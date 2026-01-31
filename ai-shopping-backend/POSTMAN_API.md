# Postman API Reference

**Base URL:** `http://localhost:5000`  
Use **Authorization: Bearer \<token\>** for endpoints marked "Auth: Bearer".

---

## 1. No auth (test first)

### GET /

**Request:** No body.

**Example response:**
```json
{
  "success": true,
  "message": "AI Shopping Assistant API",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth/*",
    "products": "/api/products",
    "cart": "/api/cart",
    "recommendations": "/api/recommendations",
    "gamification": "/api/gamification"
  }
}
```

### GET /health

**Request:** No body.

**Example response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-31T12:00:00.000000"
}
```

---

## 2. Auth (no token)

### POST /api/auth/send-otp

**Request body:**
```json
{
  "email": "user@example.com"
}
```

**Example response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email",
  "isNewUser": true,
  "email": "user@example.com",
  "otp": "123456"
}
```

### POST /api/auth/verify-otp

**Request body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Example response (new user):**
```json
{
  "success": true,
  "message": "OTP verified. Complete your profile with PUT /api/auth/profile or POST /api/auth/register.",
  "isNewUser": true,
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_1234567890.123",
    "email": "user@example.com",
    "name": "",
    "phone": "",
    "onboarded": false,
    "subscription": { "plan": "free", "status": "active", "isPremium": false }
  }
}
```

**Example response (existing user):**
```json
{
  "success": true,
  "message": "Login successful",
  "isNewUser": false,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "onboarded": true,
    "subscription": { "plan": "free", "status": "active", "isPremium": false }
  }
}
```

Copy the `token` and set **Authorization → Bearer Token** in Postman for protected routes.

### POST /api/auth/register

Call after verify-otp for new user (OTP must be verified). If user was created by verify-otp, this completes profile and returns token.

**Request body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "dob": "1990-01-01",
  "preferences": {
    "categories": ["Electronics", "Fashion"],
    "budget": "mid"
  }
}
```

**Example response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "preferences": { "categories": ["Electronics", "Fashion"], "budget": "mid" },
    "onboarded": true,
    "subscription": { "plan": "free", "status": "active", "isPremium": false }
  }
}
```

---

## 3. Auth (Bearer token required)

### GET /api/auth/me

**Request:** No body. Header: `Authorization: Bearer <token>`.

**Example response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "dob": "1990-01-01",
    "preferences": { "categories": [], "budget": "mid" },
    "onboarded": true,
    "lastLogin": "2025-01-31T12:00:00.000000",
    "createdAt": "2025-01-31T10:00:00.000000",
    "subscription": {
      "plan": "free",
      "status": "active",
      "startDate": null,
      "endDate": null,
      "isPremium": false
    }
  }
}
```

### PUT /api/auth/profile

**Request body (all fields optional):**
```json
{
  "name": "Jane Doe",
  "phone": "+9876543210",
  "dob": "1995-05-15",
  "preferences": {
    "categories": ["Electronics"],
    "budget": "high"
  }
}
```

**Example response:** Same shape as GET /api/auth/me with updated user.

---

## 4. Products (no auth unless noted)

**Test product IDs from GET /api/products:** `prod_1` … `prod_20` (e.g. `prod_19` USB-C Cable, `prod_11` Sunglasses, `prod_5` Coffee Maker, `prod_2` Smart Watch). Categories: `Electronics`, `Fashion`, `Home`, `Sports`, `Office`.

### GET /api/products

**Request:** No body. Query params (all optional): `category`, `min_price`, `max_price`, `search`, `in_stock`, `sort_by`, `sort_order`, `page`, `limit`.

Examples:
- `GET http://localhost:5000/api/products`
- `GET http://localhost:5000/api/products?category=Electronics&page=1&limit=10`
- `GET http://localhost:5000/api/products?search=coffee&min_price=50&max_price=200`

