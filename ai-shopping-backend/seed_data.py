from datetime import datetime, timedelta
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import random
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get MongoDB URI from environment
MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise ValueError("MONGODB_URI not found in .env file")

print(f"Using MongoDB URI: {MONGODB_URI[:30]}...{MONGODB_URI[-20:]}")

# Sample products data
SAMPLE_PRODUCTS = [
    {
        "_id": "prod_1",
        "name": "Wireless Headphones",
        "category": "Electronics",
        "price": 79.99,
        "brand": "TechSound",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
        "description": "Premium wireless headphones with noise cancellation",
        "tags": ["audio", "wireless", "tech"],
        "stock_quantity": 50,
        "is_in_stock": True,
        "popularity_score": 85.5,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_2",
        "name": "Smart Watch",
        "category": "Electronics",
        "price": 199.99,
        "brand": "FitTech",
        "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
        "description": "Advanced fitness tracking smartwatch",
        "tags": ["fitness", "tech", "wearable"],
        "stock_quantity": 30,
        "is_in_stock": True,
        "popularity_score": 92.3,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_3",
        "name": "Running Shoes",
        "category": "Sports",
        "price": 89.99,
        "brand": "SportPro",
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
        "description": "Comfortable running shoes for athletes",
        "tags": ["sports", "running", "fitness"],
        "stock_quantity": 100,
        "is_in_stock": True,
        "popularity_score": 78.9,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_4",
        "name": "Yoga Mat",
        "category": "Sports",
        "price": 29.99,
        "brand": "YogaLife",
        "image_url": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f",
        "description": "Non-slip yoga mat for all levels",
        "tags": ["yoga", "fitness", "wellness"],
        "stock_quantity": 75,
        "is_in_stock": True,
        "popularity_score": 65.4,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_5",
        "name": "Coffee Maker",
        "category": "Home",
        "price": 129.99,
        "brand": "BrewMaster",
        "image_url": "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6",
        "description": "Programmable coffee maker with thermal carafe",
        "tags": ["kitchen", "coffee", "appliance"],
        "stock_quantity": 40,
        "is_in_stock": True,
        "popularity_score": 71.2,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_6",
        "name": "Backpack",
        "category": "Fashion",
        "price": 59.99,
        "brand": "TravelGear",
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
        "description": "Durable backpack with laptop compartment",
        "tags": ["travel", "fashion", "accessories"],
        "stock_quantity": 60,
        "is_in_stock": True,
        "popularity_score": 68.7,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_7",
        "name": "LED Desk Lamp",
        "category": "Home",
        "price": 39.99,
        "brand": "BrightLight",
        "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c",
        "description": "Adjustable LED desk lamp with USB charging",
        "tags": ["lighting", "desk", "home"],
        "stock_quantity": 90,
        "is_in_stock": True,
        "popularity_score": 62.1,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_8",
        "name": "Gaming Mouse",
        "category": "Electronics",
        "price": 49.99,
        "brand": "GamePro",
        "image_url": "https://images.unsplash.com/photo-1527814050087-3793815479db",
        "description": "High-precision gaming mouse with RGB lighting",
        "tags": ["gaming", "computer", "tech"],
        "stock_quantity": 55,
        "is_in_stock": True,
        "popularity_score": 73.6,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_9",
        "name": "Water Bottle",
        "category": "Sports",
        "price": 19.99,
        "brand": "HydroFit",
        "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8",
        "description": "Insulated stainless steel water bottle",
        "tags": ["hydration", "sports", "fitness"],
        "stock_quantity": 120,
        "is_in_stock": True,
        "popularity_score": 58.3,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_10",
        "name": "Bluetooth Speaker",
        "category": "Electronics",
        "price": 69.99,
        "brand": "SoundWave",
        "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1",
        "description": "Portable Bluetooth speaker with 360° sound",
        "tags": ["audio", "wireless", "portable"],
        "stock_quantity": 45,
        "is_in_stock": True,
        "popularity_score": 80.2,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_11",
        "name": "Sunglasses",
        "category": "Fashion",
        "price": 89.99,
        "brand": "StyleShades",
        "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f",
        "description": "UV protection polarized sunglasses",
        "tags": ["fashion", "accessories", "outdoor"],
        "stock_quantity": 70,
        "is_in_stock": True,
        "popularity_score": 64.8,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_12",
        "name": "Blender",
        "category": "Home",
        "price": 79.99,
        "brand": "BlendMaster",
        "image_url": "https://images.unsplash.com/photo-1585515320310-259814833e62",
        "description": "High-speed blender for smoothies and more",
        "tags": ["kitchen", "appliance", "healthy"],
        "stock_quantity": 35,
        "is_in_stock": True,
        "popularity_score": 69.5,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_13",
        "name": "Laptop Stand",
        "category": "Electronics",
        "price": 34.99,
        "brand": "DeskTech",
        "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46",
        "description": "Ergonomic adjustable laptop stand",
        "tags": ["office", "ergonomic", "tech"],
        "stock_quantity": 80,
        "is_in_stock": True,
        "popularity_score": 61.7,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_14",
        "name": "Resistance Bands",
        "category": "Sports",
        "price": 24.99,
        "brand": "FitGear",
        "image_url": "https://images.unsplash.com/photo-1598289431512-b97b0917affc",
        "description": "Set of 5 resistance bands for home workouts",
        "tags": ["fitness", "home-gym", "exercise"],
        "stock_quantity": 95,
        "is_in_stock": True,
        "popularity_score": 66.2,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_15",
        "name": "Wall Clock",
        "category": "Home",
        "price": 44.99,
        "brand": "TimeDesign",
        "image_url": "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c",
        "description": "Modern minimalist wall clock",
        "tags": ["home-decor", "wall", "clock"],
        "stock_quantity": 50,
        "is_in_stock": True,
        "popularity_score": 55.9,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_16",
        "name": "Phone Case",
        "category": "Electronics",
        "price": 14.99,
        "brand": "CasePro",
        "image_url": "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb",
        "description": "Protective phone case with grip",
        "tags": ["phone", "accessories", "protection"],
        "stock_quantity": 150,
        "is_in_stock": True,
        "popularity_score": 72.4,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_17",
        "name": "Dumbbell Set",
        "category": "Sports",
        "price": 149.99,
        "brand": "StrongFit",
        "image_url": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
        "description": "Adjustable dumbbell set 5-50 lbs",
        "tags": ["fitness", "weights", "home-gym"],
        "stock_quantity": 25,
        "is_in_stock": True,
        "popularity_score": 87.1,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_18",
        "name": "Throw Pillow",
        "category": "Home",
        "price": 24.99,
        "brand": "CozyHome",
        "image_url": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2",
        "description": "Soft decorative throw pillow",
        "tags": ["home-decor", "comfort", "pillow"],
        "stock_quantity": 110,
        "is_in_stock": True,
        "popularity_score": 52.6,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_19",
        "name": "USB-C Cable",
        "category": "Electronics",
        "price": 12.99,
        "brand": "ChargeFast",
        "image_url": "https://images.unsplash.com/photo-1591290619762-9b2c0601e5b3",
        "description": "Fast charging USB-C cable 6ft",
        "tags": ["charging", "cable", "tech"],
        "stock_quantity": 200,
        "is_in_stock": True,
        "popularity_score": 68.9,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_20",
        "name": "Notebook Set",
        "category": "Office",
        "price": 18.99,
        "brand": "WriteWell",
        "image_url": "https://images.unsplash.com/photo-1531346878377-a5be20888e57",
        "description": "Set of 3 ruled notebooks",
        "tags": ["office", "writing", "stationery"],
        "stock_quantity": 85,
        "is_in_stock": True,
        "popularity_score": 48.3,
        "created_at": datetime.utcnow()
    }
]

