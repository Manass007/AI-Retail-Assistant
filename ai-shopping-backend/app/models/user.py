from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

# Helper for MongoDB ObjectId
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

class Preferences(BaseModel):
    categories: List[str] = []
    budget: Optional[str] = "mid"

class Subscription(BaseModel):
    plan: str = "free"
    status: str = "active"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = ""
    dob: Optional[datetime] = None
    preferences: Optional[Preferences] = None

class UserCreate(UserBase):
    pass

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    onboarded: bool = False
    subscription: Subscription = Subscription()
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str]
    onboarded: bool
    subscription: dict