**Example response (matches live API):**
```json
{
  "success": true,
  "products": [
    {
      "_id": "prod_19",
      "name": "USB-C Cable",
      "category": "Electronics",
      "price": 12.99,
      "brand": "ChargeFast",
      "image_url": "https://images.unsplash.com/photo-1591290619762-9b2c0601e5b3",
      "description": "Fast charging USB-C cable 6ft",
      "tags": ["charging", "cable", "tech"],
      "stock_quantity": 200,
      "is_in_stock": true,
      "popularity_score": 68.9,
      "created_at": "2026-01-30T20:36:32.755000"
    },
    {
      "_id": "prod_11",
      "name": "Sunglasses",
      "category": "Fashion",
      "price": 89.99,
      "brand": "StyleShades",
      "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f",
      "description": "UV protection polarized sunglasses",
      "tags": ["fashion", "accessories", "outdoor"],
      "stock_quantity": 70,
      "is_in_stock": true,
      "popularity_score": 64.8,
      "created_at": "2026-01-30T20:36:32.755000"
    },
    {
      "_id": "prod_5",
      "name": "Coffee Maker",
      "category": "Home",
      "price": 129.99,
      "brand": "BrewMaster",
      "image_url": "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6",
      "description": "Programmable coffee maker with thermal carafe",
      "tags": ["kitchen", "coffee", "appliance"],
      "stock_quantity": 40,
      "is_in_stock": true,
      "popularity_score": 71.2,
      "created_at": "2026-01-30T20:36:32.755000"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 20,
    "pages": 1
  }
}
```

### GET /api/products/{product_id}

**Request:** No body. Use a real `_id` from GET /api/products (e.g. `prod_19`, `prod_11`, `prod_5`).

Example: `GET http://localhost:5000/api/products/prod_19`

**Example response:**
```json
{
  "success": true,
  "product": {
    "_id": "prod_19",
    "name": "USB-C Cable",
    "category": "Electronics",
    "price": 12.99,
    "brand": "ChargeFast",
    "image_url": "https://images.unsplash.com/photo-1591290619762-9b2c0601e5b3",
    "description": "Fast charging USB-C cable 6ft",
    "tags": ["charging", "cable", "tech"],
    "stock_quantity": 200,
    "is_in_stock": true,
    "popularity_score": 68.9,
    "created_at": "2026-01-30T20:36:32.755000"
  }
}
```

### GET /api/products/category/{category}

**Request:** No body. Query: `limit` (optional, default 20). Use real categories: `Electronics`, `Fashion`, `Home`, `Sports`, `Office`.

Examples:
- `GET http://localhost:5000/api/products/category/Electronics?limit=10`
- `GET http://localhost:5000/api/products/category/Home?limit=5`

**Example response:**
```json
{
  "success": true,
  "category": "Electronics",
  "products": [
    {
      "_id": "prod_19",
      "name": "USB-C Cable",
      "category": "Electronics",
      "price": 12.99,
      "brand": "ChargeFast",
      "image_url": "https://images.unsplash.com/photo-1591290619762-9b2c0601e5b3",
      "description": "Fast charging USB-C cable 6ft",
      "tags": ["charging", "cable", "tech"],
      "stock_quantity": 200,
      "is_in_stock": true,
      "popularity_score": 68.9,
      "created_at": "2026-01-30T20:36:32.755000"
    }
  ]
}
```

### POST /api/products/notify-me

**Request:** No body. Query: `product_id`, `user_id`. Use real product ID (e.g. `prod_19`) and your user `id` from GET /api/auth/me.

Example: `POST http://localhost:5000/api/products/notify-me?product_id=prod_19&user_id=user_1234567890.123`

**Example response:**
```json
{
  "success": true,
  "message": "You will be notified when the product is back in stock"
}
```

---

## 5. Cart (all require Bearer token)

Use real product IDs: e.g. `prod_19`, `prod_11`, `prod_5`, `prod_2` (from GET /api/products).

### GET /api/cart

**Request:** No body. Header: `Authorization: Bearer <token>`.

