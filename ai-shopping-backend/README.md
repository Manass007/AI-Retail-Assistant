# AI Shopping Assistant Backend

FastAPI-based backend for an AI-powered shopping assistant application.

## 📋 Table of Contents

- [Overview](#overview)
- [Setup Guide](#setup-guide)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Database Schema](#database-schema)
- [Background Jobs](#background-jobs)
- [Testing](#testing)

## 🎯 Overview

This backend provides a RESTful API for an AI-powered shopping assistant with features including:

- User authentication with OTP
- Product catalog management
- Shopping cart functionality
- AI-powered product recommendations
- Gamification (spin wheel for discounts)
- Background job processing

## 🚀 Setup Guide

### Prerequisites

- Python 3.8+
- MongoDB (local or MongoDB Atlas)
- OpenAI API key (optional)
- SendGrid API key (optional)

### Installation Steps

1. **Install Dependencies**

```bash
pip install -r requirements.txt
```

2. **Create Environment File**

Create a `.env` file in the `ai-shopping-backend` directory:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/AiShoppingAssistant

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE_MINUTES=43200

# OpenAI (Optional)
OPENAI_API_KEY=sk-your-openai-api-key
ENABLE_OPENAI=true

# SMTP / Gmail (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_app_password
ENABLE_EMAIL=false

# App Configuration
PORT=5000
FRONTEND_URL=http://localhost:3000
APP_NAME=AI Shopping Assistant
```

3. **Seed Database (Optional)**

```bash
python seed_data.py
```

This will create:
- 20 sample products
- 1 demo user (email: `demo@example.com`)
- Sample interactions and coupons

4. **Run the Server**

```bash
uvicorn app.main:app --reload --port 5000
```

Or using Python directly:

```bash
python -m uvicorn app.main:app --reload --port 5000
```

5. **Access API Documentation**

- Swagger UI: http://localhost:5000/docs
- ReDoc: http://localhost:5000/redoc

## 📚 API Documentation

### Base URL

All API endpoints are prefixed with `/api`:

```
http://localhost:5000/api
```

### Authentication

Most endpoints require authentication via JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Authentication (`/api/auth`)

##### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email",
  "isNewUser": false,
  "email": "user@example.com",
  "otp": "123456"  // Remove in production
}
```

##### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
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
    "onboarded": true,
    "subscription": {
      "plan": "free",
      "status": "active",
      "isPremium": false
    }
  }
}
```

##### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "dob": "1990-01-01",
  "preferences": {
    "categories": ["Electronics", "Sports"],
    "budget": "mid"
  }
}
```

**Note:** OTP must be verified first.

##### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

##### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe Updated",
  "phone": "+1234567890",
  "preferences": {
    "categories": ["Electronics"],
    "budget": "high"
  }
}
```

#### Products (`/api/products`)

##### Get All Products
```http
GET /api/products?category=Electronics&min_price=10&max_price=100&search=headphones&page=1&limit=20
```

**Query Parameters:**
- `category` (optional): Filter by category
- `min_price` (optional): Minimum price
- `max_price` (optional): Maximum price
- `search` (optional): Search in name, description, brand
- `in_stock` (optional): Filter by stock status (true/false)
- `sort_by` (optional): Sort field (default: "created_at")
- `sort_order` (optional): "asc" or "desc" (default: "desc")
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "products": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

##### Get Single Product
```http
GET /api/products/{product_id}
```

##### Get Products by Category
```http
GET /api/products/category/{category}?limit=20
```

##### Request Stock Notification
```http
POST /api/products/notify-me?product_id=prod_1&user_id=user_123
```

#### Cart (`/api/cart`)

##### Get Cart
```http
GET /api/cart
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "cart": [
    {
      "product": {...},
      "quantity": 2,
      "added_at": "2024-01-01T00:00:00",
      "days_in_cart": 5,
      "migrated_to_wishlist": false
    }
  ],
  "total_items": 2,
  "total_amount": 159.98
}
```

##### Add to Cart
```http
POST /api/cart/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "product_id": "prod_1",
  "quantity": 1
}
```

##### Update Cart Item Quantity
```http
PUT /api/cart/{product_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

##### Remove from Cart
```http
DELETE /api/cart/{product_id}
Authorization: Bearer <token>
```

##### Get Cart Recovery Items
```http
GET /api/cart/recovery
Authorization: Bearer <token>
```

Returns products that were moved from cart to wishlist after 15 days.

##### Clear Cart
```http
POST /api/cart/clear
Authorization: Bearer <token>
```

#### Recommendations (`/api/recommendations`)

##### Get Recommendations
```http
GET /api/recommendations?limit=10
Authorization: Bearer <token>  # Optional
```

**Response:**
```json
{
  "success": true,
  "products": [...],
  "reason": "Based on your interest in Electronics"
}
```

##### Track Product View
```http
POST /api/recommendations/track-view?product_id=prod_1
Authorization: Bearer <token>  # Optional
```

##### Get Similar Products
```http
GET /api/recommendations/similar/{product_id}?limit=6
```

#### Gamification (`/api/gamification`)

##### Spin Wheel
```http
POST /api/gamification/spin-wheel
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "coupon": {
    "discount": 20,
    "label": "20% OFF",
    "code": "SPIN1234",
    "expires_at": "2024-02-01T00:00:00"
  },
  "message": "Congratulations! You won 20% off!"
}
```

**Note:** Can only spin once per month.

##### Get My Coupons
```http
GET /api/gamification/my-coupons
Authorization: Bearer <token>
```

##### Use Coupon
```http
POST /api/gamification/use-coupon/{code}
Authorization: Bearer <token>
```

##### Check if Can Spin
```http
GET /api/gamification/can-spin
Authorization: Bearer <token>
```

## 🏗️ Architecture

### Tech Stack

- **Framework**: FastAPI
- **Database**: MongoDB (Motor async driver)
- **Authentication**: JWT (python-jose)
- **Background Jobs**: APScheduler
- **AI**: OpenAI API
- **Email**: SendGrid

### Project Structure

```
app/
├── main.py                 # FastAPI app initialization
├── config.py              # Settings and configuration
├── database.py            # MongoDB connection
├── middleware/
│   └── auth.py            # JWT authentication
├── models/                # Pydantic models
│   ├── user.py
│   ├── product.py
│   ├── cart.py
│   └── otp.py
├── routes/                # API route handlers
│   ├── auth.py
│   ├── products.py
│   ├── cart.py
│   ├── recommendations.py
│   └── gamification.py
└── services/              # Business logic
    ├── email_service.py
    ├── openai_service.py
    └── recommendation_service.py
```

### Request Flow

1. Client sends request → FastAPI router
2. Middleware validates JWT (if required)
3. Route handler processes request
4. Service layer handles business logic
5. Database operations via Motor
6. Response returned to client

## ⚙️ Configuration

### Environment Variables

All configuration is managed through environment variables loaded from `.env` file:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `JWT_SECRET` | Yes | - | Secret for JWT token signing |
| `JWT_EXPIRE_MINUTES` | No | 43200 | JWT token expiration (30 days) |
| `OPENAI_API_KEY` | No* | - | OpenAI API key |
| `ENABLE_OPENAI` | No | true | Enable/disable OpenAI features |
| `EMAIL_HOST` | No | smtp.gmail.com | SMTP server host |
| `EMAIL_PORT` | No | 587 | SMTP port (587 for TLS) |
| `EMAIL_USER` | No* | - | SMTP login (e.g. Gmail address) |
| `EMAIL_PASSWORD` | No* | - | SMTP password (Gmail: use App Password) |
| `ENABLE_EMAIL` | No | false | Enable/disable email features |
| `PORT` | No | 5000 | Server port |
| `FRONTEND_URL` | No | http://localhost:3000 | Frontend URL for CORS |
| `APP_NAME` | No | AI Shopping Assistant | Application name |

*Required if corresponding feature is enabled

## 🗄️ Database Schema

### Collections

#### users
```javascript
{
  "_id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "dob": ISODate("1990-01-01"),
  "preferences": {
    "categories": ["Electronics", "Sports"],
    "budget": "mid"
  },
  "onboarded": true,
  "subscription": {
    "plan": "free",
    "status": "active",
    "start_date": null,
    "end_date": null
  },
  "wishlist": [
    {
      "product_id": "prod_1",
      "migrated_from_cart": false,
      "added_at": ISODate("2024-01-01")
    }
  ],
  "cart": [
    {
      "product_id": "prod_2",
      "quantity": 2,
      "added_at": ISODate("2024-01-01"),
      "migrated_to_wishlist": false
    }
  ],
  "is_active": true,
  "created_at": ISODate("2024-01-01"),
  "last_login": ISODate("2024-01-01"),
  "last_spin_date": ISODate("2024-01-01")
}
```

#### products
```javascript
{
  "_id": "prod_1",
  "name": "Wireless Headphones",
  "category": "Electronics",
  "price": 79.99,
  "brand": "TechSound",
  "image_url": "https://...",
  "description": "Premium wireless headphones",
  "tags": ["audio", "wireless", "tech"],
  "stock_quantity": 50,
  "is_in_stock": true,
  "popularity_score": 85.5,
  "created_at": ISODate("2024-01-01")
}
```

#### interactions
```javascript
{
  "user_id": "user_123",
  "product_id": "prod_1",
  "event_type": "view",  // "view", "add_to_cart", "purchase"
  "timestamp": ISODate("2024-01-01"),
  "metadata": {}
}
```

#### coupons
```javascript
{
  "user_id": "user_123",
  "code": "SPIN1234",
  "discount_percent": 20,
  "created_at": ISODate("2024-01-01"),
  "expires_at": ISODate("2024-02-01"),
  "used": false,
  "used_at": null
}
```

#### stock_notifications
```javascript
{
  "user_id": "user_123",
  "product_id": "prod_1",
  "notified": false,
  "created_at": ISODate("2024-01-01")
}
```

## ⏰ Background Jobs

### Cart Migration Job

**Schedule**: Daily at 2:00 AM

**Function**: Automatically moves cart items older than 15 days to the user's wishlist.

**Process**:
1. Find all users with cart items older than 15 days
2. Move items to wishlist
3. Mark items as migrated
4. Send email notification (if email enabled)

**Configuration**: See `jobs/cart_migration_job.py`

## 🧪 Testing

### Manual Testing with cURL

#### 1. Health Check
```bash
curl http://localhost:5000/health
```

#### 2. Send OTP
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

#### 3. Verify OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "otp": "123456"}'
```

#### 4. Get Products
```bash
curl http://localhost:5000/api/products?limit=5
```

#### 5. Get Recommendations (with token)
```bash
curl http://localhost:5000/api/recommendations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Swagger UI

1. Start the server
2. Navigate to http://localhost:5000/docs
3. Use the interactive API documentation to test endpoints
4. Click "Authorize" to add your JWT token

## 🔒 Security Considerations

1. **JWT Secret**: Use a strong, random secret in production
2. **MongoDB**: Use connection string with authentication
3. **CORS**: Configure allowed origins properly
4. **OTP Storage**: Currently in-memory; use Redis in production
5. **Rate Limiting**: Consider adding rate limiting for production
6. **Input Validation**: All inputs are validated via Pydantic models

## 🚀 Deployment

### Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Configure MongoDB with proper authentication
- [ ] Set up Redis for OTP storage
- [ ] Configure CORS for production frontend URL
- [ ] Set up proper logging
- [ ] Configure rate limiting
- [ ] Set up monitoring and error tracking
- [ ] Use environment-specific `.env` files
- [ ] Enable HTTPS
- [ ] Set up database backups

### Docker Deployment (Example)

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]
```

## 📝 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
