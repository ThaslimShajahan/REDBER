from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from ..dependencies.auth import get_current_user
import json
import base64
import httpx
from ..models.schemas import ChatRequest, ChatResponse, ChatMessage
from ..integrations.openai_client import transcribe_audio, generate_speech
from ..integrations.supabase_client import get_supabase_client
from pydantic import BaseModel
from typing import Optional

import os
load_dotenv = lambda: __import__('dotenv').load_dotenv(override=True)
load_dotenv()

# Get key from environment
DEEPGRAM_API_KEY = os.environ.get("DEEPGRAM_API_KEY", "").strip()

router = APIRouter(
    prefix="/api/bots",
    tags=["bots"]
)


class TTSRequest(BaseModel):
    text: str
    voice: str = "aura-asteria-en"  # Deepgram Aura voice


@router.post("/tts")
async def text_to_speech(req: TTSRequest):
    """Convert text to speech using Deepgram Aura TTS (ultra-low latency)."""
    try:
        url = f"https://api.deepgram.com/v1/speak?model={req.voice}"
        headers = {
            "Authorization": f"Token {DEEPGRAM_API_KEY}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=15.0) as http_client:
            response = await http_client.post(url, headers=headers, json={"text": req.text})
            if response.status_code == 200:
                audio_b64 = base64.b64encode(response.content).decode("utf-8")
                return {"audio_b64": audio_b64, "provider": "deepgram"}
    except Exception as e:
        print(f"[TTS] Deepgram failed: {e}, falling back to OpenAI")

    # Fallback to OpenAI TTS
    try:
        audio_bytes = await generate_speech(req.text, "nova")
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        return {"audio_b64": audio_b64, "provider": "openai"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {e}")


# ── Public Bots Listing (no auth — for landing page) ──────────────────────────

@router.get("/public/list")
async def public_list_bots():
    """Returns Active bots for the public landing page — no auth required.
    Only exposes safe fields (no persona_prompt).
    """
    print("[PUBLIC BOTS] Fetching active bots...")
    supabase = get_supabase_client()
    if not supabase:
        print("[PUBLIC BOTS] Supabase client is None!")
        return []
    try:
        response = supabase.table("bots").select(
            "id, name, role, theme_color, avatar, status, persona_config, page_config, is_public"
        ).eq("status", "Active").eq("is_public", True).execute()
        print(f"[PUBLIC BOTS] Found {len(response.data)} bots.")
        return response.data or []
    except Exception as e:
        print(f"[PUBLIC BOTS] error: {e}")
        return []



class SetRateLimitsRequest(BaseModel):
    monthly_messages: int = 999999
    messages_per_day: int = 999999
    messages_per_hour: int = 999999
    api_calls_per_minute: int = 999999
    burst_limit: int = 999999
    max_bots: int = 20


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    from ..services.bot_service import BotService
    from ..services.rate_limiter import check_and_increment, get_bot_limits, get_friendly_block_message

    try:
        limits = await get_bot_limits(request.bot_id)
        if limits:
            allowed, reason, counts = await check_and_increment(request.bot_id, limits)
            if not allowed:
                block_message = get_friendly_block_message(reason)
                return ChatResponse(
                    reply=block_message,
                    lead_score=0,
                    lead_type="rate_limited",
                    action_taken="blocked",
                    format_type="default"
                )
    except Exception as e:
        print(f"[RATE_LIMIT] Error checking limits: {e}")

    try:
        response = await BotService.process_chat(request)
        return response
    except Exception as e:
        return ChatResponse(
            reply=f"I encountered an error connecting to my persona brain. Error: {str(e)}",
            lead_score=0,
            lead_type="error",
            action_taken="none"
        )


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Streaming chat endpoint using Server-Sent Events (SSE).
    Yields tokens as they arrive from OpenAI — first token in ~1-2s instead of 14s.
    Events:
      data: {"type": "token", "content": "..."}   — one per token
      data: {"type": "done",  "reply": "...", "format_type": "...", "action_taken": "..."}
    """
    from ..services.bot_service import BotService
    from ..services.rate_limiter import check_and_increment, get_bot_limits, get_friendly_block_message

    # Rate limit check (same as /chat)
    try:
        limits = await get_bot_limits(request.bot_id)
        if limits:
            allowed, reason, _ = await check_and_increment(request.bot_id, limits)
            if not allowed:
                block_message = get_friendly_block_message(reason)
                async def _blocked():
                    yield f"data: {json.dumps({'type': 'done', 'reply': block_message, 'format_type': 'default', 'action_taken': 'blocked'})}\n\n"
                return StreamingResponse(_blocked(), media_type="text/event-stream")
    except Exception as e:
        print(f"[RATE_LIMIT_STREAM] Error: {e}")

    async def _event_stream():
        try:
            async for event in BotService.process_chat_stream(request):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'done', 'reply': f'Error: {str(e)}', 'format_type': 'default', 'action_taken': 'none'})}\n\n"

    return StreamingResponse(
        _event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # tells Nginx NOT to buffer SSE
            "Connection": "keep-alive",
        }
    )


@router.post("/voice")
async def voice_chat(
    file: UploadFile = File(...),
    bot_id: str = Form(...),
    session_id: str = Form(...),
    history: str = Form("[]")
):
    from ..services.bot_service import BotService
    from ..services.rate_limiter import check_and_increment, get_bot_limits, get_friendly_block_message

    # ── Check rate limits for voice too ───────────────────────────────────────
    try:
        limits = await get_bot_limits(bot_id)
        if limits:
            allowed, reason, _ = await check_and_increment(bot_id, limits)
            if not allowed:
                return {"error": "rate_limited", "message": get_friendly_block_message(reason)}
    except Exception as e:
        print(f"[RATE_LIMIT_VOICE] Error: {e}")

    try:
        audio_bytes = await file.read()
        file_tuple = (file.filename or "audio.webm", audio_bytes, file.content_type)
        transcript_text = await transcribe_audio(file_tuple)

        history_dicts = json.loads(history)
        history_objs = [ChatMessage(**h) for h in history_dicts]

        request = ChatRequest(
            bot_id=bot_id,
            session_id=session_id,
            message=transcript_text + " [Respond briefly in casual, conversational language appropriate for a real-time phone call. Use natural filler words occasionally. NEVER use markdown or bullet points. Avoid lists.]",
            history=history_objs
        )

        response = await BotService.process_chat(request)

        bot_audio_bytes = await generate_speech(response.reply, "nova")
        audio_b64 = base64.b64encode(bot_audio_bytes).decode("utf-8")

        return {
            "transcript": transcript_text,
            "reply": response.reply,
            "audio_b64": audio_b64,
            "lead_score": response.lead_score,
            "lead_type": response.lead_type
        }
    except Exception as e:
        return {"error": str(e)}


_WA_PHONE_NUMBER_ID = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")
_WA_ACCESS_TOKEN = os.environ.get("WHATSAPP_ACCESS_TOKEN", "")
_WA_VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN", "redber_verify_token")


async def _send_whatsapp_reply(to: str, message: str) -> bool:
    """Send a text reply back to a WhatsApp user via Cloud API."""
    if not _WA_PHONE_NUMBER_ID or not _WA_ACCESS_TOKEN:
        import logging
        logging.getLogger(__name__).warning(
            "[WhatsApp] WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not set — reply NOT sent"
        )
        return False
    url = f"https://graph.facebook.com/v19.0/{_WA_PHONE_NUMBER_ID}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": message},
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            r = await c.post(
                url,
                headers={"Authorization": f"Bearer {_WA_ACCESS_TOKEN}", "Content-Type": "application/json"},
                json=payload,
            )
            return r.status_code == 200
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error("[WhatsApp] send error: %s", exc)
        return False


@router.get("/whatsapp")
async def whatsapp_verify(
    hub_mode: str = "",
    hub_verify_token: str = "",
    hub_challenge: str = "",
):
    """Meta webhook verification handshake (GET)."""
    from fastapi.responses import PlainTextResponse
    if hub_mode == "subscribe" and hub_verify_token == _WA_VERIFY_TOKEN:
        return PlainTextResponse(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/whatsapp")
async def whatsapp_webhook(payload: dict):
    from ..services.bot_service import BotService
    try:
        entry = payload.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])

        if not messages:
            return {"status": "ok", "message": "no messages parsed"}

        msg = messages[0]
        msg_type = msg.get("type", "")

        # Only handle text messages; ignore status updates, images, etc.
        if msg_type != "text":
            return {"status": "ok", "message": f"ignored type={msg_type}"}

        phone_number = msg.get("from", "")
        body = msg.get("text", {}).get("body", "").strip()

        if not phone_number or not body:
            return {"status": "ok", "message": "empty message"}

        bot_id = os.environ.get("WHATSAPP_DEFAULT_BOT_ID", "spa_ai")

        request = ChatRequest(
            bot_id=bot_id,
            session_id=phone_number,
            message=body,
            history=[],
        )

        response = await BotService.process_chat(request)

        # Actually deliver the reply back to the user via WhatsApp Cloud API
        sent = await _send_whatsapp_reply(phone_number, response.reply)

        return {"status": "success", "reply": response.reply, "delivered": sent}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


# ── Rate Limit Admin Endpoints ─────────────────────────────────────────────────

@router.post("/{bot_id}/rate-limits", dependencies=[Depends(get_current_user)])
async def set_bot_rate_limits(bot_id: str, req: dict):
    """
    Set rate limits for a bot with flexible duration selection.
    
    New format supports:
    {
        "primaryLimit": { "value": 500, "duration": "month" | "day" | "hour" | "minute" },
        "secondaryLimit": { "value": 50, "duration": "day" },  # Optional - spike protection
        "burstLimit": 50,  # Optional
        "maxBots": 5  # Optional
    }
    
    Also supports legacy format for backward compatibility.
    """
    from ..integrations.supabase_client import get_supabase_client
    
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        # Handle both new flexible format and legacy format
        limits_to_save = {}
        
        # Primary limit
        if "primaryLimit" in req and req["primaryLimit"] and req["primaryLimit"].get("value"):
            limits_to_save["primaryLimit"] = {
                "value": int(req["primaryLimit"]["value"]),
                "duration": req["primaryLimit"].get("duration", "month")
            }
        
        # Secondary limit (optional spike protection)
        if "secondaryLimit" in req and req["secondaryLimit"] and req["secondaryLimit"].get("value"):
            limits_to_save["secondaryLimit"] = {
                "value": int(req["secondaryLimit"]["value"]),
                "duration": req["secondaryLimit"].get("duration", "day")
            }
        
        # Burst limit (optional)
        if "burstLimit" in req and req.get("burstLimit"):
            limits_to_save["burstLimit"] = int(req["burstLimit"])
        
        # Max bots (optional)
        if "maxBots" in req and req.get("maxBots"):
            limits_to_save["maxBots"] = int(req["maxBots"])
        
        # Support legacy format for backward compatibility
        legacy_keys = ["monthly_messages", "messages_per_day", "messages_per_hour", "api_calls_per_minute"]
        if any(key in req for key in legacy_keys):
            limits_to_save["monthlyMessages"] = int(req.get("monthly_messages", 999999))
            limits_to_save["messagesPerDay"] = int(req.get("messages_per_day", 999999))
            limits_to_save["messagesPerHour"] = int(req.get("messages_per_hour", 999999))
            limits_to_save["apiCallsPerMinute"] = int(req.get("api_calls_per_minute", 999999))
        
        supabase.table("bots").update({"rate_limits": limits_to_save}).eq("id", bot_id).execute()
        return {"status": "updated", "bot_id": bot_id, "limits": limits_to_save}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{bot_id}/rate-limits", dependencies=[Depends(get_current_user)])
async def get_bot_rate_limits(bot_id: str):
    """Get the current rate limits and usage counters for a bot."""
    from ..services.rate_limiter import get_bot_limits, _window_keys, _now_utc, _get_supabase_count, _get_memory

    supabase = get_supabase_client()
    limits = await get_bot_limits(bot_id)
    
    now = _now_utc()
    windows = _window_keys(now)
    
    counts = {}
    for label, window in windows.items():
        if supabase:
            counts[label] = _get_supabase_count(supabase, bot_id, window)
        else:
            counts[label] = _get_memory(bot_id, window)
    
    return {
        "bot_id": bot_id,
        "limits": limits,
        "current_usage": counts,
        "windows": windows,
    }


@router.delete("/{bot_id}/rate-limits/reset", dependencies=[Depends(get_current_user)])
async def reset_bot_counters(bot_id: str):
    """Reset all rate limit counters for a bot (admin only - for testing)."""
    from ..services.rate_limiter import reset_counters
    await reset_counters(bot_id)
    return {"status": "reset", "bot_id": bot_id}