**Example response:**
```json
{
  "success": true,
  "cart": [
    {
      "product": {
        "_id": "prod_19",
        "name": "USB-C Cable",
        "category": "Electronics",
        "price": 12.99,
        "brand": "ChargeFast",
        "image_url": "https://images.unsplash.com/photo-1591290619762-9b2c0601e5b3",
        "description": "Fast charging USB-C cable 6ft",
        "tags": ["charging", "cable", "tech"],
        "stock_quantity": 200,
        "is_in_stock": true,
        "popularity_score": 68.9,
        "created_at": "2026-01-30T20:36:32.755000"
      },
      "quantity": 2,
      "added_at": "2026-01-30T20:36:32.755000",
      "days_in_cart": 0,
      "migrated_to_wishlist": false
    }
  ],
  "total_items": 1,
  "total_amount": 25.98
}
```

### POST /api/cart/add

**Request body (use real product_id from GET /api/products):**
```json
{
  "product_id": "prod_19",
  "quantity": 1
}
```

Other examples: `{"product_id": "prod_11", "quantity": 2}`, `{"product_id": "prod_5", "quantity": 1}`.

**Example response:**
```json
{
  "success": true,
  "message": "Product added to cart",
  "cart": [
    {
      "product_id": "prod_19",
      "quantity": 1,
      "added_at": "2026-01-30T20:36:32.755000",
      "migrated_to_wishlist": false
    }
  ]
}
```

### PUT /api/cart/{product_id}

**Request body:**
```json
{
  "quantity": 3
}
```

Example: `PUT http://localhost:5000/api/cart/prod_19` (use a product_id that is already in your cart).

### DELETE /api/cart/{product_id}

**Request:** No body. Example: `DELETE http://localhost:5000/api/cart/prod_19`

### GET /api/cart/recovery

**Request:** No body. Returns abandoned cart info.

### POST /api/cart/clear

**Request:** No body. Clears the cart.

---

## 6. Recommendations

Use real product IDs (e.g. `prod_19`, `prod_11`, `prod_5`) for track-view and similar.

### GET /api/recommendations

**Request:** No body. Query: `limit` (optional, default 10). Auth optional (works without token as trending).

Example: `GET http://localhost:5000/api/recommendations?limit=10`

**Example response:**
```json
{
  "success": true,
  "products": [
    {
      "_id": "prod_2",
      "name": "Smart Watch",
      "category": "Electronics",
      "price": 199.99,
      "brand": "FitTech",
      "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
      "description": "Advanced fitness tracking smartwatch",
      "tags": ["fitness", "tech", "wearable"],
      "stock_quantity": 30,
      "is_in_stock": true,
      "popularity_score": 92.3,
      "created_at": "2026-01-30T20:36:32.755000"
    }
  ],
  "reason": "Based on your interests: Electronics"
}
```

### POST /api/recommendations/track-view

**Request:** No body. Query: `product_id`. Use a real product ID (e.g. `prod_19`, `prod_11`). Auth optional (with token, view is tied to user).

Example: `POST http://localhost:5000/api/recommendations/track-view?product_id=prod_19`

**Example response:**
```json
{
  "success": true,
  "message": "View tracked successfully"
}
```

### GET /api/recommendations/similar/{product_id}

**Request:** No body. Query: `limit` (optional, default 6). Use a real product_id (e.g. `prod_19`).

Example: `GET http://localhost:5000/api/recommendations/similar/prod_19?limit=6`

**Example response:**
```json
{
  "success": true,
  "products": [
    {
      "_id": "prod_16",
      "name": "Phone Case",
      "category": "Electronics",
      "price": 14.99,
      "brand": "CasePro",
      "image_url": "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb",
      "description": "Protective phone case with grip",
      "tags": ["phone", "accessories", "protection"],
      "stock_quantity": 150,
      "is_in_stock": true,
      "popularity_score": 72.4,
      "created_at": "2026-01-30T20:36:32.755000"
    }
  ]
}
```

---

## 7. Gamification (all require Bearer token)

### POST /api/gamification/spin-wheel

**Request:** No body. Once per month per user.

**Example response:**
```json
{
  "success": true,
  "coupon": {
    "discount": 10,
    "label": "10% OFF",
    "code": "SPIN1234",
    "expires_at": "2025-02-28T12:00:00.000000"
  },
  "message": "Congratulations! You won 10% off!"
}
```

### GET /api/gamification/my-coupons

**Request:** No body.

