from app.database import get_db
from datetime import datetime
from typing import List, Dict, Optional
import random

class WatchlistComboService:
    """Service for generating watchlist-based combo suggestions with dynamic pricing"""
    
    @staticmethod
    async def generate_combo_suggestions(product_id: str, user_id: str, limit: int = 3) -> List[Dict]:
        """
        Generate combo suggestions for a product based on user's watchlist items.
        
        Args:
            product_id: The current product being viewed
            user_id: The user's ID
            limit: Maximum number of suggestions to return
            
        Returns:
            List of combo suggestion dictionaries
        """
        db = get_db()
        
        # Get current product
        current_product = await db.products.find_one({"_id": product_id})
        if not current_product:
            return []
        
        # Get user's watchlist
        user = await db.users.find_one({"_id": user_id})
        if not user:
            return []
        
        watchlist = user.get("wishlist", [])
        if not watchlist:
            return []
        
        # Filter watchlist items that came from cart
        watchlist_items = [item for item in watchlist if item.get("migrated_from_cart", False)]
        if not watchlist_items:
            return []
        
        # Get product details for watchlist items
        watchlist_products = []
        for item in watchlist_items:
            product = await db.products.find_one({"_id": item["product_id"]})
            if product and product.get("is_in_stock", True):
                watchlist_products.append({
                    "product": product,
                    "watchlist_item": item
                })
        
        if not watchlist_products:
            return []
        
        # Generate combo suggestions
        suggestions = []
        for watchlist_data in watchlist_products[:limit * 2]:  # Check more to find good matches
            watchlist_product = watchlist_data["product"]
            
            # Skip if same product
            if watchlist_product["_id"] == product_id:
                continue
            
            # Calculate combo pricing
            combo_data = await WatchlistComboService.calculate_dynamic_pricing(
                current_product, watchlist_product
            )
            
            if combo_data:
                suggestions.append({
                    "watchlist_product": watchlist_product,
                    "current_product": current_product,
                    **combo_data
                })
        
        # Sort by savings (highest first) and limit
        suggestions.sort(key=lambda x: x.get("savings", 0), reverse=True)
        return suggestions[:limit]
    
    @staticmethod
    async def calculate_dynamic_pricing(
        current_product: Dict, 
        watchlist_product: Dict
    ) -> Optional[Dict]:
        """
        Calculate dynamic pricing strategy for a combo.
        
        Args:
            current_product: The product being viewed
            watchlist_product: The product from watchlist
            
        Returns:
            Dictionary with pricing details or None if combo not viable
        """
        current_price = float(current_product.get("price", 0))
        watchlist_price = float(watchlist_product.get("price", 0))
        original_total = current_price + watchlist_price
        
        # Determine pricing strategy based on product values
        combo_type = None
        savings = 0
        savings_percent = 0
        combo_total = original_total
        message = ""
        value_add = None
        
        # High-value combo (both > $50)
        if current_price > 50 and watchlist_price > 50:
            savings_percent = random.randint(12, 15)
            savings = round(original_total * (savings_percent / 100.0), 2)
            combo_total = round(original_total - savings, 2)
            combo_type = "percentage"
            message = f"Premium combo - Save {savings_percent}%"
        
        # Mid-value combo ($20-$50 range)
        elif (20 <= current_price <= 50) or (20 <= watchlist_price <= 50):
            savings = random.choice([5, 6, 7, 8])
            combo_total = round(original_total - savings, 2)
            savings_percent = round((savings / original_total) * 100, 1)
            combo_type = "fixed"
            message = f"Complete the combo and save ${savings:.0f}"
        
        # Low-value combo (< $20)
        elif current_price < 20 or watchlist_price < 20:
            combo_type = "value_add"
            # Value-add messaging instead of discount
            value_add_options = [
                "Free shipping on combo",
                "Get bonus item with combo",
                "Extra value with combo purchase"
            ]
            value_add = random.choice(value_add_options)
            message = "Pair with your Watchlist items for extra value"
            # Small discount for low-value items too
            savings_percent = 5
            savings = round(original_total * 0.05, 2)
            combo_total = round(original_total - savings, 2)
        
        # Mixed categories - check if complementary
        current_category = current_product.get("category", "")
        watchlist_category = watchlist_product.get("category", "")
        
        if current_category != watchlist_category:
            # Complementary products - boost discount slightly
            if combo_type == "percentage":
                savings_percent = min(18, savings_percent + 2)
                savings = round(original_total * (savings_percent / 100.0), 2)
                combo_total = round(original_total - savings, 2)
                message = f"Frequently bought together - Save {savings_percent}%"
            elif combo_type == "fixed":
                savings = min(10, savings + 2)
                combo_total = round(original_total - savings, 2)
                savings_percent = round((savings / original_total) * 100, 1)
                message = f"Perfect combo - Save ${savings:.0f}"
        
        return {
            "combo_type": combo_type,
            "original_total": round(original_total, 2),
            "combo_total": combo_total,
            "savings": savings,
            "savings_percent": savings_percent,
            "message": message,
            "value_add": value_add
        }
    
    @staticmethod
    async def get_combo_suggestions_for_cart(user_id: str, limit: int = 3) -> List[Dict]:
        """
        Get combo suggestions based on items currently in cart.
        
        Args:
            user_id: The user's ID
            limit: Maximum number of suggestions
            
        Returns:
            List of combo suggestions
        """
        db = get_db()
        user = await db.users.find_one({"_id": user_id})
        if not user:
            return []
        
        cart = user.get("cart", [])
        watchlist = user.get("wishlist", [])
        
        # Filter watchlist items from cart
        watchlist_items = [item for item in watchlist if item.get("migrated_from_cart", False)]
        if not watchlist_items or not cart:
            return []
        
        # Get cart products
        cart_products = []
        for item in cart:
            product = await db.products.find_one({"_id": item["product_id"]})
            if product:
                cart_products.append(product)
        
        if not cart_products:
            return []
        
        # Generate suggestions for each cart item
        all_suggestions = []
        for cart_product in cart_products[:2]:  # Limit to first 2 cart items
            for watchlist_item in watchlist_items[:limit]:
                watchlist_product = await db.products.find_one({"_id": watchlist_item["product_id"]})
                if watchlist_product and watchlist_product.get("is_in_stock", True):
                    combo_data = await WatchlistComboService.calculate_dynamic_pricing(
                        cart_product, watchlist_product
                    )
                    if combo_data:
                        all_suggestions.append({
                            "watchlist_product": watchlist_product,
                            "current_product": cart_product,
                            **combo_data
                        })
        
        # Sort and limit
        all_suggestions.sort(key=lambda x: x.get("savings", 0), reverse=True)
        return all_suggestions[:limit]
    
    @staticmethod
    async def get_combo_suggestions_for_checkout(user_id: str, limit: int = 2) -> List[Dict]:
        """
        Get non-intrusive combo suggestions for checkout page.
        
        Args:
            user_id: The user's ID
            limit: Maximum number of suggestions (fewer for checkout)
            
        Returns:
            List of combo suggestions
        """
        # Similar to cart but with fewer suggestions
        return await WatchlistComboService.get_combo_suggestions_for_cart(user_id, limit)

watchlist_combo_service = WatchlistComboService()
