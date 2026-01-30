from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.database import get_db
from app.services.email_service import email_service
from datetime import datetime, timedelta
import asyncio

async def migrate_old_cart_items():
    """
    Migrate cart items older than 15 days to wishlist
    Runs daily at 2 AM
    """
    print("🔄 Running cart migration job...")
    
    db = get_db()
    fifteen_days_ago = datetime.utcnow() - timedelta(days=15)
    
    # Find users with old cart items
    users = await db.users.find({
        "cart": {
            "$elemMatch": {
                "added_at": {"$lte": fifteen_days_ago},
                "migrated_to_wishlist": False
            }
        }
    }).to_list(length=1000)
    
    migrated_count = 0
    
    for user in users:
        cart = user.get("cart", [])
        wishlist = user.get("wishlist", [])
        
        updated_cart = []
        items_migrated = []
        
        for item in cart:
            if item["added_at"] <= fifteen_days_ago and not item.get("migrated_to_wishlist", False):
                # Add to wishlist
                wishlist.append({
                    "product_id": item["product_id"],
                    "migrated_from_cart": True,
                    "original_cart_date": item["added_at"],
                    "added_at": datetime.utcnow()
                })
                
                items_migrated.append(item["product_id"])
                migrated_count += 1
                
                # Mark as migrated in cart
                item["migrated_to_wishlist"] = True
            
            updated_cart.append(item)
        
        if items_migrated:
            # Update user
            await db.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "cart": updated_cart,
                        "wishlist": wishlist
                    }
                }
            )
            
            # Send email notification
            try:
                product = await db.products.find_one({"_id": items_migrated[0]})
                if product:
                    await email_service.send_cart_recovery_email(
                        email=user["email"],
                        name=user["name"],
                        product_name=product["name"]
                    )
            except Exception as e:
                print(f"Failed to send cart recovery email: {e}")
    
    print(f"✅ Migrated {migrated_count} cart items to wishlist")

def start_scheduler():
    """Start background job scheduler"""
    scheduler = AsyncIOScheduler()
    
    # Run daily at 2 AM
    scheduler.add_job(
        migrate_old_cart_items,
        'cron',
        hour=2,
        minute=0
    )
    
    # Also run immediately on startup (for testing)
    # scheduler.add_job(migrate_old_cart_items, 'date', run_date=datetime.now())
    
    scheduler.start()
    print("⏰ Scheduler started - Cart migration job scheduled")
    
    return scheduler