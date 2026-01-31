from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.middleware.auth import generate_token, get_current_user
from app.services.email_service import email_service
from datetime import datetime, timedelta
import random
import bcrypt
import re

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# In-memory OTP storage (use Redis in production)
otp_store = {}

# ============= PYDANTIC MODELS =============

class SendOTPRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    phone: str = ""
    dob: str = None
    preferences: dict = {"categories": [], "budget": "mid"}

class UpdateProfileRequest(BaseModel):
    name: str = None
    phone: str = None
    dob: str = None
    preferences: dict = None

# ============= HELPER FUNCTIONS =============

def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return str(random.randint(100000, 999999))

def hash_otp(otp: str) -> str:
    """Hash OTP with bcrypt"""
    return bcrypt.hashpw(otp.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_otp(plain_otp: str, hashed_otp: str) -> bool:
    """Verify OTP"""
    return bcrypt.checkpw(plain_otp.encode('utf-8'), hashed_otp.encode('utf-8'))

# ============= ROUTES =============

@router.post("/send-otp")
async def send_otp(request: SendOTPRequest):
    """Send OTP to email (like your /api/auth/send-otp)"""
    
    email = request.email.lower()
    
    # Validate email
    email_regex = r'^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$'
    if not re.match(email_regex, email):
        raise HTTPException(status_code=400, detail="Please provide a valid email address")
    
    # Check if user exists
    db = get_db()
    existing_user = await db.users.find_one({"email": email})
    
    # Generate OTP
    otp_code = generate_otp()
    hashed = hash_otp(otp_code)
    
    # Store OTP (expires in 10 minutes)
    otp_store[email] = {
        "otp": hashed,
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
        "attempts": 0,
        "verified": False
    }
    
    # Send email
    email_result = await email_service.send_otp_email(email, otp_code, not existing_user)
    
    if not email_result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to send OTP. Please try again.")
    
    return {
        "success": True,
        "message": "OTP sent successfully to your email",
        "isNewUser": not existing_user,
        "email": email,
        "otp": otp_code  # Remove in production, only for testing
    }

@router.post("/verify-otp")
async def verify_otp_route(request: VerifyOTPRequest):
    """Verify OTP (like your /api/auth/verify-otp)"""
    
    email = request.email.lower()
    otp = request.otp
    
    # Check if OTP exists
    otp_record = otp_store.get(email)
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="OTP not found. Please request a new one.")
    
    # Check expiry
    if datetime.utcnow() > otp_record["expires_at"]:
        del otp_store[email]
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
    
    # Check attempts
    if otp_record["attempts"] >= 5:
        raise HTTPException(status_code=400, detail="Too many incorrect attempts. Please request a new OTP.")
    
    # Verify OTP
    if not verify_otp(otp, otp_record["otp"]):
        otp_record["attempts"] += 1
        raise HTTPException(
            status_code=400,
            detail=f"Invalid OTP. {5 - otp_record['attempts']} attempts remaining."
        )
    
    # Mark as verified
    otp_record["verified"] = True
    
    # Check if user exists
    db = get_db()
    existing_user = await db.users.find_one({"email": email})
    
    if existing_user:
        # Update last login
        await db.users.update_one(
            {"_id": existing_user["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        # Generate token
        token = generate_token(existing_user["_id"])
        
        # Check premium status
        is_premium = False
        if existing_user.get("subscription"):
            sub = existing_user["subscription"]
            is_premium = (
                sub.get("plan") == "premium" and
                sub.get("status") == "active" and
                (not sub.get("end_date") or sub["end_date"] > datetime.utcnow())
            )
        
        return {
            "success": True,
            "message": "Login successful",
            "isNewUser": False,
            "token": token,
            "user": {
                "id": existing_user["_id"],
                "email": existing_user["email"],
                "name": existing_user["name"],
                "phone": existing_user.get("phone", ""),
                "onboarded": existing_user.get("onboarded", False),
                "subscription": {
                    "plan": existing_user.get("subscription", {}).get("plan", "free"),
                    "status": existing_user.get("subscription", {}).get("status", "active"),
                    "isPremium": is_premium
                }
            }
        }
    else:
        # New user: create minimal user and return token so client gets token in one step
        user_id = f"user_{datetime.utcnow().timestamp()}"
        new_user = {
            "_id": user_id,
            "email": email,
            "name": "",
            "phone": "",
            "dob": None,
            "preferences": {"categories": [], "budget": "mid"},
            "onboarded": False,
            "subscription": {"plan": "free", "status": "active", "start_date": None, "end_date": None},
            "wishlist": [],
            "cart": [],
            "is_active": True,
            "created_at": datetime.utcnow(),
            "last_login": datetime.utcnow(),
            "last_spin_date": None,
        }
        await db.users.insert_one(new_user)
        token = generate_token(user_id)
        return {
            "success": True,
            "message": "OTP verified. Complete your profile with PUT /api/auth/profile or POST /api/auth/register.",
            "isNewUser": True,
            "email": email,
            "token": token,
            "user": {
                "id": user_id,
                "email": email,
                "name": "",
                "phone": "",
                "onboarded": False,
                "subscription": {"plan": "free", "status": "active", "isPremium": False},
            },
        }

@router.post("/register")
async def register(request: RegisterRequest):
    """Register new user (like your /api/auth/register)"""
    
    email = request.email.lower()
    
    # Check if OTP was verified
    otp_record = otp_store.get(email)
    
    if not otp_record or not otp_record.get("verified"):
        raise HTTPException(status_code=400, detail="Please verify your email with OTP first")
    
    db = get_db()
    existing_user = await db.users.find_one({"email": email})

    if existing_user:
        # User was created by verify-otp (minimal user): complete profile and return token
        user_id = existing_user["_id"]
        await db.users.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "name": request.name,
                    "phone": request.phone,
                    "dob": datetime.fromisoformat(request.dob) if request.dob else None,
                    "preferences": request.preferences,
                    "onboarded": True,
                    "last_login": datetime.utcnow(),
                }
            },
        )
        token = generate_token(user_id)
        try:
            await email_service.send_welcome_email(email, request.name)
        except Exception as e:
            print(f"Failed to send welcome email: {e}")
        if email in otp_store:
            del otp_store[email]
        return {
            "success": True,
            "message": "Registration completed",
            "token": token,
            "user": {
                "id": user_id,
                "email": email,
                "name": request.name,
                "phone": request.phone,
                "preferences": request.preferences,
                "onboarded": True,
                "subscription": {"plan": "free", "status": "active", "isPremium": False},
            },
        }

    # Create new user (OTP verified, no user yet)
    user_id = f"user_{datetime.utcnow().timestamp()}"
    new_user = {
        "_id": user_id,
        "email": email,
        "name": request.name,
        "phone": request.phone,
        "dob": datetime.fromisoformat(request.dob) if request.dob else None,
        "preferences": request.preferences,
        "onboarded": True,
        "subscription": {"plan": "free", "status": "active", "start_date": None, "end_date": None},
        "wishlist": [],
        "cart": [],
        "is_active": True,
        "created_at": datetime.utcnow(),
        "last_login": datetime.utcnow(),
        "last_spin_date": None,
    }
    await db.users.insert_one(new_user)
    token = generate_token(user_id)
    try:
        await email_service.send_welcome_email(email, request.name)
    except Exception as e:
        print(f"Failed to send welcome email: {e}")
    if email in otp_store:
        del otp_store[email]
    return {
        "success": True,
        "message": "Registration successful",
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "name": request.name,
            "phone": request.phone,
            "preferences": request.preferences,
            "onboarded": True,
            "subscription": {"plan": "free", "status": "active", "isPremium": False},
        },
    }

