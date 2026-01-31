"""Orders: history (last/frequent), create order with payment_method (pay_at_store | online)."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.database import get_db
from app.middleware.auth import get_current_user
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/api/orders", tags=["Orders"])


class CreateOrderRequest(BaseModel):
    payment_method: str  # "pay_at_store" | "online"
    store_id: Optional[str] = None  # required for pickup; optional for delivery
    address_id: Optional[str] = None  # optional, for home delivery


@router.get("")
async def list_orders(
    current_user=Depends(get_current_user),
    limit: int = 20,
):
    """List user's orders (order_id, date, total, status) for profile / order history."""
    db = get_db()
    cursor = (
        db.orders.find({"user_id": current_user["_id"]})
        .sort("created_at", -1)
        .limit(limit)
    )
    orders = await cursor.to_list(length=limit)
    list_out = []
    for o in orders:
        pm = o.get("payment_method")
        # For pay_at_store: show pickup status (packed / ready for pickup)
        pickup_status = None
        if pm == "pay_at_store":
            pickup_status = o.get("pickup_status", "pending")  # pending | packed | ready_for_pickup
        list_out.append({
            "order_id": o["_id"],
            "created_at": o.get("created_at"),
            "total": o.get("total", 0),
            "payment_status": o.get("payment_status", "pending"),
            "payment_method": pm,
            "pickup_status": pickup_status,
            "item_count": sum(item.get("quantity", 1) for item in o.get("items", [])),
        })
    return {"success": True, "orders": list_out}


@router.get("/history")
async def get_order_history(
    last_n: int = 5,
    current_user=Depends(get_current_user),
):
    """Last ordered items and frequently ordered product IDs for quick-add."""
    db = get_db()
    orders = (
        await db.orders.find({"user_id": current_user["_id"], "payment_status": "paid"})
        .sort("created_at", -1)
        .limit(50)
        .to_list(length=50)
    )
    last_ordered_items = []
    seen_last = set()  # dedupe by product_id so "last order" shows each product once
    product_count = {}
    for o in orders[:last_n]:
        for item in o.get("items", []):
            pid = item.get("product_id")
            if pid not in seen_last:
                seen_last.add(pid)
                last_ordered_items.append(
                    {
                        "product_id": pid,
                        "quantity": item.get("quantity", 1),
                        "price": item.get("price"),
                        "order_id": o["_id"],
                        "ordered_at": o.get("created_at"),
                    }
                )
            product_count[pid] = product_count.get(pid, 0) + item.get("quantity", 1)
    for o in orders[last_n:]:
        for item in o.get("items", []):
            pid = item.get("product_id")
            product_count[pid] = product_count.get(pid, 0) + item.get("quantity", 1)
    frequently_ordered = [
        {"product_id": pid, "order_count": c}
        for pid, c in sorted(product_count.items(), key=lambda x: -x[1])[:20]
    ]
    product_ids = list({i["product_id"] for i in last_ordered_items} | {f["product_id"] for f in frequently_ordered})
    products = await db.products.find({"_id": {"$in": product_ids}}).to_list(length=len(product_ids))
    product_map = {p["_id"]: p for p in products}
    last_ordered_with_product = [
        {**item, "product": product_map.get(item["product_id"])}
        for item in last_ordered_items
    ]
    frequently_with_product = [
        {**f, "product": product_map.get(f["product_id"])}
        for f in frequently_ordered
    ]
    return {
        "success": True,
        "last_ordered": last_ordered_with_product,
        "frequently_ordered": frequently_with_product,
    }


