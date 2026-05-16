from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Literal
from ..integrations.supabase_client import get_supabase_client
from ..dependencies.auth import get_current_user

VALID_REGIONS = {"INR", "USD", "GBP", "AED"}
VALID_PLANS = {"starter", "growth", "business"}

# Static fallback if DB is unavailable
_DEFAULTS = {
    "INR": {"starter": {"monthly": 5500,  "yearly": 55000},  "growth": {"monthly": 9999,  "yearly": 100000}, "business": {"monthly": 18999, "yearly": 189990}},
    "AED": {"starter": {"monthly": 349,   "yearly": 3500},   "growth": {"monthly": 549,   "yearly": 5500},   "business": {"monthly": 749,   "yearly": 7500}},
    "USD": {"starter": {"monthly": 99,    "yearly": 999},    "growth": {"monthly": 149,   "yearly": 1499},   "business": {"monthly": 199,   "yearly": 1999}},
    "GBP": {"starter": {"monthly": 79,    "yearly": 749},    "growth": {"monthly": 119,   "yearly": 1149},   "business": {"monthly": 169,   "yearly": 1589}},
}

router = APIRouter(prefix="/api/pricing", tags=["pricing"])


@router.get("")
def get_pricing():
    """Return full pricing table (public endpoint — no auth required)."""
    supabase = get_supabase_client()
    if not supabase:
        return _DEFAULTS

    try:
        rows = supabase.table("pricing_config").select("region,plan,monthly,yearly").execute()
        if not rows.data:
            return _DEFAULTS

        result = {r: {p: {} for p in VALID_PLANS} for r in VALID_REGIONS}
        for row in rows.data:
            region = row["region"]
            plan = row["plan"]
            if region in result and plan in result[region]:
                result[region][plan] = {"monthly": float(row["monthly"]), "yearly": float(row["yearly"])}

        # Fill any missing entries with defaults
        for region in VALID_REGIONS:
            for plan in VALID_PLANS:
                if not result[region][plan]:
                    result[region][plan] = _DEFAULTS[region][plan]
        return result
    except Exception:
        return _DEFAULTS


class PriceUpdate(BaseModel):
    monthly: float
    yearly: float


@router.put("/{region}/{plan}")
def update_pricing(
    region: str,
    plan: str,
    body: PriceUpdate,
    user: dict = Depends(get_current_user),
):
    """Update price for a region+plan combo. Requires admin auth."""
    if region not in VALID_REGIONS:
        raise HTTPException(status_code=400, detail=f"Invalid region. Must be one of: {VALID_REGIONS}")
    if plan not in VALID_PLANS:
        raise HTTPException(status_code=400, detail=f"Invalid plan. Must be one of: {VALID_PLANS}")
    if body.monthly <= 0 or body.yearly <= 0:
        raise HTTPException(status_code=400, detail="Prices must be positive numbers.")

    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    supabase.table("pricing_config").upsert(
        {"region": region, "plan": plan, "monthly": body.monthly, "yearly": body.yearly},
        on_conflict="region,plan"
    ).execute()

    return {"ok": True, "region": region, "plan": plan, "monthly": body.monthly, "yearly": body.yearly}
