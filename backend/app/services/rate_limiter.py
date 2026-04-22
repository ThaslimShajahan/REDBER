"""
Rate Limiter for PersonaAI bots.

Tracks message counts per bot_id using Supabase (`rate_counters` table).
Limits are read from Firebase (stored on the tenant user document).

Table schema (run once in Supabase SQL editor):

  CREATE TABLE IF NOT EXISTS rate_counters (
    bot_id       TEXT NOT NULL,
    window       TEXT NOT NULL,          -- 'month:2024-03', 'day:2024-03-16', 'hour:2024-03-16T14', 'minute:2024-03-16T14:32'
    count        INTEGER NOT NULL DEFAULT 0,
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (bot_id, window)
  );

"""

import asyncio
from datetime import datetime, timezone
from typing import Optional, Tuple
from app.integrations.supabase_client import get_supabase_client
import time

# ── In-memory fallback (if Supabase table isn't created yet) ──────────────────
_memory_counters: dict = {}

# ── Dynamic Fallbacks ────────────────────────────────────────────────────────
_supabase_counters_available = True
_supabase_limits_available = True

# ── In-memory cache for bot rate-limit configs (TTL 60s) ─────────────────────
_limits_cache: dict = {}   # bot_id -> (limits_dict, fetched_at)
_LIMITS_CACHE_TTL = 60     # seconds

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)

def _window_keys(now: datetime) -> dict:
    """Returns the window string identifiers for each rate window."""
    return {
        "month":  f"month:{now.strftime('%Y-%m')}",
        "day":    f"day:{now.strftime('%Y-%m-%d')}",
        "hour":   f"hour:{now.strftime('%Y-%m-%dT%H')}",
        "minute": f"minute:{now.strftime('%Y-%m-%dT%H:%M')}",
    }


def _inc_memory(bot_id: str, window: str) -> int:
    """Increment an in-memory counter and return the new value."""
    key = f"{bot_id}|{window}"
    _memory_counters[key] = _memory_counters.get(key, 0) + 1
    return _memory_counters[key]


def _get_memory(bot_id: str, window: str) -> int:
    return _memory_counters.get(f"{bot_id}|{window}", 0)


def _increment_supabase(supabase, bot_id: str, window: str) -> int:
    """
    Upsert a rate counter row and return the updated count.
    Uses Supabase upsert (insert or increment).
    """
    global _supabase_counters_available
    if not _supabase_counters_available:
        return _inc_memory(bot_id, window)
    try:
        # Try to get existing
        res = supabase.table("rate_counters").select("count").eq("bot_id", bot_id).eq("window", window).execute()
        if res.data:
            new_count = res.data[0]["count"] + 1
            supabase.table("rate_counters").update({"count": new_count, "updated_at": "now()"}).eq("bot_id", bot_id).eq("window", window).execute()
        else:
            new_count = 1
            supabase.table("rate_counters").insert({"bot_id": bot_id, "window": window, "count": 1}).execute()
        return new_count
    except Exception as e:
        err_str = str(e)
        if "PGRST205" in err_str or "does not exist" in err_str:
            _supabase_counters_available = False
        print(f"[RateLimiter] Supabase counter error: {e}")
        return _inc_memory(bot_id, window)


def _get_supabase_count(supabase, bot_id: str, window: str) -> int:
    global _supabase_counters_available
    if not _supabase_counters_available:
        return _get_memory(bot_id, window)
    try:
        res = supabase.table("rate_counters").select("count").eq("bot_id", bot_id).eq("window", window).execute()
        if res.data:
            return res.data[0]["count"]
        return 0
    except Exception as e:
        err_str = str(e)
        if "PGRST205" in err_str or "does not exist" in err_str:
            _supabase_counters_available = False
        return _get_memory(bot_id, window)


