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


class ApplyCouponRequest(BaseModel):
    code: str


async def _validate_coupon(db, code: str, subtotal: float, user_dob=None, user=None):
    """Validate promo code or user's earned coupon; return (discount_percent, name) or None."""
    code_upper = (code or "").strip().upper()
    if not code_upper:
        return None
    now = datetime.utcnow()

    # User's earned coupons (from home delivery reward)
    if user:
        earned = user.get("earned_coupons") or []
        for ec in earned:
            if (ec.get("code") or "").upper() != code_upper or ec.get("used"):
                continue
            valid_until = ec.get("valid_until")
            if not valid_until:
                continue
            try:
                if hasattr(valid_until, "replace"):
                    if valid_until.replace(tzinfo=None) >= now:
                        return (int(ec.get("discount_percent", 0)), ec.get("label", "Earned coupon"))
                elif valid_until >= now:
                    return (int(ec.get("discount_percent", 0)), ec.get("label", "Earned coupon"))
            except Exception:
                pass
            break

    promo = await db.promo_codes.find_one({
        "code": code_upper,
        "valid_from": {"$lte": now},
        "valid_until": {"$gte": now},
        "is_active": True,
    })
    if promo and float(subtotal) >= float(promo.get("min_order", 0)):
        return (int(promo.get("discount_percent", 0)), promo.get("name", code_upper))
    if code_upper == "WINTER20" and subtotal >= 0:
        return (20, "Winter Festive")
    if code_upper == "BDAY10" and subtotal >= 0:
        return (10, "Birthday Special")
    if code_upper == "SAVE10" and subtotal >= 100:
        return (10, "Welcome Offer")
    return None


# ============= ROUTES =============

@router.get("")
async def get_cart(current_user = Depends(get_current_user)):
    """Get user's cart with optional coupon discount."""
    
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    cart_items = user.get("cart", [])
    cart_coupon = user.get("cart_coupon")
    
    # Filter out migrated items (shouldn't be in cart, but filter just in case)
    active_cart_items = [
        item for item in cart_items 
        if not item.get("migrated_to_wishlist", False)
    ]
    
    # Get product details for each cart item
    cart_with_products = []
    total_amount = 0
    
    for item in active_cart_items:
        product = await db.products.find_one({"_id": item["product_id"]})
        
        if product:
            days_in_cart = (datetime.utcnow() - item["added_at"]).days
            
            cart_with_products.append({
                "product": product,
                "quantity": item["quantity"],
                "added_at": item["added_at"],
                "days_in_cart": days_in_cart
            })
            
            total_amount += float(product.get("price", 0)) * item["quantity"]
    
    discount_amount = 0
    applied_coupon = None
    if cart_coupon and cart_with_products:
        pct = cart_coupon.get("discount_percent", 0)
        discount_amount = round(total_amount * (pct / 100.0), 2)
        applied_coupon = {"code": cart_coupon.get("code"), "discount_percent": pct, "name": cart_coupon.get("name")}
    
    return {
        "success": True,
        "cart": cart_with_products,
        "total_items": len(cart_with_products),
        "total_amount": round(total_amount, 2),
        "discount_amount": discount_amount,
        "applied_coupon": applied_coupon,
        "total_after_discount": round(total_amount - discount_amount, 2),
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

@router.delete("/coupon")
async def remove_coupon(current_user=Depends(get_current_user)):
    """Remove applied coupon from cart."""
    db = get_db()
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$unset": {"cart_coupon": 1}},
    )
    return {"success": True, "message": "Coupon removed."}


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


# One-time use: birthday and festive; general (e.g. SAVE10) can be used every order
ONE_TIME_COUPON_CODES = {"BDAY10", "WINTER20", "XMAS25"}


@router.post("/apply-coupon")
async def apply_coupon(
    request: ApplyCouponRequest,
    current_user=Depends(get_current_user),
):
    """Apply a discount code to the cart."""
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})
    cart_items = user.get("cart", [])
    subtotal = 0
    for item in cart_items:
        product = await db.products.find_one({"_id": item["product_id"]})
        if product:
            subtotal += float(product.get("price", 0)) * item.get("quantity", 1)
    result = await _validate_coupon(db, request.code, subtotal, user.get("dob"), user)
    if not result:
        raise HTTPException(status_code=400, detail="Invalid or expired coupon code, or order total below minimum.")
    discount_percent, name = result
    code_upper = (request.code or "").strip().upper()
    # One-time coupons: user may use only once
    if code_upper in ONE_TIME_COUPON_CODES:
        used = await db.orders.count_documents(
            {"user_id": current_user["_id"], "coupon_code": code_upper}
        )
        if used >= 1:
            raise HTTPException(
                status_code=400,
                detail="This coupon can only be used once per account.",
            )
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"cart_coupon": {"code": code_upper, "discount_percent": discount_percent, "name": name}}},
    )
    return {
        "success": True,
        "message": f"Coupon applied: {discount_percent}% off",
        "applied_coupon": {"code": code_upper, "discount_percent": discount_percent, "name": name},
    }