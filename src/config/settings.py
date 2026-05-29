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
        - TWILIO_ACCOUNT_SID: Twilio account identifier
        - TWILIO_AUTH_TOKEN: Twilio authentication token
        - TWILIO_WHATSAPP_FROM: Twilio sandbox WhatsApp number (e.g. whatsapp:+14155238886)
        - GEMINI_API_KEY: Google Gemini API key for AI responses (Phase 3+)
    
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
    ENVIRONMENT: str = "development"
    
    # ── Server Configuration ──────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # ── Database Configuration (Phase 4) ──────────────────────────
    MONGODB_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "whatsapp_ai_bot"
    
    # ── Twilio WhatsApp ───────────────────────────────────────────
    # Required — get from https://console.twilio.com
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    # The Twilio sandbox number in format: whatsapp:+14155238886
    TWILIO_WHATSAPP_FROM: str = ""
    
    # ── Google Gemini AI ──────────────────────────────────────────
    # Required — get from https://aistudio.google.com/apikey
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-flash-lite-latest"
    
    # ── Admin Dashboard ───────────────────────────────────────────
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    JWT_SECRET_KEY: str = "supersecretjwtkey_for_admin_dashboard"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60 * 24 # 24 hours
    
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
