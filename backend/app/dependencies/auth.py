import os
import time
import json
import base64
import requests as req_lib
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# ── Firebase project config ────────────────────────────────────────────────────
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "redber-persona-mvp")
SUPER_ADMIN_UID = "0QldlPOgyQS2ddhvvOBHyB797hD2"

# Public-key cache: { kid: rsa_public_key_pem }
_pk_cache: dict = {}
_pk_cache_expiry: float = 0.0

FIREBASE_CERTS_URL = (
    "https://www.googleapis.com/robot/v1/metadata/x509/"
    "securetoken@system.gserviceaccount.com"
)


def _get_firebase_public_keys() -> dict:
    """Fetch Firebase's public RSA keys (cached until they expire)."""
    global _pk_cache, _pk_cache_expiry
    now = time.time()
    if _pk_cache and now < _pk_cache_expiry:
        return _pk_cache
    try:
        resp = req_lib.get(FIREBASE_CERTS_URL, timeout=5)
        resp.raise_for_status()
        # Cache-Control header tells us how long to cache
        cc = resp.headers.get("Cache-Control", "")
        max_age = 3600
        for part in cc.split(","):
            part = part.strip()
            if part.startswith("max-age="):
                try:
                    max_age = int(part.split("=")[1])
                except ValueError:
                    pass
        _pk_cache = resp.json()
        _pk_cache_expiry = now + max_age
        print(f"[AUTH] Fetched {len(_pk_cache)} Firebase public keys, expires in {max_age}s")
    except Exception as e:
        print(f"[AUTH] Failed to fetch Firebase public keys: {e}")
    return _pk_cache


def _b64_decode(data: str) -> bytes:
    """URL-safe base64 decode with padding fix."""
    padding = 4 - len(data) % 4
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data)


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token manually using Firebase's public keys.
    This works without a service account — just needs the project ID.
    """
    try:
        from cryptography.hazmat.primitives.serialization import load_pem_public_key
        from cryptography.x509 import load_pem_x509_certificate
        from cryptography.hazmat.primitives.asymmetric.padding import PKCS1v15
        from cryptography.hazmat.primitives import hashes
        from cryptography.exceptions import InvalidSignature
    except ImportError:
        # Fallback: try firebase_admin if cryptography not installed
        import firebase_admin
        from firebase_admin import auth as firebase_auth, credentials
        if not firebase_admin._apps:
            firebase_admin.initialize_app(options={"projectId": FIREBASE_PROJECT_ID})
        decoded = firebase_auth.verify_id_token(id_token)
        return decoded

    # ── Split the JWT ──────────────────────────────────────────────────────────
    parts = id_token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid JWT format")

    header_b64, payload_b64, sig_b64 = parts
    header = json.loads(_b64_decode(header_b64))
    payload = json.loads(_b64_decode(payload_b64))
    signature = _b64_decode(sig_b64)
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

    # ── Validate standard claims ───────────────────────────────────────────────
    now = time.time()
    if payload.get("iss") != f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}":
        raise ValueError(f"Invalid issuer: {payload.get('iss')}")
    if payload.get("aud") != FIREBASE_PROJECT_ID:
        raise ValueError(f"Invalid audience: {payload.get('aud')}")
    if payload.get("exp", 0) < now:
        raise ValueError("Token has expired")
    if payload.get("iat", 0) > now + 300:
        raise ValueError("Token issued in the future")
    if not payload.get("sub"):
        raise ValueError("Missing sub claim")

    # ── Verify signature ───────────────────────────────────────────────────────
    kid = header.get("kid")
    public_keys = _get_firebase_public_keys()
    if kid not in public_keys:
        raise ValueError(f"Unknown key id: {kid}")

    pem = public_keys[kid].encode("utf-8")
    
    # Firebase certificates are x509 certificates, not just public keys
    try:
        cert = load_pem_x509_certificate(pem)
        public_key = cert.public_key()
    except Exception as e:
        # Fallback in case they ever return raw public keys
        try:
            public_key = load_pem_public_key(pem)
        except:
            raise ValueError(f"Failed to load public key from certificate: {e}")

    public_key.verify(signature, signing_input, PKCS1v15(), hashes.SHA256())

    # ── Return normalised token dict (same shape as firebase_admin) ────────────
    payload["uid"] = payload.get("sub")
    print(f"[AUTH] Token verified: {payload.get('email')} (uid={payload.get('uid')})")
    return payload


# ── FastAPI security scheme ────────────────────────────────────────────────────
security = HTTPBearer()


async def get_current_user(res: HTTPAuthorizationCredentials = Depends(security)):
    token = res.credentials
    try:
        return verify_firebase_token(token)
    except Exception as e:
        error_msg = f"[AUTH] Token verification failed: {e}"
        print(error_msg)
        # Log to a file we can read
        try:
            with open("c:\\Work\\persona-ai-mvp\\backend\\auth_error.log", "a") as f:
                f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} - {error_msg}\n")
        except:
            pass
            
        raise HTTPException(
            status_code=401,
            detail=f"Invalid or expired authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_super_admin(decoded_token: dict = Depends(get_current_user)):
    uid = decoded_token.get("uid")
    role = decoded_token.get("role")
    print(f"[AUTH] Super-admin check: uid={uid}, role={role}")
    if uid == SUPER_ADMIN_UID or role == "super_admin":
        return decoded_token
    raise HTTPException(status_code=403, detail="Not authorized to access this resource")


async def get_user_bots(decoded_token: dict = Depends(get_current_user)):
    uid = decoded_token.get("uid")
    print(f"[AUTH] get_user_bots: uid={uid}")

    if uid == SUPER_ADMIN_UID:
        print("[AUTH] Super admin → all bots")
        return None  # None means "all bots"

    # For regular users, look up their bot list in Supabase
    try:
        from ..integrations.supabase_client import get_supabase_client
        supabase = get_supabase_client()
        if supabase:
            res = supabase.table("user_bots").select("bot_id").eq("user_id", uid).execute()
            bot_ids = [row["bot_id"] for row in (res.data or [])]
            print(f"[AUTH] User {uid} has bots: {bot_ids}")
            return bot_ids if bot_ids else []
    except Exception as e:
        print(f"[AUTH] Supabase user_bots lookup failed: {e}")

    # No bots found → return empty list (non-super-admin with no bots)
    return []
