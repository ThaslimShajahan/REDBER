"""
whatsapp.py — WhatsApp Cloud API webhook handler.

Incoming messages from Meta → AI response via bot pipeline → reply via Graph API.

Webhook setup in Meta Developer Console:
  URL:          https://api.redber.in/api/whatsapp/webhook
  Verify Token: (value of WHATSAPP_VERIFY_TOKEN in .env)
  Fields:       messages
"""

import os
import json
import logging
import asyncio
import datetime
import httpx
from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import PlainTextResponse

from ..integrations.supabase_client import get_supabase_client
from ..integrations.openai_client import generate_chat_response

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])
logger = logging.getLogger(__name__)

WHATSAPP_TOKEN        = os.environ.get("WHATSAPP_ACCESS_TOKEN", "").strip()
WHATSAPP_VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN", "redber_whatsapp_verify_2026").strip()
WHATSAPP_API_VERSION  = "v25.0"
GRAPH_API_BASE        = f"https://graph.facebook.com/{WHATSAPP_API_VERSION}"

# De-dupe: ignore messages we've already processed (in-memory, per process restart)
_processed_ids: set[str] = set()
_MAX_DEDUP_SIZE = 2000


# ─── Helpers ─────────────────────────────────────────────────────────────────

async def _send_whatsapp_message(phone_number_id: str, to: str, text: str, token: str) -> None:
    url = f"{GRAPH_API_BASE}/{phone_number_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "text",
        "text": {"body": text[:4096]},  # WhatsApp max text length
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            url,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json=payload,
        )
        if resp.status_code not in (200, 201):
            logger.error("[WA] Send failed %s: %s", resp.status_code, resp.text[:200])
        else:
            logger.info("[WA] Sent to %s", to)


async def _mark_read(phone_number_id: str, message_id: str, token: str) -> None:
    url = f"{GRAPH_API_BASE}/{phone_number_id}/messages"
    async with httpx.AsyncClient(timeout=10.0) as client:
        await client.post(
            url,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"messaging_product": "whatsapp", "status": "read", "message_id": message_id},
        )


def _fetch_bot_for_phone(phone_number_id: str, supabase) -> tuple[str, str, dict]:
    """
    Returns (bot_id, persona_prompt, config) for the bot linked to this WhatsApp number.
    Looks for persona_config->>'whatsapp_phone_number_id' == phone_number_id.
    Falls back to WHATSAPP_DEFAULT_BOT_ID env var, then first bot found.
    """
    default_bot_id = os.environ.get("WHATSAPP_DEFAULT_BOT_ID", "").strip()
    if not supabase:
        return default_bot_id, "You are a helpful assistant.", {}

    try:
        # Try explicit mapping first
        all_bots = supabase.table("bots").select("id, persona_prompt, persona_config, name").execute()
        if all_bots.data:
            for bot in all_bots.data:
                cfg = bot.get("persona_config") or {}
                if cfg.get("whatsapp_phone_number_id", "").strip() == phone_number_id:
                    return bot["id"], bot.get("persona_prompt") or "You are a helpful assistant.", cfg

        # Fall back to env default
        if default_bot_id:
            for bot in all_bots.data or []:
                if bot["id"] == default_bot_id:
                    return bot["id"], bot.get("persona_prompt") or "You are a helpful assistant.", bot.get("persona_config") or {}

        # Last resort: first bot
        if all_bots.data:
            bot = all_bots.data[0]
            return bot["id"], bot.get("persona_prompt") or "You are a helpful assistant.", bot.get("persona_config") or {}
    except Exception as e:
        logger.warning("[WA] bot lookup error: %s", e)

    return default_bot_id or "unknown", "You are a helpful assistant.", {}


