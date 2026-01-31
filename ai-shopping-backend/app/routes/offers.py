"""Offers: active promo codes, festive and seasonal offers, birthday eligibility."""
from fastapi import APIRouter, Depends
from app.database import get_db
from app.middleware.auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/offers", tags=["Offers"])


def _is_festive_season():
    """Dec 15 - Dec 31: Christmas / winter festive."""
    now = datetime.utcnow()
    return (now.month == 12 and now.day >= 15) or (now.month == 1 and now.day <= 5)


def _is_birthday_month(user_dob):
    """True if current month is user's birthday month."""
    if not user_dob:
        return False
    try:
        return getattr(user_dob, "month", None) == datetime.utcnow().month
    except Exception:
        return False


@router.get("")
async def list_offers(current_user=Depends(get_current_user)):
    """Active offers: festive (Dec 15–31), birthday (if DOB set), and general promo codes."""
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})
    user_dob = user.get("dob")

    now = datetime.utcnow()
    offers = []

    # Festive: 15 Dec - 31 Dec
    if _is_festive_season():
        offers.append({
            "id": "festive_winter",
            "name": "Christmas & Winter Festive Offer",
            "description": "Special discounts from 15 Dec to 31 Dec. Use code WINTER20 at checkout.",
            "code": "WINTER20",
            "discount_percent": 20,
            "min_order": 0,
            "valid_until": f"{now.year}-12-31",
            "type": "festive",
        })

    seen_codes = set()

    # Birthday (only if user has DOB and current month is birthday month)
    if _is_birthday_month(user_dob):
        offers.append({
            "id": "birthday",
            "name": "Birthday Special",
            "description": "Happy birthday! Use code BDAY10 for 10% off.",
            "code": "BDAY10",
            "discount_percent": 10,
            "min_order": 0,
            "valid_until": now.replace(day=28).strftime("%Y-%m-%d"),
            "type": "birthday",
        })
        seen_codes.add("BDAY10")

    # Global promo codes from collection (skip BDAY10 if already added)
    cursor = db.promo_codes.find({
        "valid_from": {"$lte": now},
        "valid_until": {"$gte": now},
        "is_active": True,
    })
    promos = await cursor.to_list(length=20)
    for p in promos:
        code = (p.get("code") or "").strip().upper()
        if code in seen_codes:
            continue
        seen_codes.add(code)
        offers.append({
            "id": p.get("_id"),
            "name": p.get("name", p.get("code", "")),
            "description": p.get("description", ""),
            "code": code,
            "discount_percent": p.get("discount_percent", 0),
            "min_order": p.get("min_order", 0),
            "valid_until": p.get("valid_until").strftime("%Y-%m-%d") if hasattr(p.get("valid_until"), "strftime") else str(p.get("valid_until", "")),
            "type": p.get("type", "general"),
        })

    # User's earned coupons (home delivery reward): only unused and still valid
    earned_coupons = []
    now = datetime.utcnow()
    for ec in user.get("earned_coupons") or []:
        if ec.get("used"):
            continue
        valid_until = ec.get("valid_until")
        if not valid_until:
            continue
        try:
            if hasattr(valid_until, "replace") and valid_until.replace(tzinfo=None) < now:
                continue
        except Exception:
            continue
        earned_coupons.append({
            "id": ec.get("code"),
            "name": ec.get("label", f"{ec.get('discount_percent', 0)}% off"),
            "description": f"Valid for {ec.get('valid_days_display', '1 month')}. Use at checkout.",
            "code": ec.get("code"),
            "discount_percent": ec.get("discount_percent", 0),
            "category": ec.get("category"),
            "valid_days_display": ec.get("valid_days_display", "1 month"),
            "type": "earned",
        })

    return {"success": True, "offers": offers, "earned_coupons": earned_coupons}
