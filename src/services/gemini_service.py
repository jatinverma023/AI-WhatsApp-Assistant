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


# ══════════════════════════════════════════════════════════════════
#  SYSTEM PROMPT — The Bot's Personality
# ══════════════════════════════════════════════════════════════════
# This tells Gemini HOW to behave. It's sent with every request
# as invisible context the user never sees.
#
# WHY a system prompt?
# - Without it, Gemini gives generic, robotic responses
# - The system prompt shapes the bot's personality, tone, and rules
# - It's like giving the bot a "job description"

SYSTEM_PROMPT = """You are a friendly, helpful WhatsApp AI assistant.

PERSONALITY:
- Be warm, conversational, and approachable
- Use a casual but respectful tone (like texting a helpful friend)
- Keep responses short and concise — this is WhatsApp, not an essay
- Use relevant emojis sparingly to add personality (1-2 per message max)
- Be direct and get to the point quickly

RULES:
- Keep replies under 200 words unless the user asks for detail
- If you don't know something, say so honestly
- Never make up facts, links, or references
- Be helpful with a wide range of topics: general knowledge, coding, advice, etc.
- For sensitive or medical/legal topics, recommend consulting a professional
- Respond in the same language the user writes in

FORMAT:
- Use short paragraphs (1-3 sentences each)
- Use bullet points or numbered lists for multi-step answers
- Avoid markdown formatting (WhatsApp doesn't render it well)
- No headers, bold, or italic markers — just plain text
"""


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
    
    # Fallback message when Gemini can't generate a response
    FALLBACK_RESPONSE = (
        "I'm having trouble thinking right now 🤔 "
        "Please try again in a moment!"
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
        
        # Model to use — Gemini 2.5 Flash is fast, smart, and cost-effective
        # Perfect for chat applications where speed and quality both matter
        self.model_name = "gemini-2.5-flash"
        
        # Store the system prompt for use in every request
        self.system_prompt = SYSTEM_PROMPT
    
    async def generate_response(self, user_message: str) -> str:
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
            # ── Call the Gemini API ───────────────────────────────
            print(f"🤖 Sending to Gemini: \"{user_message[:80]}{'...' if len(user_message) > 80 else ''}\"")
            
            # Run the synchronous SDK call in a thread pool
            # This prevents blocking FastAPI's async event loop
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model_name,
                contents=user_message,
                config=types.GenerateContentConfig(
                    system_instruction=self.system_prompt,
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
            # Common errors: rate limits, invalid API key, network issues
            print(f"❌ Gemini API error: {type(e).__name__}: {e}")
            traceback.print_exc()
            return self.FALLBACK_RESPONSE


# ── Create a singleton service instance ───────────────────────────
# Imported as: from src.services.gemini_service import gemini_service
# Created once at startup, reused for every message
gemini_service = GeminiService()
