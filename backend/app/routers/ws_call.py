"""
ws_call.py – WebSocket endpoint for real-time AI voice calls.

Flow:
  Browser (mic audio chunks via MediaRecorder)
      │  binary webm/opus frames
      ▼
  FastAPI WebSocket  (/api/bots/ws/call/{bot_id})
      │
      ├── Forward raw audio  ──►  Deepgram Streaming STT (nova-2)
      │                               │ JSON results
      │                               ▼
      │                          speech_final transcript
      │                               │
      ├── Query OpenAI (gpt-4o, streaming) ◄─┘
      │       │ text chunks
      │       ▼
      ├── Deepgram Aura TTS (per-sentence)
      │       │ mp3 / linear16 bytes
      │       ▼
      └── Send binary audio back to browser  ──► AudioContext queue
          Send JSON { type:"transcript"|"thinking"|"bot_reply"|"bot_complete" }
"""

import os
import asyncio
import json
import httpx
import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from ..integrations.openai_client import client as openai_client, generate_embedding, generate_chat_response
from ..integrations.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/bots/ws", tags=["bots-ws"])

# Get key from environment
DEEPGRAM_API_KEY = os.environ.get("DEEPGRAM_API_KEY", "").strip()

# ─── Deepgram TTS ─────────────────────────────────────────────────────────────
async def deepgram_tts(text: str, voice_model: str = "aura-asteria-en") -> bytes | None:
    """Convert text → audio bytes using Deepgram Aura TTS (~150 ms latency)."""
    if not text.strip():
        return None
    url = f"https://api.deepgram.com/v1/speak?model={voice_model}&encoding=mp3"
    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(url, headers=headers, json={"text": text})
            if resp.status_code == 200:
                return resp.content
            else:
                print(f"[DG TTS] non-200: {resp.status_code} {resp.text[:200]}")
    except Exception as e:
        print(f"[DG TTS] error: {e}")
    return None


# ─── Helper: safe WS send ─────────────────────────────────────────────────────
async def safe_send_json(ws: WebSocket, data: dict):
    try:
        if ws.client_state == WebSocketState.CONNECTED:
            await ws.send_json(data)
    except Exception:
        pass


async def safe_send_bytes(ws: WebSocket, data: bytes):
    try:
        if ws.client_state == WebSocketState.CONNECTED:
            await ws.send_bytes(data)
    except Exception:
        pass


