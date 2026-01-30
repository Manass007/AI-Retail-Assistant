# Postman API Reference

**Base URL:** `http://localhost:5000`

---

## 1. No auth (test first)

| Method | URL | Description |
|--------|-----|-------------|
| GET | `http://localhost:5000/` | API info & endpoint list |
| GET | `http://localhost:5000/health` | Health check |

---

## 2. Get a token (Auth flow)

Protected routes need **Authorization: Bearer \<token\>**.

### Step 1 – Send OTP

- **Method:** POST  
- **URL:** `http://localhost:5000/api/auth/send-otp`  
- **Headers:** `Content-Type: application/json`  
- **Body (raw JSON):**
```json
{
  "email": "your@email.com"
}
```
- **Note:** Response may include `otp` for testing; check email if ENABLE_EMAIL is true.

### Step 2 – Verify OTP

- **Method:** POST  
- **URL:** `http://localhost:5000/api/auth/verify-otp`  
- **Body (raw JSON):**
```json
{
  "email": "your@email.com",
  "otp": "123456"
}
```
- **Response:** Always includes `token` (and `user`). Copy the `token` and use it as Bearer token for protected requests. New users get a minimal account and token; existing users get login token.

### Step 3 – Use token in Postman

- **Authorization** tab → Type: **Bearer Token** → paste the token.  
- Or add **Header:** `Authorization` = `Bearer <your-token>`.

---

## 3. Auth endpoints

| Method | URL | Auth | Body / Params |
|--------|-----|------|----------------|
| POST | `/api/auth/send-otp` | No | Body: `{"email": "user@example.com"}` |
| POST | `/api/auth/verify-otp` | No | Body: `{"email": "user@example.com", "otp": "123456"}` |
| POST | `/api/auth/register` | No | Body: `{"email","name","phone":"","dob":null,"preferences":{"categories":[],"budget":"mid"}}` |
| GET | `/api/auth/me` | Bearer | — |
| PUT | `/api/auth/profile` | Bearer | Body: `{"name":null,"phone":null,"dob":null,"preferences":null}` (all optional) |

**Register (after verify-otp for new user):**
```json
{
  "email": "your@email.com",
  "name": "Your Name",
  "phone": "",
  "dob": null,
  "preferences": { "categories": [], "budget": "mid" }
}
```

**Update profile (optional fields):**
```json
{
  "name": "New Name",
  "phone": "+1234567890",
  "dob": "1990-01-01",
  "preferences": { "categories": ["Electronics"], "budget": "high" }
}
```

---

## 4. Products (most are public)

| Method | URL | Auth | Notes |
|--------|-----|------|------|
| GET | `/api/products` | No | Query: `category`, `min_price`, `max_price`, `search`, `in_stock`, `sort_by`, `sort_order`, `page`, `limit` |
| GET | `/api/products/{product_id}` | No | Replace `{product_id}` with actual ID |
| GET | `/api/products/category/{category}` | No | Query: `limit` (default 20) |
| POST | `/api/products/notify-me` | No | Query: `product_id`, `user_id` |

**Example – List products with filters:**  
`GET http://localhost:5000/api/products?category=Electronics&page=1&limit=10`

**Example – Notify when in stock:**  
`POST http://localhost:5000/api/products/notify-me?product_id=prod_123&user_id=user_456`

---

## 5. Cart (all require Bearer token)

| Method | URL | Body |
|--------|-----|------|
| GET | `/api/cart` | — |
| POST | `/api/cart/add` | `{"product_id": "<id>", "quantity": 1}` |
| PUT | `/api/cart/{product_id}` | `{"quantity": 2}` |
| DELETE | `/api/cart/{product_id}` | — |
| GET | `/api/cart/recovery` | — |
| POST | `/api/cart/clear` | — |

**Add to cart:**
```json
{
  "product_id": "prod_abc123",
  "quantity": 1
}
```

**Update quantity:**
```json
{
  "quantity": 3
}
```

---

## 6. Recommendations

| Method | URL | Auth | Notes |
|--------|-----|------|-------|
| GET | `/api/recommendations` | Optional | Query: `limit` (default 10). Works without token (trending). |
| POST | `/api/recommendations/track-view` | Optional | Query: `product_id` |
| GET | `/api/recommendations/similar/{product_id}` | No | Query: `limit` (default 6) |

**Track view:**  
`POST http://localhost:5000/api/recommendations/track-view?product_id=prod_123`

---

## 7. Gamification (all require Bearer token)

| Method | URL | Body / Params |
|--------|-----|----------------|
| POST | `/api/gamification/spin-wheel` | — |
| GET | `/api/gamification/my-coupons` | — |
| POST | `/api/gamification/use-coupon/{code}` | Replace `{code}` with coupon code (e.g. SPIN1234) |
| GET | `/api/gamification/can-spin` | — |

---

## Quick test order

1. **GET** `http://localhost:5000/` → 200, JSON with `endpoints`.
2. **POST** `http://localhost:5000/api/auth/send-otp` with `{"email":"test@example.com"}`.
3. **POST** `http://localhost:5000/api/auth/verify-otp` with same email + OTP from response (or email).
4. Set **Authorization** → Bearer Token → paste `token` from verify-otp.
5. **GET** `http://localhost:5000/api/auth/me` → 200, user object.
6. **GET** `http://localhost:5000/api/products` → 200, list of products (use an ID for cart).
7. **POST** `http://localhost:5000/api/cart/add` with `{"product_id":"<id from step 6>","quantity":1}`.
8. **GET** `http://localhost:5000/api/cart` → 200, cart with items.

Ensure the backend is running (`uvicorn app.main:app --reload --port 5000`) and the DB is seeded (`python seed_data.py`) so product IDs exist.
