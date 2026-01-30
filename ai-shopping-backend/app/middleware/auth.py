from fastapi import HTTPException, Header, Depends
from jose import jwt, JWTError
from app.config import settings
from app.database import get_db
from typing import Optional
from datetime import datetime, timedelta

def generate_token(user_id: str) -> str:
    """Generate JWT token (like your generateToken)"""
    expires = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    
    payload = {
        "sub": user_id,
        "exp": expires,
        "iat": datetime.utcnow()
    }
    
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
    return token

async def get_current_user(authorization: Optional[str] = Header(None)):
    """Protect middleware - requires valid token (like your protect)"""
    
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Not authorized. Please login to access this resource."
        )
    
    # Extract token from "Bearer <token>"
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    # Verify token
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
    except JWTError as e:
        if "expired" in str(e).lower():
            raise HTTPException(status_code=401, detail="Token expired. Please login again.")
        raise HTTPException(status_code=401, detail="Invalid token. Please login again.")
    
    # Get user from database
    db = get_db()
    user = await db.users.find_one({"_id": user_id})
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found. Token is invalid.")
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=401,
            detail="Your account has been deactivated. Please contact support."
        )
    
    return user

async def optional_auth(authorization: Optional[str] = Header(None)):
    """Optional auth - doesn't fail if no token (like your optionalAuth)"""
    
    if not authorization:
        return None
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            return None
        
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        
        if not user_id:
            return None
        
        db = get_db()
        user = await db.users.find_one({"_id": user_id})
        
        if user and user.get("is_active", True):
            return user
        
    except Exception as e:
        print(f"Optional auth failed: {e}")
        return None
    
    return None