# ─── AI Response + TTS Pipeline ───────────────────────────────────────────────
async def generate_and_speak(
    user_text: str,
    chat_history: list[dict],
    bot_id: str,
    websocket: WebSocket,
    voice_model: str,
    persona: str = "You are a friendly and helpful AI receptionist."
):
    """
    Given a final user transcript, streams an OpenAI response and converts
    each sentence to Deepgram TTS, writing audio chunks to the websocket in
    real-time. Also sends control messages for UI state.
    """
    if not user_text.strip():
        return

    # Notify frontend we are processing
    await safe_send_json(websocket, {"type": "thinking"})

    # ── Fetch Knowledge Base Context (RAG) ─────────────────────────────
    supabase = get_supabase_client()
    context_text = ""
    
    if supabase:
        try:
            query_embedding = await generate_embedding(user_text)
            if query_embedding:
                rag_res = supabase.rpc("match_documents", {
                    "query_embedding": query_embedding,
                    "match_threshold": 0.4,
                    "match_count": 3,
                    "filter_bot_id": bot_id
                }).execute()
                if rag_res.data:
                    context_text = "\n\n".join([item["content"] for item in rag_res.data])
        except Exception as e:
            print(f"[WS RAG] error: {e}")

    # ── Fetch Bot Config for Behavior ───────────────────────────────────
    persona_config = {}
    if supabase:
        res = supabase.table("bots").select("persona_config").eq("id", bot_id).execute()
        if res.data:
            persona_config = res.data[0].get("persona_config") or {}

    # Industry-specific booking logic (same as bot_service.py)
    industry = persona_config.get("industry", "").lower()
    is_restaurant = "restaurant" in industry or "food" in industry or "restaurant" in bot_id
    is_automotive = "automotive" in industry or "dealer" in industry or "car" in industry or "dealer" in bot_id
    
    booking_rules = ""
    if is_restaurant:
        booking_rules = "RESTAURANT BOOKING: Ask for Date, Time, Guests, Name, Phone. One at a time."
    elif is_automotive:
        booking_rules = "DEALERSHIP BOOKING: Ask for Preferred Date, Time, Name, Phone. One at a time."
    else:
        booking_rules = "GENERAL BOOKING: If user wants to book, collect their contact details and preferred time."

    # Build the chat message list for OpenAI
    system = {
        "role": "system",
        "content": (
            f"{persona}\n\n"
            "REAL-TIME VOICE CALL RULES (HUMAN-LIKE):\n"
            "- Speak naturally and warmly, like a friendly human on the phone.\n"
            "- Use natural fillers occasionally (e.g., 'Hmm', 'Right', 'Got it').\n"
            "- Keep replies EXTREMELY BRIEF (1-2 short sentences).\n"
            "- NEVER use markdown or bullet points.\n"
            f"- {booking_rules}\n"
            "- CRITICAL: To confirm a booking, you MUST have the Date, Time, and contact info.\n"
            "- Once all details are collected, repeat them and append: [SYSTEM_BOOKING_CONFIRMED]\n\n"
            f"KNOWLEDGE BASE CONTEXT (RAG):\n{context_text if context_text else 'No specific context found.'}"
        ),
    }
    messages = [system] + chat_history[-10:] + [{"role": "user", "content": user_text}]

    # OpenAI streaming
    full_reply = ""
    sentence_buf = ""
    sentence_enders = {".", "?", "!", "\n"}

    # TTS tasks run concurrently while we stream tokens
    tts_tasks: list[asyncio.Task] = []

    async def tts_and_send(sentence: str, v_model: str):
        audio = await deepgram_tts(sentence, v_model)
        if audio:
            await safe_send_bytes(websocket, audio)

    try:
        stream = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7,
            max_tokens=200,
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            full_reply += delta
            sentence_buf += delta

            # Flush a sentence to TTS as soon as we see a sentence boundary or natural pause
            for ch in delta:
                # Trigger TTS faster: lower threshold for sentence length
                if ch in sentence_enders and len(sentence_buf.strip()) > 3:
                    task = asyncio.create_task(tts_and_send(sentence_buf.strip(), voice_model))
                    tts_tasks.append(task)
                    sentence_buf = ""
                    break

        # Flush any remaining text
        if sentence_buf.strip():
            task = asyncio.create_task(tts_and_send(sentence_buf.strip(), voice_model))
            tts_tasks.append(task)

        # Wait for all TTS chunks to be sent
        if tts_tasks:
            await asyncio.gather(*tts_tasks, return_exceptions=True)

    except Exception as e:
        print(f"[AI] error: {e}")
        full_reply = "Sorry, I had trouble thinking of a response there."
        audio = await deepgram_tts(full_reply, voice_model)
        if audio:
            await safe_send_bytes(websocket, audio)

    # Tell frontend the bot reply text (updates chat feed)
    await safe_send_json(websocket, {"type": "bot_reply", "text": full_reply.strip()})
    # Signal audio stream is complete so frontend resumes listening
    await safe_send_json(websocket, {"type": "bot_complete"})

    # Update the in-call history for multi-turn context
    chat_history.append({"role": "user", "content": user_text})
    chat_history.append({"role": "assistant", "content": full_reply.strip()})


