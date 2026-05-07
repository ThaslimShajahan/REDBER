"""
ws_call.py – WebSocket relay supporting OpenAI Realtime and ElevenLabs Conversational AI.

Provider is selected per-bot via persona_config.voice_provider:
  "openai"      (default) → OpenAI gpt-4o-realtime-preview
  "elevenlabs"            → ElevenLabs Conversational AI (any ElevenLabs voice incl. Hindi/Indian)

Both paths receive raw PCM16 at 24 kHz from the browser and send PCM16 back.
"""

import os
import asyncio
import json
import base64
import logging
import datetime
import websockets
import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from ..integrations.openai_client import client as openai_client, generate_chat_response
from ..integrations.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/bots/ws", tags=["bots-ws"])
logger = logging.getLogger(__name__)

OPENAI_API_KEY      = os.environ.get("OPENAI_API_KEY", "").strip()
ELEVENLABS_API_KEY  = os.environ.get("ELEVENLABS_API_KEY", "").strip()
REALTIME_URL        = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview"
ELEVEN_CONVAI_URL   = "wss://api.elevenlabs.io/v1/convai/conversation"


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


async def _fetch_bot_config(bot_id: str, supabase) -> tuple[str, dict, str]:
    persona = "You are a friendly and helpful AI receptionist."
    config: dict = {}
    name = ""
    if not supabase:
        return persona, config, name
    try:
        res = supabase.table("bots").select("persona_prompt, persona_config, name").eq("id", bot_id).execute()
        if res.data:
            persona = res.data[0].get("persona_prompt") or persona
            config = res.data[0].get("persona_config") or {}
            name = res.data[0].get("name", "")
    except Exception as e:
        logger.warning("[WS] fetch bot config: %s", e)
    return persona, config, name


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


async def _save_agent_id(bot_id: str, agent_id: str, supabase) -> None:
    if not supabase:
        return
    try:
        br = supabase.table("bots").select("persona_config").eq("id", bot_id).execute()
        cfg = (br.data[0].get("persona_config") or {}) if br.data else {}
        cfg["elevenlabs_agent_id"] = agent_id
        supabase.table("bots").update({"persona_config": cfg}).eq("id", bot_id).execute()
    except Exception as e:
        logger.warning("[ElevenWS] save agent_id: %s", e)


_AGENT_CREATE_CONFIG = {
    "conversation_config": {
        "asr": {
            "quality": "high",
            "provider": "elevenlabs",
            "user_input_audio_format": "pcm_24000",
        },
        "tts": {
            "model_id": "eleven_turbo_v2",
            "agent_output_audio_format": "pcm_24000",
            "optimize_streaming_latency": 4,
            "stability": 0.5,
            "similarity_boost": 0.75,
        },
        "turn": {
            "turn_timeout": 3,
            "silence_end_call_timeout": 300,
            "turn_eagerness": "high",
        },
        "agent": {
            "prompt": {"prompt": "You are a helpful assistant."},
            "language": "en",
            "first_message": "",
        },
    },
    "platform_settings": {
        "overrides": {
            "conversation_config_override": {
                "agent": {
                    "first_message": True,
                    "language": True,
                    "prompt": {"prompt": True},
                },
                "tts": {"voice_id": True},
            }
        }
    },
}


