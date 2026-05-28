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
- Business logic goes in the services/ layer (Gemini AI, Twilio messaging)
- This keeps routes thin and testable

PHASE 3 FLOW:
    Twilio webhook → extract message → Gemini AI → generate reply → Twilio send → WhatsApp
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Form

from src.config.settings import settings
from src.services.gemini_service import gemini_service
from src.services.twilio_service import twilio_service

# ── Create Router ─────────────────────────────────────────────────
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
#  TWILIO WHATSAPP WEBHOOK — Now with Gemini AI!
# ══════════════════════════════════════════════════════════════════

@router.post(
    "/webhook",
    summary="Twilio WhatsApp Webhook",
    description=(
        "Receives incoming WhatsApp messages from Twilio, generates an "
        "AI response using Google Gemini, and sends the reply back to "
        "the user via WhatsApp."
    ),
    tags=["Webhook"],
)
async def whatsapp_webhook(
    # ── Form Fields from Twilio ──────────────────────────────────
    # Twilio sends data as application/x-www-form-urlencoded (NOT JSON)
    # Field names MUST match Twilio's exact field names (case-sensitive)
    From: str = Form(..., description="Sender's WhatsApp number"),
    Body: str = Form(..., description="The message text sent by the user"),
    To: str = Form(default="", description="Your Twilio WhatsApp number"),
):
    """
    Webhook endpoint that Twilio calls when a WhatsApp message is received.
    
    FLOW (Phase 3):
    1. Twilio receives a WhatsApp message from the user
    2. Twilio sends an HTTP POST to this endpoint with the message data
    3. We extract the sender number and message body
    4. We log the incoming message to the terminal
    5. We send the message to Gemini AI to generate a response
    6. We send the AI-generated reply back to the user via Twilio
    7. We return HTTP 200 so Twilio knows we processed the message
    
    Args:
        From: Sender's WhatsApp number (format: "whatsapp:+919876543210")
        Body: The text message the user sent
        To: The Twilio sandbox number that received the message
        
    Returns:
        dict: Processing result with status, message received, and reply info
    """
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # ── Step 1: Log the incoming message ─────────────────────────
    print("\n" + "═" * 60)
    print(f"📩 INCOMING MESSAGE [{timestamp}]")
    print(f"   From: {From}")
    print(f"   Body: {Body}")
    print("═" * 60)
    
    # ── Step 2: Generate AI response using Gemini ────────────────
    # The gemini_service handles all AI logic: system prompt,
    # API calls, and error fallback. The route stays thin.
    ai_reply = await gemini_service.generate_response(user_message=Body)
    
    print(f"💬 AI Reply: {ai_reply[:100]}{'...' if len(ai_reply) > 100 else ''}")
    
    # ── Step 3: Send AI reply back via Twilio ────────────────────
    reply_sent = False
    reply_sid = None
    error_detail = None
    
    try:
        reply_result = twilio_service.send_message(
            to=From,       # Reply goes back to the sender
            body=ai_reply, # AI-generated response (not static anymore!)
        )
        reply_sent = True
        reply_sid = reply_result["sid"]
    except Exception as e:
        # Log the error but DON'T crash — Twilio still needs HTTP 200
        error_detail = str(e)
        print(f"⚠️  Failed to send reply via Twilio: {error_detail}")
    
    # ── Step 4: Log completion ───────────────────────────────────
    status_icon = "✅" if reply_sent else "❌"
    print(f"{status_icon} Webhook processing complete")
    print("─" * 60)
    
    # ── Step 5: Return confirmation to Twilio ────────────────────
    # Always return HTTP 200. If we return an error, Twilio retries.
    response = {
        "status": "processed",
        "from": From,
        "message": Body,
        "ai_reply": ai_reply[:100],  # Truncated for response body
        "reply_sent": reply_sent,
    }
    
    if reply_sid:
        response["reply_sid"] = reply_sid
    if error_detail:
        response["error"] = error_detail
    
    return response
