from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.database import get_db
from app.middleware.auth import get_current_user
from datetime import datetime, timedelta, date
import random

router = APIRouter(prefix="/api/gamification", tags=["Gamification"])

# ============= MODELS =============

class SpinWheelResponse(BaseModel):
    success: bool
    coupon: dict
    message: str

class DailyCheckInStatusResponse(BaseModel):
    success: bool
    streak: int
    can_claim: bool
    last_checkin_date: datetime = None
    next_reward_day: int = None
    next_reward_description: str = None
    monthly_gift_eligible: bool = False
    monthly_gift_used: bool = False

class DailyCheckInClaimResponse(BaseModel):
    success: bool
    reward_type: str  # "coupon" | "monthly_gift"
    reward: dict
    message: str
    streak: int

class PointsInfoResponse(BaseModel):
    success: bool
    total_points: int
    points_value_usd: float  # 20 points = $0.9
    daily_prompts_completed: int
    daily_prompts_remaining: int
    daily_points_earned: int
    daily_points_remaining: int
    streak_days: int
    streak_tier: str  # "none" | "bronze" | "silver" | "gold"
    streak_reset_date: datetime = None
    next_tier: str = None
    days_to_next_tier: int = None

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

# ============= DAILY CHECK-IN ROUTES =============

@router.get("/daily-checkin/status")
async def get_daily_checkin_status(current_user = Depends(get_current_user)):
    """Get current daily check-in status"""
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    streak = user.get("checkin_streak", 0)
    last_checkin = user.get("last_checkin_date")
    monthly_gift_eligible = user.get("monthly_gift_eligible", False)
    monthly_gift_used = user.get("monthly_gift_used", False)
    
    now = datetime.utcnow()
    can_claim = False
    
    # Check if user can claim today
    if last_checkin:
        # Normalize datetime to date for comparison
        if isinstance(last_checkin, datetime):
            last_checkin_date = last_checkin.date()
        elif hasattr(last_checkin, 'date'):
            last_checkin_date = last_checkin.date()
        else:
            last_checkin_date = last_checkin
        today_date = now.date()
        
        if isinstance(last_checkin_date, datetime):
            last_checkin_date = last_checkin_date.date()
        
        if last_checkin_date < today_date:
            # Check if it's consecutive (yesterday)
            days_diff = (today_date - last_checkin_date).days
            if days_diff == 1:
                can_claim = True
            elif days_diff > 1:
                # Streak broken, reset
                streak = 0
                can_claim = True
        else:
            can_claim = False  # Already claimed today
    else:
        # Never checked in, can claim
        can_claim = True
    
    # Determine next reward
    next_reward_day = None
    next_reward_description = None
    
    if streak == 0:
        next_reward_day = 1
        next_reward_description = "2% off coupon"
    elif streak == 1:
        next_reward_day = 3
        next_reward_description = "Free delivery coupon"
    elif streak < 3:
        next_reward_day = 3
        next_reward_description = "Free delivery coupon"
    elif streak < 7:
        next_reward_day = 7
        next_reward_description = "5% off coupon"
    elif streak < 30:
        next_reward_day = 30
        next_reward_description = "Free gift (keychain)"
    else:
        next_reward_day = None
        next_reward_description = "All rewards claimed!"
    
    return {
        "success": True,
        "streak": streak,
        "can_claim": can_claim,
        "last_checkin_date": last_checkin,
        "next_reward_day": next_reward_day,
        "next_reward_description": next_reward_description,
        "monthly_gift_eligible": monthly_gift_eligible,
        "monthly_gift_used": monthly_gift_used
    }

