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
    },
    {
        "_id": "prod_21",
        "name": "Wireless Keyboard",
        "category": "Electronics",
        "price": 64.99,
        "brand": "KeyTech",
        "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
        "description": "Ergonomic wireless keyboard with backlight",
        "tags": ["keyboard", "wireless", "office", "tech"],
        "stock_quantity": 65,
        "is_in_stock": True,
        "popularity_score": 74.2,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_22",
        "name": "Fitness Tracker",
        "category": "Electronics",
        "price": 89.99,
        "brand": "FitTech",
        "image_url": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a",
        "description": "Activity tracker with heart rate monitor",
        "tags": ["fitness", "wearable", "health", "tech"],
        "stock_quantity": 55,
        "is_in_stock": True,
        "popularity_score": 81.5,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_23",
        "name": "Tablet Stand",
        "category": "Electronics",
        "price": 27.99,
        "brand": "DeskTech",
        "image_url": "https://images.unsplash.com/photo-1586953208448-b95a79798f07",
        "description": "Adjustable aluminum tablet stand",
        "tags": ["tablet", "stand", "ergonomic", "office"],
        "stock_quantity": 95,
        "is_in_stock": True,
        "popularity_score": 59.8,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_24",
        "name": "Basketball",
        "category": "Sports",
        "price": 34.99,
        "brand": "SportPro",
        "image_url": "https://images.unsplash.com/photo-1519861531473-9200262198bf",
        "description": "Official size basketball with grip texture",
        "tags": ["basketball", "sports", "outdoor", "fitness"],
        "stock_quantity": 70,
        "is_in_stock": True,
        "popularity_score": 67.3,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_25",
        "name": "Air Fryer",
        "category": "Home",
        "price": 119.99,
        "brand": "KitchenPro",
        "image_url": "https://images.unsplash.com/photo-1556912173-46e1c1c33036",
        "description": "Digital air fryer with 5.5L capacity",
        "tags": ["kitchen", "appliance", "cooking", "healthy"],
        "stock_quantity": 42,
        "is_in_stock": True,
        "popularity_score": 83.7,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_26",
        "name": "Leather Wallet",
        "category": "Fashion",
        "price": 49.99,
        "brand": "StyleLeather",
        "image_url": "https://images.unsplash.com/photo-1627123424574-724758594e93",
        "description": "Genuine leather wallet with RFID blocking",
        "tags": ["wallet", "fashion", "accessories", "leather"],
        "stock_quantity": 88,
        "is_in_stock": True,
        "popularity_score": 63.4,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_27",
        "name": "Desk Organizer",
        "category": "Office",
        "price": 22.99,
        "brand": "OrganizePro",
        "image_url": "https://images.unsplash.com/photo-1586953208448-b95a79798f07",
        "description": "Multi-compartment desk organizer set",
        "tags": ["office", "organizer", "desk", "storage"],
        "stock_quantity": 105,
        "is_in_stock": True,
        "popularity_score": 56.9,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_28",
        "name": "Tennis Racket",
        "category": "Sports",
        "price": 129.99,
        "brand": "SportPro",
        "image_url": "https://images.unsplash.com/photo-1622163642999-9582b1e1e8e6",
        "description": "Professional tennis racket with carbon fiber",
        "tags": ["tennis", "sports", "racket", "fitness"],
        "stock_quantity": 38,
        "is_in_stock": True,
        "popularity_score": 72.1,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_29",
        "name": "Smart Thermostat",
        "category": "Home",
        "price": 179.99,
        "brand": "HomeSmart",
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
        "description": "WiFi-enabled smart thermostat with app control",
        "tags": ["smart-home", "thermostat", "automation", "energy"],
        "stock_quantity": 32,
        "is_in_stock": True,
        "popularity_score": 76.8,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_30",
        "name": "Wireless Earbuds",
        "category": "Electronics",
        "price": 99.99,
        "brand": "TechSound",
        "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df",
        "description": "True wireless earbuds with noise cancellation",
        "tags": ["audio", "wireless", "earbuds", "tech"],
        "stock_quantity": 58,
        "is_in_stock": True,
        "popularity_score": 88.4,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_31",
        "name": "Yoga Blocks",
        "category": "Sports",
        "price": 19.99,
        "brand": "YogaLife",
        "image_url": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f",
        "description": "Set of 2 high-density foam yoga blocks",
        "tags": ["yoga", "fitness", "wellness", "exercise"],
        "stock_quantity": 125,
        "is_in_stock": True,
        "popularity_score": 54.6,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_32",
        "name": "Stand Mixer",
        "category": "Home",
        "price": 249.99,
        "brand": "KitchenPro",
        "image_url": "https://images.unsplash.com/photo-1556912173-46e1c1c33036",
        "description": "5-quart stand mixer with multiple attachments",
        "tags": ["kitchen", "appliance", "baking", "mixing"],
        "stock_quantity": 28,
        "is_in_stock": True,
        "popularity_score": 79.3,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_33",
        "name": "Running Shorts",
        "category": "Sports",
        "price": 29.99,
        "brand": "SportPro",
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
        "description": "Moisture-wicking running shorts with pockets",
        "tags": ["sports", "running", "clothing", "fitness"],
        "stock_quantity": 115,
        "is_in_stock": True,
        "popularity_score": 61.2,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_34",
        "name": "Monitor Stand",
        "category": "Electronics",
        "price": 39.99,
        "brand": "DeskTech",
        "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46",
        "description": "Wooden monitor stand with storage drawer",
        "tags": ["monitor", "stand", "office", "ergonomic"],
        "stock_quantity": 72,
        "is_in_stock": True,
        "popularity_score": 65.7,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_35",
        "name": "Belt",
        "category": "Fashion",
        "price": 34.99,
        "brand": "StyleLeather",
        "image_url": "https://images.unsplash.com/photo-1627123424574-724758594e93",
        "description": "Genuine leather belt with classic buckle",
        "tags": ["belt", "fashion", "accessories", "leather"],
        "stock_quantity": 92,
        "is_in_stock": True,
        "popularity_score": 58.1,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_36",
        "name": "Jump Rope",
        "category": "Sports",
        "price": 14.99,
        "brand": "FitGear",
        "image_url": "https://images.unsplash.com/photo-1598289431512-b97b0917affc",
        "description": "Adjustable speed jump rope with weighted handles",
        "tags": ["fitness", "jump-rope", "exercise", "cardio"],
        "stock_quantity": 140,
        "is_in_stock": True,
        "popularity_score": 52.3,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_37",
        "name": "Smart Doorbell",
        "category": "Home",
        "price": 149.99,
        "brand": "HomeSmart",
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
        "description": "Video doorbell with motion detection and app alerts",
        "tags": ["smart-home", "security", "doorbell", "automation"],
        "stock_quantity": 36,
        "is_in_stock": True,
        "popularity_score": 70.5,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_38",
        "name": "Mechanical Keyboard",
        "category": "Electronics",
        "price": 109.99,
        "brand": "KeyTech",
        "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
        "description": "RGB mechanical keyboard with Cherry MX switches",
        "tags": ["keyboard", "mechanical", "gaming", "tech"],
        "stock_quantity": 48,
        "is_in_stock": True,
        "popularity_score": 77.9,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_39",
        "name": "Kettlebell",
        "category": "Sports",
        "price": 54.99,
        "brand": "StrongFit",
        "image_url": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
        "description": "Cast iron kettlebell 20 lbs",
        "tags": ["fitness", "weights", "kettlebell", "home-gym"],
        "stock_quantity": 62,
        "is_in_stock": True,
        "popularity_score": 64.2,
        "created_at": datetime.utcnow()
    },
    {
        "_id": "prod_40",
        "name": "Desk Chair",
        "category": "Office",
        "price": 199.99,
        "brand": "ErgoSeat",
        "image_url": "https://images.unsplash.com/photo-1586953208448-b95a79798f07",
        "description": "Ergonomic office chair with lumbar support",
        "tags": ["chair", "office", "ergonomic", "furniture"],
        "stock_quantity": 25,
        "is_in_stock": True,
        "popularity_score": 82.6,
        "created_at": datetime.utcnow()
    }
]

