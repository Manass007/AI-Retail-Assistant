from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

# MongoDB client
client = None
db = None

async def connect_db():
    """Connect to MongoDB"""
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    
    # IMPORTANT: Use AiShoppingAssistant as the database name to match your MongoDB URI
    # The URI specifies: mongodb+srv://...mongodb.net/AiShoppingAssistant
    db = client.AiShoppingAssistant
    
    # Test the connection
    try:
        await client.admin.command('ping')
        print("✅ Connected to MongoDB - Database: AiShoppingAssistant")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        raise

async def close_db():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("❌ MongoDB connection closed")

def get_db():
    """Get database instance"""
    return db