@router.post("/daily-checkin")
async def claim_daily_checkin(current_user = Depends(get_current_user)):
    """Claim daily check-in reward"""
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    now = datetime.utcnow()
    last_checkin = user.get("last_checkin_date")
    current_streak = user.get("checkin_streak", 0)
    rewards_claimed = user.get("checkin_rewards_claimed", [])
    
    # Check if already claimed today
    if last_checkin:
        # Normalize datetime to date for comparison
        if isinstance(last_checkin, datetime):
            last_checkin_date = last_checkin.date()
        elif hasattr(last_checkin, 'date'):
            last_checkin_date = last_checkin.date()
        else:
            last_checkin_date = last_checkin
        today_date = now.date()
        
        if isinstance(last_checkin_date, datetime):
            last_checkin_date = last_checkin_date.date()
        
        if last_checkin_date >= today_date:
            raise HTTPException(
                status_code=400,
                detail="You have already claimed your reward today. Come back tomorrow!"
            )
        
        # Check if streak is consecutive
        days_diff = (today_date - last_checkin_date).days
        if days_diff == 1:
            # Consecutive day, increment streak
            current_streak += 1
        elif days_diff > 1:
            # Streak broken, reset to 1
            current_streak = 1
    else:
        # First check-in
        current_streak = 1
    
    # Determine reward based on streak (only give reward on milestone days)
    reward_type = None
    reward_data = {}
    message = ""
    
    # Only give rewards on milestone days (1, 3, 7, 30)
    if current_streak in [1, 3, 7, 30]:
        if current_streak == 1:
            # Day 1: 2% off coupon
            code = f"DAILY1-{random.randint(1000, 9999)}"
            coupon_data = {
                "user_id": current_user["_id"],
                "code": code,
                "discount_percent": 2,
                "created_at": now,
                "expires_at": now + timedelta(days=30),
                "used": False
            }
            await db.coupons.insert_one(coupon_data)
            reward_type = "coupon"
            reward_data = {
                "code": code,
                "discount_percent": 2,
                "label": "2% OFF",
                "expires_at": coupon_data["expires_at"]
            }
            message = "Congratulations! You earned a 2% off coupon!"
            
        elif current_streak == 3:
            # Day 3: Free delivery coupon
            code = f"FREEDEL-{random.randint(1000, 9999)}"
            coupon_data = {
                "user_id": current_user["_id"],
                "code": code,
                "discount_percent": 0,
                "free_delivery": True,
                "created_at": now,
                "expires_at": now + timedelta(days=30),
                "used": False
            }
            await db.coupons.insert_one(coupon_data)
            reward_type = "coupon"
            reward_data = {
                "code": code,
                "free_delivery": True,
                "label": "Free Delivery",
                "expires_at": coupon_data["expires_at"]
            }
            message = "Congratulations! You earned a free delivery coupon!"
            
        elif current_streak == 7:
            # Day 7: 5% off coupon
            code = f"DAILY7-{random.randint(1000, 9999)}"
            coupon_data = {
                "user_id": current_user["_id"],
                "code": code,
                "discount_percent": 5,
                "created_at": now,
                "expires_at": now + timedelta(days=30),
                "used": False
            }
            await db.coupons.insert_one(coupon_data)
            reward_type = "coupon"
            reward_data = {
                "code": code,
                "discount_percent": 5,
                "label": "5% OFF",
                "expires_at": coupon_data["expires_at"]
            }
            message = "Congratulations! You earned a 5% off coupon!"
            
        elif current_streak == 30:
            # Day 30: Free gift
            await db.users.update_one(
                {"_id": current_user["_id"]},
                {"$set": {"monthly_gift_eligible": True, "monthly_gift_used": False}}
            )
            reward_type = "monthly_gift"
            reward_data = {
                "gift_name": "Free Keychain",
                "description": "Get a free keychain with your next purchase!"
            }
            message = "Amazing! You've logged in for 30 days! You'll receive a free keychain with your next purchase!"
    
    # Update user's check-in data
    update_data = {
        "last_checkin_date": now,
        "checkin_streak": current_streak
    }
    
    # Add to rewards claimed if we gave a reward
    if reward_type:
        if "checkin_rewards_claimed" not in user or not isinstance(user.get("checkin_rewards_claimed"), list):
            update_data["checkin_rewards_claimed"] = [now]
        else:
            rewards_claimed.append(now)
            update_data["checkin_rewards_claimed"] = rewards_claimed
    
    # Update points system streak
    streak_days = user.get("streak_days", 0)
    streak_tier = user.get("streak_tier", "none")
    streak_start_date = user.get("streak_start_date")
    streak_reset_date = user.get("streak_reset_date")
    
    # Check if it's a new day for streak
    last_checkin_for_streak = user.get("last_checkin_date")
    if last_checkin_for_streak:
        last_checkin_date_obj = last_checkin_for_streak.date() if isinstance(last_checkin_for_streak, datetime) else last_checkin_for_streak
        if last_checkin_date_obj < today_date:
            # New day, increment streak
            streak_days += 1
    else:
        # First check-in
        streak_days = 1
        streak_start_date = now
    
    # Check if streak reset date passed
    if streak_reset_date:
        reset_date_obj = streak_reset_date.date() if isinstance(streak_reset_date, datetime) else streak_reset_date
        if reset_date_obj < today_date:
            # Reset period passed, start new period
            streak_days = 1
            streak_tier = "none"
            streak_start_date = now
            streak_reset_date = now + timedelta(days=90)
    else:
        # Set initial reset date (3 months from now)
        streak_reset_date = now + timedelta(days=90)
    
    # Update tier based on streak (30 days per tier)
    if streak_days >= 90:
        streak_tier = "gold"
    elif streak_days >= 60:
        streak_tier = "silver"
    elif streak_days >= 30:
        streak_tier = "bronze"
    else:
        streak_tier = "none"
    
    update_data["streak_days"] = streak_days
    update_data["streak_tier"] = streak_tier
    update_data["streak_start_date"] = streak_start_date
    update_data["streak_reset_date"] = streak_reset_date
    
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data}
    )
    
    # If no reward this time (not a milestone day), still update streak
    if not reward_type:
        message = f"Great! Day {current_streak} check-in complete. Keep it up!"
        reward_data = {
            "streak": current_streak,
            "next_milestone": 1 if current_streak < 1 else (3 if current_streak < 3 else (7 if current_streak < 7 else 30))
        }
    
    return {
        "success": True,
        "reward_type": reward_type or "streak_update",
        "reward": reward_data,
        "message": message,
        "streak": current_streak
    }

