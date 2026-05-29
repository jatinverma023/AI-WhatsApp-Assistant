"""
Profile & Preference Engine Service
===================================
Handles persistent long-term user memory, automatically extracting facts 
from conversations and storing them in MongoDB.

RESPONSIBILITIES:
1. Fetch and create user profiles
2. Analyze user messages to detect new long-term facts (Memory Extraction)
3. Update the user profile with deduplicated data
4. Format the profile into a summary for the Gemini context
"""

import json
from datetime import datetime, timezone
import asyncio

from google import genai
from google.genai import types

from src.database.mongodb import get_database
from src.models.user_profile import UserProfile, ProfileUpdateExtraction
from src.config.settings import settings

class ProfileService:
    """
    Service class for interacting with the MongoDB user profiles collection.
    """
    
    COLLECTION_NAME = "users"
    
    def __init__(self):
        # We need a Gemini client here specifically for the extraction task
        # We use temperature=0.0 because extraction should be deterministic and factual
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your-gemini-api-key-here":
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            self.model_name = getattr(settings, 'GEMINI_MODEL', "gemini-flash-lite-latest")
        else:
            self.client = None

    async def get_profile(self, phone_number: str) -> UserProfile:
        """
        Retrieves a user profile from MongoDB. If none exists, creates a new one.
        """
        db = get_database()
        if db is None:
            # Fallback to an empty profile if DB is down
            return UserProfile(phone_number=phone_number)
            
        collection = db[self.COLLECTION_NAME]
        profile_data = await collection.find_one({"phone_number": phone_number})
        
        if profile_data:
            return UserProfile(**profile_data)
            
        # Create a new profile if it doesn't exist
        new_profile = UserProfile(phone_number=phone_number)
        await collection.insert_one(new_profile.model_dump())
        return new_profile

    async def update_profile(self, phone_number: str, profile_update: UserProfile) -> bool:
        """
        Updates an existing user profile in MongoDB.
        """
        db = get_database()
        if db is None:
            return False
            
        collection = db[self.COLLECTION_NAME]
        
        # Update the timestamp
        profile_update.updated_at = datetime.now(timezone.utc)
        
        try:
            await collection.update_one(
                {"phone_number": phone_number},
                {"$set": profile_update.model_dump(exclude={"phone_number"})}
            )
            return True
        except Exception as e:
            print(f"❌ Failed to update profile: {e}")
            return False

    async def extract_memory_from_message(self, message: str, current_profile: UserProfile) -> bool:
        """
        Analyzes a message using Gemini to extract long-term facts.
        If facts are found, updates the profile in the database.
        
        Args:
            message: The raw text from the user
            current_profile: The current UserProfile object
            
        Returns:
            bool: True if profile was updated, False otherwise
        """
        if not self.client or not message or len(message.strip()) < 3:
            return False
            
        system_instruction = (
            "You are a memory extraction engine. Your job is to analyze the user's message "
            "and extract long-term, persistent facts about them. "
            "ONLY extract meaningful, permanent information (like name, profession, hobbies, goals, languages). "
            "DO NOT extract temporary states (like 'I am tired today' or 'I am eating lunch'). "
            "If a piece of information is already implied by their current profile, do not add it again. "
            "Return JSON matching the schema."
        )
        
        prompt = f"""
        Current Profile:
        {current_profile.model_dump_json(exclude_none=True)}
        
        New Message from User:
        "{message}"
        
        Extract any NEW facts from the message. If nothing new or meaningful is found, return empty/null fields.
        """
        
        try:
            # Run the synchronous generate_content in a thread pool
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=ProfileUpdateExtraction,
                    temperature=0.0, # Deterministic extraction
                )
            )
            
            if not response.text:
                return False
                
            # Parse the JSON response
            extracted_data = json.loads(response.text)
            
            # Check if we actually extracted anything meaningful
            has_updates = False
            
            # Update single fields
            for field in ["name", "nickname", "profession", "preferred_language", "coding_experience"]:
                if extracted_data.get(field):
                    setattr(current_profile, field, extracted_data[field])
                    has_updates = True
            
            # Update list fields (append and deduplicate)
            list_mappings = {
                "new_interests": "interests",
                "new_favorite_topics": "favorite_topics",
                "new_goals": "goals",
                "new_custom_notes": "custom_notes"
            }
            
            for ext_field, prof_field in list_mappings.items():
                new_items = extracted_data.get(ext_field, [])
                if new_items:
                    current_items = getattr(current_profile, prof_field)
                    # Add new items, ignoring duplicates (case-insensitive check)
                    lower_current = [item.lower() for item in current_items]
                    for item in new_items:
                        if item.lower() not in lower_current:
                            current_items.append(item)
                            has_updates = True
                            
                    # Safeguard: prevent excessive profile growth (max 20 items per list)
                    if len(current_items) > 20:
                        setattr(current_profile, prof_field, current_items[-20:])
            
            # Save if updates were made
            if has_updates:
                print(f"🧠 Memory Extracted & Profile Updated for {current_profile.phone_number}")
                await self.update_profile(current_profile.phone_number, current_profile)
                return True
                
            return False
            
        except Exception as e:
            print(f"⚠️ Memory extraction failed (safe to ignore): {e}")
            return False

    def format_profile_for_prompt(self, profile: UserProfile) -> str:
        """
        Formats the user profile into a clean string to be injected 
        into the Gemini system prompt context.
        """
        lines = ["--- USER PROFILE & MEMORY ---"]
        
        if profile.name:
            lines.append(f"Name: {profile.name}")
        if profile.nickname:
            lines.append(f"Nickname: {profile.nickname}")
        if profile.profession:
            lines.append(f"Profession: {profile.profession}")
        if profile.preferred_language:
            lines.append(f"Preferred Language: {profile.preferred_language}")
        if profile.coding_experience:
            lines.append(f"Coding Experience: {profile.coding_experience}")
            
        if profile.interests:
            lines.append(f"Interests: {', '.join(profile.interests)}")
        if profile.favorite_topics:
            lines.append(f"Favorite Topics: {', '.join(profile.favorite_topics)}")
        if profile.goals:
            lines.append("Goals:")
            for goal in profile.goals:
                lines.append(f" - {goal}")
        if profile.custom_notes:
            lines.append("Notes to remember:")
            for note in profile.custom_notes:
                lines.append(f" - {note}")
                
        # If no profile data exists yet, return empty
        if len(lines) == 1:
            return ""
            
        lines.append("-----------------------------")
        return "\n".join(lines)


# Singleton instance
profile_service = ProfileService()