def _fetch_kb_context(bot_id: str, supabase) -> str:
    if not supabase or not bot_id:
        return ""
    try:
        res = supabase.table("knowledge_base").select("content").eq("bot_id", bot_id).limit(6).execute()
        if res.data:
            return "\n\n".join(item["content"] for item in res.data)
    except Exception as e:
        logger.warning("[WA] KB fetch error: %s", e)
    return ""


def _build_whatsapp_prompt(persona: str, config: dict, kb_context: str) -> str:
    now = datetime.datetime.now()
    industry = (config.get("industry") or "").lower()

    if "restaurant" in industry or "food" in industry:
        booking_rule = "Collect Date, Time, Guest count, Name, Phone — one at a time."
    elif "hotel" in industry or "hospitality" in industry:
        booking_rule = "Collect Check-in date, Check-out date, Room type, Name, Phone — one at a time."
    elif "automotive" in industry or "dealer" in industry:
        booking_rule = "Collect Preferred Date, Time, Name, Phone — one at a time."
    else:
        booking_rule = "Collect Name, Phone, and preferred time — one at a time."

    prompt = (
        f"[SYSTEM — CURRENT DATE & TIME]\n"
        f"TODAY IS {now.strftime('%A, %B %d, %Y')}. TIME: {now.strftime('%I:%M %p')}.\n"
        f"Always use this date. Never say a different date.\n\n"
        f"{persona}\n\n"
        "━━━ WHATSAPP CHANNEL RULES ━━━\n"
        "You are responding via WhatsApp. Keep replies concise and conversational.\n"
        "Use short paragraphs — no bullet walls. Emojis are fine but don't overdo it.\n"
        "Respond in the same language the customer uses.\n"
        f"BOOKING: {booking_rule} Once confirmed, say [SYSTEM_BOOKING_CONFIRMED].\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    )
    if kb_context:
        prompt += f"\nKNOWLEDGE BASE:\n{kb_context}\n"
    return prompt


def _fetch_history(bot_id: str, session_id: str, supabase, limit: int = 10) -> list[dict]:
    """Fetch recent conversation for this WhatsApp session from chat_logs."""
    if not supabase:
        return []
    try:
        rows = (
            supabase.table("chat_logs")
            .select("user_message, bot_reply")
            .eq("bot_id", bot_id)
            .eq("session_id", session_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        history = []
        for row in reversed(rows.data or []):
            if row.get("user_message") and row["user_message"] != "[WHATSAPP SESSION]":
                history.append({"role": "user", "content": row["user_message"]})
            if row.get("bot_reply"):
                history.append({"role": "assistant", "content": row["bot_reply"]})
        return history
    except Exception as e:
        logger.warning("[WA] history fetch: %s", e)
    return []


def _save_log(bot_id: str, session_id: str, user_msg: str, bot_reply: str, supabase) -> None:
    if not supabase:
        return
    try:
        supabase.table("chat_logs").insert({
            "bot_id": bot_id,
            "session_id": session_id,
            "user_message": user_msg,
            "bot_reply": bot_reply,
            "confidence_score": "High",
            "lead_score": 0,
        }).execute()
    except Exception as e:
        logger.warning("[WA] save log: %s", e)


async def _handle_message(
    phone_number_id: str,
    from_number: str,
    message_text: str,
    message_id: str,
    token: str,
) -> None:
    supabase = get_supabase_client()
    bot_id, persona, config = _fetch_bot_for_phone(phone_number_id, supabase)
    kb_context = _fetch_kb_context(bot_id, supabase)
    system_prompt = _build_whatsapp_prompt(persona, config, kb_context)
    session_id = f"wa_{from_number}"

    # Build conversation history
    history = _fetch_history(bot_id, session_id, supabase)
    messages = [
        {"role": "system", "content": system_prompt},
        *history,
        {"role": "user", "content": message_text},
    ]

    # Generate AI reply
    try:
        reply = await generate_chat_response(messages)
        # Strip signal tags that sometimes appear in streamed responses
        reply = reply.replace("[SYSTEM_BOOKING_CONFIRMED]", "✅ Booking confirmed!").strip()
    except Exception as e:
        logger.error("[WA] AI error: %s", e)
        reply = "Sorry, I'm having a little trouble right now. Please try again in a moment!"

    # Send reply
    await _send_whatsapp_message(phone_number_id, from_number, reply, token)

    # Mark as read
    await _mark_read(phone_number_id, message_id, token)

    # Persist log
    _save_log(bot_id, session_id, message_text, reply, supabase)
    logger.info("[WA] Handled: bot=%s from=%s", bot_id, from_number)


# ─── Webhook Endpoints ────────────────────────────────────────────────────────

@router.get("/webhook")
async def verify_webhook(request: Request) -> PlainTextResponse:
    """Meta webhook verification handshake."""
    params = dict(request.query_params)
    mode      = params.get("hub.mode")
    token     = params.get("hub.verify_token")
    challenge = params.get("hub.challenge", "")

    if mode == "subscribe" and token == WHATSAPP_VERIFY_TOKEN:
        logger.info("[WA] Webhook verified")
        return PlainTextResponse(content=challenge)

    logger.warning("[WA] Webhook verify failed — token mismatch")
    raise HTTPException(status_code=403, detail="Verification token mismatch")


@router.post("/webhook")
async def receive_webhook(request: Request) -> dict:
    """Receive incoming WhatsApp messages from Meta."""
    body = await request.json()
    logger.debug("[WA] Webhook payload: %s", json.dumps(body)[:500])

    # Meta wraps everything in entry[].changes[].value
    for entry in body.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            if change.get("field") != "messages":
                continue

            phone_number_id = value.get("metadata", {}).get("phone_number_id", "")
            token = os.environ.get("WHATSAPP_ACCESS_TOKEN", WHATSAPP_TOKEN).strip()

            for msg in value.get("messages", []):
                msg_id   = msg.get("id", "")
                msg_type = msg.get("type", "")
                from_num = msg.get("from", "")

                # De-duplicate
                if msg_id in _processed_ids:
                    logger.debug("[WA] Duplicate message %s skipped", msg_id)
                    continue
                _processed_ids.add(msg_id)
                if len(_processed_ids) > _MAX_DEDUP_SIZE:
                    _processed_ids.clear()

                if msg_type == "text":
                    text = msg.get("text", {}).get("body", "").strip()
                    if text:
                        logger.info("[WA] Incoming from=%s: %s", from_num, text[:80])
                        asyncio.create_task(
                            _handle_message(phone_number_id, from_num, text, msg_id, token)
                        )
                elif msg_type in ("image", "audio", "video", "document"):
                    # Acknowledge receipt but can't process media yet
                    asyncio.create_task(
                        _send_whatsapp_message(
                            phone_number_id, from_num,
                            "Thanks for your message! I can only read text for now — please describe what you need and I'll help you out 😊",
                            token,
                        )
                    )
                    await _mark_read(phone_number_id, msg.get("id", ""), token)
                else:
                    logger.debug("[WA] Unhandled message type: %s", msg_type)

    # Meta expects a 200 quickly — processing happens in background tasks
    return {"status": "ok"}


# ─── Send API (for admin/manual use) ─────────────────────────────────────────

from pydantic import BaseModel

class WASendRequest(BaseModel):
    to: str
    message: str
    phone_number_id: str = ""

@router.post("/send")
async def send_message(req: WASendRequest) -> dict:
    """Manually send a WhatsApp message (admin use)."""
    token = os.environ.get("WHATSAPP_ACCESS_TOKEN", WHATSAPP_TOKEN).strip()
    phone_number_id = req.phone_number_id or os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")
    if not token or not phone_number_id:
        raise HTTPException(status_code=400, detail="Missing WHATSAPP_ACCESS_TOKEN or phone_number_id")
    await _send_whatsapp_message(phone_number_id, req.to, req.message, token)
    return {"status": "sent"}