**Example response:**
```json
{
  "success": true,
  "coupons": [
    {
      "_id": "...",
      "user_id": "user_123",
      "code": "SPIN1234",
      "discount_percent": 10,
      "used": false,
      "expires_at": "2025-02-28T12:00:00.000000"
    }
  ],
  "count": 1
}
```

### POST /api/gamification/use-coupon/{code}

**Request:** No body. Replace `{code}` with coupon code (e.g. SPIN1234).  
Example: `POST http://localhost:5000/api/gamification/use-coupon/SPIN1234`

### GET /api/gamification/can-spin

**Request:** No body.

**Example response:**
```json
{
  "success": true,
  "canSpin": true,
  "daysUntilNextSpin": 0
}
```

---

## 8. Orders (Bearer token required)

### GET /api/orders/history

**Request:** No body. Returns last ordered items and frequently ordered products (for quick-add in chat).

**Example response:**
```json
{
  "success": true,
  "last_ordered": [
    { "product_id": "prod_g1", "quantity": 2, "price": 2.99, "product": { "_id": "prod_g1", "name": "Milk", "category": "Dairy", "price": 2.99 } }
  ],
  "frequently_ordered": [
    { "product_id": "prod_g1", "order_count": 3, "product": { "_id": "prod_g1", "name": "Milk" } }
  ]
}
```

### POST /api/orders

**Request body:** Create order from current cart. Choose payment: pay at store (pickup) or online (Razorpay).
```json
{
  "payment_method": "pay_at_store",
  "store_id": "store_1"
}
```
For online payment: `"payment_method": "online"`, `store_id` optional. For pickup: pass `store_id` from GET /api/stores/pickup.

**Example response:**
```json
{
  "success": true,
  "order_id": "ord_1234567890.123",
  "total": 25.98,
  "payment_method": "pay_at_store",
  "payment_status": "pay_at_store",
  "message": "Pay at store when you pick up."
}
```
If `payment_method` is `online`, call POST /api/payments/create-order with this `order_id` and `amount_rupees` next.

---

## 9. Pickup stores (no auth)

### GET /api/stores/pickup

**Request:** No body. Query (optional): `city`, `pincode`.

Example: `GET http://localhost:5000/api/stores/pickup?city=Downtown`

**Example response:**
```json
{
  "success": true,
  "stores": [
    { "_id": "store_1", "name": "QuickPick Downtown", "address": "123 Main St", "city": "Downtown", "pincode": "10001", "is_active": true }
  ]
}
```

---

## 10. Bundles (no auth)

### GET /api/bundles

**Request:** No body. List all bundles (e.g. perfume + trimmer 20% off).

**Example response:**
```json
{
  "success": true,
  "bundles": [
    {
      "_id": "bundle_1",
      "name": "Perfume + Trimmer Combo",
      "description": "Buy perfume with trimmer and get 20% off total.",
      "products": [ { "_id": "prod_p1", "name": "Men's Perfume", "price": 40 }, { "_id": "prod_p2", "name": "Electric Trimmer", "price": 50 } ],
      "discount_percent": 20,
      "total_original": 90,
      "total_after_discount": 72
    }
  ]
}
```

### GET /api/bundles/product/{product_id}

**Request:** No body. Bundles that include this product (for budget / upsell).  
Example: `GET http://localhost:5000/api/bundles/product/prod_p1`

---

