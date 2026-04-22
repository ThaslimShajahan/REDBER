"""
ws_call.py – WebSocket relay between browser and OpenAI Realtime API.

Flow:
  Browser (raw PCM16 at 24 kHz via AudioWorklet)
      │  binary Int16 frames
      ▼
  FastAPI WebSocket  (/api/bots/ws/call/{bot_id})
      │  base64-encode + input_audio_buffer.append
      ▼
  OpenAI Realtime API  (gpt-4o-realtime-preview)
      │  response.audio.delta  (base64 PCM16)
      ▼
  FastAPI WebSocket  (decode → raw Int16 bytes)
      │
      └── Browser  (Int16→Float32 → AudioContext playback)
"""

import os
import asyncio
import json
import base64
import logging
import datetime
import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from ..integrations.openai_client import client as openai_client, generate_chat_response
from ..integrations.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/bots/ws", tags=["bots-ws"])
logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview"


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _safe_send_json(ws: WebSocket, data: dict) -> None:
    try:
        if ws.client_state == WebSocketState.CONNECTED:
            await ws.send_json(data)
    except Exception:
        pass


async def _safe_send_bytes(ws: WebSocket, data: bytes) -> None:
    try:
        if ws.client_state == WebSocketState.CONNECTED:
            await ws.send_bytes(data)
    except Exception:
        pass


async def _fetch_bot_config(bot_id: str, supabase) -> tuple[str, dict]:
    persona = "You are a friendly and helpful AI receptionist."
    config: dict = {}
    if not supabase:
        return persona, config
    try:
        res = supabase.table("bots").select("persona_prompt, persona_config").eq("id", bot_id).execute()
        if res.data:
            persona = res.data[0].get("persona_prompt") or persona
            config = res.data[0].get("persona_config") or {}
    except Exception as e:
        logger.warning("[WS] fetch bot config: %s", e)
    return persona, config


async def _fetch_kb_context(bot_id: str, supabase) -> str:
    if not supabase:
        return ""
    try:
        res = (
            supabase.table("knowledge_base")
            .select("content")
            .eq("bot_id", bot_id)
            .limit(6)
            .execute()
        )
        if res.data:
            return "\n\n".join(item["content"] for item in res.data)
    except Exception as e:
        logger.warning("[WS] fetch KB context: %s", e)
    return ""


def _build_system_prompt(persona: str, config: dict, kb_context: str) -> str:
    industry = config.get("industry", "").lower()
    if "restaurant" in industry or "food" in industry:
        booking_rule = "BOOKING: Collect Date, Time, Guest count, Name, Phone — one question at a time."
    elif "automotive" in industry or "dealer" in industry or "car" in industry:
        booking_rule = "BOOKING: Collect Preferred Date, Time, Name, Phone — one question at a time."
    else:
        booking_rule = "BOOKING: If the user wants to book, collect their contact details and preferred time."

    now = datetime.datetime.now()
    prompt = (
        f"[CURRENT DATE & TIME — ground truth, never use training knowledge for date/time]\n"
        f"TODAY: {now.strftime('%A, %B %d, %Y')}  |  NOW: {now.strftime('%I:%M %p')}\n"
        f"Any date before {now.strftime('%B %d, %Y')} is in the past — never book a past date.\n\n"
        f"{persona}\n\n"
        "VOICE PERSONALITY — THIS IS A REAL PHONE CALL, NOT A CHAT BOT:\n"
        "- You are a warm, friendly human-sounding receptionist having a real conversation.\n"
        "- Start EVERY response with a natural filler or acknowledgement: 'Sure!', 'Oh absolutely!', "
        "'Hmm, let me think...', 'Right, of course!', 'Got it!', 'Oh yeah!', 'Sure thing!', 'Of course!'.\n"
        "- Vary your fillers — never repeat the same one twice in a row.\n"
        "- Speak in short, natural sentences like a real person: 1–3 sentences max per turn.\n"
        "- NEVER use bullet points, numbered lists, markdown, or structured formatting — this is spoken audio.\n"
        "- It's fine to say 'um' or 'uh' occasionally — it sounds human.\n"
        "- Never repeat 'How can I assist you today?' — it sounds robotic.\n"
        "- Mirror the caller's energy: if they're casual, be casual; if they're formal, be professional.\n"
        f"- {booking_rule}\n"
        "- DATE RULE: The current date is stated at the top. Never confirm a booking for any date that has already passed.\n"
        "- Once all booking details are confirmed, repeat them back warmly and append [SYSTEM_BOOKING_CONFIRMED].\n"
        "- LANGUAGE RULE: ALWAYS start and respond in ENGLISH by default, regardless of the bot's name or persona. "
        "ONLY switch to another language if the caller FIRST speaks to you in that language. "
        "Never assume the caller's language from the bot name — wait for them to speak.\n"
    )
    if kb_context:
        prompt += f"\nKNOWLEDGE BASE:\n{kb_context}\n"
    return prompt


