from fastapi import APIRouter, Depends
from app.database import get_db
from app.middleware.auth import get_current_user, optional_auth
from app.services.openai_service import openai_service
from datetime import datetime, timedelta
from typing import List, Dict

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

# ============= HELPER FUNCTIONS =============

async def get_preference_based_recommendations(user: dict, db, limit: int = 10):
    """Get recommendations based on user preferences (for new users)"""
    
    preferences = user.get("preferences", {})
    categories = preferences.get("categories", [])
    
    if not categories:
        # Return trending products
        products = await db.products.find({"is_in_stock": True})\
            .sort("popularity_score", -1)\
            .limit(limit)\
            .to_list(length=limit)
        
        return products, "Popular products"
    
    # Get products from preferred categories
    products = await db.products.find({
        "category": {"$in": categories},
        "is_in_stock": True
    })\
        .sort("popularity_score", -1)\
        .limit(limit)\
        .to_list(length=limit)
    
    reason = f"Based on your interests: {', '.join(categories[:2])}"
    return products, reason

async def get_history_based_recommendations(user: dict, db, limit: int = 10):
    """Get recommendations based on browsing history"""
    
    # Get recent interactions
    interactions = await db.interactions.find({
        "user_id": user["_id"],
        "event_type": "view"
    })\
        .sort("timestamp", -1)\
        .limit(20)\
        .to_list(length=20)
    
    if not interactions:
        return await get_preference_based_recommendations(user, db, limit)
    
    # Extract product IDs
    viewed_product_ids = [i["product_id"] for i in interactions if i.get("product_id")]
    
    # Get viewed products
    viewed_products = await db.products.find({
        "_id": {"$in": viewed_product_ids[:10]}
    }).to_list(length=10)
    
    if not viewed_products:
        return await get_preference_based_recommendations(user, db, limit)
    
    # Analyze patterns
    categories = {}
    prices = []
    brands = {}
    
    for product in viewed_products:
        # Count categories
        category = product.get("category")
        if category:
            categories[category] = categories.get(category, 0) + 1
        
        # Collect prices
        prices.append(product.get("price", 0))
        
        # Count brands
        brand = product.get("brand")
        if brand:
            brands[brand] = brands.get(brand, 0) + 1
    
    # Get top category
    top_category = max(categories, key=categories.get) if categories else None
    
    # Calculate price range
    avg_price = sum(prices) / len(prices) if prices else 100
    price_min = avg_price * 0.7
    price_max = avg_price * 1.5
    
    # Build recommendation query
    query = {
        "_id": {"$nin": viewed_product_ids},
        "is_in_stock": True,
        "price": {"$gte": price_min, "$lte": price_max}
    }
    
    if top_category:
        query["category"] = top_category
    
    # Get recommendations
    products = await db.products.find(query)\
        .sort("popularity_score", -1)\
        .limit(limit)\
        .to_list(length=limit)
    
    # Generate AI reason
    try:
        reason = await openai_service.get_recommendation_reason(
            user_preferences=user.get("preferences", {}),
            user_history=[p["name"] for p in viewed_products[:5]],
            recommended_products=[{"name": p["name"], "category": p.get("category", "")} for p in products[:3]]
        )
    except:
        reason = f"Based on your interest in {top_category}" if top_category else "You might like these"
    
    return products, reason

# ============= ROUTES =============

@router.get("")
async def get_recommendations(
    limit: int = 10,
    current_user = Depends(optional_auth)
):
    """Get personalized recommendations"""
    
    db = get_db()
    
    if not current_user:
        # Guest user - return trending
        products = await db.products.find({"is_in_stock": True})\
            .sort("popularity_score", -1)\
            .limit(limit)\
            .to_list(length=limit)
        
        return {
            "success": True,
            "products": products,
            "reason": "Trending products"
        }
    
    # Get user's interaction history count
    interaction_count = await db.interactions.count_documents({
        "user_id": current_user["_id"]
    })
    
    # Choose recommendation strategy
    if interaction_count > 5:
        # User with history
        products, reason = await get_history_based_recommendations(current_user, db, limit)
    else:
        # New user
        products, reason = await get_preference_based_recommendations(current_user, db, limit)
    
    return {
        "success": True,
        "products": products,
        "reason": reason
    }

@router.post("/track-view")
async def track_product_view(
    product_id: str,
    current_user = Depends(optional_auth)
):
    """Track product view for recommendation engine"""
    
    if not current_user:
        return {"success": True, "message": "View tracked (guest)"}
    
    db = get_db()
    
    # Track interaction
    await db.interactions.insert_one({
        "user_id": current_user["_id"],
        "product_id": product_id,
        "event_type": "view",
        "timestamp": datetime.utcnow(),
        "metadata": {}
    })
    
    return {
        "success": True,
        "message": "View tracked successfully"
    }

@router.get("/similar/{product_id}")
async def get_similar_products(product_id: str, limit: int = 6):
    """Get similar products based on category and price"""
    
    db = get_db()
    
    # Get the product
    product = await db.products.find_one({"_id": product_id})
    
    if not product:
        return {"success": False, "message": "Product not found"}
    
    # Find similar products
    similar = await db.products.find({
        "_id": {"$ne": product_id},
        "category": product.get("category"),
        "price": {
            "$gte": product.get("price", 0) * 0.7,
            "$lte": product.get("price", 0) * 1.3
        },
        "is_in_stock": True
    })\
        .sort("popularity_score", -1)\
        .limit(limit)\
        .to_list(length=limit)
    
    return {
        "success": True,
        "products": similar
    }