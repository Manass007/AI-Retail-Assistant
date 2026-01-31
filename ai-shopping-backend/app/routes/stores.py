"""Pickup stores for quick pickup orders."""
from fastapi import APIRouter, Query
from app.database import get_db

router = APIRouter(prefix="/api/stores", tags=["Stores"])


@router.get("/pickup")
async def get_pickup_stores(
    city: str = None,
    pincode: str = None,
):
    """List pickup stores. Optionally filter by city or pincode."""
    db = get_db()
    q = {"is_active": True}
    if city:
        q["city"] = {"$regex": city, "$options": "i"}
    if pincode:
        q["pincode"] = pincode
    stores = await db.pickup_stores.find(q).to_list(length=50)
    return {"success": True, "stores": stores}
