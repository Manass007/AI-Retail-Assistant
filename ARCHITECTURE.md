# AI Retail Assistant - Architecture Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser<br/>React/Next.js]
        MOBILE[Mobile Browser<br/>Responsive UI]
    end

    subgraph "Frontend Application"
        FE[React Frontend<br/>Port 3000]
        PAGES[Pages<br/>Home, Login, Products, Cart, Checkout, Profile]
        COMP[Components<br/>Auth, Cart, Product, Chat, Gamification]
        CONTEXT[Context Providers<br/>AuthContext, CartContext]
        API_CLIENT[API Client<br/>axios.js]
    end

    subgraph "Backend API"
        API[FastAPI Server<br/>Port 5000]
        MIDDLEWARE[Middleware<br/>CORS, Auth JWT]
        ROUTES[API Routes]
    end

    subgraph "Route Handlers"
        AUTH_R[Auth Routes<br/>OTP, Register, Profile]
        PROD_R[Products Routes<br/>List, Search, Filter]
        CART_R[Cart Routes<br/>Add, Update, Remove]
        REC_R[Recommendations Routes<br/>AI Suggestions]
        GAME_R[Gamification Routes<br/>Spin Wheel, Coupons]
        ORDER_R[Orders Routes<br/>Create, History]
        PAY_R[Payments Routes<br/>Razorpay Integration]
        CHAT_R[Chat Routes<br/>AI Assistant]
        BUNDLE_R[Bundles Routes<br/>Product Bundles]
        STORE_R[Stores Routes<br/>Pickup Locations]
        WATCH_R[Watchlist Routes<br/>Wishlist Management]
    end

    subgraph "Service Layer"
        EMAIL_S[Email Service<br/>OTP, Notifications]
        OPENAI_S[OpenAI Service<br/>AI Recommendations]
        REC_S[Recommendation Service<br/>Product Matching]
        WATCH_S[Watchlist Combo Service<br/>Bundle Suggestions]
    end

    subgraph "Data Layer"
        MONGO[(MongoDB<br/>AiShoppingAssistant)]
        COLLECTIONS[Collections<br/>users, products, orders, coupons, interactions]
    end

    subgraph "Background Jobs"
        SCHEDULER[APScheduler<br/>Background Tasks]
        CART_JOB[Cart Migration Job<br/>Daily 2 AM<br/>15-day old items → Wishlist]
    end

    subgraph "External Services"
        OPENAI[OpenAI API<br/>GPT Models]
        EMAIL_PROVIDER[Email Provider<br/>SMTP/SendGrid]
        RAZORPAY[Razorpay<br/>Payment Gateway]
    end

    %% Client to Frontend
    WEB --> FE
    MOBILE --> FE

    %% Frontend Internal Flow
    FE --> PAGES
    FE --> COMP
    FE --> CONTEXT
    PAGES --> API_CLIENT
    COMP --> API_CLIENT
    CONTEXT --> API_CLIENT

    %% Frontend to Backend
    API_CLIENT -->|HTTP/REST| API

    %% Backend Flow
    API --> MIDDLEWARE
    MIDDLEWARE --> ROUTES

    %% Routes
    ROUTES --> AUTH_R
    ROUTES --> PROD_R
    ROUTES --> CART_R
    ROUTES --> REC_R
    ROUTES --> GAME_R
    ROUTES --> ORDER_R
    ROUTES --> PAY_R
    ROUTES --> CHAT_R
    ROUTES --> BUNDLE_R
    ROUTES --> STORE_R
    ROUTES --> WATCH_R

    %% Routes to Services
    AUTH_R --> EMAIL_S
    REC_R --> OPENAI_S
    REC_R --> REC_S
    CHAT_R --> OPENAI_S
    WATCH_R --> WATCH_S

    %% Services to External
    EMAIL_S --> EMAIL_PROVIDER
    OPENAI_S --> OPENAI
    PAY_R --> RAZORPAY

    %% Routes to Database
    AUTH_R --> MONGO
    PROD_R --> MONGO
    CART_R --> MONGO
    REC_R --> MONGO
    GAME_R --> MONGO
    ORDER_R --> MONGO
    PAY_R --> MONGO
    CHAT_R --> MONGO
    BUNDLE_R --> MONGO
    STORE_R --> MONGO
    WATCH_R --> MONGO

    %% Database Collections
    MONGO --> COLLECTIONS

    %% Background Jobs
    API --> SCHEDULER
    SCHEDULER --> CART_JOB
    CART_JOB --> MONGO
    CART_JOB --> EMAIL_S

    style FE fill:#e1f5ff
    style API fill:#fff4e1
    style MONGO fill:#e8f5e9
    style OPENAI fill:#f3e5f5
    style EMAIL_PROVIDER fill:#f3e5f5
    style RAZORPAY fill:#f3e5f5
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant EmailService
    participant MongoDB

    User->>Frontend: Enter Email
    Frontend->>Backend: POST /api/auth/send-otp
    Backend->>MongoDB: Check if user exists
    Backend->>Backend: Generate OTP (6 digits)
    Backend->>Backend: Hash & Store OTP (10 min expiry)
    Backend->>EmailService: Send OTP Email
    EmailService->>User: Email with OTP
    Backend->>Frontend: {success: true, isNewUser: bool}
    
    User->>Frontend: Enter OTP
    Frontend->>Backend: POST /api/auth/verify-otp
    Backend->>Backend: Verify OTP (check expiry, attempts)
    
    alt Existing User
        Backend->>MongoDB: Update last_login
        Backend->>Backend: Generate JWT Token
        Backend->>Frontend: {token, user, isNewUser: false}
        Frontend->>Frontend: Store token in localStorage
        Frontend->>User: Redirect to Home
    else New User
        Backend->>Frontend: {token, isNewUser: true}
        Frontend->>User: Redirect to Onboarding
        User->>Frontend: Complete Registration (DOB, Preferences)
        Frontend->>Backend: POST /api/auth/register
        Backend->>MongoDB: Create User Profile
        Backend->>Frontend: {success: true, user}
        Frontend->>User: Redirect to Home
    end