# ─── WebSocket Endpoint ───────────────────────────────────────────────────────
@router.websocket("/call/{bot_id}")
async def websocket_call(
    websocket: WebSocket,
    bot_id: str,
    session_id: str = "default",
):
    await websocket.accept()
    print(f"[WS] Call connected: bot={bot_id} session={session_id}")

    # Deepgram Live STT websocket URL
    # - language=en-IN: Tuned for Indian English
    # - model=nova-2: High accuracy
    # - endpointing=300: Fast transition to AI response
    dg_url = (
        "wss://api.deepgram.com/v1/listen"
        "?model=nova-2"
        "&language=en-IN"
        "&smart_format=true"
        "&interim_results=true"
        "&endpointing=300"
    )
    dg_headers = {"Authorization": f"Token {DEEPGRAM_API_KEY}"}

    chat_history: list[dict] = []
    supabase = get_supabase_client()
    
    # ── Fetch Bot Persona & Voice Config ────────────────────────────────────
    persona = "You are a friendly and helpful AI receptionist."
    voice_model = "aura-asteria-en"
    if supabase:
        res = supabase.table("bots").select("persona_prompt, persona_config").eq("id", bot_id).execute()
        if res.data:
            persona = res.data[0]["persona_prompt"]
            persona_config = res.data[0].get("persona_config") or {}
            voice_model = persona_config.get("voice_model", "aura-asteria-en")

    try:
        async with websockets.connect(dg_url, additional_headers=dg_headers) as dg_ws:

            # ── Sender: browser → Deepgram ────────────────────────────────────
            async def browser_to_deepgram():
                try:
                    while True:
                        msg = await websocket.receive()
                        if "bytes" in msg and msg["bytes"]:
                            await dg_ws.send(msg["bytes"])
                        elif "text" in msg:
                            try:
                                ctrl = json.loads(msg["text"])
                                if ctrl.get("action") == "stop":
                                    break
                            except Exception:
                                pass
                except WebSocketDisconnect:
                    pass
                except Exception as e:
                    print(f"[WS] browser_to_deepgram error: {e}")
                finally:
                    # Close DG gracefully
                    try:
                        await dg_ws.close()
                    except Exception:
                        pass

            # ── Receiver: Deepgram → AI → TTS → browser ───────────────────────
            async def deepgram_to_browser():
                try:
                    async for raw in dg_ws:
                        result = json.loads(raw)

                        if result.get("type") != "Results":
                            continue

                        alts = result.get("channel", {}).get("alternatives", [])
                        if not alts:
                            continue

                        transcript = alts[0].get("transcript", "").strip()
                        is_final = result.get("is_final", False)
                        speech_final = result.get("speech_final", False)

                        if not transcript:
                            continue

                        # Send live transcript to frontend for UI
                        if is_final or speech_final:
                            await safe_send_json(
                                websocket,
                                {"type": "transcript", "text": transcript},
                            )

                        # On speech_final → full pipeline
                        if speech_final and transcript:
                            asyncio.create_task(
                                generate_and_speak(
                                    transcript, chat_history, bot_id, websocket, voice_model, persona
                                )
                            )

                except websockets.exceptions.ConnectionClosed:
                    pass
                except Exception as e:
                    print(f"[WS] deepgram_to_browser error: {e}")

            # Run both directions concurrently
            await asyncio.gather(browser_to_deepgram(), deepgram_to_browser())

    except Exception as e:
        print(f"[WS] Deepgram connection error: {e}")
        # Send more detailed error to frontend for easier debugging
        await safe_send_json(
            websocket,
            {
                "type": "error",
                "message": f"Deepgram connection failed: {str(e)}",
            },
        )
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
        print(f"[WS] Call ended: bot={bot_id} session={session_id}")
        
        # ── Persist Call Log & Detect Leads ───────────────────────────────────
        if chat_history and supabase:
            async def process_call_leads():
                try:
                    # 1. Concatenate the full conversation
                    full_transcript = ""
                    for msg in chat_history:
                        role = "Customer" if msg["role"] == "user" else "Assistant"
                        full_transcript += f"{role}: {msg['content']}\n"
                    
                    # 2. Basic Log Entry
                    log_entry = {
                        "bot_id": bot_id,
                        "session_id": session_id,
                        "user_message": "[VOICE CALL SESSION START]",
                        "bot_reply": full_transcript.strip() or "[Voice call ended without speech]",
                        "confidence_score": "High",
                        "lead_score": 0,
                    }
                    
                    # 3. AI Lead Detection (Adapted from bot_service.py)
                    lead_detection_prompt = f"""Analyze this voice call transcript and output ONLY valid JSON.
                    
                    Conversation:
                    {full_transcript}
                    
                    Your task:
                    1. Score 0-100: how likely is the customer to convert?
                    2. Type: choose ONE of: "reservation", "product_inquiry", "complaint", "general_question", "lead_opportunity", "none".
                    3. Extract entities: Name (first name only), Phone, Email, Date, Time.
                    4. Human-readable summary (1-3 lines).
                    
                    Output format (JSON only):
                    {{"score": 85, "type": "reservation", "name": "John", "phone": "5550199", "email": "john@example.com", "summary": "Wants to book...", "date": null, "time": null}}"""
                    
                    lead_data = {"score": 0, "type": "none", "summary": "No lead detected"}
                    try:
                        lead_json_str = await generate_chat_response([
                            {"role": "system", "content": "You are a lead extraction AI. Output ONLY valid JSON, no explanation, no markdown."},
                            {"role": "user", "content": lead_detection_prompt}
                        ])
                        cleaned_json = lead_json_str.strip()
                        if "```" in cleaned_json:
                            cleaned_json = cleaned_json.split("```")[1]
                            if cleaned_json.startswith("json"): cleaned_json = cleaned_json[4:]
                        lead_data = json.loads(cleaned_json.strip())
                        # Ensure score is int to avoid comparison errors
                        lead_data["score"] = int(lead_data.get("score", 0))
                    except Exception as e:
                        print(f"[WS LEAD] AI Error: {e}")

                    # 4. Save/Update Lead in Database
                    if lead_data.get("score", 0) >= 30:
                        log_entry["lead_score"] = lead_data["score"]
                        log_entry["lead_type"] = lead_data["type"]
                        
                        # Build summary with extracted fields
                        extracted = []
                        if lead_data.get("name"): extracted.append(f"Name: {lead_data['name']}")
                        if lead_data.get("phone"): extracted.append(f"Phone: {lead_data['phone']}")
                        if lead_data.get("email"): extracted.append(f"Email: {lead_data['email']}")
                        combined_summary = "\n".join(extracted) + "\n\n" + str(lead_data.get("summary", ""))
                        
                        lead_payload = {
                            "bot_id": bot_id, 
                            "session_id": session_id, 
                            "score": lead_data["score"], 
                            "type": lead_data["type"],
                            "name": lead_data.get("name"), 
                            "phone": lead_data.get("phone"), 
                            "email": lead_data.get("email"),
                            "status": "new", 
                            "summary": combined_summary.strip()
                        }
                        
                        try:
                            # Upsert Lead
                            exist = supabase.table("leads").select("id").eq("session_id", session_id).execute()
                            if exist.data: supabase.table("leads").update(lead_payload).eq("session_id", session_id).execute()
                            else: supabase.table("leads").insert(lead_payload).execute()
                            
                            # Upsert Customer CRM
                            if lead_data.get("phone"):
                                supabase.table("customers").upsert({
                                    "phone": lead_data["phone"], "name": lead_data.get("name"),
                                    "email": lead_data.get("email"), "preferences": combined_summary.strip()
                                }, on_conflict="phone").execute()

                            # 4c. New: Explicit Booking Capture
                            # If AI signaled a booking OR if lead type is reservation + we have a date
                            bot_reply_str = str(log_entry.get("bot_reply", ""))
                            is_booking = "[SYSTEM_BOOKING_CONFIRMED]" in bot_reply_str or lead_data.get("type") == "reservation"
                            if is_booking and lead_data.get("phone") and (lead_data.get("date") or lead_data.get("time")):
                                try:
                                    supabase.table("bookings").insert({
                                        "bot_id": bot_id,
                                        "customer_phone": lead_data["phone"],
                                        "booking_date": lead_data.get("date"),
                                        "booking_time": lead_data.get("time"),
                                        "status": "confirmed",
                                        "source": "voice_call"
                                    }).execute()
                                    print(f"[WS BOOKING] Saved for {lead_data['phone']}")
                                except Exception as be:
                                    print(f"[WS BOOKING] error: {be}")

                        except Exception as e:
                            print(f"[WS CRM] error: {e}")

                    # 5. Finalize Log Entry
                    supabase.table("chat_logs").insert(log_entry).execute()
                    print(f"[WS LOG] Call saved successfully (Score: {lead_data.get('score', 0)})")

                except Exception as e:
                    print(f"[WS LOG] processing error: {e}")

            asyncio.create_task(process_call_leads())
