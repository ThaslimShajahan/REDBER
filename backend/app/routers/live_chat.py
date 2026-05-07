"""
Human-in-the-Loop live chat router.

Provides:
  WS  /api/admin/live/ws          — admin WebSocket for real-time session monitoring
  GET /api/admin/live/sessions     — list all active sessions (REST fallback)
  POST /api/admin/live/sessions/{id}/send     — admin sends a message to user
  POST /api/admin/live/sessions/{id}/takeover — admin takes over (pauses AI)
  POST /api/admin/live/sessions/{id}/release  — release back to AI
"""
import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends
from pydantic import BaseModel
from ..dependencies.auth import get_current_user
from ..services import live_sessions

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/live", tags=["live_chat"])


class AdminMessageRequest(BaseModel):
    message: str


@router.websocket("/ws")
async def admin_live_ws(websocket: WebSocket):
    """
    Admin WebSocket. Streams all live chat activity in real-time.
    Sends an 'init' event with current sessions on connect, then
    'message', 'takeover', and 'release' events as they happen.
    """
    await websocket.accept()
    q: asyncio.Queue = asyncio.Queue(maxsize=200)
    live_sessions.subscribe_admin(q)
    logger.info("[LiveChat] Admin WebSocket connected")

    try:
        while True:
            try:
                event = await asyncio.wait_for(q.get(), timeout=25.0)
                await websocket.send_text(json.dumps(event))
            except asyncio.TimeoutError:
                # Heartbeat to keep connection alive
                await websocket.send_text(json.dumps({"type": "ping", "ts": asyncio.get_event_loop().time()}))
    except WebSocketDisconnect:
        logger.info("[LiveChat] Admin WebSocket disconnected")
    except Exception as e:
        logger.warning("[LiveChat] WebSocket error: %s", e)
    finally:
        live_sessions.unsubscribe_admin(q)


@router.get("/sessions", dependencies=[Depends(get_current_user)])
async def list_active_sessions():
    """REST fallback: returns all active sessions with last 20 messages each."""
    return live_sessions.get_active_sessions()


@router.post("/sessions/{session_id}/send", dependencies=[Depends(get_current_user)])
async def admin_send_message(session_id: str, body: AdminMessageRequest):
    """
    Admin sends a message that will be delivered to the user on their next chat request.
    The session must be in takeover mode — otherwise the AI would reply normally.
    """
    msg = body.message.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="message cannot be empty")
    live_sessions.add_admin_reply(session_id, msg)
    return {"status": "queued", "session_id": session_id}


@router.post("/sessions/{session_id}/takeover", dependencies=[Depends(get_current_user)])
async def takeover_session(session_id: str):
    """Pause AI for this session. Admin takes control."""
    live_sessions.takeover(session_id)
    return {"status": "taken_over", "session_id": session_id}


@router.post("/sessions/{session_id}/release", dependencies=[Depends(get_current_user)])
async def release_session(session_id: str):
    """Resume AI for this session."""
    live_sessions.release(session_id)
    return {"status": "released", "session_id": session_id}