# ─── WebSocket Endpoint ───────────────────────────────────────────────────────

@router.websocket("/call/{bot_id}")
async def websocket_call(
    websocket: WebSocket,
    bot_id: str,
    session_id: str = "default",
) -> None:
    await websocket.accept()
    logger.info("[WS] Call connected: bot=%s session=%s", bot_id, session_id)

    if not OPENAI_API_KEY:
        await _safe_send_json(websocket, {"type": "error", "message": "OpenAI API key not configured."})
        await websocket.close()
        return

    supabase = get_supabase_client()
    persona, config = await _fetch_bot_config(bot_id, supabase)
    kb_context = await _fetch_kb_context(bot_id, supabase)
    system_prompt = _build_system_prompt(persona, config, kb_context)
    voice = config.get("realtime_voice", "alloy")

    chat_history: list[dict] = []

    try:
        async with websockets.connect(
            REALTIME_URL,
            additional_headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "OpenAI-Beta": "realtime=v1",
            },
        ) as openai_ws:

            # Configure the Realtime session
            await openai_ws.send(json.dumps({
                "type": "session.update",
                "session": {
                    "modalities": ["audio", "text"],
                    "instructions": system_prompt,
                    "voice": voice,
                    "input_audio_format": "pcm16",
                    "output_audio_format": "pcm16",
                    "input_audio_transcription": {"model": "whisper-1"},
                    "turn_detection": {
                        "type": "server_vad",
                        "threshold": 0.65,
                        "prefix_padding_ms": 200,
                        "silence_duration_ms": 500,
                    },
                    "temperature": 0.9,
                    "max_response_output_tokens": 120,
                },
            }))

            # ── Browser → OpenAI ───────────────────────────────────────────
            async def browser_to_openai() -> None:
                try:
                    while True:
                        msg = await websocket.receive()
                        if "bytes" in msg and msg["bytes"]:
                            encoded = base64.b64encode(msg["bytes"]).decode()
                            await openai_ws.send(json.dumps({
                                "type": "input_audio_buffer.append",
                                "audio": encoded,
                            }))
                        elif "text" in msg and msg["text"]:
                            try:
                                ctrl = json.loads(msg["text"])
                                if ctrl.get("action") == "stop":
                                    break
                            except Exception:
                                pass
                except (WebSocketDisconnect, Exception) as exc:
                    if not isinstance(exc, WebSocketDisconnect):
                        logger.debug("[WS] browser_to_openai: %s", exc)
                finally:
                    try:
                        await openai_ws.close()
                    except Exception:
                        pass

            # ── OpenAI → Browser ───────────────────────────────────────────
            async def openai_to_browser() -> None:
                bot_transcript_buf = ""
                response_active = False   # tracks whether OpenAI has a live response in flight
                try:
                    async for raw in openai_ws:
                        try:
                            event = json.loads(raw)
                        except Exception:
                            continue

                        etype = event.get("type", "")

                        if etype in ("session.created", "session.updated"):
                            await _safe_send_json(websocket, {"type": "session_ready"})

                        elif etype == "response.created":
                            response_active = True

                        elif etype == "input_audio_buffer.speech_started":
                            # Only cancel if a response is actually in progress.
                            # Sending cancel when idle causes "Cancellation failed" errors.
                            if response_active:
                                await _safe_send_json(websocket, {"type": "speech_started"})
                                try:
                                    await openai_ws.send(json.dumps({"type": "response.cancel"}))
                                except Exception:
                                    pass

                        elif etype == "response.audio.delta":
                            audio_b64 = event.get("delta", "")
                            if audio_b64:
                                await _safe_send_bytes(websocket, base64.b64decode(audio_b64))

                        elif etype == "response.audio_transcript.delta":
                            bot_transcript_buf += event.get("delta", "")

                        elif etype == "response.audio_transcript.done":
                            full_bot_text = event.get("transcript", "") or bot_transcript_buf
                            bot_transcript_buf = ""
                            if full_bot_text:
                                chat_history.append({"role": "assistant", "content": full_bot_text})
                                await _safe_send_json(websocket, {
                                    "type": "bot_reply",
                                    "text": full_bot_text,
                                })

                        elif etype == "response.done":
                            response_active = False
                            await _safe_send_json(websocket, {"type": "bot_complete"})

                        elif etype == "conversation.item.input_audio_transcription.completed":
                            user_text = event.get("transcript", "").strip()
                            if user_text:
                                chat_history.append({"role": "user", "content": user_text})
                                await _safe_send_json(websocket, {
                                    "type": "transcript",
                                    "text": user_text,
                                })

                        elif etype == "error":
                            err = event.get("error", {})
                            msg = err.get("message", "")
                            # "Cancellation failed" is benign — don't alarm the user
                            if "cancellation" in msg.lower():
                                logger.debug("[WS] benign cancel error ignored: %s", msg)
                            else:
                                logger.error("[WS] OpenAI Realtime error: %s", err)
                                await _safe_send_json(websocket, {
                                    "type": "error",
                                    "message": msg or "Unknown voice service error",
                                })

                except websockets.exceptions.ConnectionClosed:
                    pass
                except Exception as exc:
                    logger.error("[WS] openai_to_browser: %s", exc)

            await asyncio.gather(browser_to_openai(), openai_to_browser())

    except Exception as exc:
        logger.error("[WS] OpenAI connection error: %s", exc)
        await _safe_send_json(websocket, {
            "type": "error",
            "message": f"Failed to connect to voice service: {exc}",
        })
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
        logger.info("[WS] Call ended: bot=%s session=%s", bot_id, session_id)
        if chat_history and supabase:
            asyncio.create_task(_process_call_leads(bot_id, session_id, chat_history, supabase))


