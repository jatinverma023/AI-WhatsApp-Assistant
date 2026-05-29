"""
Chat Models
===========
Pydantic models for chat messages and database schemas.

WHY use Pydantic models for the database?
- Ensures data consistency before saving to MongoDB
- Automatically handles datetime formatting
- Makes the code easier to read and maintain
"""

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    """
    Represents a single message in the database (either from user or AI).
    """
    phone_number: str = Field(..., description="WhatsApp number of the user")
    role: str = Field(..., description="Role of the sender: 'user' or 'model'")
    content: str = Field(..., description="The message text")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    message_sid: Optional[str] = Field(default=None, description="Twilio message SID if applicable")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
