# Setup Guide - AI Retail Assistant

Complete step-by-step guide to set up and run the AI Retail Assistant backend.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Python 3.8 or higher**
  ```bash
  python --version
  # Should show Python 3.8 or higher
  ```

- **pip** (Python package manager)
  ```bash
  pip --version
  ```

- **MongoDB** (choose one):
  - **MongoDB Atlas** (cloud, recommended for beginners): https://www.mongodb.com/cloud/atlas
  - **MongoDB Community Edition** (local): https://www.mongodb.com/try/download/community

### Optional (for full features)

- **OpenAI API Key**: https://platform.openai.com/api-keys
- **SendGrid API Key**: https://app.sendgrid.com/settings/api_keys

## 🚀 Installation

### Step 1: Clone or Navigate to Project

```bash
cd AI-Retail-Assistant/ai-shopping-backend
```

### Step 2: Create Virtual Environment (Recommended)

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- FastAPI and Uvicorn (web framework and server)
- Motor and PyMongo (MongoDB drivers)
- Pydantic (data validation)
- OpenAI (AI features)
- SendGrid (email service)
- APScheduler (background jobs)
- python-jose (JWT authentication)
- And other dependencies

## ⚙️ Configuration

### Step 1: Create Environment File

Copy the example environment file:

```bash
copy .env.example .env
```

**macOS/Linux:**
```bash
cp .env.example .env
```

### Step 2: Configure MongoDB

#### Option A: MongoDB Atlas (Cloud - Recommended)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (free tier available)
4. Create a database user
5. Whitelist your IP address (or use 0.0.0.0/0 for development)
6. Get your connection string:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `AiShoppingAssistant`

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/AiShoppingAssistant?retryWrites=true&w=majority
```

#### Option B: Local MongoDB

1. Install MongoDB Community Edition
2. Start MongoDB service
3. Use connection string:
```
mongodb://localhost:27017/AiShoppingAssistant
```

### Step 3: Configure Environment Variables

Edit the `.env` file with your values:

```env
# MongoDB (Required)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/AiShoppingAssistant

# JWT Secret (Required)
# Generate a secure secret:
# python -c "import secrets; print(secrets.token_urlsafe(32))"
JWT_SECRET=your-generated-secret-key-here

# OpenAI (Optional - set ENABLE_OPENAI=false to disable)
OPENAI_API_KEY=sk-your-key-here
ENABLE_OPENAI=true

# SendGrid (Optional - set ENABLE_EMAIL=false to disable)
SENDGRID_API_KEY=SG.your-key-here
SENDGRID_FROM_EMAIL=noreply@yourstore.com
ENABLE_EMAIL=false

# App Settings
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Step 4: Generate JWT Secret

Generate a secure JWT secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and paste it into your `.env` file as `JWT_SECRET`.

## 🗄️ Database Setup

### Step 1: Seed the Database (Optional but Recommended)

This will populate your database with sample products and a demo user:

```bash
python seed_data.py
```

Expected output:
```
🌱 Seeding database...
✅ Connected to MongoDB successfully!
📦 Inserting 20 products...
✅ Inserted 20 products
👤 Creating sample user...
✅ Created user with ID: user_sample_001
✅ Database seeded successfully!
```

### Step 2: Verify Database Connection

The application will automatically connect to MongoDB on startup. Check the console output for:

```
✅ Connected to MongoDB - Database: AiShoppingAssistant
```

## 🏃 Running the Application

### Development Mode (with auto-reload)

```bash
uvicorn app.main:app --reload --port 5000
```

Or using Python:

```bash
python -m uvicorn app.main:app --reload --port 5000
```

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 5000
```

### Expected Startup Output

```
🚀 Starting AI Shopping Assistant Backend...
✅ Connected to MongoDB - Database: AiShoppingAssistant
⏰ Scheduler started - Cart migration job scheduled
✅ Server running on port 5000
✅ Frontend URL: http://localhost:3000
INFO:     Uvicorn running on http://127.0.0.1:5000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## ✅ Verification

### 1. Health Check

Open your browser or use curl:

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00"
}
```

### 2. API Root

```bash
curl http://localhost:5000/
```

### 3. API Documentation

Open in browser:
- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc

### 4. Test Authentication Flow

#### Send OTP:
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"test@example.com\"}"
```

#### Verify OTP (use OTP from response):
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"test@example.com\", \"otp\": \"123456\"}"
```

### 5. Test Products Endpoint

```bash
curl http://localhost:5000/api/products?limit=5
```

## 🔧 Troubleshooting

### Issue: MongoDB Connection Failed

**Error:**
```
❌ MongoDB connection failed: ...
```

**Solutions:**
1. Verify `MONGODB_URI` is correct in `.env`
2. Check MongoDB is running (if local)
3. Verify network connectivity (if Atlas)
4. Check IP whitelist in MongoDB Atlas
5. Verify database user credentials

### Issue: Module Not Found

**Error:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
```bash
pip install -r requirements.txt
```

### Issue: Port Already in Use

**Error:**
```
ERROR: [Errno 48] Address already in use
```

**Solutions:**
1. Change port in `.env`: `PORT=5001`
2. Or kill the process using port 5000:
   ```bash
   # Find process
   lsof -i :5000
   # Kill process (replace PID)
   kill -9 <PID>
   ```

### Issue: JWT Secret Error

**Error:**
```
ValueError: JWT_SECRET not found
```

**Solution:**
1. Ensure `.env` file exists
2. Add `JWT_SECRET=your-secret-key` to `.env`
3. Restart the server

### Issue: OpenAI API Error

**Error:**
```
OpenAI API error: ...
```

**Solutions:**
1. Verify `OPENAI_API_KEY` is correct
2. Check API quota/limits
3. Set `ENABLE_OPENAI=false` to disable AI features

### Issue: Email Service Error

**Error:**
```
Failed to send email: ...
```

**Solutions:**
1. Verify `SENDGRID_API_KEY` is correct
2. Check SendGrid account status
3. Set `ENABLE_EMAIL=false` to disable email features
4. Verify `SENDGRID_FROM_EMAIL` is verified in SendGrid

### Issue: Database Seeding Fails

**Error:**
```
Error seeding database: ...
```

**Solutions:**
1. Verify MongoDB connection
2. Check database permissions
3. Ensure database name matches in connection string
4. Try clearing existing data manually

## 📚 Next Steps

1. **Explore API Documentation**: Visit http://localhost:5000/docs
2. **Test Endpoints**: Use Swagger UI to test all endpoints
3. **Review Code**: Check the code structure in `app/` directory
4. **Customize**: Modify products, add features, etc.
5. **Connect Frontend**: Point your frontend to `http://localhost:5000`

## 🆘 Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review error messages in the console
3. Check MongoDB connection status
4. Verify all environment variables are set
5. Open an issue on the repository

## 📝 Notes

- The `.env` file should never be committed to version control
- Use different configurations for development and production
- Background jobs run daily at 2 AM (cart migration)
- OTP is stored in-memory (use Redis in production)
- Demo user credentials: `demo@example.com` (use OTP to login)

---

**Happy Coding! 🚀**