async def seed_database():
    """Seed the database with sample data"""
    
    print("🌱 Seeding database...")
    print(f"📍 Target database: AiShoppingAssistant")
    
    # Connect to MongoDB - database name will be extracted from URI
    client = AsyncIOMotorClient(MONGODB_URI)
    
    # The database name should be AiShoppingAssistant from your URI
    db = client.AiShoppingAssistant
    
    try:
        # Test connection first
        print("🔗 Testing connection...")
        await client.admin.command('ping')
        print("✅ Connected to MongoDB successfully!")
        
        # Clear existing data
        print("\n🗑️  Clearing existing data...")
        result1 = await db.products.delete_many({})
        result2 = await db.users.delete_many({})
        result3 = await db.interactions.delete_many({})
        result4 = await db.coupons.delete_many({})
        result5 = await db.stock_notifications.delete_many({})
        
        print(f"   Deleted {result1.deleted_count} products")
        print(f"   Deleted {result2.deleted_count} users")
        print(f"   Deleted {result3.deleted_count} interactions")
        print(f"   Deleted {result4.deleted_count} coupons")
        print(f"   Deleted {result5.deleted_count} stock notifications")
        
        # Insert products
        print(f"\n📦 Inserting {len(SAMPLE_PRODUCTS)} products...")
        result = await db.products.insert_many(SAMPLE_PRODUCTS)
        print(f"✅ Inserted {len(result.inserted_ids)} products")
        
        # Create sample user
        print("\n👤 Creating sample user...")
        sample_user = {
            "_id": "user_sample_001",
            "email": "demo@example.com",
            "name": "Demo User",
            "phone": "+1234567890",
            "dob": datetime(1990, 1, 1),
            "preferences": {
                "categories": ["Electronics", "Sports"],
                "budget": "mid"
            },
            "onboarded": True,
            "subscription": {
                "plan": "free",
                "status": "active",
                "start_date": None,
                "end_date": None
            },
            "wishlist": [],
            "cart": [
                {
                    "product_id": "prod_1",
                    "quantity": 1,
                    "added_at": datetime.utcnow() - timedelta(days=5),
                    "migrated_to_wishlist": False
                },
                {
                    "product_id": "prod_3",
                    "quantity": 2,
                    "added_at": datetime.utcnow() - timedelta(days=2),
                    "migrated_to_wishlist": False
                }
            ],
            "is_active": True,
            "created_at": datetime.utcnow() - timedelta(days=30),
            "last_login": datetime.utcnow(),
            "last_spin_date": None
        }
        result = await db.users.insert_one(sample_user)
        print(f"✅ Created user with ID: {result.inserted_id}")
        
        # Create sample interactions
        print("\n🔄 Creating sample interactions...")
        interactions = []
        product_ids = ["prod_1", "prod_2", "prod_3", "prod_5", "prod_8", "prod_10"]
        
        for i, product_id in enumerate(product_ids):
            interactions.append({
                "user_id": "user_sample_001",
                "product_id": product_id,
                "event_type": "view",
                "timestamp": datetime.utcnow() - timedelta(days=random.randint(1, 10)),
                "metadata": {}
            })
        
        # Add some cart interactions
        interactions.append({
            "user_id": "user_sample_001",
            "product_id": "prod_1",
            "event_type": "add_to_cart",
            "timestamp": datetime.utcnow() - timedelta(days=5),
            "metadata": {"quantity": 1}
        })
        
        result = await db.interactions.insert_many(interactions)
        print(f"✅ Created {len(result.inserted_ids)} interactions")
        
        # Create sample coupon
        print("\n🎟️  Creating sample coupon...")
        sample_coupon = {
            "user_id": "user_sample_001",
            "code": "SPIN1234",
            "discount_percent": 20,
            "created_at": datetime.utcnow() - timedelta(days=5),
            "expires_at": datetime.utcnow() + timedelta(days=25),
            "used": False
        }
        result = await db.coupons.insert_one(sample_coupon)
        print(f"✅ Created coupon with code: SPIN1234")
        
        # Verify data
        print("\n✅ Database seeded successfully!")
        print(f"\n📊 Summary:")
        product_count = await db.products.count_documents({})
        user_count = await db.users.count_documents({})
        interaction_count = await db.interactions.count_documents({})
        coupon_count = await db.coupons.count_documents({})
        
        print(f"   - Products: {product_count}")
        print(f"   - Users: {user_count}")
        print(f"   - Interactions: {interaction_count}")
        print(f"   - Coupons: {coupon_count}")
        
        # List all collections
        print(f"\n📋 Collections in database:")
        collections = await db.list_collection_names()
        for collection in collections:
            count = await db[collection].count_documents({})
            print(f"   - {collection}: {count} documents")
        
        # Print sample credentials
        print("\n📧 Sample User Credentials:")
        print(f"   Email: demo@example.com")
        print(f"   (Use OTP authentication to login)")
        
    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        client.close()
        print("\n🔒 MongoDB connection closed")

if __name__ == "__main__":
    asyncio.run(seed_database())