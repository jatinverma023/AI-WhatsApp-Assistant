"""
WhatsApp AI Bot — Application Entry Point
==========================================
This is the main entry point for the FastAPI application.

WHAT THIS FILE DOES:
1. Creates the FastAPI application instance
2. Configures CORS (Cross-Origin Resource Sharing) middleware
3. Mounts all route handlers
4. Defines the startup/shutdown lifecycle

WHY FastAPI?
- Built-in async support (handles many concurrent WhatsApp messages)
- Automatic API documentation (Swagger UI at /docs)
- Request validation via Pydantic (catches bad data before it hits your code)
- High performance (one of the fastest Python frameworks)

HOW TO RUN:
    uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import router
from src.config.settings import settings


# ── Application Lifecycle ─────────────────────────────────────────
# This runs code when the server starts up and shuts down.
# Useful for: connecting to databases, initializing AI models, cleanup
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application startup and shutdown events.
    
    Startup: Initialize resources (database connections, AI clients, etc.)
    Shutdown: Clean up resources (close connections, flush logs, etc.)
    """
    # ── Startup ───────────────────────────────────────────────────
    print("=" * 60)
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"📍 Server running at http://{settings.HOST}:{settings.PORT}")
    print(f"📚 API Docs at http://{settings.HOST}:{settings.PORT}/docs")
    print(f"🤖 Gemini AI: {'CONNECTED' if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != 'your-gemini-api-key-here' else 'NOT CONFIGURED'}")
    print(f"🐛 Debug mode: {'ON' if settings.DEBUG else 'OFF'}")
    print("=" * 60)
    
    yield  # App runs here — this is where requests are handled
    
    # ── Shutdown ──────────────────────────────────────────────────
    print("\n🛑 Shutting down WhatsApp AI Bot...")
    print("✅ Cleanup complete. Goodbye!")


# ── Create FastAPI Application ────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "An AI-powered WhatsApp chatbot using Google Gemini 2.5 Flash. "
        "Receives messages via Twilio webhook, processes them with AI, "
        "and sends intelligent replies back to WhatsApp."
    ),
    lifespan=lifespan,
    # Customize the docs URLs
    docs_url="/docs",       # Swagger UI
    redoc_url="/redoc",     # ReDoc alternative docs
)


# ── CORS Middleware ───────────────────────────────────────────────
# CORS controls which websites/apps can call our API.
# For development, we allow all origins. In production, lock this down.
#
# WHY do we need CORS?
# - Twilio's webhooks come from Twilio's servers (different origin)
# - If we build a frontend dashboard later, it needs to call our API
# - Without CORS, browsers block these cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Allow all origins (restrict in production)
    allow_credentials=True,
    allow_methods=["*"],       # Allow all HTTP methods
    allow_headers=["*"],       # Allow all headers
)


# ── Mount Routers ─────────────────────────────────────────────────
# Include all route handlers. As the app grows, we add more routers:
# e.g., app.include_router(webhook_router, prefix="/api/v1")
app.include_router(router)