async def _get_or_create_elevenlabs_agent(bot_id: str, eleven_key: str, supabase) -> str:
    """
    Returns the ElevenLabs agent_id for this bot:
    1. DB cache hit → return immediately
    2. Try to create a new agent via API
    3. If creation forbidden (missing Write permission), fall back to listing
       existing agents and finding one named redber_{bot_id}
    """
    # 1. Check DB cache
    if supabase:
        try:
            bot_res = supabase.table("bots").select("persona_config").eq("id", bot_id).execute()
            if bot_res.data:
                stored = (bot_res.data[0].get("persona_config") or {}).get("elevenlabs_agent_id", "").strip()
                if stored:
                    return stored
        except Exception as e:
            logger.warning("[ElevenWS] fetch stored agent_id: %s", e)

    agent_name = f"redber_{bot_id}"
    headers = {"xi-api-key": eleven_key, "Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=20.0) as client:
        # 2. Try to create
        logger.info("[ElevenWS] Creating ElevenLabs agent for bot=%s", bot_id)
        try:
            resp = await client.post(
                "https://api.elevenlabs.io/v1/convai/agents/create",
                headers=headers,
                json={"name": agent_name, **_AGENT_CREATE_CONFIG},
            )
            if resp.status_code in (200, 201):
                new_id = resp.json().get("agent_id", "")
                if new_id:
                    logger.info("[ElevenWS] Created agent %s for bot=%s", new_id, bot_id)
                    await _save_agent_id(bot_id, new_id, supabase)
                    return new_id
            elif resp.status_code in (401, 403):
                logger.warning("[ElevenWS] Agent create forbidden (%s) — will search existing agents", resp.status_code)
            else:
                logger.error("[ElevenWS] Agent create failed: %s %s", resp.status_code, resp.text[:300])
        except Exception as e:
            logger.error("[ElevenWS] Agent create error: %s", e)

        # 3. Fallback: list agents and find by name (works even without Write permission)
        logger.info("[ElevenWS] Searching existing agents for name=%s", agent_name)
        try:
            page = 1
            while True:
                list_resp = await client.get(
                    "https://api.elevenlabs.io/v1/convai/agents",
                    headers=headers,
                    params={"page_size": 100, "page": page},
                )
                if list_resp.status_code != 200:
                    logger.error("[ElevenWS] Agent list failed: %s", list_resp.status_code)
                    break
                data = list_resp.json()
                agents = data.get("agents", [])
                for a in agents:
                    if a.get("name") == agent_name:
                        found_id = a.get("agent_id", "")
                        if found_id:
                            logger.info("[ElevenWS] Found existing agent %s for bot=%s", found_id, bot_id)
                            await _save_agent_id(bot_id, found_id, supabase)
                            return found_id
                if not data.get("has_more"):
                    break
                page += 1
        except Exception as e:
            logger.error("[ElevenWS] Agent list error: %s", e)

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


# ─── ElevenLabs Conversational AI Relay ──────────────────────────────────────

def _build_eleven_system_prompt(base_prompt: str, config: dict) -> str:
    """
    Builds the ElevenLabs system prompt with critical voice-call rules FIRST
    so they're never cut off by the 6000-char WebSocket override limit.
    """
    industry = config.get("industry", "").lower()

    if "restaurant" in industry or "food" in industry:
        booking_rule = "Collect Date, Time, Guest count, Name, Phone — one question at a time."
    elif "hotel" in industry or "hospitality" in industry:
        booking_rule = "Collect Check-in date, Check-out date, Room type, Name, Phone — one at a time."
    elif "automotive" in industry or "dealer" in industry:
        booking_rule = "Collect Preferred Date, Time, Name, Phone — one question at a time."
    else:
        booking_rule = "Collect Name, Phone, and preferred time — one question at a time."

    now = datetime.datetime.now()
    today_str = now.strftime("%A, %B %d, %Y")
    time_str  = now.strftime("%I:%M %p")

    call_rules = (
        # Date pinned at the very top so it's the first thing the LLM sees
        f"[SYSTEM — CURRENT DATE & TIME]\n"
        f"TODAY IS {today_str}. THE TIME IS {time_str}.\n"
        f"This is provided by the live system. ALWAYS use this date. "
        f"NEVER say it is any other date or year. {today_str} is the correct date right now.\n\n"

        "━━━ VOICE CALL RULES — ALWAYS FOLLOW ━━━\n\n"
        "LANGUAGE: ENGLISH ONLY. Respond in English always, no exceptions.\n\n"

        "FILLERS — start EVERY reply with a varied natural filler:\n"
        '  "Sure!", "Oh absolutely!", "Of course!", "Got it!", "Right so...", "Hmm let me see...",\n'
        '  "Great question!", "Ah yes!", "Certainly!", "Yeah for sure!", "Oh nice!", "Happy to help!",\n'
        '  "Let me check on that...", "One moment!", "Sounds good!", "Oh yeah!"\n'
        "  Vary them — never use the same filler twice in a row.\n\n"

        "BRIEF SOUNDS: If the caller says 'uh', 'um', 'hmm', 'yeah', or makes any brief sound, "
        "treat it as them wanting to speak. Respond with 'Yeah?' or 'Go ahead' or 'I'm listening'.\n\n"

        "RESPONSE LENGTH: 1–3 short sentences only. No bullets, lists, or markdown — spoken audio.\n\n"

        "INTERRUPTIONS: If the caller speaks while you're talking, stop immediately and listen.\n\n"

        f"DATE: Today is {today_str}. Never book past dates.\n\n"
        f"BOOKING: {booking_rule} Once confirmed, repeat back warmly and say [SYSTEM_BOOKING_CONFIRMED].\n\n"

        "NEVER say 'How can I assist you today?' — robotic. Never claim to be an AI unless asked.\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        "YOUR PERSONA & KNOWLEDGE:\n"
    )

    # Rules are ~1100 chars; allow 4900 for persona/KB so total stays within 6000
    trimmed_base = base_prompt[:4900] if len(base_prompt) > 4900 else base_prompt
    return call_rules + trimmed_base


async def _relay_elevenlabs(
    websocket: WebSocket,
    bot_id: str,
    session_id: str,
    system_prompt: str,
    config: dict,
    supabase,
    bot_name: str = "",
) -> None:
    """
    Relay the voice call through ElevenLabs Conversational AI.
    Tuned for minimum latency phone-call feel with natural fillers.
    Audio: pcm_24000 both ways (matches browser PCM16Player at 24 kHz).
    """
    voice_id    = config.get("elevenlabs_voice_id", "").strip()
    # Read key fresh — picks up .env changes without server restart
    eleven_key  = os.environ.get("ELEVENLABS_API_KEY", "").strip() or ELEVENLABS_API_KEY

    # Get or auto-create the ElevenLabs agent (stored in persona_config.elevenlabs_agent_id)
    agent_id = config.get("elevenlabs_agent_id", "").strip()
    if not agent_id:
        agent_id = await _get_or_create_elevenlabs_agent(bot_id, eleven_key, supabase)
        if agent_id:
            await asyncio.sleep(1.5)  # brief delay for ElevenLabs to provision the new agent
    if not agent_id:
        await _safe_send_json(websocket, {"type": "error", "message": "ElevenLabs agent could not be created. Check API key permissions (ElevenAgents → Write)."})
        return
    logger.info("[ElevenWS] Using agent=%s voice=%s for bot=%s", agent_id, voice_id or "default", bot_id)
    ws_url      = f"{ELEVEN_CONVAI_URL}?agent_id={agent_id}"
    chat_history: list[dict] = []

    eleven_prompt = _build_eleven_system_prompt(system_prompt, config)

    # Build opening greeting so the bot speaks immediately when call connects
    greeting = f"Hello! I'm {bot_name}. How can I help you today?" if bot_name else "Hello! How can I help you today?"

    try:
        async with websockets.connect(
            ws_url,
            additional_headers={"xi-api-key": eleven_key},
            max_size=8 * 1024 * 1024,
        ) as eleven_ws:

            # ── Init: override prompt, voice, audio format ──
            # Voice calls are English-only — never override to another language.
            # asr/turn/tts.model_id cannot be overridden — they're fixed at agent creation.
            init_msg: dict = {
                "type": "conversation_initiation_client_data",
                "conversation_config_override": {
                    "agent": {
                        "prompt": {"prompt": eleven_prompt[:6000]},
                        "first_message": greeting,
                        "language": "en",
                    },
                    "tts": {"voice_id": voice_id} if voice_id else {},
                },
            }
            await eleven_ws.send(json.dumps(init_msg))

            # Event set after the bot's first turn ends — lets browser_to_eleven
            # know it's safe to start forwarding mic audio to ElevenLabs.
            # Without this gate, ambient noise sent during the opening greeting
            # triggers ElevenLabs VAD → interrupts the bot → call drops.
            mic_open = asyncio.Event()

            # ── Browser → ElevenLabs ───────────────────────────────────────
            async def browser_to_eleven() -> None:
                try:
                    while True:
                        msg = await websocket.receive()
                        if "bytes" in msg and msg["bytes"]:
                            # Drain (discard) mic audio until the opening greeting ends.
                            # Fallback: open unconditionally after 8 seconds so the mic
                            # is never permanently muted if no greeting is configured.
                            if not mic_open.is_set():
                                continue
                            encoded = base64.b64encode(msg["bytes"]).decode()
                            await eleven_ws.send(json.dumps({"user_audio_chunk": encoded}))
                        elif "text" in msg and msg["text"]:
                            try:
                                ctrl = json.loads(msg["text"])
                                if ctrl.get("action") == "stop":
                                    break
                            except Exception:
                                pass
                except (WebSocketDisconnect, Exception) as exc:
                    if not isinstance(exc, WebSocketDisconnect):
                        logger.debug("[ElevenWS] browser_to_eleven: %s", exc)
                finally:
                    try:
                        await eleven_ws.close()
                    except Exception:
                        pass

            async def _open_mic_fallback() -> None:
                """Ensure mic opens even if no agent_response ever arrives (no greeting)."""
                await asyncio.sleep(8)
                mic_open.set()

            # ── ElevenLabs → Browser ───────────────────────────────────────
            async def eleven_to_browser() -> None:
                try:
                    async for raw in eleven_ws:
                        if not isinstance(raw, str):
                            # ElevenLabs sometimes sends binary audio directly
                            if isinstance(raw, bytes):
                                await _safe_send_bytes(websocket, raw)
                            continue
                        try:
                            event = json.loads(raw)
                        except Exception:
                            continue

                        etype = event.get("type", "")
                        logger.info("[ElevenWS] ← %s", etype)

                        if etype in (
                            "conversation_initiation_metadata",
                            "conversation_initiation_client_data_response",
                        ):
                            await _safe_send_json(websocket, {"type": "session_ready"})

                        elif etype == "audio":
                            # audio_event.audio_base_64 is the PCM16 chunk
                            audio_b64 = (
                                event.get("audio_event", {}).get("audio_base_64")
                                or event.get("audio_base_64", "")
                            )
                            if audio_b64:
                                await _safe_send_bytes(websocket, base64.b64decode(audio_b64))

                        elif etype in ("agent_response", "agent_response_correction"):
                            # Full agent turn text — two possible shapes in different API versions
                            text = (
                                event.get("agent_response_event", {}).get("agent_response")
                                or event.get("agent_response", "")
                            )
                            if text:
                                chat_history.append({"role": "assistant", "content": text})
                                await _safe_send_json(websocket, {"type": "bot_reply", "text": text})
                                # After the bot's turn ends, open the mic (greeting is over)
                                # and schedule bot_complete so the browser can track playback.
                                _ws_ref = websocket
                                async def _finish_turn(ws=_ws_ref):
                                    await asyncio.sleep(1.5)
                                    mic_open.set()   # allow mic audio to flow to ElevenLabs
                                    await _safe_send_json(ws, {"type": "bot_complete"})
                                asyncio.create_task(_finish_turn())

                        elif etype == "user_transcript":
                            text = (
                                event.get("user_transcription_event", {}).get("user_transcript")
                                or event.get("user_transcript", "")
                            )
                            if text:
                                chat_history.append({"role": "user", "content": text})
                                await _safe_send_json(websocket, {"type": "transcript", "text": text})

                        elif etype == "interruption":
                            # Caller started speaking — tell browser to stop playing
                            await _safe_send_json(websocket, {"type": "speech_started"})

                        elif etype == "ping":
                            event_id = event.get("ping_event", {}).get("event_id")
                            await eleven_ws.send(json.dumps({"type": "pong", "event_id": event_id}))

                        elif etype == "internal_tentative_agent_response":
                            pass  # partial transcript, ignore

                        elif etype == "error":
                            err_msg = (
                                event.get("error", {}).get("message")
                                or event.get("message", "ElevenLabs error")
                            )
                            logger.error("[ElevenWS] error event: %s", event)
                            await _safe_send_json(websocket, {"type": "error", "message": err_msg})

                        elif etype == "conversation_ended":
                            reason = event.get("conversation_ended_event", {})
                            logger.info("[ElevenWS] conversation_ended — full event: %s", json.dumps(event))
                            await _safe_send_json(websocket, {"type": "call_ended"})
                            break

                except websockets.exceptions.ConnectionClosed:
                    pass
                except Exception as exc:
                    logger.error("[ElevenWS] eleven_to_browser: %s", exc)

            asyncio.create_task(_open_mic_fallback())  # safety: open mic after 8s max
            await asyncio.gather(browser_to_eleven(), eleven_to_browser())

    except Exception as exc:
        logger.error("[ElevenWS] connection error: %s", exc)
        await _safe_send_json(websocket, {
            "type": "error",
            "message": f"Failed to connect to ElevenLabs: {exc}",
        })
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
        logger.info("[ElevenWS] Call ended: bot=%s session=%s", bot_id, session_id)
        if chat_history and supabase:
            asyncio.create_task(_process_call_leads(bot_id, session_id, chat_history, supabase))


# ─── WebSocket Endpoint ───────────────────────────────────────────────────────

@router.websocket("/call/{bot_id}")
async def websocket_call(
    websocket: WebSocket,
    bot_id: str,
    session_id: str = "default",
) -> None:
    await websocket.accept()
    logger.info("[WS] Call connected: bot=%s session=%s", bot_id, session_id)

    # Count this as an active visitor
    try:
        from ..routers.bots import _touch_session
        _touch_session(bot_id, session_id)
    except Exception:
        pass

    supabase = get_supabase_client()
    persona, config, bot_name = await _fetch_bot_config(bot_id, supabase)
    kb_context = await _fetch_kb_context(bot_id, supabase)
    system_prompt = _build_system_prompt(persona, config, kb_context)

    # Route to ElevenLabs if configured
    voice_provider  = config.get("voice_provider", "openai")
    fresh_eleven_key = os.environ.get("ELEVENLABS_API_KEY", "").strip() or ELEVENLABS_API_KEY
    if voice_provider == "elevenlabs" and fresh_eleven_key:
        await _relay_elevenlabs(websocket, bot_id, session_id, system_prompt, config, supabase, bot_name)
        return

    if not OPENAI_API_KEY:
        await _safe_send_json(websocket, {"type": "error", "message": "OpenAI API key not configured."})
        await websocket.close()
        return

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
