"""Product bundles and bundle offers (e.g. perfume + trimmer 20% off)."""
from fastapi import APIRouter
from app.database import get_db

router = APIRouter(prefix="/api/bundles", tags=["Bundles"])


@router.get("")
async def list_bundles():
    """List all active bundles with product details and discounted total."""
    db = get_db()
    bundles = await db.product_bundles.find({}).to_list(length=50)
    result = []
    for b in bundles:
        pids = b.get("product_ids", [])
        products = await db.products.find({"_id": {"$in": pids}}).to_list(length=len(pids))
        total_original = sum(float(p.get("price", 0)) for p in products)
        discount = b.get("discount_percent", 0) / 100.0
        total_after = round(total_original * (1 - discount), 2)
        result.append({
            "_id": b["_id"],
            "name": b.get("name"),
            "description": b.get("description"),
            "products": products,
            "discount_percent": b.get("discount_percent"),
            "total_original": round(total_original, 2),
            "total_after_discount": total_after,
        })
    return {"success": True, "bundles": result}


@router.get("/product/{product_id}")
async def get_bundles_for_product(product_id: str):
    """Bundles that include this product (for budget / upsell)."""
    db = get_db()
    bundles = await db.product_bundles.find({"product_ids": product_id}).to_list(length=20)
    result = []
    for b in bundles:
        pids = b.get("product_ids", [])
        products = await db.products.find({"_id": {"$in": pids}}).to_list(length=len(pids))
        total_original = sum(float(p.get("price", 0)) for p in products)
        discount = b.get("discount_percent", 0) / 100.0
        total_after = round(total_original * (1 - discount), 2)
        result.append({
            "_id": b["_id"],
            "name": b.get("name"),
            "description": b.get("description"),
            "products": products,
            "discount_percent": b.get("discount_percent"),
            "total_original": round(total_original, 2),
            "total_after_discount": total_after,
        })
    return {"success": True, "bundles": result}
