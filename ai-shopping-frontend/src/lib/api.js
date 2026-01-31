const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export async function api(method, path, body = null, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const config = { method, headers };
  if (body && method !== "GET") config.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}${path}`, config);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.message || "Request failed");
  return data;
}

export const auth = {
  sendOtp: (email) => api("POST", "/api/auth/send-otp", { email }),
  verifyOtp: (email, otp) => api("POST", "/api/auth/verify-otp", { email, otp }),
  register: (payload) => api("POST", "/api/auth/register", payload),
  me: () => api("GET", "/api/auth/me"),
  updateProfile: (payload) => api("PUT", "/api/auth/profile", payload),
};

export const addresses = {
  list: () => api("GET", "/api/auth/addresses"),
  add: (addressData) => api("POST", "/api/auth/addresses", addressData),
  update: (addressId, addressData) => api("PUT", `/api/auth/addresses/${addressId}`, addressData),
  delete: (addressId) => api("DELETE", `/api/auth/addresses/${addressId}`),
};

export const products = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api("GET", `/api/products${q ? `?${q}` : ""}`);
  },
  get: (id) => api("GET", `/api/products/${id}`),
  byCategory: (category, limit = 20) =>
    api("GET", `/api/products/category/${category}?limit=${limit}`),
};

export const cart = {
  get: () => api("GET", "/api/cart"),
  add: (productId, quantity = 1) =>
    api("POST", "/api/cart/add", { product_id: productId, quantity }),
  update: (productId, quantity) =>
    api("PUT", `/api/cart/${productId}`, { quantity }),
  remove: (productId) => api("DELETE", `/api/cart/${productId}`),
  clear: () => api("POST", "/api/cart/clear"),
  applyCoupon: (code) => api("POST", "/api/cart/apply-coupon", { code }),
  removeCoupon: () => api("DELETE", "/api/cart/coupon"),
};

export const recommendations = {
  list: (limit = 10) => api("GET", `/api/recommendations?limit=${limit}`),
  trackView: (productId) =>
    api("POST", `/api/recommendations/track-view?product_id=${productId}`),
  similar: (productId, limit = 6) =>
    api("GET", `/api/recommendations/similar/${productId}?limit=${limit}`),
};

export const orders = {
  list: (limit = 20) => api("GET", `/api/orders?limit=${limit}`),
  get: (orderId) => api("GET", `/api/orders/${orderId}`),
  history: () => api("GET", "/api/orders/history"),
  create: (paymentMethod, storeId = null, addressId = null) =>
    api("POST", "/api/orders", {
      payment_method: paymentMethod,
      store_id: storeId || undefined,
      address_id: addressId || undefined,
    }),
};

export const stores = {
  pickup: (city, pincode) => {
    const params = {};
    if (city) params.city = city;
    if (pincode) params.pincode = pincode;
    const q = new URLSearchParams(params).toString();
    return api("GET", `/api/stores/pickup${q ? `?${q}` : ""}`);
  },
};

export const bundles = {
  list: () => api("GET", "/api/bundles"),
  forProduct: (productId) => api("GET", `/api/bundles/product/${productId}`),
};

export const payments = {
  createOrder: (orderId, amountUsd) =>
    api("POST", "/api/payments/create-order", {
      order_id: orderId,
      amount_usd: amountUsd,
    }),
  verify: (orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature) =>
    api("POST", "/api/payments/verify", {
      order_id: orderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_order_id: razorpayOrderId,
      razorpay_signature: razorpaySignature,
    }),
};

export const chat = {
  send: (message, conversationHistory = []) =>
    api("POST", "/api/chat", { message, conversation_history: conversationHistory }),
};

export const offers = {
  list: () => api("GET", "/api/offers"),
};

export const gamification = {
  dailyCheckin: {
    status: () => api("GET", "/api/gamification/daily-checkin/status"),
    claim: () => api("POST", "/api/gamification/daily-checkin"),
  },
};

export const watchlist = {
  get: () => api("GET", "/api/watchlist"),
  comboSuggestions: (productId) => api("GET", `/api/watchlist/combo-suggestions/${productId}`),
  comboSuggestionsCart: () => api("GET", "/api/watchlist/combo-suggestions/cart"),
  comboSuggestionsCheckout: () => api("GET", "/api/watchlist/combo-suggestions/checkout"),
  moveFromCart: (productId) => api("POST", `/api/watchlist/move-from-cart/${productId}`),
};

export { getToken };
export default api;
