import os
import time
import json
import base64
import logging
import requests as req_lib
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

# ── Firebase project config ───────────────────────────────────────────────────
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "redber-persona-mvp")
SUPER_ADMIN_UID = os.environ.get("SUPER_ADMIN_UID", "0QldlPOgyQS2ddhvvOBHyB797hD2")

# Set to "true" in .env / CI when tenant isolation should be enforced.
# Leave "false" during MVP to preserve existing behaviour for all authenticated users.
ENFORCE_TENANT_ISOLATION = os.environ.get("ENFORCE_TENANT_ISOLATION", "false").lower() == "true"

FIREBASE_CERTS_URL = (
    "https://www.googleapis.com/robot/v1/metadata/x509/"
    "securetoken@system.gserviceaccount.com"
)

# Public-key cache: { kid: rsa_public_key_pem }
_pk_cache: dict = {}
_pk_cache_expiry: float = 0.0

# Firebase Admin app initialisation (lazy, at most once)
_firebase_admin_initialised = False


def _ensure_firebase_admin() -> bool:
    """Initialise firebase_admin once.  Returns True if successful."""
    global _firebase_admin_initialised
    if _firebase_admin_initialised:
        return True
    try:
        import firebase_admin
        from firebase_admin import credentials
        if firebase_admin._apps:
            _firebase_admin_initialised = True
            return True
        sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT", "").strip()
        if sa_json:
            cred = credentials.Certificate(json.loads(sa_json))
        else:
            cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {"projectId": FIREBASE_PROJECT_ID})
        _firebase_admin_initialised = True
        return True
    except Exception as e:
        logger.warning("Firebase Admin init failed: %s", e)
        return False


def _get_firebase_public_keys() -> dict:
    global _pk_cache, _pk_cache_expiry
    now = time.time()
    if _pk_cache and now < _pk_cache_expiry:
        return _pk_cache
    try:
        resp = req_lib.get(FIREBASE_CERTS_URL, timeout=5)
        resp.raise_for_status()
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
        logger.info("Fetched %d Firebase public keys, expires in %ds", len(_pk_cache), max_age)
    except Exception as e:
        logger.error("Failed to fetch Firebase public keys: %s", e)
    return _pk_cache


def _b64_decode(data: str) -> bytes:
    padding = 4 - len(data) % 4
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data)


def verify_firebase_token(id_token: str) -> dict:
    try:
        from cryptography.hazmat.primitives.serialization import load_pem_public_key
        from cryptography.x509 import load_pem_x509_certificate
        from cryptography.hazmat.primitives.asymmetric.padding import PKCS1v15
        from cryptography.hazmat.primitives import hashes
    except ImportError:
        # Fallback: use firebase_admin SDK
        if _ensure_firebase_admin():
            from firebase_admin import auth as firebase_auth
            decoded = firebase_auth.verify_id_token(id_token)
            decoded["uid"] = decoded.get("uid") or decoded.get("sub")
            return decoded
        raise ValueError("cryptography package not installed and firebase_admin unavailable")

    parts = id_token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid JWT format")

    header_b64, payload_b64, sig_b64 = parts
    header = json.loads(_b64_decode(header_b64))
    payload = json.loads(_b64_decode(payload_b64))
    signature = _b64_decode(sig_b64)
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

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

    kid = header.get("kid")
    public_keys = _get_firebase_public_keys()
    if kid not in public_keys:
        raise ValueError(f"Unknown key id: {kid}")

    pem = public_keys[kid].encode("utf-8")
    try:
        cert = load_pem_x509_certificate(pem)
        public_key = cert.public_key()
    except Exception as e:
        try:
            public_key = load_pem_public_key(pem)
        except Exception:
            raise ValueError(f"Failed to load public key: {e}")

    public_key.verify(signature, signing_input, PKCS1v15(), hashes.SHA256())

    payload["uid"] = payload.get("sub")
    logger.info("Token verified: %s (uid=%s)", payload.get("email"), payload.get("uid"))
    return payload


# ── FastAPI security scheme ───────────────────────────────────────────────────
security = HTTPBearer()


async def get_current_user(res: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = res.credentials
    try:
        return verify_firebase_token(token)
    except Exception as e:
        error_msg = f"Token verification failed: {e}"
        logger.warning("[AUTH] %s", error_msg)
        try:
            log_path = os.path.join(os.path.dirname(__file__), "..", "..", "auth_error.log")
            with open(os.path.abspath(log_path), "a") as f:
                f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} - {error_msg}\n")
        except Exception:
            pass
        raise HTTPException(
            status_code=401,
            detail=f"Invalid or expired authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_super_admin(decoded_token: dict = Depends(get_current_user)) -> dict:
    """Restrict endpoint to the super-admin UID or a user with role='super_admin'."""
    if not ENFORCE_TENANT_ISOLATION:
        # MVP mode — all authenticated users have super-admin access
        return decoded_token
    uid = decoded_token.get("uid")
    role = decoded_token.get("role")
    logger.debug("[AUTH] super-admin check: uid=%s role=%s", uid, role)
    if uid == SUPER_ADMIN_UID or role == "super_admin":
        return decoded_token
    raise HTTPException(status_code=403, detail="Not authorised to access this resource")


async def _get_user_bot_ids_from_firestore(uid: str) -> list[str]:
    """Look up a user's allowed bot IDs from Firestore."""
    if not _ensure_firebase_admin():
        logger.warning("[AUTH] Firebase Admin unavailable — returning empty bot list for uid=%s", uid)
        return []
    from firebase_admin import firestore
    db = firestore.client()
    loop = __import__("asyncio").get_event_loop()
    doc = await loop.run_in_executor(None, lambda: db.collection("users").document(uid).get())
    if doc.exists:
        data = doc.to_dict() or {}
        bot_ids = data.get("botIds", [])
        logger.debug("[AUTH] uid=%s allowed bots: %s", uid, bot_ids)
        return bot_ids if isinstance(bot_ids, list) else []
    logger.warning("[AUTH] No Firestore user doc for uid=%s", uid)
    return []


async def get_user_bots(decoded_token: dict = Depends(get_current_user)) -> list[str] | None:
    """
    Returns None (= all bots) for super-admins.
    Returns a list of allowed bot IDs for regular tenants.
    When ENFORCE_TENANT_ISOLATION=false (MVP mode) everyone gets None.
    """
    uid = decoded_token.get("uid")

    if not ENFORCE_TENANT_ISOLATION:
        return None  # MVP: everyone sees all bots

    if uid == SUPER_ADMIN_UID:
        return None  # super-admin sees everything

    try:
        return await _get_user_bot_ids_from_firestore(uid)
    except Exception as e:
        logger.error("[AUTH] Firestore bot lookup failed for uid=%s: %s", uid, e)
        return []
