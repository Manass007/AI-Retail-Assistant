from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.database import get_db
from app.middleware.auth import get_current_user
from datetime import datetime, timedelta
from typing import List

router = APIRouter(prefix="/api/cart", tags=["Cart"])

# ============= MODELS =============

class AddToCartRequest(BaseModel):
    product_id: str
    quantity: int = 1

class UpdateCartRequest(BaseModel):
    quantity: int

# ============= ROUTES =============

@router.get("")
async def get_cart(current_user = Depends(get_current_user)):
    """Get user's cart"""
    
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    cart_items = user.get("cart", [])
    
    # Get product details for each cart item
    cart_with_products = []
    total_amount = 0
    
    for item in cart_items:
        product = await db.products.find_one({"_id": item["product_id"]})
        
        if product:
            days_in_cart = (datetime.utcnow() - item["added_at"]).days
            
            cart_with_products.append({
                "product": product,
                "quantity": item["quantity"],
                "added_at": item["added_at"],
                "days_in_cart": days_in_cart,
                "migrated_to_wishlist": item.get("migrated_to_wishlist", False)
            })
            
            total_amount += product["price"] * item["quantity"]
    
    return {
        "success": True,
        "cart": cart_with_products,
        "total_items": len(cart_with_products),
        "total_amount": total_amount
    }

@router.post("/add")
async def add_to_cart(
    request: AddToCartRequest,
    current_user = Depends(get_current_user)
):
    """Add product to cart"""
    
    db = get_db()
    
    # Check if product exists
    product = await db.products.find_one({"_id": request.product_id})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not product.get("is_in_stock", True):
        raise HTTPException(status_code=400, detail="Product is out of stock")
    
    # Get user's cart
    user = await db.users.find_one({"_id": current_user["_id"]})
    cart = user.get("cart", [])
    
    # Check if product already in cart
    existing_item = None
    for item in cart:
        if item["product_id"] == request.product_id:
            existing_item = item
            break
    
    if existing_item:
        # Update quantity
        existing_item["quantity"] += request.quantity
    else:
        # Add new item
        cart.append({
            "product_id": request.product_id,
            "quantity": request.quantity,
            "added_at": datetime.utcnow(),
            "migrated_to_wishlist": False
        })
    
    # Update user's cart
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"cart": cart}}
    )
    
    # Track interaction
    await db.interactions.insert_one({
        "user_id": current_user["_id"],
        "product_id": request.product_id,
        "event_type": "add_to_cart",
        "timestamp": datetime.utcnow(),
        "metadata": {"quantity": request.quantity}
    })
    
    return {
        "success": True,
        "message": "Added to cart successfully",
        "cart_count": len(cart)
    }

@router.delete("/{product_id}")
async def remove_from_cart(
    product_id: str,
    current_user = Depends(get_current_user)
):
    """Remove product from cart"""
    
    db = get_db()
    
    # Get user's cart
    user = await db.users.find_one({"_id": current_user["_id"]})
    cart = user.get("cart", [])
    
    # Remove item
    cart = [item for item in cart if item["product_id"] != product_id]
    
    # Update user's cart
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"cart": cart}}
    )
    
    return {
        "success": True,
        "message": "Removed from cart successfully",
        "cart_count": len(cart)
    }

@router.put("/{product_id}")
async def update_cart_quantity(
    product_id: str,
    request: UpdateCartRequest,
    current_user = Depends(get_current_user)
):
    """Update cart item quantity"""
    
    db = get_db()
    
    # Get user's cart
    user = await db.users.find_one({"_id": current_user["_id"]})
    cart = user.get("cart", [])
    
    # Update quantity
    for item in cart:
        if item["product_id"] == product_id:
            item["quantity"] = request.quantity
            break
    
    # Update user's cart
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"cart": cart}}
    )
    
    return {
        "success": True,
        "message": "Cart updated successfully"
    }

@router.get("/recovery")
async def get_cart_recovery(current_user = Depends(get_current_user)):
    """Get products that were in cart for 15+ days (moved to wishlist)"""
    
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})
    
    # Get wishlist items that came from cart
    wishlist = user.get("wishlist", [])
    recovery_items = [item for item in wishlist if item.get("migrated_from_cart", False)]
    
    # Get product details
    recovery_products = []
    for item in recovery_items:
        product = await db.products.find_one({"_id": item["product_id"]})
        if product and product.get("is_in_stock", True):
            recovery_products.append(product)
    
    return {
        "success": True,
        "message": "You left something! ✨" if recovery_products else "No items to recover",
        "products": recovery_products,
        "count": len(recovery_products)
    }

@router.post("/clear")
async def clear_cart(current_user = Depends(get_current_user)):
    """Clear entire cart"""
    
    db = get_db()
    
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"cart": []}}
    )
    
    return {
        "success": True,
        "message": "Cart cleared successfully"
    }