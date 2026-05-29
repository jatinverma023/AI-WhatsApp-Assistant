"""
User Profile Models
===================
Pydantic models for persistent long-term user memory.

WHY use Pydantic models for profiles?
- Enforces a strict schema for MongoDB storage
- Makes it easy to parse JSON structures from Gemini when extracting memory
- Defaults ensure we don't get KeyErrors for missing fields
"""

from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, Field

class UserProfile(BaseModel):
    """
    Represents a user's persistent profile and preferences in the database.
    """
    phone_number: str = Field(..., description="Unique WhatsApp number of the user")
    
    # Core Demographics
    name: Optional[str] = Field(default=None, description="The user's real name")
    nickname: Optional[str] = Field(default=None, description="Preferred nickname")
    profession: Optional[str] = Field(default=None, description="Job, role, or student status")
    
    # Interests & Preferences
    interests: List[str] = Field(default_factory=list, description="General interests or hobbies")
    favorite_topics: List[str] = Field(default_factory=list, description="Topics they frequently discuss")
    preferred_language: Optional[str] = Field(default="English", description="Language they prefer to converse in")
    tone_preference: Optional[str] = Field(default="Friendly and casual", description="Preferred AI tone (e.g., formal, casual, humorous)")
    
    # Domain Specific (Example for coding bot)
    coding_experience: Optional[str] = Field(default=None, description="Experience level with programming")
    goals: List[str] = Field(default_factory=list, description="Long-term goals or current projects")
    
    # Custom Extracted Notes
    custom_notes: List[str] = Field(default_factory=list, description="Other important facts to remember")
    
    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ProfileUpdateExtraction(BaseModel):
    """
    Used strictly for parsing the JSON output from Gemini's memory extraction.
    Only contains fields that Gemini is allowed to update.
    """
    name: Optional[str] = None
    nickname: Optional[str] = None
    profession: Optional[str] = None
    new_interests: List[str] = Field(default_factory=list)
    new_favorite_topics: List[str] = Field(default_factory=list)
    preferred_language: Optional[str] = None
    coding_experience: Optional[str] = None
    new_goals: List[str] = Field(default_factory=list)
    new_custom_notes: List[str] = Field(default_factory=list)
