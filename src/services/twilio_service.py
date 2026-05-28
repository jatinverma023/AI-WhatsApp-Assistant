"""
Twilio WhatsApp Service
========================
This module handles all communication with the Twilio API.

RESPONSIBILITIES:
1. Initialize and manage the Twilio client connection
2. Send WhatsApp messages to users via Twilio
3. Provide a clean, reusable interface for the rest of the app

WHY a separate service?
- Routes should NOT contain business logic or SDK calls
- If we ever switch from Twilio to another provider, we only change THIS file
- Makes testing easy — we can mock this service in tests
- Single Responsibility Principle: this file does ONE thing — talks to Twilio

ARCHITECTURE:
    routes.py (receives webhook) → twilio_service.py (sends reply) → Twilio API → WhatsApp
"""

from twilio.rest import Client

from src.config.settings import settings


class TwilioService:
    """
    Service class for sending WhatsApp messages via Twilio.
    
    Uses the official Twilio Python SDK to authenticate and send messages.
    The client is initialized once and reused for all message sends,
    which is more efficient than creating a new client for each message.
    
    Usage:
        twilio_service = TwilioService()
        twilio_service.send_message(to="whatsapp:+919876543210", body="Hello!")
    """
    
    def __init__(self):
        """
        Initialize the Twilio client with credentials from environment variables.
        
        The Client object handles authentication and HTTP requests to Twilio's API.
        We store the 'from' number so we don't have to pass it every time.
        """
        # Create the Twilio client — this authenticates with Twilio's API
        # Account SID = your Twilio "username"
        # Auth Token  = your Twilio "password"
        self.client = Client(
            settings.TWILIO_ACCOUNT_SID,
            settings.TWILIO_AUTH_TOKEN,
        )
        
        # The WhatsApp number that messages are sent FROM (Twilio sandbox number)
        # Format: "whatsapp:+14155238886"
        self.from_number = settings.TWILIO_WHATSAPP_FROM
    
    def send_message(self, to: str, body: str) -> dict:
        """
        Send a WhatsApp message to a specific user.
        
        Args:
            to: Recipient's WhatsApp number (format: "whatsapp:+919876543210")
            body: The text message to send
            
        Returns:
            dict: Message details including SID (unique message ID) and status
            
        Example:
            >>> service = TwilioService()
            >>> result = service.send_message(
            ...     to="whatsapp:+919876543210",
            ...     body="Hello from the bot!"
            ... )
            >>> print(result)
            {"sid": "SM...", "status": "queued", "to": "whatsapp:+919876543210"}
        """
        # Use Twilio's messages.create() to send the WhatsApp message
        # Twilio handles all the complexity: routing, delivery, retries
        message = self.client.messages.create(
            from_=self.from_number,  # Twilio sandbox number
            to=to,                   # User's WhatsApp number
            body=body,               # Message text
        )
        
        # Log the sent message for debugging
        print(f"📤 Reply sent to {to}: {body}")
        print(f"   Message SID: {message.sid} | Status: {message.status}")
        
        # Return useful info about the sent message
        return {
            "sid": message.sid,         # Unique message ID from Twilio
            "status": message.status,   # Usually "queued" (Twilio will deliver async)
            "to": to,
        }


# ── Create a singleton service instance ───────────────────────────
# Imported throughout the app: from src.services.twilio_service import twilio_service
# We use a singleton so the Twilio client is created ONCE, not per-request
twilio_service = TwilioService()
