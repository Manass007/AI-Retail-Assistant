from fastapi import APIRouter, Query, Depends
from app.database import get_db
from app.middleware.auth import get_current_user
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/api/products", tags=["Products"])

@router.get("")
async def get_products(
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    in_stock: Optional[bool] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = 1,
    limit: int = 20
):
    """Get all products with filters (like your media routes)"""
    
    db = get_db()
    
    # Build filter
    filter_query = {}
    
    if category:
        filter_query["category"] = category
    
    if min_price is not None or max_price is not None:
        filter_query["price"] = {}
        if min_price is not None:
            filter_query["price"]["$gte"] = min_price
        if max_price is not None:
            filter_query["price"]["$lte"] = max_price
    
    if in_stock is not None:
        filter_query["is_in_stock"] = in_stock
    
    if search:
        filter_query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}}
        ]
    
    # Calculate skip
    skip = (page - 1) * limit
    
    # Sort
    sort_direction = -1 if sort_order == "desc" else 1
    
    # Get products
    products = await db.products.find(filter_query)\
        .sort(sort_by, sort_direction)\
        .skip(skip)\
        .limit(limit)\
        .to_list(length=limit)
    
    # Get total count
    total = await db.products.count_documents(filter_query)
    
    return {
        "success": True,
        "products": products,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@router.get("/{product_id}")
async def get_product(product_id: str):
    """Get single product"""
    
    db = get_db()
    product = await db.products.find_one({"_id": product_id})
    
    if not product:
        return {"success": False, "message": "Product not found"}
    
    return {
        "success": True,
        "product": product
    }

@router.get("/category/{category}")
async def get_by_category(category: str, limit: int = 20):
    """Get products by category"""
    
    db = get_db()
    products = await db.products.find({"category": category})\
        .sort("popularity_score", -1)\
        .limit(limit)\
        .to_list(length=limit)
    
    return {
        "success": True,
        "category": category,
        "products": products
    }

@router.post("/notify-me")
async def notify_when_in_stock(
    product_id: str = Query(..., description="Product ID to get notified about"),
    current_user = Depends(get_current_user)
):
    """Add stock notification request (requires authentication)"""
    
    db = get_db()
    
    # Check if product exists
    product = await db.products.find_one({"_id": product_id})
    if not product:
        return {"success": False, "message": "Product not found"}
    
    # Check if notification already exists
    existing = await db.stock_notifications.find_one({
        "user_id": current_user["_id"],
        "product_id": product_id,
        "notified": False
    })
    
    if existing:
        return {
            "success": True,
            "message": "You're already subscribed to notifications for this product"
        }
    
    # Add notification request
    await db.stock_notifications.insert_one({
        "user_id": current_user["_id"],
        "product_id": product_id,
        "notified": False,
        "created_at": datetime.utcnow()
    })
    
    return {
        "success": True,
        "message": "You'll be notified when back in stock"
    }