```

## Shopping Workflow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant OpenAI
    participant MongoDB

    User->>Frontend: Browse Products
    Frontend->>Backend: GET /api/products?category=Electronics
    Backend->>MongoDB: Query Products Collection
    MongoDB->>Backend: Product List
    Backend->>Frontend: Products with Pagination
    Frontend->>User: Display Products

    User->>Frontend: View Product Details
    Frontend->>Backend: GET /api/products/{id}
    Frontend->>Backend: POST /api/recommendations/track-view
    Backend->>MongoDB: Save Interaction
    Backend->>Frontend: Product Details + Similar Products

    User->>Frontend: Add to Cart
    Frontend->>Backend: POST /api/cart/add
    Backend->>MongoDB: Update User Cart
    Backend->>Frontend: Cart Updated

    User->>Frontend: Request Recommendations
    Frontend->>Backend: GET /api/recommendations
    Backend->>MongoDB: Get User Preferences & History
    Backend->>OpenAI: Generate Personalized Recommendations
    OpenAI->>Backend: AI Suggestions
    Backend->>MongoDB: Query Recommended Products
    Backend->>Frontend: Recommended Products

    User->>Frontend: Proceed to Checkout
    Frontend->>Backend: GET /api/cart
    Backend->>MongoDB: Get Cart Items
    Backend->>Frontend: Cart Summary
    Frontend->>User: Checkout Page

    User->>Frontend: Place Order
    Frontend->>Backend: POST /api/orders
    Backend->>MongoDB: Create Order
    Backend->>MongoDB: Clear Cart
    Backend->>Frontend: Order Confirmation
```

## Cart Migration Background Job Flow

