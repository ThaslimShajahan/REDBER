"""
Live session store for the Human-in-the-Loop admin feature.

Sessions are kept in memory for fast access. On startup (or when the in-memory
store is empty) recent sessions are recovered from chat_logs so a server restart
doesn't wipe the Live Monitor.
"""
import asyncio
import time
import typing
import datetime
import logging

_logger = logging.getLogger(__name__)

SESSION_TTL = 3600  # 1 hour of inactivity before session is removed

# session_id → { bot_id, messages: [], started_at, last_active, is_taken_over }
_sessions: typing.Dict[str, dict] = {}

# Pending admin replies keyed by session_id — returned to user on next message
_pending_admin_replies: typing.Dict[str, typing.List[str]] = {}

# Admin WebSocket queues — all admins share a global broadcast channel
_admin_queues: typing.Set[asyncio.Queue] = set()

# Sessions where a human admin has taken over (AI is paused)
_taken_over: typing.Set[str] = set()


def push_message(session_id: str, bot_id: typing.Optional[str], role: str, content: str, metadata: dict) -> None:
    """Called by BotService after every chat exchange. Stores and broadcasts."""
    now = time.time()
    if session_id not in _sessions:
        _sessions[session_id] = {
            "bot_id": bot_id,
            "messages": [],
            "started_at": now,
            "last_active": now,
            "is_taken_over": session_id in _taken_over,
        }
    _sessions[session_id]["last_active"] = now
    _sessions[session_id]["is_taken_over"] = session_id in _taken_over

    msg = {"role": role, "content": content, "ts": now, **metadata}
    _sessions[session_id]["messages"].append(msg)

    event = {
        "type": "message",
        "session_id": session_id,
        "bot_id": bot_id or _sessions[session_id].get("bot_id"),
        "role": role,
        "content": content,
        "ts": now,
        **metadata,
    }
    _broadcast(event)
    _cleanup_old_sessions()


def _broadcast(event: dict) -> None:
    dead = set()
    for q in _admin_queues:
        try:
            q.put_nowait(event)
        except (asyncio.QueueFull, RuntimeError):
            dead.add(q)
    _admin_queues.difference_update(dead)


def _cleanup_old_sessions() -> None:
    cutoff = time.time() - SESSION_TTL
    stale = [sid for sid, s in _sessions.items() if s.get("last_active", 0) < cutoff]
    for sid in stale:
        _sessions.pop(sid, None)
        _taken_over.discard(sid)
        _pending_admin_replies.pop(sid, None)


def restore_from_db() -> None:
    """Reload recent sessions from chat_logs (called on startup or when store is empty)."""
    try:
        from app.integrations.supabase_client import get_supabase_client
        supabase = get_supabase_client()
        if not supabase:
            return
        cutoff_dt = (datetime.datetime.utcnow() - datetime.timedelta(seconds=SESSION_TTL)).isoformat()
        res = supabase.table("chat_logs").select("session_id,bot_id,user_message,bot_reply,created_at") \
            .gte("created_at", cutoff_dt).order("created_at", desc=False).limit(1000).execute()
        for row in (res.data or []):
            sid = row.get("session_id")
            if not sid:
                continue
            try:
                ts = datetime.datetime.fromisoformat(
                    row["created_at"].replace("Z", "+00:00")
                ).timestamp()
            except Exception:
                ts = time.time()
            if sid not in _sessions:
                _sessions[sid] = {
                    "bot_id": row.get("bot_id"),
                    "messages": [],
                    "started_at": ts,
                    "last_active": ts,
                    "is_taken_over": False,
                }
            _sessions[sid]["last_active"] = max(_sessions[sid]["last_active"], ts)
            if row.get("user_message"):
                _sessions[sid]["messages"].append({"role": "user", "content": row["user_message"], "ts": ts})
            if row.get("bot_reply"):
                _sessions[sid]["messages"].append({"role": "bot", "content": row["bot_reply"], "ts": ts + 0.1})
        _logger.info("[live_sessions] Restored %d sessions from DB", len(_sessions))
    except Exception as exc:
        _logger.warning("[live_sessions] restore_from_db failed: %s", exc)


def get_active_sessions() -> typing.List[dict]:
    _cleanup_old_sessions()
    if not _sessions:
        restore_from_db()
    result = []
    for sid, data in _sessions.items():
        result.append({
            "session_id": sid,
            "bot_id": data.get("bot_id"),
            "started_at": data.get("started_at"),
            "last_active": data.get("last_active"),
            "message_count": len(data.get("messages", [])),
            "is_taken_over": sid in _taken_over,
            "messages": data.get("messages", [])[-20:],  # last 20 messages for admin
        })
    result.sort(key=lambda x: x.get("last_active", 0), reverse=True)
    return result


def subscribe_admin(q: asyncio.Queue) -> None:
    _admin_queues.add(q)
    # Send current sessions snapshot on connect
    snapshot = get_active_sessions()
    try:
        q.put_nowait({"type": "init", "sessions": snapshot})
    except asyncio.QueueFull:
        pass


def unsubscribe_admin(q: asyncio.Queue) -> None:
    _admin_queues.discard(q)


def is_taken_over(session_id: str) -> bool:
    return session_id in _taken_over


def takeover(session_id: str) -> None:
    _taken_over.add(session_id)
    if session_id in _sessions:
        _sessions[session_id]["is_taken_over"] = True
    _broadcast({"type": "takeover", "session_id": session_id, "ts": time.time()})


def release(session_id: str) -> None:
    _taken_over.discard(session_id)
    if session_id in _sessions:
        _sessions[session_id]["is_taken_over"] = False
    _broadcast({"type": "release", "session_id": session_id, "ts": time.time()})


def add_admin_reply(session_id: str, message: str) -> None:
    """Queue a message from the admin to be delivered to the user on their next request."""
    if session_id not in _pending_admin_replies:
        _pending_admin_replies[session_id] = []
    _pending_admin_replies[session_id].append(message)
    push_message(session_id, None, "admin", message, {})


def pop_admin_reply(session_id: str) -> typing.Optional[str]:
    """Return and remove the oldest pending admin reply for this session."""
    queue = _pending_admin_replies.get(session_id, [])
    if queue:
        reply = queue.pop(0)
        if not queue:
            _pending_admin_replies.pop(session_id, None)
        return reply
    return None
