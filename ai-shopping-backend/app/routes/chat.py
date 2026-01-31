"""Chat / assistant: urgent groceries, quick-add from history, bundle offers."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.database import get_db
from app.middleware.auth import get_current_user
from app.services.openai_service import openai_service
from typing import List, Dict, Optional
from datetime import datetime, date

router = APIRouter(prefix="/api/chat", tags=["Chat / Assistant"])


# Keyword -> product_id for quick-add (all categories: groceries, fashion, sports, etc.)
QUICK_ADD_KEYWORDS = {
    "milk": "prod_g1",
    "wheat flour": "prod_g2",
    "flour": "prod_g2",
    "muesli": "prod_g3",
    "musile": "prod_g3",
    "butter": "prod_g4",
    "rice": "prod_g5",
    "eggs": "prod_g6",
    "bread": "prod_g7",
    "yogurt": "prod_g8",
    "olive oil": "prod_g9",
    "honey": "prod_g10",
    "breakfast": "prod_g3",  # muesli
    "cuisine": "prod_g4",   # butter
    "cuisines": "prod_g4",
    "dishes": "prod_g6",    # eggs
    "ingredients": "prod_g8",
    "perfume": "prod_p1",
    "trimmer": "prod_p2",
    "shoes": "prod_3",
    "running shoes": "prod_3",
    "backpack": "prod_6",
    "sunglasses": "prod_11",
    "fashion": "prod_6",
    "sports": "prod_3",
}


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None


@router.post("")
async def chat(
    request: ChatRequest,
    current_user=Depends(get_current_user),
):
    """
    Assistant chat: supports urgent groceries (milk, wheat flour, muesli),
    quick-add from last/frequently ordered, and bundle offers for budget.
    Returns reply + quick_add_products, last_ordered, frequently_ordered, pickup_stores, bundle_offers.
    """
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})
    cart = user.get("cart", [])

    # Last ordered & frequently ordered
    orders = (
        await db.orders.find({"user_id": current_user["_id"], "payment_status": "paid"})
        .sort("created_at", -1)
        .limit(20)
        .to_list(length=20)
    )
    last_items = []
    product_count = {}
    for o in orders[:5]:
        for item in o.get("items", []):
            pid = item.get("product_id")
            last_items.append({"product_id": pid, "quantity": item.get("quantity", 1), "order_id": o["_id"]})
            product_count[pid] = product_count.get(pid, 0) + item.get("quantity", 1)
    for o in orders[5:]:
        for item in o.get("items", []):
            pid = item.get("product_id")
            product_count[pid] = product_count.get(pid, 0) + item.get("quantity", 1)
    freq_ids = [pid for pid, _ in sorted(product_count.items(), key=lambda x: -x[1])[:15]]
    last_ids = list({i["product_id"] for i in last_items})
    all_order_ids = list(set(last_ids) | set(freq_ids))
    order_products = await db.products.find({"_id": {"$in": all_order_ids}}).to_list(length=len(all_order_ids)) if all_order_ids else []
    order_product_map = {p["_id"]: p for p in order_products}
    last_ordered = [{"product_id": i["product_id"], "quantity": i["quantity"], "product": order_product_map.get(i["product_id"])} for i in last_items[:10]]
    frequently_ordered = [{"product_id": pid, "order_count": product_count[pid], "product": order_product_map.get(pid)} for pid in freq_ids[:10]]

    # Pickup stores
    stores = await db.pickup_stores.find({"is_active": True}).to_list(length=20)

    # Bundles
    bundles_cursor = await db.product_bundles.find({}).to_list(length=20)
    bundle_offers = []
    for b in bundles_cursor:
        pids = b.get("product_ids", [])
        products = await db.products.find({"_id": {"$in": pids}}).to_list(length=len(pids))
        total_orig = sum(float(p.get("price", 0)) for p in products)
        disc = b.get("discount_percent", 0) / 100.0
        total_after = round(total_orig * (1 - disc), 2)
        bundle_offers.append({
            "_id": b["_id"],
            "name": b.get("name"),
            "description": b.get("description"),
            "products": products,
            "discount_percent": b.get("discount_percent"),
            "total_original": round(total_orig, 2),
            "total_after_discount": total_after,
        })

    # Catalog summary for AI (all categories: Electronics, Fashion, Sports, Home, Groceries, etc.)
    all_products = await db.products.find({}).sort("popularity_score", -1).limit(80).to_list(length=80)
    catalog_lines = [f"{p['_id']}: {p.get('name')} ({p.get('category')})" for p in all_products]
    catalog_summary = "; ".join(catalog_lines[:60]) if catalog_lines else "No products."
    last_ordered_summary = ", ".join([order_product_map.get(i["product_id"], {}).get("name", i["product_id"]) for i in last_ordered[:5]]) or "None"
    frequently_ordered_summary = ", ".join([order_product_map.get(f["product_id"], {}).get("name", f["product_id"]) for f in frequently_ordered[:5]]) or "None"
    bundle_summary = "; ".join([f"{b['name']}: {b['discount_percent']}% off, total {b['total_after_discount']}" for b in bundle_offers]) or "None"

    # Keyword match for quick-add
    msg_lower = request.message.lower()
    matched_ids = []
    for kw, pid in QUICK_ADD_KEYWORDS.items():
        if kw in msg_lower and pid not in matched_ids:
            matched_ids.append(pid)

    # Search products by message (name, description, tags, category) for any category e.g. shoes, fashion
    search_terms = [s.strip() for s in msg_lower.replace("?", "").replace(".", "").split() if len(s.strip()) > 2]
    suggested_products = []
    if search_terms:
        regex_ors = []
        for t in search_terms:
            regex_ors.extend([
                {"name": {"$regex": t, "$options": "i"}},
                {"description": {"$regex": t, "$options": "i"}},
                {"category": {"$regex": t, "$options": "i"}},
                {"tags": {"$regex": t, "$options": "i"}},
            ])
        if regex_ors:
            search_cursor = await db.products.find({"$or": regex_ors}).limit(8).to_list(length=8)
            suggested_products = [p for p in search_cursor if p.get("is_in_stock", True)][:8]

    quick_add_products = []
    if matched_ids:
        quick_add_products = await db.products.find({"_id": {"$in": matched_ids}}).to_list(length=len(matched_ids))

    # For food/breakfast/cuisine queries, prefer keyword-matched grocery products over generic search
    food_terms = {"breakfast", "cuisine", "cuisines", "dishes", "muesli", "butter", "eggs", "yogurt", "ingredients", "meal"}
    is_food_query = any(t in msg_lower for t in food_terms)
    if is_food_query and quick_add_products:
        display_products = quick_add_products
    else:
        display_products = suggested_products if suggested_products else quick_add_products
    product_names_for_ai = ", ".join([p.get("name", "") for p in display_products[:6]]) or "None"

    # If user says "yes add to cart" (or similar) and we have bundle offers, add first bundle to cart
    added_to_cart = False
    added_bundle = None
    if bundle_offers and len(bundle_offers) > 0:
        if any(w in msg_lower for w in ("yes", "add", "please")) and any(w in msg_lower for w in ("add", "cart")):
            bundle = bundle_offers[0]
            pids = [p.get("_id") for p in bundle.get("products", []) if p.get("_id")]
            if pids:
                user_cart = user.get("cart", [])
                for pid in pids:
                    if not pid:
                        continue
                    existing = next((x for x in user_cart if x.get("product_id") == pid), None)
                    if existing:
                        existing["quantity"] = existing.get("quantity", 1) + 1
                    else:
                        user_cart.append({"product_id": pid, "quantity": 1, "added_at": datetime.utcnow(), "migrated_to_wishlist": False})
                await db.users.update_one({"_id": current_user["_id"]}, {"$set": {"cart": user_cart}})
                added_to_cart = True
                added_bundle = bundle.get("name", "Bundle")

    # AI reply (all categories: Electronics, Fashion, Sports, Home, Groceries, etc.)
    reply = await openai_service.chat_assistant_engaged(
        user_message=request.message,
        catalog_summary=catalog_summary,
        last_ordered_summary=last_ordered_summary,
        frequently_ordered_summary=frequently_ordered_summary,
        bundle_summary=bundle_summary,
        suggested_product_names=product_names_for_ai,
        conversation_history=request.conversation_history or [],
    )

    # Points system: Award 3 points per prompt, max 12 points per day (4 prompts)
    now = datetime.utcnow()
    today = now.date()
    
    # Get user's current points data
    user_points = user.get("points", 0)
    last_prompt_date = user.get("last_prompt_date")
    daily_prompt_count = user.get("daily_prompt_count", 0)
    suggested_products_today = user.get("suggested_products_today", [])
    
    # Reset daily count if it's a new day
    if last_prompt_date:
        last_prompt_date_obj = last_prompt_date.date() if isinstance(last_prompt_date, datetime) else last_prompt_date
        if last_prompt_date_obj < today:
            daily_prompt_count = 0
            suggested_products_today = []
    
    # Award points for prompt (max 4 prompts = 12 points per day)
    points_awarded = 0
    if daily_prompt_count < 4:
        points_awarded = 3
        user_points += points_awarded
        daily_prompt_count += 1
    
    # Track suggested products for today (for purchase bonus)
    suggested_product_ids = [p.get("_id") for p in display_products if p.get("_id")]
    for pid in suggested_product_ids:
        if pid not in suggested_products_today:
            suggested_products_today.append(pid)
    
    # Update user with points and tracking data
    update_data = {
        "points": user_points,
        "daily_prompt_count": daily_prompt_count,
        "last_prompt_date": now,
        "suggested_products_today": suggested_products_today[:20]  # Limit to 20 products
    }
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data}
    )

    return {
        "success": True,
        "reply": reply,
        "quick_add_products": display_products,
        "last_ordered": last_ordered,
        "frequently_ordered": frequently_ordered,
        "pickup_stores": stores,
        "bundle_offers": bundle_offers,
        "added_to_cart": added_to_cart,
        "added_bundle": added_bundle,
        "points_awarded": points_awarded,
        "daily_prompts_remaining": max(0, 4 - daily_prompt_count),
    }