```mermaid
sequenceDiagram
    participant Scheduler
    participant CartJob
    participant MongoDB
    participant EmailService
    participant User

    Note over Scheduler: Daily at 2:00 AM
    
    Scheduler->>CartJob: Trigger Migration
    CartJob->>MongoDB: Find Users with Cart Items > 15 days old
    MongoDB->>CartJob: Users with Old Cart Items
    
    loop For Each User
        CartJob->>MongoDB: Get Cart Items
        CartJob->>CartJob: Filter Items Added > 15 Days Ago
        CartJob->>MongoDB: Get Product Details
        CartJob->>MongoDB: Move Items to Wishlist
        CartJob->>MongoDB: Remove from Cart
        CartJob->>EmailService: Send Cart Recovery Email
        EmailService->>User: Email Notification
    end
    
    CartJob->>Scheduler: Migration Complete
```

## AI Chat Assistant Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant OpenAI
    participant MongoDB

    User->>Frontend: Send Chat Message
    Frontend->>Backend: POST /api/chat
    Backend->>MongoDB: Get User Profile & Preferences
    Backend->>MongoDB: Get Cart Items
    Backend->>MongoDB: Get Order History
    Backend->>OpenAI: Send Context + User Message
    Note over Backend,OpenAI: Context includes:<br/>- User preferences<br/>- Cart contents<br/>- Order history<br/>- Product catalog
    OpenAI->>Backend: AI Response with Product Suggestions
    Backend->>MongoDB: Save Chat Interaction
    Backend->>Frontend: AI Response + Quick Add Products
    Frontend->>User: Display Response
    
    alt User Clicks Quick Add
        Frontend->>Backend: POST /api/cart/add
        Backend->>MongoDB: Add to Cart
        Backend->>Frontend: Cart Updated
    end
```

## Gamification Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant MongoDB

    User->>Frontend: Click Spin Wheel
    Frontend->>Backend: GET /api/gamification/can-spin
    Backend->>MongoDB: Check last_spin_date
    MongoDB->>Backend: User Spin Status
    
    alt Can Spin (Monthly)
        Backend->>Frontend: {canSpin: true}
        User->>Frontend: Spin Wheel
        Frontend->>Backend: POST /api/gamification/spin-wheel
        Backend->>Backend: Generate Random Discount (5-50%)
        Backend->>Backend: Generate Unique Coupon Code
        Backend->>MongoDB: Save Coupon
        Backend->>MongoDB: Update last_spin_date
        Backend->>Frontend: {coupon: {code, discount, expires_at}}
        Frontend->>User: Display Coupon
    else Cannot Spin
        Backend->>Frontend: {canSpin: false, nextSpinDate}
        Frontend->>User: Show Next Spin Date
    end
    
    User->>Frontend: Apply Coupon at Checkout
    Frontend->>Backend: POST /api/cart/apply-coupon
    Backend->>MongoDB: Validate Coupon (check expiry, usage)
    Backend->>MongoDB: Mark Coupon as Used
    Backend->>Frontend: Discount Applied
```

