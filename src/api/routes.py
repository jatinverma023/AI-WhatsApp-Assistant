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

from datetime import datetime, timezone

from fastapi import APIRouter, Form

from src.config.settings import settings
from src.services.twilio_service import twilio_service

# ── Create Router ─────────────────────────────────────────────────
# APIRouter is like a "mini FastAPI app" — it groups related endpoints
# We can mount multiple routers in main.py for clean organization
router = APIRouter()


# ══════════════════════════════════════════════════════════════════
#  HEALTH CHECK ENDPOINTS
# ══════════════════════════════════════════════════════════════════

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


# ══════════════════════════════════════════════════════════════════
#  TWILIO WHATSAPP WEBHOOK
# ══════════════════════════════════════════════════════════════════

# The static reply message — will be replaced with AI responses in Phase 3
STATIC_REPLY = "Hello from FastAPI WhatsApp Bot 🚀"


@router.post(
    "/webhook",
    summary="Twilio WhatsApp Webhook",
    description=(
        "Receives incoming WhatsApp messages from Twilio. "
        "Twilio sends a POST request with form-encoded data every time "
        "a user sends a message to the sandbox number."
    ),
    tags=["Webhook"],
)
async def whatsapp_webhook(
    # ── Form Fields from Twilio ──────────────────────────────────
    # Twilio sends data as application/x-www-form-urlencoded (NOT JSON)
    # That's why we use Form(...) instead of Body(...)
    #
    # Field names MUST match Twilio's exact field names (case-sensitive):
    #   - "From" → sender's WhatsApp number
    #   - "Body" → the message text
    #   - "To"   → your Twilio sandbox number
    From: str = Form(..., description="Sender's WhatsApp number (e.g., whatsapp:+919876543210)"),
    Body: str = Form(..., description="The message text sent by the user"),
    To: str = Form(default="", description="Your Twilio WhatsApp number"),
):
    """
    Webhook endpoint that Twilio calls when a WhatsApp message is received.
    
    FLOW:
    1. Twilio receives a WhatsApp message from the user
    2. Twilio sends an HTTP POST to this endpoint with the message data
    3. We extract the sender number and message body
    4. We log the message to the terminal for debugging
    5. We send a static reply back to the user via Twilio
    6. We return HTTP 200 so Twilio knows we processed the message
    
    Args:
        From: Sender's WhatsApp number (format: "whatsapp:+919876543210")
        Body: The text message the user sent
        To: The Twilio sandbox number that received the message
        
    Returns:
        dict: Confirmation that the message was received and reply was sent
    """
    # ── Step 1: Log the incoming message ─────────────────────────
    # This prints to your terminal so you can see messages arriving in real-time
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print("\n" + "─" * 60)
    print(f"📩 INCOMING MESSAGE [{timestamp}]")
    print(f"   From: {From}")
    print(f"   Body: {Body}")
    print(f"   To:   {To}")
    print("─" * 60)
    
    # ── Step 2: Send static reply via Twilio ─────────────────────
    # In Phase 3, this will be replaced with Gemini AI-generated responses
    reply_sent = False
    reply_sid = None
    error_detail = None
    
    try:
        reply_result = twilio_service.send_message(
            to=From,           # Reply goes back to the sender
            body=STATIC_REPLY, # Static message for now
        )
        reply_sent = True
        reply_sid = reply_result["sid"]
    except Exception as e:
        # Log the error but DON'T crash — Twilio still needs HTTP 200
        # Common causes: invalid credentials, sandbox not configured
        error_detail = str(e)
        print(f"⚠️  Failed to send reply: {error_detail}")
        print("   (Have you set valid Twilio credentials in .env?)")
    
    # ── Step 3: Return confirmation to Twilio ────────────────────
    # Twilio expects HTTP 200 to confirm we received the webhook.
    # If we return an error (4xx/5xx), Twilio will retry the webhook.
    response = {
        "status": "received",
        "from": From,
        "message": Body,
        "reply_sent": reply_sent,
    }
    
    if reply_sid:
        response["reply_sid"] = reply_sid
    if error_detail:
        response["error"] = error_detail
    
    return response