@router.get("/me")
async def get_me(current_user = Depends(get_current_user)):
    """Get current user (like your /api/auth/me)"""
    
    # Check premium status
    is_premium = False
    if current_user.get("subscription"):
        sub = current_user["subscription"]
        is_premium = (
            sub.get("plan") == "premium" and
            sub.get("status") == "active" and
            (not sub.get("end_date") or sub["end_date"] > datetime.utcnow())
        )
    
    return {
        "success": True,
        "user": {
            "id": current_user["_id"],
            "email": current_user["email"],
            "name": current_user["name"],
            "phone": current_user.get("phone", ""),
            "dob": current_user.get("dob"),
            "preferences": current_user.get("preferences", {}),
            "onboarded": current_user.get("onboarded", False),
            "lastLogin": current_user.get("last_login"),
            "createdAt": current_user.get("created_at"),
            "subscription": {
                "plan": current_user.get("subscription", {}).get("plan", "free"),
                "status": current_user.get("subscription", {}).get("status", "active"),
                "startDate": current_user.get("subscription", {}).get("start_date"),
                "endDate": current_user.get("subscription", {}).get("end_date"),
                "isPremium": is_premium
            }
        }
    }

@router.put("/profile")
async def update_profile(
    request: UpdateProfileRequest,
    current_user = Depends(get_current_user)
):
    """Update user profile (like your /api/auth/profile)"""
    
    db = get_db()
    
    # Build update data
    update_data = {}
    if request.name:
        update_data["name"] = request.name
    if request.phone is not None:
        update_data["phone"] = request.phone
    if request.dob:
        update_data["dob"] = datetime.fromisoformat(request.dob)
    if request.preferences:
        update_data["preferences"] = request.preferences
    
    # Mark profile as completed (onboarded) when user submits name/dob/preferences
    if update_data:
        update_data["onboarded"] = True

    # Update user
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user = await db.users.find_one({"_id": current_user["_id"]})
    
    return {
        "success": True,
        "message": "Profile updated successfully",
        "user": {
            "id": updated_user["_id"],
            "email": updated_user["email"],
            "name": updated_user["name"],
            "phone": updated_user.get("phone", ""),
            "dob": updated_user.get("dob"),
            "preferences": updated_user.get("preferences", {}),
            "onboarded": updated_user.get("onboarded", True),
        }
    }