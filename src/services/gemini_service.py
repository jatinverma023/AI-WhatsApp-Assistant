"""
Gemini AI Service
==================
This module handles all communication with Google's Gemini AI.

RESPONSIBILITIES:
1. Initialize the Gemini client with API key
2. Manage the AI model and system prompt (bot personality)
3. Generate intelligent responses from user messages
4. Handle API errors gracefully with user-friendly fallbacks

WHY a separate service?
- Routes should NOT call AI SDKs directly — that's business logic
- If we switch from Gemini to GPT or Claude, we only change THIS file
- System prompt (personality) is configured in ONE place
- Error handling is centralized — no duplicate try/except in routes
- Makes testing easy — mock this service to test routes without AI calls

ARCHITECTURE:
    routes.py (receives message)
        → gemini_service.generate_response(text)
            → Google Gemini API
        ← AI-generated reply text
    routes.py → twilio_service.send_message(reply)
        → Twilio API → WhatsApp
"""

from google import genai
from google.genai import types

from src.config.settings import settings


from src.config.personality import get_system_prompt


class GeminiService:
    """
    Service class for generating AI responses using Google Gemini.
    
    Wraps the Google GenAI SDK to provide a clean interface for
    the rest of the application. Handles initialization, prompt
    management, and error recovery.
    
    Usage:
        gemini = GeminiService()
        reply = await gemini.generate_response("What's the weather like?")
    """
    
    # Emergency fallback message when the API fails
    FALLBACK_RESPONSE = (
        "I'm having trouble right now 🤔 Please try again later."
    )
    
    def __init__(self):
        """
        Initialize the Gemini client and configure the AI model.
        
        The client authenticates using the GEMINI_API_KEY from .env.
        We store the model name and system prompt so they can be
        easily changed without modifying the generate method.
        """
        # Validate that an API key is configured
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your-gemini-api-key-here":
            print("⚠️  WARNING: GEMINI_API_KEY is not set in .env")
            print("   AI responses will return fallback messages.")
            self.client = None
        else:
            # Initialize the Google GenAI client with API key authentication
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            print("✅ Gemini AI client initialized successfully")
        
        # Model to use — specified in settings
        self.model_name = getattr(settings, 'GEMINI_MODEL', "gemini-1.5-flash")
        
        # Store the system prompt for use in every request
        self.system_prompt = get_system_prompt()
    
    async def generate_response(self, user_message: str, chat_history: list = None, profile_context: str = None) -> str:
        """
        Generate an AI response for the given user message.
        
        Sends the user's message to Gemini with the system prompt
        and returns the AI-generated reply. Falls back to a friendly
        error message if anything goes wrong.
        
        The Google GenAI SDK's generate_content() is synchronous,
        so we run it in a thread pool via asyncio.to_thread() to
        avoid blocking FastAPI's event loop.
        
        Args:
            user_message: The text message from the WhatsApp user
            chat_history: Optional list of previous messages in format [{"role": "user"/"model", "content": "..."}]
            profile_context: Optional string containing formatted user profile data
            
        Returns:
            str: AI-generated reply text, or fallback message on error
        """
        import asyncio
        import traceback
        
        # ── Guard: Check for empty messages ──────────────────────
        if not user_message or not user_message.strip():
            return "It looks like you sent an empty message. What can I help you with? 😊"
        
        # ── Guard: Check if client is initialized ────────────────
        if self.client is None:
            print("⚠️  Gemini client not initialized — returning fallback")
            return self.FALLBACK_RESPONSE
        
        try:
            # ── Format Conversation History ───────────────────────
            # Construct the `contents` list for the Gemini API
            # Priority: 1. System Prompt (handled in config)
            #           2. User Profile (highest dynamic memory priority)
            #           3. Recent Chat History
            #           4. Latest Message
            
            # Start by combining System Prompt and Profile into the system instruction
            final_system_instruction = self.system_prompt
            if profile_context:
                final_system_instruction += f"\n\n{profile_context}"
                
            contents = []
            
            if chat_history:
                for msg in chat_history:
                    # Map our role names to Gemini's role names if necessary.
                    # Our DB uses 'user' and 'model', which match Gemini's expectations.
                    contents.append(
                        types.Content(
                            role=msg["role"],
                            parts=[types.Part.from_text(text=msg["content"])]
                        )
                    )
            
            # Append the current message
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=user_message)]
                )
            )
            
            # ── Call the Gemini API ───────────────────────────────
            print(f"🤖 Sending to Gemini (Model: {self.model_name}) | History: {len(chat_history) if chat_history else 0} msgs")
            
            # Run the synchronous SDK call in a thread pool
            # This prevents blocking FastAPI's async event loop
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=final_system_instruction,
                    temperature=0.7,
                    max_output_tokens=300,
                ),
            )
            
            # Extract the text from the response object
            ai_reply = response.text
            
            # ── Guard: Check for empty response ──────────────────
            if not ai_reply or not ai_reply.strip():
                print("⚠️  Gemini returned empty response — using fallback")
                return self.FALLBACK_RESPONSE
            
            # Clean up the response (remove extra whitespace)
            ai_reply = ai_reply.strip()
            
            print(f"✅ Gemini response: \"{ai_reply[:80]}{'...' if len(ai_reply) > 80 else ''}\"")
            return ai_reply
            
        except Exception as e:
            # ── Handle any Gemini API errors ──────────────────────
            print(f"❌ Gemini API error: {type(e).__name__}: {e}")
            traceback.print_exc()
            return self.FALLBACK_RESPONSE


# ── Create a singleton service instance ───────────────────────────
# Imported as: from src.services.gemini_service import gemini_service
# Created once at startup, reused for every message
gemini_service = GeminiService()
