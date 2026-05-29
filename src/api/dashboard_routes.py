"""
Dashboard API Routes
=====================
Endpoints for the Admin Dashboard to fetch statistics, users, conversations, and handle authentication.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import jwt

from src.config.settings import settings
from src.database.mongodb import get_database
from src.services.memory_service import memory_service
from src.services.profile_service import profile_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

# ── Authentication ──────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

# Dependency to check auth
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None or username != settings.ADMIN_USERNAME:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    if request.username == settings.ADMIN_USERNAME and request.password == settings.ADMIN_PASSWORD:
        access_token_expires = timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
        access_token = create_access_token(
            data={"sub": request.username}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
    )

# ── Dashboard Stats ────────────────────────────────────────────────

@router.get("/stats", dependencies=[Depends(verify_token)])
async def get_dashboard_stats():
    db = get_database()
    if db is None:
        return {"error": "Database not connected"}
    
    # 1. Total users
    total_users = await db.users.count_documents({})
    
    # 2. Total messages
    total_messages = await db.chats.count_documents({})
    
    # 3. Active users today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    active_users = len(await db.chats.distinct("phone_number", {"timestamp": {"$gte": today_start}}))
    
    # 4. AI Requests (messages from model)
    ai_requests = await db.chats.count_documents({"role": "model"})
    
    # Analytics charts data (last 7 days messages)
    pipeline = [
        {
            "$match": {
                "timestamp": {
                    "$gte": datetime.now(timezone.utc) - timedelta(days=7)
                }
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}
                },
                "messages": {"$sum": 1},
                "ai_requests": {
                    "$sum": {"$cond": [{"$eq": ["$role", "model"]}, 1, 0]}
                }
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    chart_data_cursor = db.chats.aggregate(pipeline)
    chart_data = await chart_data_cursor.to_list(length=None)
    
    formatted_chart_data = [{"date": item["_id"], "messages": item["messages"], "ai_requests": item["ai_requests"]} for item in chart_data]
    
    return {
        "stats": {
            "total_users": total_users,
            "total_messages": total_messages,
            "active_users_today": active_users,
            "ai_request_count": ai_requests
        },
        "chart_data": formatted_chart_data
    }

# ── Recent Conversations ──────────────────────────────────────────

@router.get("/conversations/recent", dependencies=[Depends(verify_token)])
async def get_recent_conversations():
    db = get_database()
    if db is None:
        return {"error": "Database not connected"}
    
    # Get unique users, then latest message for each
    pipeline = [
        {"$sort": {"timestamp": -1}},
        {"$group": {
            "_id": "$phone_number",
            "last_message": {"$first": "$content"},
            "last_role": {"$first": "$role"},
            "timestamp": {"$first": "$timestamp"}
        }},
        {"$sort": {"timestamp": -1}},
        {"$limit": 10}
    ]
    
    recent_cursor = db.chats.aggregate(pipeline)
    recent = await recent_cursor.to_list(length=None)
    
    return [
        {
            "phone_number": item["_id"],
            "last_message": item["last_message"],
            "last_role": item["last_role"],
            "timestamp": item["timestamp"]
        } for item in recent
    ]

# ── Users ─────────────────────────────────────────────────────────

@router.get("/users", dependencies=[Depends(verify_token)])
async def get_users():
    db = get_database()
    if db is None:
        return {"error": "Database not connected"}
    
    # We need to get users from the profiles collection, but we also want their total messages and last activity
    # First get all profiles
    profiles = await db.users.find().to_list(length=100)
    
    # Then aggregate chat stats per phone number
    pipeline = [
        {"$group": {
            "_id": "$phone_number",
            "interaction_count": {"$sum": 1},
            "last_interaction": {"$max": "$timestamp"}
        }}
    ]
    chat_stats_cursor = db.chats.aggregate(pipeline)
    chat_stats = await chat_stats_cursor.to_list(length=None)
    
    # Create a lookup map
    stats_map = {stat["_id"]: stat for stat in chat_stats}
    
    users_merged = []
    for u in profiles:
        u["_id"] = str(u["_id"])
        phone = u.get("phone_number")
        
        if phone in stats_map:
            u["interaction_count"] = stats_map[phone]["interaction_count"]
            u["last_interaction"] = stats_map[phone]["last_interaction"].isoformat() if stats_map[phone]["last_interaction"] else u.get("updated_at")
        else:
            u["interaction_count"] = 0
            u["last_interaction"] = u.get("updated_at")
            
        users_merged.append(u)
        
    # Sort by last_interaction descending
    users_merged.sort(key=lambda x: x.get("last_interaction", ""), reverse=True)
    return users_merged

@router.get("/users/{phone_number}/history", dependencies=[Depends(verify_token)])
async def get_user_history(phone_number: str):
    db = get_database()
    if db is None:
        return {"error": "Database not connected"}
    
    messages = await db.chats.find({"phone_number": phone_number}).sort("timestamp", 1).to_list(length=200)
    for m in messages:
        m["_id"] = str(m["_id"])
    return messages

@router.get("/users/{phone_number}/profile", dependencies=[Depends(verify_token)])
async def get_user_profile(phone_number: str):
    db = get_database()
    if db is None:
        return {"error": "Database not connected"}
    
    profile = await db.users.find_one({"phone_number": phone_number})
    if profile:
        profile["_id"] = str(profile["_id"])
    return profile

# ── Chat Search ───────────────────────────────────────────────────

@router.get("/messages/search", dependencies=[Depends(verify_token)])
async def search_messages(q: str):
    db = get_database()
    if db is None:
        return {"error": "Database not connected"}
    
    # Simple regex search across messages
    query = {"content": {"$regex": q, "$options": "i"}}
    messages = await db.chats.find(query).sort("timestamp", -1).limit(50).to_list(length=50)
    for m in messages:
        m["_id"] = str(m["_id"])
    return messages

# ── System Status ─────────────────────────────────────────────────

@router.get("/system/status", dependencies=[Depends(verify_token)])
async def get_system_status():
    db = get_database()
    mongo_status = "Connected" if db is not None else "Disconnected"
    
    gemini_status = "Active" if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your-gemini-api-key-here" else "Not Configured"
    twilio_status = "Active" if settings.TWILIO_ACCOUNT_SID else "Not Configured"
    
    return {
        "mongodb": mongo_status,
        "gemini": gemini_status,
        "twilio": twilio_status,
        "backend_uptime": "Online"
    }