## Database Schema Overview

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    USERS ||--o{ COUPONS : has
    USERS ||--o{ INTERACTIONS : generates
    USERS ||--o{ STOCK_NOTIFICATIONS : requests
    USERS {
        string _id PK
        string email
        string name
        string phone
        date dob
        object preferences
        boolean onboarded
        object subscription
        array cart
        array wishlist
        datetime last_spin_date
        datetime created_at
    }
    
    PRODUCTS ||--o{ INTERACTIONS : tracked_in
    PRODUCTS ||--o{ ORDERS : included_in
    PRODUCTS ||--o{ STOCK_NOTIFICATIONS : requested_for
    PRODUCTS {
        string _id PK
        string name
        string category
        float price
        string brand
        string image_url
        string description
        array tags
        int stock_quantity
        boolean is_in_stock
        float popularity_score
        datetime created_at
    }
    
    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS {
        string _id PK
        string user_id FK
        array items
        float total_amount
        string payment_method
        string status
        string store_id
        datetime created_at
    }
    
    COUPONS {
        string _id PK
        string user_id FK
        string code
        int discount_percent
        datetime created_at
        datetime expires_at
        boolean used
        datetime used_at
    }
    
    INTERACTIONS {
        string _id PK
        string user_id FK
        string product_id FK
        string event_type
        datetime timestamp
        object metadata
    }
    
    STOCK_NOTIFICATIONS {
        string _id PK
        string user_id FK
        string product_id FK
        boolean notified
        datetime created_at
    }
```

## Technology Stack

### Frontend
- **Framework**: React with React Router
- **UI Library**: Material-UI (MUI)
- **State Management**: React Context API (AuthContext, CartContext)
- **HTTP Client**: Axios
- **Build Tool**: Vite/Next.js
- **Styling**: CSS Modules, Material-UI Theme

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (Motor async driver)
- **Authentication**: JWT (python-jose)
- **Background Jobs**: APScheduler
- **AI Integration**: OpenAI API
- **Email Service**: SMTP/SendGrid

### External Services
- **AI**: OpenAI GPT Models
- **Email**: SMTP (Gmail) / SendGrid
- **Payment**: Razorpay
- **Database**: MongoDB Atlas / Local MongoDB

## Key Features Architecture

### 1. Product Catalog
- **Search & Filter**: Category, price range, stock status
- **Pagination**: Efficient data loading
- **Product Details**: Full product information with similar products

### 2. Shopping Cart
- **Real-time Updates**: Immediate cart synchronization
- **Auto-migration**: 15-day old items moved to wishlist
- **Recovery System**: Email notifications for migrated items

### 3. AI Recommendations
- **Personalized**: Based on user preferences and history
- **Context-aware**: Considers cart, orders, and interactions
- **OpenAI Integration**: GPT-powered suggestions

### 4. Gamification
- **Monthly Spin Wheel**: Discount coupons (5-50%)
- **Coupon Management**: Track usage and expiry
- **Points System**: Daily check-ins and streaks

### 5. Chat Assistant
- **AI-powered**: OpenAI GPT integration
- **Context-aware**: Knows user preferences and cart
- **Quick Actions**: Direct product additions from chat

### 6. Order Management
- **Multiple Payment Methods**: Pay at store / Online (Razorpay)
- **Store Pickup**: Location-based store selection
- **Order History**: Complete purchase tracking

## API Endpoints Summary

```
/api/auth/*
  - POST /send-otp
  - POST /verify-otp
  - POST /register
  - GET /me
  - PUT /profile

/api/products/*
  - GET / (list with filters)
  - GET /{id}
  - GET /category/{category}
  - POST /notify-me

/api/cart/*
  - GET /
  - POST /add
  - PUT /{product_id}
  - DELETE /{product_id}
  - GET /recovery
  - POST /clear

/api/recommendations/*
  - GET /
  - POST /track-view
  - GET /similar/{product_id}

/api/gamification/*
  - POST /spin-wheel
  - GET /my-coupons
  - POST /use-coupon/{code}
  - GET /can-spin

/api/orders/*
  - GET /
  - POST /
  - GET /{order_id}
  - GET /history

/api/payments/*
  - POST /create-order
  - POST /verify

/api/chat
  - POST /

/api/bundles/*
  - GET /
  - GET /product/{product_id}

/api/stores/*
  - GET /pickup

/api/watchlist/*
  - GET /
  - GET /combo-suggestions/{product_id}
  - POST /move-from-cart/{product_id}
```

## Security Architecture

1. **Authentication**: JWT tokens with expiration
2. **OTP Security**: Hashed storage, 10-minute expiry, 5 attempt limit
3. **CORS**: Configured for specific frontend origins
4. **Input Validation**: Pydantic models for all inputs
5. **Protected Routes**: Middleware-based JWT verification

## Deployment Considerations

- **Frontend**: Static hosting (Vercel, Netlify)
- **Backend**: Containerized (Docker) or serverless
- **Database**: MongoDB Atlas (cloud) or self-hosted
- **Background Jobs**: Separate worker process or serverless functions
- **Environment Variables**: Secure configuration management
- **Monitoring**: Health checks, logging, error tracking
