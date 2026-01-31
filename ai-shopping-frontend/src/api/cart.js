import api from './axios';

export const cartAPI = {
  // Get user's cart
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  // Add product to cart
  addToCart: async (productId, quantity = 1) => {
    const response = await api.post('/cart/add', {
      product_id: productId,
      quantity,
    });
    return response.data;
  },

  // Update cart item quantity
  updateCartItem: async (productId, quantity) => {
    const response = await api.put(`/cart/${productId}`, { quantity });
    return response.data;
  },

  // Remove from cart
  removeFromCart: async (productId) => {
    const response = await api.delete(`/cart/${productId}`);
    return response.data;
  },

  // Get cart recovery items
  getCartRecovery: async () => {
    const response = await api.get('/cart/recovery');
    return response.data;
  },

  // Clear entire cart
  clearCart: async () => {
    const response = await api.post('/cart/clear');
    return response.data;
  },
};