# ============= POINTS SYSTEM ROUTES =============

@router.get("/points/info")
async def get_points_info(current_user = Depends(get_current_user)):
    """Get user's points information, daily progress, and streak status"""
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    now = datetime.utcnow()
    today = now.date()
    
    # Get points data
    total_points = user.get("points", 0)
    last_prompt_date = user.get("last_prompt_date")
    daily_prompt_count = user.get("daily_prompt_count", 0)
    
    # Reset daily count if it's a new day
    if last_prompt_date:
        last_prompt_date_obj = last_prompt_date.date() if isinstance(last_prompt_date, datetime) else last_prompt_date
        if last_prompt_date_obj < today:
            daily_prompt_count = 0
            # Reset daily prompt count in DB
            await db.users.update_one(
                {"_id": current_user["_id"]},
                {"$set": {"daily_prompt_count": 0, "suggested_products_today": []}}
            )
    
    # Calculate daily progress
    daily_prompts_completed = daily_prompt_count
    daily_prompts_remaining = max(0, 4 - daily_prompt_count)
    daily_points_earned = daily_prompt_count * 3
    daily_points_remaining = daily_prompts_remaining * 3
    
    # Points value: 20 points = $0.9, so 1 point = $0.045
    points_value_usd = round(total_points * 0.045, 2)
    
    # Streak system: 30 days = bronze → silver → gold, reset every 3 months
    streak_days = user.get("streak_days", 0)
    streak_tier = user.get("streak_tier", "none")
    streak_start_date = user.get("streak_start_date")
    streak_reset_date = user.get("streak_reset_date")
    
    # Check if streak needs reset (every 3 months)
    if streak_reset_date:
        if isinstance(streak_reset_date, datetime):
            reset_date = streak_reset_date.date()
        else:
            reset_date = streak_reset_date
        if reset_date < today:
            # Reset streak
            streak_days = 0
            streak_tier = "none"
            await db.users.update_one(
                {"_id": current_user["_id"]},
                {"$set": {
                    "streak_days": 0,
                    "streak_tier": "none",
                    "streak_start_date": None,
                    "streak_reset_date": None
                }}
            )
    else:
        # Set initial reset date if not set (3 months from now)
        if streak_days > 0:
            new_reset_date = now + timedelta(days=90)
            await db.users.update_one(
                {"_id": current_user["_id"]},
                {"$set": {"streak_reset_date": new_reset_date}}
            )
            streak_reset_date = new_reset_date
    
    # Determine next tier
    next_tier = None
    days_to_next_tier = None
    if streak_tier == "none":
        next_tier = "bronze"
        days_to_next_tier = max(0, 30 - streak_days)
    elif streak_tier == "bronze":
        next_tier = "silver"
        days_to_next_tier = max(0, 30 - (streak_days % 30))
    elif streak_tier == "silver":
        next_tier = "gold"
        days_to_next_tier = max(0, 30 - (streak_days % 30))
    else:  # gold
        next_tier = None
        days_to_next_tier = None
    
    return {
        "success": True,
        "total_points": total_points,
        "points_value_usd": points_value_usd,
        "daily_prompts_completed": daily_prompts_completed,
        "daily_prompts_remaining": daily_prompts_remaining,
        "daily_points_earned": daily_points_earned,
        "daily_points_remaining": daily_points_remaining,
        "streak_days": streak_days,
        "streak_tier": streak_tier,
        "streak_reset_date": streak_reset_date,
        "next_tier": next_tier,
        "days_to_next_tier": days_to_next_tier,
    }

