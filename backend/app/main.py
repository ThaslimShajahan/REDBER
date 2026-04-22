import os
from dotenv import load_dotenv
load_dotenv()

# ── Set Firebase project env before any import touches it ────────────────────
if "FIREBASE_PROJECT_ID" in os.environ:
    os.environ["GOOGLE_CLOUD_PROJECT"] = os.environ["FIREBASE_PROJECT_ID"]

# ── Structured logging (must be before app imports) ──────────────────────────
from .core.logging import setup_logging
setup_logging()

import logging
logger = logging.getLogger(__name__)

# ── Optional Sentry (only activates when SENTRY_DSN is set) ──────────────────
_sentry_dsn = os.environ.get("SENTRY_DSN", "").strip()
if _sentry_dsn:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration
        sentry_sdk.init(
            dsn=_sentry_dsn,
            integrations=[StarletteIntegration(), FastApiIntegration()],
            traces_sample_rate=float(os.environ.get("SENTRY_TRACES_RATE", "0.05")),
            environment=os.environ.get("ENVIRONMENT", "production"),
        )
        logger.info("Sentry initialised (dsn masked)")
    except ImportError:
        logger.warning("sentry-sdk not installed — skipping Sentry init")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time

from .routers import bots, admin, ws_call

app = FastAPI(title="PersonaAI MVP Backend")

# ── Request timing middleware ─────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    ms = (time.perf_counter() - start) * 1000
    logger.info("%s %s → %d  (%.0fms)", request.method, request.url.path, response.status_code, ms)
    return response

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://localhost:4000",
        "https://redber.in",
        "https://www.redber.in",
        "http://redber.in",
        "http://www.redber.in",
        "https://dev.redber.in",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bots.router)
app.include_router(admin.router)
app.include_router(ws_call.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to PersonaAI API"}


@app.get("/health")
def health():
    """Health-check endpoint for load balancers and uptime monitors."""
    return {"status": "ok"}
