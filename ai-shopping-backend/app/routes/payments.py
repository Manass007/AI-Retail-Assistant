"""Razorpay: create order (for online payment), verify payment."""
import random
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.config import settings
from app.database import get_db
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/payments", tags=["Payments"])

# Earned coupon templates for home delivery: different %, category, validity
EARNED_COUPON_TEMPLATES = [
    {"discount_percent": 10, "category": None, "valid_days": 7, "label": "10% off your next order"},
    {"discount_percent": 15, "category": "Groceries", "valid_days": 15, "label": "15% off Groceries"},
    {"discount_percent": 20, "category": None, "valid_days": 30, "label": "20% off your next order"},
    {"discount_percent": 20, "category": "Electronics", "valid_days": 15, "label": "20% off Electronics"},
    {"discount_percent": 15, "category": "Dairy", "valid_days": 15, "label": "15% off Dairy"},
    {"discount_percent": 25, "category": "Fashion", "valid_days": 7, "label": "25% off Fashion"},
    {"discount_percent": 10, "category": "Sports", "valid_days": 30, "label": "10% off Sports"},
    {"discount_percent": 50, "category": None, "valid_days": 7, "label": "50% off (max $20) next order"},
]


class CreateRazorpayOrderRequest(BaseModel):
    order_id: str  # our order _id from POST /api/orders
    amount_usd: float  # order total in USD


class VerifyPaymentRequest(BaseModel):
    order_id: str
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str


@router.post("/create-order")
async def create_razorpay_order(
    request: CreateRazorpayOrderRequest,
    current_user=Depends(get_current_user),
):
    """Create Razorpay order for online payment. Returns razorpay_order_id and key for frontend Checkout."""
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.")
    db = get_db()
    order = await db.orders.find_one({"_id": request.order_id, "user_id": current_user["_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get("payment_method") != "online":
        raise HTTPException(status_code=400, detail="Order is not for online payment")
    if order.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Order already paid")
    amount_cents = int(round(request.amount_usd * 100))
    if amount_cents < 1:
        raise HTTPException(status_code=400, detail="Amount must be at least $0.01")
    import razorpay
    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    rz_order = client.order.create({
        "amount": amount_cents,
        "currency": "USD",
        "receipt": request.order_id,
    })
    await db.orders.update_one(
        {"_id": request.order_id},
        {"$set": {"razorpay_order_id": rz_order["id"]}},
    )
    return {
        "success": True,
        "razorpay_order_id": rz_order["id"],
        "amount": rz_order["amount"],
        "currency": rz_order["currency"],
        "key_id": settings.RAZORPAY_KEY_ID,
        "order_id": request.order_id,
    }


@router.post("/verify")
async def verify_payment(
    request: VerifyPaymentRequest,
    current_user=Depends(get_current_user),
):
    """Verify Razorpay signature and mark order as paid."""
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Razorpay not configured.")
    db = get_db()
    order = await db.orders.find_one({"_id": request.order_id, "user_id": current_user["_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    import razorpay
    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": request.razorpay_order_id,
            "razorpay_payment_id": request.razorpay_payment_id,
            "razorpay_signature": request.razorpay_signature,
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")
    await db.orders.update_one(
        {"_id": request.order_id},
        {"$set": {"payment_status": "paid", "razorpay_payment_id": request.razorpay_payment_id}},
    )

    # Home delivery (online payment, no store_id): grant earned coupon
    earned_coupon = None
    is_home_delivery = order.get("payment_method") == "online" and not order.get("store_id")
    if is_home_delivery:
        template = random.choice(EARNED_COUPON_TEMPLATES)
        valid_until = datetime.utcnow() + timedelta(days=template["valid_days"])
        valid_days_display = (
            "1 week" if template["valid_days"] == 7
            else "15 days" if template["valid_days"] == 15
            else "1 month"
        )
        code = f"EARNED_{secrets.token_hex(4).upper()}"
        earned_doc = {
            "code": code,
            "discount_percent": template["discount_percent"],
            "category": template.get("category"),
            "valid_until": valid_until,
            "valid_days_display": valid_days_display,
            "label": template.get("label", f"{template['discount_percent']}% off"),
            "used": False,
        }
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$push": {"earned_coupons": earned_doc}},
        )
        earned_coupon = {
            "code": code,
            "discount_percent": template["discount_percent"],
            "category": template.get("category"),
            "valid_until": valid_until.isoformat() if hasattr(valid_until, "isoformat") else str(valid_until),
            "valid_days_display": valid_days_display,
            "label": earned_doc["label"],
        }

    return {
        "success": True,
        "message": "Payment verified.",
        "order_id": request.order_id,
        "earned_coupon": earned_coupon,
    }
