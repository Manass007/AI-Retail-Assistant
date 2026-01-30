# AI Retail Assistant - Frontend

React-based frontend application for the AI Retail Assistant e-commerce platform.

## Features

- **OTP-Based Authentication**: Secure email-based login with OTP verification
- **Onboarding Flow**: Multi-step onboarding with preferences and profile setup
- **Personalized Recommendations**: AI-powered product recommendations based on user history and preferences
- **Cart Recovery**: Automatic recovery of abandoned cart items after 15 days
- **Product Management**: Browse, search, and filter products with stock notifications
- **Shopping Cart**: Full cart management with quantity controls
- **Checkout**: Multiple payment options (Online/Counter payment)
- **Gamification**: Monthly spin wheel for discount coupons
- **Clean Minimal UI**: Modern, responsive design with Material-UI

## Tech Stack

- **React 18+** - UI framework
- **Material-UI (MUI) v5** - Component library
- **React Router v6** - Routing
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **React Toastify** - Notifications
- **Vite** - Build tool

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Backend API running on `http://localhost:5000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (optional, defaults are set):
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=AI Retail Assistant
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Project Structure

```
src/
├── api/              # API service files
├── components/       # Reusable components
│   ├── auth/        # Authentication components
│   ├── cart/        # Cart components
│   ├── checkout/    # Checkout components
│   ├── common/      # Common components (Header, Footer, etc.)
│   ├── gamification/# Spin wheel and coupons
│   └── product/     # Product components
├── contexts/        # React contexts (Auth, Cart)
├── hooks/           # Custom hooks
├── pages/           # Page components
├── theme/           # MUI theme configuration
└── utils/           # Utility functions
```

## API Integration

The frontend integrates with the FastAPI backend. All API calls are handled through service files in `src/api/`:

- `auth.js` - Authentication endpoints
- `products.js` - Product endpoints
- `cart.js` - Cart endpoints
- `recommendations.js` - Recommendation endpoints
- `gamification.js` - Gamification endpoints

## Key Features Implementation

### Authentication Flow
1. User enters email
2. OTP sent to email
3. User verifies OTP
4. New users redirected to onboarding
5. Existing users logged in

### Onboarding
- Step 1: Select interests (categories) and budget
- Step 2: Enter name, phone, and date of birth
- Profile saved and user redirected to home

### Recommendations
- New users: Based on preferences from onboarding
- Existing users: Based on browsing history
- Tracks product views for better recommendations

### Cart Recovery
- Items in cart for 15+ days automatically moved to wishlist
- Banner shown on homepage with recovery items
- Users can add items back to cart

### Spin Wheel
- Available once per month per user
- Win discount coupons (5%, 10%, 15%, 20%, 25%, or 50% off)
- Coupons can be applied at checkout

## Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL (default: `http://localhost:5000/api`)
- `VITE_APP_NAME` - Application name (default: `AI Retail Assistant`)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT License
