from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db
from app.middleware.auth import get_current_user
from app.services.watchlist_combo_service import watchlist_combo_service
from datetime import datetime
from typing import List

router = APIRouter(prefix="/api/watchlist", tags=["Watchlist"])

# ============= ROUTES =============

@router.get("")
async def get_watchlist(current_user = Depends(get_current_user)):
    """
    Get user's watchlist items (items migrated from cart).
    Returns products with watchlist metadata.
    """
    db = get_db()
    
    # Get user
    user = await db.users.find_one({"_id": current_user["_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    watchlist = user.get("wishlist", [])
    
    # Filter only items that came from cart (watchlist items)
    watchlist_items = [item for item in watchlist if item.get("migrated_from_cart", False)]
    
    # Get product details for each watchlist item
    watchlist_with_products = []
    for item in watchlist_items:
        product = await db.products.find_one({"_id": item["product_id"]})
        if product:
            watchlist_with_products.append({
                "product": product,
                "added_at": item.get("added_at"),
                "original_cart_date": item.get("original_cart_date"),
                "manual_move": item.get("manual_move", False)
            })
    
    return {
        "success": True,
        "watchlist": watchlist_with_products,
        "count": len(watchlist_with_products)
    }

@router.get("/combo-suggestions/{product_id}")
async def get_combo_suggestions_for_product(
    product_id: str,
    current_user = Depends(get_current_user)
):
    """
    Get combo suggestions for a specific product based on user's watchlist.
    Used on product detail pages.
    """
    try:
        suggestions = await watchlist_combo_service.generate_combo_suggestions(
            product_id=product_id,
            user_id=current_user["_id"],
            limit=3
        )
        
        return {
            "success": True,
            "suggestions": suggestions,
            "count": len(suggestions)
        }
    except Exception as e:
        return {
            "success": False,
            "suggestions": [],
            "count": 0,
            "error": str(e)
        }

@router.get("/combo-suggestions/cart")
async def get_combo_suggestions_for_cart(
    current_user = Depends(get_current_user)
):
    """
    Get combo suggestions based on items in cart.
    Used on cart page.
    """
    try:
        suggestions = await watchlist_combo_service.get_combo_suggestions_for_cart(
            user_id=current_user["_id"],
            limit=3
        )
        
        return {
            "success": True,
            "suggestions": suggestions,
            "count": len(suggestions)
        }
    except Exception as e:
        return {
            "success": False,
            "suggestions": [],
            "count": 0,
            "error": str(e)
        }

@router.get("/combo-suggestions/checkout")
async def get_combo_suggestions_for_checkout(
    current_user = Depends(get_current_user)
):
    """
    Get non-intrusive combo suggestions for checkout page.
    Returns fewer suggestions to not distract from checkout flow.
    """
    try:
        suggestions = await watchlist_combo_service.get_combo_suggestions_for_checkout(
            user_id=current_user["_id"],
            limit=2
        )
        
        return {
            "success": True,
            "suggestions": suggestions,
            "count": len(suggestions)
        }
    except Exception as e:
        return {
            "success": False,
            "suggestions": [],
            "count": 0,
            "error": str(e)
        }

@router.post("/move-from-cart/{product_id}")
async def move_from_cart_to_watchlist(
    product_id: str,
    current_user = Depends(get_current_user)
):
    """
    Manually move a cart item to watchlist.
    Removes item from cart and adds to watchlist with proper flags.
    """
    db = get_db()
    
    # Get user
    user = await db.users.find_one({"_id": current_user["_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    cart = user.get("cart", [])
    watchlist = user.get("wishlist", [])
    
    # Find the cart item
    cart_item = None
    for item in cart:
        if item["product_id"] == product_id:
            cart_item = item
            break
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Product not found in cart")
    
    # Check if product exists
    product = await db.products.find_one({"_id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if already in watchlist
    already_in_watchlist = any(
        item.get("product_id") == product_id 
        for item in watchlist 
        if item.get("migrated_from_cart", False)
    )
    
    if already_in_watchlist:
        # Just remove from cart
        updated_cart = [item for item in cart if item["product_id"] != product_id]
    else:
        # Add to watchlist with metadata
        watchlist_item = {
            "product_id": product_id,
            "migrated_from_cart": True,
            "manual_move": True,
            "original_cart_date": cart_item.get("added_at", datetime.utcnow()),
            "added_at": datetime.utcnow(),
            "category": product.get("category"),
            "price": product.get("price", 0),
            "brand": product.get("brand")
        }
        watchlist.append(watchlist_item)
        
        # Remove from cart
        updated_cart = [item for item in cart if item["product_id"] != product_id]
    
    # Update user
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "cart": updated_cart,
                "wishlist": watchlist
            }
        }
    )
    
    return {
        "success": True,
        "message": "Moved to Watchlist successfully",
        "cart_count": len(updated_cart)
    }
