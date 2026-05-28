"""
Configuration Settings Module
==============================
This module loads environment variables from the .env file and validates them
using Pydantic's BaseSettings. This gives us:

1. Type safety — variables are validated at startup, not at runtime
2. Single source of truth — all config lives here
3. Default values — sensible fallbacks for non-sensitive settings
4. Early failure — if a required variable is missing, the app won't start

WHY Pydantic Settings?
- Plain os.environ.get() has no validation and returns strings only
- Pydantic validates types, provides defaults, and catches missing vars immediately
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Required variables (must be in .env):
        - GEMINI_API_KEY: Google Gemini API key for AI responses
        - TWILIO_ACCOUNT_SID: Twilio account identifier
        - TWILIO_AUTH_TOKEN: Twilio authentication token
        - TWILIO_WHATSAPP_NUMBER: Twilio sandbox WhatsApp number
    
    Optional variables (have sensible defaults):
        - APP_NAME: Display name of the application
        - APP_VERSION: Current version string
        - DEBUG: Enable debug mode (default: True for development)
        - HOST: Server bind address
        - PORT: Server port number
    """
    
    # ── App Metadata ──────────────────────────────────────────────
    APP_NAME: str = "WhatsApp AI Bot"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # ── Server Configuration ──────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # ── Google Gemini AI ──────────────────────────────────────────
    # Required in Phase 2 — defaulting to empty string for Phase 1
    GEMINI_API_KEY: str = ""
    
    # ── Twilio WhatsApp ───────────────────────────────────────────
    # Required in Phase 2 — defaulting to empty strings for Phase 1
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_NUMBER: str = ""
    
    # ── Pydantic Settings Config ──────────────────────────────────
    # This tells Pydantic WHERE to find the .env file and how to read it
    model_config = SettingsConfigDict(
        env_file=".env",           # Load variables from this file
        env_file_encoding="utf-8", # Handle special characters properly
        case_sensitive=True,       # ENV_VAR must match exactly
        extra="ignore",            # Don't crash on unknown variables in .env
    )


# Create a single settings instance — imported throughout the app
# This is the "singleton" pattern: one config object, used everywhere
settings = Settings()
