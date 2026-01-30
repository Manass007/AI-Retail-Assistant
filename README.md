# AI Retail Assistant

An intelligent shopping assistant backend that helps users find their needs faster using AI-powered recommendations, personalized product suggestions, and gamification features.

## 🚀 Features

- **AI-Powered Recommendations**: Personalized product suggestions based on user preferences and browsing history
- **OTP-Based Authentication**: Secure email-based authentication with OTP verification
- **Smart Cart Management**: Automatic migration of old cart items to wishlist after 15 days
- **Gamification**: Monthly spin wheel for discount coupons
- **Product Search & Filtering**: Advanced search with category, price range, and stock filters
- **User Profiles**: Customizable user preferences and profiles
- **Email Notifications**: OTP emails, welcome emails, and cart recovery notifications

## 📋 Prerequisites

- Python 3.8 or higher
- MongoDB (local or Atlas)
- OpenAI API key (optional, for AI features)
- SendGrid API key (optional, for email features)

## 🛠️ Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AI-Retail-Assistant
```

### 2. Navigate to Backend Directory

```bash
cd ai-shopping-backend
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up Environment Variables

Create a `.env` file in the `ai-shopping-backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables) section).

### 5. Seed the Database (Optional)

To populate the database with sample products:

```bash
python seed_data.py
```

### 6. Run the Server

```bash
uvicorn app.main:app --reload --port 5000
```

The API will be available at `http://localhost:5000`

## 📚 Documentation

- **API Documentation**: Available at `http://localhost:5000/docs` (Swagger UI)
- **Alternative Docs**: Available at `http://localhost:5000/redoc` (ReDoc)
- **Backend README**: See [ai-shopping-backend/README.md](ai-shopping-backend/README.md) for detailed API documentation

## 🔧 Environment Variables

See [ai-shopping-backend/.env.example](ai-shopping-backend/.env.example) for all required environment variables.

### Required Variables

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `OPENAI_API_KEY`: OpenAI API key (optional if `ENABLE_OPENAI=false`)

### Optional Variables

- `SENDGRID_API_KEY`: SendGrid API key for email features
- `SENDGRID_FROM_EMAIL`: Email address for sending emails
- `FRONTEND_URL`: Frontend application URL (default: `http://localhost:3000`)
- `PORT`: Server port (default: `5000`)
- `ENABLE_EMAIL`: Enable email features (default: `false`)
- `ENABLE_OPENAI`: Enable OpenAI features (default: `true`)

## 📁 Project Structure

```
AI-Retail-Assistant/
├── ai-shopping-backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── config.py             # Configuration settings
│   │   ├── database.py           # MongoDB connection
│   │   ├── middleware/
│   │   │   └── auth.py           # JWT authentication middleware
│   │   ├── models/               # Pydantic models
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   ├── cart.py
│   │   │   └── otp.py
│   │   ├── routes/               # API routes
│   │   │   ├── auth.py           # Authentication endpoints
│   │   │   ├── products.py      # Product endpoints
│   │   │   ├── cart.py           # Cart endpoints
│   │   │   ├── recommendations.py # Recommendation endpoints
│   │   │   └── gamification.py  # Gamification endpoints
│   │   └── services/             # Business logic services
│   │       ├── email_service.py
│   │       ├── openai_service.py
│   │       └── recommendation_service.py
│   ├── jobs/
│   │   └── cart_migration_job.py # Background job for cart migration
│   ├── data/
│   │   └── products.json         # Sample product data
│   ├── requirements.txt          # Python dependencies
│   ├── seed_data.py              # Database seeding script
│   └── README.md                 # Detailed backend documentation
└── README.md                     # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/{product_id}` - Get single product
- `GET /api/products/category/{category}` - Get products by category
- `POST /api/products/notify-me` - Request stock notification

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add product to cart
- `PUT /api/cart/{product_id}` - Update cart item quantity
- `DELETE /api/cart/{product_id}` - Remove from cart
- `GET /api/cart/recovery` - Get cart recovery items
- `POST /api/cart/clear` - Clear entire cart

### Recommendations
- `GET /api/recommendations` - Get personalized recommendations
- `POST /api/recommendations/track-view` - Track product view
- `GET /api/recommendations/similar/{product_id}` - Get similar products

### Gamification
- `POST /api/gamification/spin-wheel` - Spin wheel for discount
- `GET /api/gamification/my-coupons` - Get user's coupons
- `POST /api/gamification/use-coupon/{code}` - Use coupon
- `GET /api/gamification/can-spin` - Check if user can spin

## 🧪 Testing

### Health Check

```bash
curl http://localhost:5000/health
```

### Test Authentication Flow

1. Send OTP:
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

2. Verify OTP (use OTP from response):
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "otp": "123456"}'
```

## 🔄 Background Jobs

The application includes a background job scheduler that runs daily at 2 AM:

- **Cart Migration Job**: Automatically moves cart items older than 15 days to the user's wishlist

## 🚨 Troubleshooting

### MongoDB Connection Issues

- Verify your `MONGODB_URI` is correct
- Ensure MongoDB is running (if using local instance)
- Check network connectivity (if using MongoDB Atlas)

### OpenAI API Issues

- Verify your `OPENAI_API_KEY` is valid
- Check API quota/limits
- Set `ENABLE_OPENAI=false` to disable AI features

### Email Service Issues

- Verify `SENDGRID_API_KEY` is set correctly
- Check SendGrid account status
- Set `ENABLE_EMAIL=false` to disable email features

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on the repository.