## 11. Payments – Razorpay (Bearer token required)

Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env` for demo.

### POST /api/payments/create-order

**Request body:** Create Razorpay order for an existing order (from POST /api/orders with payment_method=online).
```json
{
  "order_id": "ord_1234567890.123",
  "amount_rupees": 25.98
}
```
Amount in INR (Razorpay demo). Returns `razorpay_order_id` and `key_id` for frontend Checkout.

**Example response:**
```json
{
  "success": true,
  "razorpay_order_id": "order_xxx",
  "amount": 2598,
  "currency": "INR",
  "key_id": "rzp_test_xxx",
  "order_id": "ord_1234567890.123"
}
```

### POST /api/payments/verify

**Request body:** After user pays, verify signature and mark order paid.
```json
{
  "order_id": "ord_1234567890.123",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_order_id": "order_xxx",
  "razorpay_signature": "xxx"
}
```

---

## 12. Chat / Assistant (Bearer token required)

### POST /api/chat

**Request body:** Natural-language message. Supports: urgent groceries (milk, wheat flour, muesli), quick-add from last/frequently ordered, bundle offers for budget.
```json
{
  "message": "Hey I am in a hurry and need some groceries - milk, wheat flour, muesli. Need to pick up from nearby store.",
  "conversation_history": []
}
```
Other examples: "Show my last ordered items", "I want perfume but it's expensive" (triggers bundle offer).

**Example response:**
```json
{
  "success": true,
  "reply": "We have milk, wheat flour, and muesli ready for you! Add them to cart and choose pay at store when you pick up from QuickPick.",
  "quick_add_products": [
    { "_id": "prod_g1", "name": "Milk", "category": "Dairy", "price": 2.99 },
    { "_id": "prod_g2", "name": "Wheat Flour", "category": "Staples", "price": 3.49 },
    { "_id": "prod_g3", "name": "Muesli", "category": "Groceries", "price": 5.99 }
  ],
  "last_ordered": [ ... ],
  "frequently_ordered": [ ... ],
  "pickup_stores": [ { "_id": "store_1", "name": "QuickPick Downtown", "address": "123 Main St", "city": "Downtown" } ],
  "bundle_offers": [ ... ]
}
```
Use `quick_add_products` to show "Add to cart" buttons; use `pickup_stores` for store selection; use `bundle_offers` for discount combos.

---

## Quick test order (using real data)

1. **GET** `http://localhost:5000/` → 200, JSON with `endpoints`.
2. **POST** `http://localhost:5000/api/auth/send-otp` with `{"email":"test@example.com"}`.
3. **POST** `http://localhost:5000/api/auth/verify-otp` with same email + OTP from response (or email) → copy `token`.
4. Set **Authorization** → Bearer Token → paste `token`.
5. **GET** `http://localhost:5000/api/auth/me` → 200, user object.
6. **GET** `http://localhost:5000/api/products` → 200, list of 20 products (`prod_1` … `prod_20`).
7. **POST** `http://localhost:5000/api/cart/add` with `{"product_id":"prod_19","quantity":1}` (or `prod_11`, `prod_5`, etc.).
8. **GET** `http://localhost:5000/api/cart` → 200, cart with items.
9. **GET** `http://localhost:5000/api/products/prod_19` → 200, single product.
10. **GET** `http://localhost:5000/api/products/category/Electronics` → 200, products in that category.
11. **POST** `http://localhost:5000/api/recommendations/track-view?product_id=prod_19` → 200 (optional: with Bearer).
12. **GET** `http://localhost:5000/api/recommendations/similar/prod_19` → 200, similar products.
13. **POST** `http://localhost:5000/api/gamification/spin-wheel` → 200 (Bearer; once per month).
14. **GET** `http://localhost:5000/api/gamification/my-coupons` → 200 (Bearer).
15. **GET** `http://localhost:5000/api/orders/history` → 200 (last_ordered, frequently_ordered).
16. **GET** `http://localhost:5000/api/stores/pickup` → 200 (pickup stores).
17. **GET** `http://localhost:5000/api/bundles` → 200 (bundle offers).
18. **POST** `http://localhost:5000/api/chat` with `{"message":"I need milk, wheat flour and muesli for pickup"}` → 200 (reply + quick_add_products + pickup_stores).
19. **POST** `http://localhost:5000/api/orders` with `{"payment_method":"pay_at_store","store_id":"store_1"}` → 200 (order created; cart cleared).

Ensure the backend is running (`uvicorn app.main:app --reload --port 5000`) and the DB is seeded (`python seed_data.py`). Re-run seed to get groceries (prod_g1–prod_g10), perfume/trimmer (prod_p1, prod_p2), pickup stores, bundles, and sample orders. Product IDs: `prod_1` … `prod_20`, `prod_g1` … `prod_g10`, `prod_p1`, `prod_p2`. Categories include `Electronics`, `Fashion`, `Home`, `Sports`, `Office`, `Dairy`, `Groceries`, `Staples`, `Personal Care`.