async def check_and_increment(
    bot_id: str,
    limits: dict,
) -> Tuple[bool, str, dict]:
    """
    Check rate limits for a bot, then increment counters if allowed.
    
    Supports both new flexible format and legacy format.
    
    New format:
    {
        "primaryLimit": { "value": 500, "duration": "month" },
        "secondaryLimit": { "value": 50, "duration": "day" },
        "burstLimit": 50,
        "maxBots": 5
    }
    
    Legacy format:
    {
        "monthlyMessages": 500,
        "messagesPerDay": 50,
        "messagesPerHour": 10,
        "apiCallsPerMinute": 5
    }

    Returns:
        (allowed: bool, reason: str, current_counts: dict)
        If allowed=False, the chat should be blocked and reason returned to user.
    """
    now = _now_utc()
    windows = _window_keys(now)
    supabase = get_supabase_client()
    loop = asyncio.get_event_loop()

    # ── Gather current counts in PARALLEL (4 reads at once) ──────────────────
    if supabase:
        results = await asyncio.gather(
            loop.run_in_executor(None, _get_supabase_count, supabase, bot_id, windows["month"]),
            loop.run_in_executor(None, _get_supabase_count, supabase, bot_id, windows["day"]),
            loop.run_in_executor(None, _get_supabase_count, supabase, bot_id, windows["hour"]),
            loop.run_in_executor(None, _get_supabase_count, supabase, bot_id, windows["minute"]),
            return_exceptions=True
        )
        curr_month  = results[0] if not isinstance(results[0], Exception) else _get_memory(bot_id, windows["month"])
        curr_day    = results[1] if not isinstance(results[1], Exception) else _get_memory(bot_id, windows["day"])
        curr_hour   = results[2] if not isinstance(results[2], Exception) else _get_memory(bot_id, windows["hour"])
        curr_minute = results[3] if not isinstance(results[3], Exception) else _get_memory(bot_id, windows["minute"])
    else:
        curr_month  = _get_memory(bot_id, windows["month"])
        curr_day    = _get_memory(bot_id, windows["day"])
        curr_hour   = _get_memory(bot_id, windows["hour"])
        curr_minute = _get_memory(bot_id, windows["minute"])

    current_counts = {
        "month":  curr_month,
        "day":    curr_day,
        "hour":   curr_hour,
        "minute": curr_minute,
    }

    # ── Handle new flexible format ────────────────────────────────────────
    if "primaryLimit" in limits and limits["primaryLimit"]:
        primary = limits["primaryLimit"]
        primary_value = int(primary.get("value", 999999))
        primary_duration = primary.get("duration", "month")
        
        # Check primary limit based on duration
        if primary_duration == "month" and curr_month >= primary_value:
            return False, f"primary_limit_reached:{curr_month}/{primary_value}", current_counts
        elif primary_duration == "day" and curr_day >= primary_value:
            return False, f"primary_limit_reached:{curr_day}/{primary_value}", current_counts
        elif primary_duration == "hour" and curr_hour >= primary_value:
            return False, f"primary_limit_reached:{curr_hour}/{primary_value}", current_counts
        elif primary_duration == "minute" and curr_minute >= primary_value:
            return False, f"primary_limit_reached:{curr_minute}/{primary_value}", current_counts
        
        # Check secondary limit if exists (spike protection)
        if "secondaryLimit" in limits and limits["secondaryLimit"]:
            secondary = limits["secondaryLimit"]
            secondary_value = int(secondary.get("value", 999999))
            secondary_duration = secondary.get("duration", "day")
            
            if secondary_duration == "month" and curr_month >= secondary_value:
                return False, f"secondary_limit_reached:{curr_month}/{secondary_value}", current_counts
            elif secondary_duration == "day" and curr_day >= secondary_value:
                return False, f"secondary_limit_reached:{curr_day}/{secondary_value}", current_counts
            elif secondary_duration == "hour" and curr_hour >= secondary_value:
                return False, f"secondary_limit_reached:{curr_hour}/{secondary_value}", current_counts
            elif secondary_duration == "minute" and curr_minute >= secondary_value:
                return False, f"secondary_limit_reached:{curr_minute}/{secondary_value}", current_counts
    
    # ── Handle legacy format (backward compatibility) ─────────────────────
    else:
        monthly_limit  = int(limits.get("monthlyMessages",    999999))
        daily_limit    = int(limits.get("messagesPerDay",      999999))
        hourly_limit   = int(limits.get("messagesPerHour",     999999))
        per_min_limit  = int(limits.get("apiCallsPerMinute",   999999))

        # Check limits (pre-increment counts) ───────────────────────────────────
        if curr_month >= monthly_limit:
            return False, f"monthly_limit_reached:{curr_month}/{monthly_limit}", current_counts

        if daily_limit < 999999 and curr_day >= daily_limit:
            return False, f"daily_limit_reached:{curr_day}/{daily_limit}", current_counts

        if hourly_limit < 999999 and curr_hour >= hourly_limit:
            return False, f"hourly_limit_reached:{curr_hour}/{hourly_limit}", current_counts

        if per_min_limit < 999999 and curr_minute >= per_min_limit:
            return False, f"rate_limit_per_minute:{curr_minute}/{per_min_limit}", current_counts

    # ── Allowed — increment all windows fire-and-forget (don't block the response) ──
    if supabase:
        asyncio.create_task(asyncio.gather(
            loop.run_in_executor(None, _increment_supabase, supabase, bot_id, windows["month"]),
            loop.run_in_executor(None, _increment_supabase, supabase, bot_id, windows["day"]),
            loop.run_in_executor(None, _increment_supabase, supabase, bot_id, windows["hour"]),
            loop.run_in_executor(None, _increment_supabase, supabase, bot_id, windows["minute"]),
            return_exceptions=True
        ))
    else:
        _inc_memory(bot_id, windows["month"])
        _inc_memory(bot_id, windows["day"])
        _inc_memory(bot_id, windows["hour"])
        _inc_memory(bot_id, windows["minute"])

    return True, "ok", current_counts


