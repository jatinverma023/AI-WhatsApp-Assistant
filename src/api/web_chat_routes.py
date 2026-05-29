from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

from src.services.memory_service import memory_service
from src.services.profile_service import profile_service
from src.services.gemini_service import gemini_service

router = APIRouter(prefix="/api/chat", tags=["WebChat"])

class WebMessage(BaseModel):
    session_id: str
    message: str

@router.post("/message")
async def send_web_message(request: WebMessage):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
        
    session_id = request.session_id
    user_msg = request.message
    
    # Save user message
    await memory_service.save_message(
        phone_number=session_id,
        role="user",
        content=user_msg
    )
    
    # Process memory extraction in background
    profile = await profile_service.get_profile(session_id)
    # Extract memory asynchronously to avoid blocking the fast chat response
    import asyncio
    asyncio.create_task(profile_service.extract_memory_from_message(user_msg, profile))
    
    # Get history for context (exclude the message we just saved so we don't pass it twice if the logic appends it)
    # Wait, gemini_service.generate_response appends the user_message explicitly, so we shouldn't pass it in history.
    history = await memory_service.get_chat_history(session_id, limit=20)
    
    # In gemini_service, it loops over chat_history and then appends user_message.
    # Since we already saved user_message, history[-1] is user_message. We must exclude it.
    if history and history[-1]["content"] == user_msg:
        history = history[:-1]
        
    profile_context = profile_service.format_profile_for_prompt(profile)
    
    # Generate response
    response_text = await gemini_service.generate_response(
        user_message=user_msg,
        chat_history=history,
        profile_context=profile_context
    )
    
    # Save AI response
    await memory_service.save_message(
        phone_number=session_id,
        role="model",
        content=response_text
    )
    
    return {"response": response_text}

@router.get("/history/{session_id}")
async def get_web_history(session_id: str):
    history = await memory_service.get_chat_history(session_id, limit=50)
    # Ensure datetime objects are serialized by converting them explicitly if they aren't already
    return history