@router.get("/{order_id}")
async def get_order(
    order_id: str,
    current_user=Depends(get_current_user),
):
    """Get single order with items and product details (for order detail / reorder)."""
    db = get_db()
    order = await db.orders.find_one({"_id": order_id, "user_id": current_user["_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    product_ids = [item.get("product_id") for item in order.get("items", []) if item.get("product_id")]
    products = await db.products.find({"_id": {"$in": product_ids}}).to_list(length=len(product_ids))
    product_map = {p["_id"]: p for p in products}
    items_with_product = [
        {**item, "product": product_map.get(item.get("product_id"))}
        for item in order.get("items", [])
    ]
    return {
        "success": True,
        "order": {
            "order_id": order["_id"],
            "created_at": order.get("created_at"),
            "total": order.get("total", 0),
            "payment_status": order.get("payment_status"),
            "payment_method": order.get("payment_method"),
            "pickup_status": order.get("pickup_status"),
            "items": items_with_product,
            "item_count": len(items_with_product),
        },
    }


@router.post("")
async def create_order(
    request: CreateOrderRequest,
    current_user=Depends(get_current_user),
):
    """Create order from current cart. payment_method: pay_at_store | online. For pickup, pass store_id."""
    if request.payment_method not in ("pay_at_store", "online"):
        raise HTTPException(status_code=400, detail="payment_method must be pay_at_store or online")
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    cart = user.get("cart", [])
    if not cart:
        raise HTTPException(status_code=400, detail="Cart is empty")
    product_ids = [c["product_id"] for c in cart]
    products = await db.products.find({"_id": {"$in": product_ids}}).to_list(length=len(product_ids))
    product_map = {p["_id"]: p for p in products}
    total = 0
    items = []
    for c in cart:
        p = product_map.get(c["product_id"])
        if not p:
            continue
        if not p.get("is_in_stock", True):
            raise HTTPException(status_code=400, detail=f"Product {p.get('name')} is out of stock")
        qty = c.get("quantity", 1)
        price = float(p.get("price", 0))
        total += price * qty
        items.append({"product_id": p["_id"], "quantity": qty, "price": price})
    # Apply cart coupon if set
    cart_coupon = user.get("cart_coupon")
    discount_amount = 0
    coupon_code = None
    if cart_coupon and total > 0:
        pct = cart_coupon.get("discount_percent", 0)
        discount_amount = round(total * (pct / 100.0), 2)
        coupon_code = cart_coupon.get("code")
    # Check for monthly gift eligibility
    monthly_gift_eligible = user.get("monthly_gift_eligible", False)
    monthly_gift_used = user.get("monthly_gift_used", False)
    
    # Add free gift if eligible and not used
    if monthly_gift_eligible and not monthly_gift_used:
        gift_product = await db.products.find_one({"_id": "FREE_GIFT_KEYCHAIN"})
        if gift_product:
            items.append({
                "product_id": "FREE_GIFT_KEYCHAIN",
                "quantity": 1,
                "price": 0.00
            })
            # Mark gift as used
            await db.users.update_one(
                {"_id": current_user["_id"]},
                {"$set": {"monthly_gift_used": True}}
            )
    
    total_after_discount = round(total - discount_amount, 2)
    order_id = f"ord_{datetime.utcnow().timestamp()}"
    order = {
        "_id": order_id,
        "user_id": current_user["_id"],
        "items": items,
        "total": total_after_discount,
        "subtotal": round(total, 2),
        "discount_amount": discount_amount,
        "coupon_code": coupon_code,
        "payment_method": request.payment_method,
        "payment_status": "pending" if request.payment_method == "online" else "pay_at_store",
        "store_id": request.store_id,
        "address_id": request.address_id,
        "razorpay_order_id": None,
        "created_at": datetime.utcnow(),
    }
    await db.orders.insert_one(order)
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"cart": []}, "$unset": {"cart_coupon": 1}},
    )
    # Mark earned coupon as used if applied
    if coupon_code and str(coupon_code).upper().startswith("EARNED_"):
        await db.users.update_one(
            {"_id": current_user["_id"], "earned_coupons.code": coupon_code},
            {"$set": {"earned_coupons.$.used": True}},
        )
    return {
        "success": True,
        "order_id": order_id,
        "total": order["total"],
        "payment_method": request.payment_method,
        "payment_status": order["payment_status"],
        "message": "Pay online to complete order." if request.payment_method == "online" else "Pay at store when you pick up.",
    }