def get_friendly_block_message(reason: str) -> str:
    """Convert an internal block reason to a user-facing message."""
    # Handle new format messages
    if reason.startswith("primary_limit_reached"):
        parts = reason.split(":")[1].split("/")
        used, limit = parts[0], parts[1]
        return (
            f"⚠️ **Message limit reached.**\n\n"
            f"You've sent **{used}/{limit}** messages. "
            f"Please wait a bit before sending more messages.\n\n"
            f"*Your messages are important to us — try again soon!*"
        )
    if reason.startswith("secondary_limit_reached"):
        parts = reason.split(":")[1].split("/")
        used, limit = parts[0], parts[1]
        return (
            f"⚠️ **Too many requests too quickly.**\n\n"
            f"You're sending messages faster than allowed ({used}/{limit}). "
            f"Please slow down and try again in a moment."
        )
    
    # Handle legacy format messages
    if reason.startswith("monthly_limit_reached"):
        parts = reason.split(":")[1].split("/")
        used, limit = parts[0], parts[1]
        return (
            f"⚠️ **Monthly message limit reached.**\n\n"
            f"This bot has used **{used}/{limit}** messages this month. "
            f"Please contact support to upgrade your plan or wait until next month.\n\n"
            f"*Your messages are important to us — we'll be back at full capacity soon!*"
        )
    if reason.startswith("daily_limit_reached"):
        parts = reason.split(":")[1].split("/")
        used, limit = parts[0], parts[1]
        return (
            f"⚠️ **Daily message limit reached.**\n\n"
            f"This bot has sent **{used}/{limit}** messages today. "
            f"The limit resets at midnight UTC. Please try again tomorrow."
        )
    if reason.startswith("hourly_limit_reached"):
        parts = reason.split(":")[1].split("/")
        used, limit = parts[0], parts[1]
        return (
            f"⚠️ **Hourly message limit reached.**\n\n"
            f"This bot has sent **{used}/{limit}** messages this hour. "
            f"Please wait a few minutes before trying again."
        )
    if reason.startswith("rate_limit_per_minute"):
        parts = reason.split(":")[1].split("/")
        used, limit = parts[0], parts[1]
        return (
            f"⚠️ **Too many requests.**\n\n"
            f"You're sending messages too quickly ({used}/{limit} per minute). "
            f"Please slow down and try again in a moment."
        )
    return "⚠️ **Message limit reached.** Please try again later or contact support."


async def get_bot_limits(bot_id: str) -> dict:
    """
    Fetch the rate limits for a given bot from the 'bots' table in Supabase.
    Cached in memory for 60 s to avoid a DB round-trip on every message.
    """
    # Return cached limits if fresh
    cached = _limits_cache.get(bot_id)
    if cached and (time.monotonic() - cached[1]) < _LIMITS_CACHE_TTL:
        return cached[0]

    global _supabase_limits_available
    if not _supabase_limits_available:
        return {}

    supabase = get_supabase_client()
    if not supabase:
        return {}
    try:
        loop = asyncio.get_event_loop()
        res = await loop.run_in_executor(
            None,
            lambda: supabase.table("bots").select("rate_limits").eq("id", bot_id).execute()
        )
        limits = res.data[0].get("rate_limits") if res.data else {}
        _limits_cache[bot_id] = (limits or {}, time.monotonic())
        return limits or {}
    except Exception as e:
        err_str = str(e)
        if "42703" in err_str or "does not exist" in err_str:
            _supabase_limits_available = False
        print(f"[RateLimiter] Failed to fetch bot limits: {e}")
    return {}


async def reset_counters(bot_id: str):
    """
    Reset all counters for a bot (useful for testing).
    """
    supabase = get_supabase_client()
    if supabase:
        try:
            supabase.table("rate_counters").delete().eq("bot_id", bot_id).execute()
        except Exception as e:
            print(f"[RateLimiter] Reset error: {e}")
    # Also clear memory
    keys_to_del = [k for k in _memory_counters if k.startswith(f"{bot_id}|")]
    for k in keys_to_del:
        del _memory_counters[k]
