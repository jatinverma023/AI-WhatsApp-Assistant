"""
MongoDB Connection Manager
===========================
Handles connecting to MongoDB using Motor (async driver).

WHY a separate file?
- Keeps database connection logic centralized
- Allows opening connection on app startup and closing on shutdown
- Easy to mock in testing
"""

import motor.motor_asyncio
from pymongo.errors import ConnectionFailure

from src.config.settings import settings

class MongoDB:
    """
    Singleton wrapper for MongoDB client and database instance.
    """
    client: motor.motor_asyncio.AsyncIOMotorClient = None
    db = None

db_manager = MongoDB()

import asyncio
from pymongo import IndexModel, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, OperationFailure

async def connect_to_mongo(retries=3):
    """
    Initialize database connection with retries.
    Called on FastAPI startup.
    """
    for attempt in range(retries):
        try:
            print(f"🔄 Connecting to MongoDB... (Attempt {attempt + 1}/{retries})")
            db_manager.client = motor.motor_asyncio.AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=5000
            )
            # Verify connection
            await db_manager.client.admin.command('ping')
            db_manager.db = db_manager.client[settings.DB_NAME]
            print(f"✅ Connected to MongoDB database: {settings.DB_NAME}")
            
            # Setup Indexes
            try:
                print("🔄 Setting up MongoDB indexes...")
                chats_collection = db_manager.db["chats"]
                users_collection = db_manager.db["users"]
                
                # Indexes for chats: query by phone_number, sort by timestamp
                await chats_collection.create_indexes([
                    IndexModel([("phone_number", ASCENDING)]),
                    IndexModel([("timestamp", DESCENDING)]),
                    IndexModel([("phone_number", ASCENDING), ("timestamp", DESCENDING)])
                ])
                
                # Indexes for users
                await users_collection.create_indexes([
                    IndexModel([("phone_number", ASCENDING)], unique=True)
                ])
                print("✅ MongoDB indexes verified.")
            except OperationFailure as e:
                print(f"⚠️ Failed to create indexes: {e}")
                
            return  # Success, exit retry loop
            
        except ConnectionFailure as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
        except Exception as e:
            print(f"❌ Unexpected error connecting to MongoDB: {e}")
            
        if attempt < retries - 1:
            print("⏳ Retrying in 3 seconds...")
            await asyncio.sleep(3)
            
    # If we exhaust retries
    db_manager.client = None
    db_manager.db = None
    print("❌ Critical: Could not connect to MongoDB after multiple attempts.")

async def close_mongo_connection():
    """
    Close database connection.
    Called on FastAPI shutdown.
    """
    if db_manager.client is not None:
        print("🛑 Closing MongoDB connection...")
        db_manager.client.close()
        print("✅ MongoDB connection closed.")

def get_database():
    """
    Returns the database instance.
    """
    return db_manager.db
