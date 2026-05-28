"""
API Routes Module
==================
This module contains all HTTP endpoint definitions for the application.

WHY separate routes from main.py?
- main.py is the "entry point" — it boots the app
- routes.py defines "what the app can do" — the API surface
- Separation makes it easy to add more route files later
  (e.g., webhook_routes.py, admin_routes.py) without cluttering main.py

ARCHITECTURE PATTERN:
- Routes only handle HTTP concerns (request in → response out)
- Business logic goes in the services/ layer
- This keeps routes thin and testable
"""

from fastapi import APIRouter

from src.config.settings import settings

# ── Create Router ─────────────────────────────────────────────────
# APIRouter is like a "mini FastAPI app" — it groups related endpoints
# We can mount multiple routers in main.py for clean organization
router = APIRouter()


@router.get(
    "/",
    summary="Health Check",
    description="Returns the current status of the WhatsApp AI Bot server.",
    tags=["Health"],
)
async def health_check():
    """
    Health check endpoint — verifies the server is running.
    
    This is the first endpoint you should test after starting the server.
    In production, load balancers and monitoring tools hit this endpoint
    to verify the service is alive.
    
    Returns:
        dict: Server status, welcome message, and version info
    """
    return {
        "status": "active",
        "message": "WhatsApp AI Bot Running",
        "version": settings.APP_VERSION,
    }


@router.get(
    "/health",
    summary="Detailed Health Check",
    description="Returns detailed health information for monitoring.",
    tags=["Health"],
)
async def detailed_health():
    """
    Detailed health check — used by monitoring systems.
    
    Returns additional context about the running application,
    useful for debugging and infrastructure monitoring.
    
    Returns:
        dict: Detailed server health information
    """
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "debug_mode": settings.DEBUG,
    }
