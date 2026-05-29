"""
Memory Service
==============
Handles saving and retrieving chat history from MongoDB.

RESPONSIBILITIES:
1. Save user messages and AI responses to the database
2. Retrieve the last N messages for a specific phone number
3. Format history for the Gemini AI context

WHY a separate service?
- Keeps database logic out of the route handlers
- Centralizes how history is fetched and formatted
"""

from typing import List, Dict, Any

from src.database.mongodb import get_database
from src.models.chat_model import ChatMessage

class MemoryService:
    """
    Service class for interacting with the MongoDB chat history.
    """
    
    # Collection name in MongoDB
    COLLECTION_NAME = "chats"
    
    async def save_message(self, phone_number: str, role: str, content: str, message_sid: str = None) -> bool:
        """
        Saves a message to the database.
        
        Args:
            phone_number: WhatsApp number of the user
            role: "user" or "model"
            content: The text content of the message
            message_sid: Optional Twilio SID
            
        Returns:
            bool: True if saved successfully, False otherwise
        """
        db = get_database()
        if db is None:
            print("⚠️ Database not connected. Message not saved.")
            return False
            
        try:
            # Create a Pydantic model instance to validate the data
            msg = ChatMessage(
                phone_number=phone_number,
                role=role,
                content=content,
                message_sid=message_sid
            )
            
            # Insert into MongoDB
            collection = db[self.COLLECTION_NAME]
            await collection.insert_one(msg.model_dump())
            return True
        except Exception as e:
            print(f"❌ Failed to save message to memory: {e}")
            return False
            
    async def get_chat_history(self, phone_number: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Retrieves the last N messages for a specific phone number.
        
        Args:
            phone_number: WhatsApp number of the user
            limit: Maximum number of messages to retrieve
            
        Returns:
            List of dictionaries containing role and content, ordered chronologically
        """
        db = get_database()
        if db is None:
            print("⚠️ Database not connected. No history retrieved.")
            return []
            
        try:
            collection = db[self.COLLECTION_NAME]
            
            # Find messages for this number, sort by timestamp DESC (newest first), limit to N
            cursor = collection.find({"phone_number": phone_number}).sort("timestamp", -1).limit(limit)
            
            # Fetch all documents from cursor
            messages = await cursor.to_list(length=limit)
            
            # Reverse the list so it's chronologically ordered (oldest to newest)
            messages.reverse()
            
            # Format for Gemini context
            history = []
            for msg in messages:
                history.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
                
            return history
        except Exception as e:
            print(f"❌ Failed to retrieve chat history: {e}")
            return []

# Create a singleton service instance
memory_service = MemoryService()
