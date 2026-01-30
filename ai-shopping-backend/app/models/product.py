from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    category: str
    price: float
    brand: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = []

class ProductCreate(ProductBase):
    id: str
    stock_quantity: int = 0
    is_in_stock: bool = True

class ProductInDB(ProductBase):
    id: str = Field(alias="_id")
    stock_quantity: int
    is_in_stock: bool
    popularity_score: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class ProductResponse(ProductBase):
    id: str
    stock_quantity: int
    is_in_stock: bool