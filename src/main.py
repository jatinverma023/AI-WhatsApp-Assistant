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
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages application startup and shutdown events."""
    from src.database.mongodb import connect_to_mongo, close_mongo_connection
    
    print("=" * 60)
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"📍 Server running at http://{settings.HOST}:{settings.PORT}")
    print(f"🌍 Environment: {getattr(settings, 'ENVIRONMENT', 'development')}")
    print("=" * 60)
    
    # Connect to MongoDB and create indexes
    await connect_to_mongo()
    
    yield
    
    print("\n🛑 Shutting down WhatsApp AI Bot...")
    await close_mongo_connection()
    print("✅ Cleanup complete. Goodbye!")

# ── Create FastAPI Application ────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production-ready AI WhatsApp Bot.",
    lifespan=lifespan,
    docs_url="/docs" if getattr(settings, 'ENVIRONMENT', 'development') != 'production' else None,
    redoc_url="/redoc" if getattr(settings, 'ENVIRONMENT', 'development') != 'production' else None,
)

# ── CORS Middleware ───────────────────────────────────────────────
# In production, you would restrict allow_origins to your Vercel URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["*"],
)

# ── Global Exception Handling ─────────────────────────────────────
from fastapi import Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("uvicorn.error")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "detail": "An unexpected error occurred. Please try again later."},
    )

# ── Health Check Endpoint ─────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    from src.database.mongodb import get_database
    db = get_database()
    
    return {
        "status": "healthy",
        "mongodb": "connected" if db is not None else "disconnected",
        "gemini": "connected" if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your-gemini-api-key-here" else "disconnected",
        "twilio": "connected" if settings.TWILIO_ACCOUNT_SID else "disconnected",
        "environment": getattr(settings, 'ENVIRONMENT', 'development')
    }

# ── Mount Routers ─────────────────────────────────────────────────
app.include_router(router)

from src.api.dashboard_routes import router as dashboard_router
app.include_router(dashboard_router)