# ─── Post-call Lead Detection ─────────────────────────────────────────────────

async def _process_call_leads(
    bot_id: str,
    session_id: str,
    chat_history: list[dict],
    supabase,
) -> None:
    try:
        full_transcript = "\n".join(
            f"{'Customer' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
            for m in chat_history
        )
        log_entry = {
            "bot_id": bot_id,
            "session_id": session_id,
            "user_message": "[VOICE CALL SESSION START]",
            "bot_reply": full_transcript.strip() or "[Voice call ended without speech]",
            "confidence_score": "High",
            "lead_score": 0,
        }

        lead_data: dict = {"score": 0, "type": "none", "summary": "No lead detected"}
        if full_transcript.strip():
            try:
                lead_json_str = await generate_chat_response([
                    {"role": "system", "content": "Output ONLY valid JSON, no explanation, no markdown."},
                    {"role": "user", "content": (
                        "Analyze this voice call transcript and output ONLY valid JSON.\n\n"
                        f"Conversation:\n{full_transcript}\n\n"
                        "Output format (JSON only):\n"
                        '{"score": 85, "type": "reservation", "name": "John", '
                        '"phone": "5550199", "email": null, "summary": "Wants to book...", '
                        '"date": null, "time": null}\n\n'
                        'Types: "reservation", "product_inquiry", "complaint", '
                        '"general_question", "lead_opportunity", "none"\n'
                        "Score 0-100: likelihood to convert."
                    )},
                ])
                cleaned = lead_json_str.strip()
                if "```" in cleaned:
                    cleaned = cleaned.split("```")[1]
                    if cleaned.startswith("json"):
                        cleaned = cleaned[4:]
                lead_data = json.loads(cleaned.strip())
                lead_data["score"] = int(lead_data.get("score", 0))
            except Exception as exc:
                logger.warning("[WS LEAD] AI error: %s", exc)

        if lead_data.get("score", 0) >= 30:
            log_entry["lead_score"] = lead_data["score"]
            log_entry["lead_type"] = lead_data.get("type")
            extracted = [
                f"{k.capitalize()}: {lead_data[k]}"
                for k in ("name", "phone", "email")
                if lead_data.get(k)
            ]
            combined_summary = "\n".join(extracted) + "\n\n" + str(lead_data.get("summary", ""))

            lead_payload = {
                "bot_id": bot_id,
                "session_id": session_id,
                "score": lead_data["score"],
                "type": lead_data.get("type"),
                "name": lead_data.get("name"),
                "phone": lead_data.get("phone"),
                "email": lead_data.get("email"),
                "status": "new",
                "summary": combined_summary.strip(),
            }
            try:
                exist = supabase.table("leads").select("id").eq("session_id", session_id).execute()
                if exist.data:
                    supabase.table("leads").update(lead_payload).eq("session_id", session_id).execute()
                else:
                    supabase.table("leads").insert(lead_payload).execute()

                if lead_data.get("phone"):
                    supabase.table("customers").upsert({
                        "phone": lead_data["phone"],
                        "name": lead_data.get("name"),
                        "email": lead_data.get("email"),
                        "preferences": combined_summary.strip(),
                    }, on_conflict="phone").execute()

                is_booking = (
                    "[SYSTEM_BOOKING_CONFIRMED]" in full_transcript
                    or lead_data.get("type") == "reservation"
                )
                if is_booking and lead_data.get("phone") and (lead_data.get("date") or lead_data.get("time")):
                    supabase.table("bookings").insert({
                        "bot_id": bot_id,
                        "customer_phone": lead_data["phone"],
                        "booking_date": lead_data.get("date"),
                        "booking_time": lead_data.get("time"),
                        "status": "confirmed",
                        "service_type": "voice_call",
                    }).execute()
                    logger.info("[WS BOOKING] Saved for %s", lead_data["phone"])

            except Exception as exc:
                logger.warning("[WS CRM] error: %s", exc)

        supabase.table("chat_logs").insert(log_entry).execute()
        logger.info("[WS LOG] Call saved (score=%s)", lead_data.get("score", 0))

    except Exception as exc:
        logger.error("[WS LOG] processing error: %s", exc)
