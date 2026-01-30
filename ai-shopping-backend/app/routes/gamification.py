from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.database import get_db
from app.middleware.auth import get_current_user
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/api/gamification", tags=["Gamification"])

# ============= MODELS =============

class SpinWheelResponse(BaseModel):
    success: bool
    coupon: dict
    message: str

# ============= ROUTES =============

@router.post("/spin-wheel")
async def spin_wheel(current_user = Depends(get_current_user)):
    """Spin wheel to get discount coupon (once per month)"""
    
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})
    
    # Check if already spun this month
    last_spin = user.get("last_spin_date")
    
    if last_spin:
        days_since_spin = (datetime.utcnow() - last_spin).days
        if days_since_spin < 30:
            raise HTTPException(
                status_code=400,
                detail=f"Already spun this month. Try again in {30 - days_since_spin} days."
            )
    
    # Generate random discount
    discounts = [5, 10, 15, 20, 25, 50]
    weights = [30, 25, 20, 15, 8, 2]  # 50% is rare
    discount = random.choices(discounts, weights=weights)[0]
    
    # Generate coupon code
    code = f"SPIN{random.randint(1000, 9999)}"
    
    # Save coupon
    coupon_data = {
        "user_id": current_user["_id"],
        "code": code,
        "discount_percent": discount,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=30),
        "used": False
    }
    
    await db.coupons.insert_one(coupon_data)
    
    # Update user's last spin date
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"last_spin_date": datetime.utcnow()}}
    )
    
    return {
        "success": True,
        "coupon": {
            "discount": discount,
            "label": f"{discount}% OFF",
            "code": code,
            "expires_at": coupon_data["expires_at"]
        },
        "message": f"Congratulations! You won {discount}% off!"
    }

@router.get("/my-coupons")
async def get_my_coupons(current_user = Depends(get_current_user)):
    """Get user's coupons"""
    
    db = get_db()
    
    # Get active coupons
    coupons = await db.coupons.find({
        "user_id": current_user["_id"],
        "used": False,
        "expires_at": {"$gt": datetime.utcnow()}
    })\
        .sort("created_at", -1)\
        .to_list(length=50)
    
    return {
        "success": True,
        "coupons": coupons,
        "count": len(coupons)
    }

@router.post("/use-coupon/{code}")
async def use_coupon(code: str, current_user = Depends(get_current_user)):
    """Mark coupon as used"""
    
    db = get_db()
    
    # Find coupon
    coupon = await db.coupons.find_one({
        "code": code,
        "user_id": current_user["_id"],
        "used": False,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found or expired")
    
    # Mark as used
    await db.coupons.update_one(
        {"_id": coupon["_id"]},
        {"$set": {"used": True, "used_at": datetime.utcnow()}}
    )
    
    return {
        "success": True,
        "message": "Coupon applied successfully",
        "discount": coupon["discount_percent"]
    }

@router.get("/can-spin")
async def can_spin(current_user = Depends(get_current_user)):
    """Check if user can spin the wheel"""
    
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})
    
    last_spin = user.get("last_spin_date")
    
    if not last_spin:
        return {
            "success": True,
            "can_spin": True,
            "message": "You can spin now!"
        }
    
    days_since_spin = (datetime.utcnow() - last_spin).days
    
    if days_since_spin >= 30:
        return {
            "success": True,
            "can_spin": True,
            "message": "You can spin now!"
        }
    
    return {
        "success": True,
        "can_spin": False,
        "message": f"Try again in {30 - days_since_spin} days",
        "days_remaining": 30 - days_since_spin
    }