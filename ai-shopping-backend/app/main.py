from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
from app.config import settings
from app.database import connect_db, close_db
from jobs.cart_migration_job import start_scheduler

# Import routes
from app.routes import auth, products, cart, recommendations, gamification, orders, stores, bundles, payments, chat, offers

# ============= LIFESPAN EVENTS =============

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting AI Shopping Assistant Backend...")
    await connect_db()
    
    # Start background jobs
    scheduler = start_scheduler()
    
    print(f"✅ Server running on port {settings.PORT}")
    print(f"✅ Frontend URL: {settings.FRONTEND_URL}")
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")
    scheduler.shutdown()
    await close_db()

# ============= CREATE APP =============

app = FastAPI(
    title="AI Shopping Assistant API",
    description="Backend API for AI-powered shopping assistant",
    version="1.0.0",
    lifespan=lifespan
)

# ============= CORS =============

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= ROUTES =============

# Include routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(recommendations.router)
app.include_router(gamification.router)
app.include_router(orders.router)
app.include_router(stores.router)
app.include_router(bundles.router)
app.include_router(payments.router)
app.include_router(chat.router)
app.include_router(offers.router)

# ============= HEALTH CHECK =============

@app.get("/")
async def root():
    return {
        "success": True,
        "message": "AI Shopping Assistant API",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/auth/*",
            "products": "/api/products",
            "cart": "/api/cart",
            "recommendations": "/api/recommendations",
            "gamification": "/api/gamification",
            "orders": "/api/orders",
            "stores": "/api/stores",
            "bundles": "/api/bundles",
            "payments": "/api/payments",
            "chat": "/api/chat",
            "offers": "/api/offers"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

# ============= 404 HANDLER =============

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"success": False, "message": "Route not found"},
    )

# ============= ERROR HANDLER =============

@app.exception_handler(500)
async def server_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Internal server error"},
    )