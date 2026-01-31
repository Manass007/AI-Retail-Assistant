# AI Shopping Assistant – Frontend

Next.js + MUI frontend for the AI Shopping Assistant backend. Mobile-first, clean UI.

## Setup

1. **Backend:** Run the API at `http://localhost:5000` (see `ai-shopping-backend`).
2. **Env:** Create `.env.local` with:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```
3. **Install & run:**
   ```bash
   npm install
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

## Pages

- **Home** – Chat CTA, category chips, featured products.
- **Login** – OTP flow (send OTP → verify → optional register).
- **Chat** – Assistant chat; quick prompts, quick-add products, last/frequently ordered, pickup stores, bundle offers.
- **Products** – List with category filters and search.
- **Product detail** – Single product, add to cart, bundle deals link.
- **Cart** – Items, quantity, remove; checkout CTA.
- **Checkout** – Payment method (pay at store / online), pickup store, place order.
- **Payment** – Online payment (Razorpay) – create order; integrate Checkout as needed.
- **Profile** – User info, cart/checkout links, logout.
- **Bundles** – List bundle deals, add bundle to cart.

## Tech

- **Next.js** (Pages Router), **MUI** (Material-UI) + Emotion.
- **Auth:** Token in `localStorage`; protected routes redirect to `/login`.
- **API:** `src/lib/api.js` – all backend endpoints; base URL from `NEXT_PUBLIC_API_URL`.

## Responsive

- Mobile-first layout; bottom nav on mobile.
- Product grids: 2 cols (mobile), 3 (sm), 4 (md+).