@router.post("/points/update-streak")
async def update_streak(current_user = Depends(get_current_user)):
    """Update streak when user completes daily check-in (called from daily check-in)"""
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    now = datetime.utcnow()
    today = now.date()
    
    streak_days = user.get("streak_days", 0)
    streak_tier = user.get("streak_tier", "none")
    streak_start_date = user.get("streak_start_date")
    last_checkin_date = user.get("last_checkin_date")
    
    # Check if user checked in today
    if last_checkin_date:
        last_checkin_date_obj = last_checkin_date.date() if isinstance(last_checkin_date, datetime) else last_checkin_date
        if last_checkin_date_obj >= today:
            # Already checked in today, increment streak
            streak_days += 1
        else:
            # New day, increment streak
            streak_days += 1
    else:
        # First check-in
        streak_days = 1
        streak_start_date = now
    
    # Update tier based on streak (30 days per tier)
    if streak_days >= 90:
        streak_tier = "gold"
    elif streak_days >= 60:
        streak_tier = "silver"
    elif streak_days >= 30:
        streak_tier = "bronze"
    else:
        streak_tier = "none"
    
    # Set reset date (3 months from start or from last reset)
    streak_reset_date = user.get("streak_reset_date")
    if not streak_reset_date:
        streak_reset_date = now + timedelta(days=90)
    elif isinstance(streak_reset_date, datetime):
        reset_date_obj = streak_reset_date.date()
        if reset_date_obj < today:
            # Reset period passed, start new period
            streak_reset_date = now + timedelta(days=90)
            streak_days = 1
            streak_tier = "none"
            streak_start_date = now
    
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {
            "streak_days": streak_days,
            "streak_tier": streak_tier,
            "streak_start_date": streak_start_date,
            "streak_reset_date": streak_reset_date
        }}
    )
    
    return {
        "success": True,
        "streak_days": streak_days,
        "streak_tier": streak_tier,
        "message": f"Streak updated! You're at {streak_days} days ({streak_tier} tier)"
    }