# Groceries, Dairy, Staples, Snacks (daily-life categories)
GROCERY_PRODUCTS = [
    {"_id": "prod_g1", "name": "Milk", "category": "Dairy", "price": 2.99, "brand": "FreshFarm", "image_url": "https://images.unsplash.com/photo-1563636619-e9143da7973b", "description": "Fresh full-fat milk 1L", "tags": ["dairy", "milk", "groceries"], "stock_quantity": 200, "is_in_stock": True, "popularity_score": 95.0, "created_at": datetime.utcnow()},
    {"_id": "prod_g2", "name": "Wheat Flour", "category": "Staples", "price": 3.49, "brand": "HomeGrain", "image_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020a", "description": "Whole wheat flour 1kg", "tags": ["groceries", "flour", "staples", "wheat"], "stock_quantity": 150, "is_in_stock": True, "popularity_score": 88.0, "created_at": datetime.utcnow()},
    {"_id": "prod_g3", "name": "Muesli", "category": "Groceries", "price": 5.99, "brand": "BreakfastBowl", "image_url": "https://images.unsplash.com/photo-1517673132405-a56a62b18ddb", "description": "Oats and fruit muesli 500g", "tags": ["groceries", "breakfast", "muesli", "cereal"], "stock_quantity": 80, "is_in_stock": True, "popularity_score": 82.0, "created_at": datetime.utcnow()},
    {"_id": "prod_g4", "name": "Butter", "category": "Dairy", "price": 4.49, "brand": "FreshFarm", "image_url": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d", "description": "Salted butter 200g", "tags": ["dairy", "butter", "groceries"], "stock_quantity": 100, "is_in_stock": True, "popularity_score": 75.0, "created_at": datetime.utcnow()},
    {"_id": "prod_g5", "name": "Rice", "category": "Staples", "price": 8.99, "brand": "HomeGrain", "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c", "description": "Basmati rice 2kg", "tags": ["groceries", "rice", "staples"], "stock_quantity": 120, "is_in_stock": True, "popularity_score": 90.0, "created_at": datetime.utcnow()},
    {"_id": "prod_g6", "name": "Eggs", "category": "Dairy", "price": 3.99, "brand": "FreshFarm", "image_url": "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f", "description": "Free-range eggs dozen", "tags": ["dairy", "eggs", "groceries"], "stock_quantity": 180, "is_in_stock": True, "popularity_score": 92.0, "created_at": datetime.utcnow()},
    {"_id": "prod_g7", "name": "Bread", "category": "Groceries", "price": 2.49, "brand": "DailyBake", "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff", "description": "Whole grain bread loaf", "tags": ["groceries", "bread", "bakery"], "stock_quantity": 90, "is_in_stock": True, "popularity_score": 85.0, "created_at": datetime.utcnow()},
    {"_id": "prod_g8", "name": "Yogurt", "category": "Dairy", "price": 3.29, "brand": "FreshFarm", "image_url": "https://images.unsplash.com/photo-1571212515416-ffe4b2d2b58d", "description": "Plain yogurt 500g", "tags": ["dairy", "yogurt", "groceries"], "stock_quantity": 110, "is_in_stock": True, "popularity_score": 78.0, "created_at": datetime.utcnow()},
    {"_id": "prod_g9", "name": "Olive Oil", "category": "Staples", "price": 9.99, "brand": "KitchenGold", "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5", "description": "Extra virgin olive oil 500ml", "tags": ["groceries", "oil", "staples"], "stock_quantity": 60, "is_in_stock": True, "popularity_score": 70.0, "created_at": datetime.utcnow()},
    {"_id": "prod_g10", "name": "Honey", "category": "Groceries", "price": 6.49, "brand": "NatureSweet", "image_url": "https://images.unsplash.com/photo-1587049352846-4a222e784d38", "description": "Pure honey 350g", "tags": ["groceries", "honey", "breakfast"], "stock_quantity": 70, "is_in_stock": True, "popularity_score": 72.0, "created_at": datetime.utcnow()},
]

# Perfume & Trimmer for bundle demo (prices in USD for consistency; bundle 20% off)
PERFUME_TRIMMER_PRODUCTS = [
    {"_id": "prod_p1", "name": "Men's Perfume", "category": "Personal Care", "price": 40.00, "brand": "ScentPro", "image_url": "https://images.unsplash.com/photo-1541643600914-78b084683b50", "description": "Long-lasting men's fragrance", "tags": ["perfume", "fragrance", "personal-care"], "stock_quantity": 50, "is_in_stock": True, "popularity_score": 65.0, "created_at": datetime.utcnow()},
    {"_id": "prod_p2", "name": "Electric Trimmer", "category": "Personal Care", "price": 50.00, "brand": "GroomPro", "image_url": "https://images.unsplash.com/photo-1622286342621-4bd786c2447c", "description": "Cordless electric trimmer", "tags": ["trimmer", "grooming", "personal-care"], "stock_quantity": 45, "is_in_stock": True, "popularity_score": 68.0, "created_at": datetime.utcnow()},
]

# Free gift product for monthly check-in reward
FREE_GIFT_PRODUCT = [
    {"_id": "FREE_GIFT_KEYCHAIN", "name": "Free Keychain", "category": "Personal Care", "price": 0.00, "brand": "Reward", "image_url": "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d", "description": "Monthly check-in reward - Free keychain with any purchase", "tags": ["gift", "reward", "keychain"], "stock_quantity": 9999, "is_in_stock": True, "popularity_score": 0.0, "created_at": datetime.utcnow()},
]

PICKUP_STORES = [
    {"_id": "store_1", "name": "QuickPick Downtown", "address": "123 Main St", "city": "Downtown", "pincode": "10001", "is_active": True},
    {"_id": "store_2", "name": "QuickPick Mall", "address": "456 Mall Ave", "city": "Central", "pincode": "10002", "is_active": True},
    {"_id": "store_3", "name": "QuickPick Express", "address": "789 Highway Rd", "city": "Suburb", "pincode": "10003", "is_active": True},
]

PRODUCT_BUNDLES = [
    {"_id": "bundle_1", "name": "Perfume + Trimmer Combo", "product_ids": ["prod_p1", "prod_p2"], "discount_percent": 20, "description": "Buy perfume with trimmer and get 20% off total. Great value!"},
]

PROMO_CODES = [
    {"_id": "promo_winter20", "code": "WINTER20", "name": "Winter Festive", "description": "20% off (Dec 15-31)", "discount_percent": 20, "min_order": 0, "valid_from": datetime(2024, 12, 15), "valid_until": datetime(2025, 12, 31), "is_active": True, "type": "festive"},
    {"_id": "promo_xmas25", "code": "XMAS25", "name": "Christmas Offer", "description": "25% off orders", "discount_percent": 25, "min_order": 500, "valid_from": datetime(2024, 12, 15), "valid_until": datetime(2025, 12, 31), "is_active": True, "type": "festive"},
    {"_id": "promo_bday10", "code": "BDAY10", "name": "Birthday Special", "description": "10% off on your birthday month", "discount_percent": 10, "min_order": 0, "valid_from": datetime(2024, 1, 1), "valid_until": datetime(2026, 12, 31), "is_active": True, "type": "birthday"},
    {"_id": "promo_save10", "code": "SAVE10", "name": "Welcome Offer", "description": "10% off first order", "discount_percent": 10, "min_order": 100, "valid_from": datetime(2024, 1, 1), "valid_until": datetime(2026, 12, 31), "is_active": True, "type": "general"},
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
        try:
            r6 = await db.orders.delete_many({})
            print(f"   Deleted {r6.deleted_count} orders")
        except Exception:
            pass
        try:
            r7 = await db.pickup_stores.delete_many({})
            print(f"   Deleted {r7.deleted_count} pickup stores")
        except Exception:
            pass
        try:
            r8 = await db.product_bundles.delete_many({})
            print(f"   Deleted {r8.deleted_count} product bundles")
        except Exception:
            pass
        try:
            r9 = await db.promo_codes.delete_many({})
            print(f"   Deleted {r9.deleted_count} promo codes")
        except Exception:
            pass

        print(f"   Deleted {result1.deleted_count} products")
        print(f"   Deleted {result2.deleted_count} users")
        print(f"   Deleted {result3.deleted_count} interactions")
        print(f"   Deleted {result4.deleted_count} coupons")
        print(f"   Deleted {result5.deleted_count} stock notifications")
        
        # Insert products (main + grocery + perfume/trimmer + free gift)
        all_products = SAMPLE_PRODUCTS + GROCERY_PRODUCTS + PERFUME_TRIMMER_PRODUCTS + FREE_GIFT_PRODUCT
        print(f"\n📦 Inserting {len(all_products)} products...")
        result = await db.products.insert_many(all_products)
        print(f"✅ Inserted {len(result.inserted_ids)} products")
        
        # Insert pickup stores
        print("\n🏪 Inserting pickup stores...")
        await db.pickup_stores.insert_many(PICKUP_STORES)
        print(f"✅ Inserted {len(PICKUP_STORES)} pickup stores")
        
        # Insert product bundles
        print("\n📦 Inserting product bundles...")
        await db.product_bundles.insert_many(PRODUCT_BUNDLES)
        print(f"✅ Inserted {len(PRODUCT_BUNDLES)} product bundles")

        # Insert promo codes (offers / discount codes)
        print("\n🎟️ Inserting promo codes...")
        await db.promo_codes.insert_many(PROMO_CODES)
        print(f"✅ Inserted {len(PROMO_CODES)} promo codes")

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
        
        # Create sample orders (for last_ordered / frequently_ordered)
        print("\n📋 Creating sample orders...")
        sample_orders = [
            {"_id": "ord_1", "user_id": "user_sample_001", "items": [{"product_id": "prod_g1", "quantity": 2, "price": 2.99}, {"product_id": "prod_g2", "quantity": 1, "price": 3.49}], "total": 9.47, "payment_method": "pay_at_store", "payment_status": "paid", "store_id": "store_1", "created_at": datetime.utcnow() - timedelta(days=2)},
            {"_id": "ord_2", "user_id": "user_sample_001", "items": [{"product_id": "prod_g1", "quantity": 1, "price": 2.99}, {"product_id": "prod_g3", "quantity": 1, "price": 5.99}], "total": 8.98, "payment_method": "online", "payment_status": "paid", "store_id": "store_2", "created_at": datetime.utcnow() - timedelta(days=5)},
            {"_id": "ord_3", "user_id": "user_sample_001", "items": [{"product_id": "prod_1", "quantity": 1, "price": 79.99}], "total": 79.99, "payment_method": "online", "payment_status": "paid", "store_id": None, "created_at": datetime.utcnow() - timedelta(days=10)},
        ]
        await db.orders.insert_many(sample_orders)
        print(f"✅ Created {len(sample_orders)} sample orders")
        
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