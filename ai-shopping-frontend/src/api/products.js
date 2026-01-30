import api from './axios';

export const productsAPI = {
  // Get all products with filters
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // Get single product
  getProduct: async (productId) => {
    const response = await api.get(`/products/${productId}`);
    return response.data;
  },

  // Get products by category
  getByCategory: async (category, limit = 20) => {
    const response = await api.get(`/products/category/${category}`, {
      params: { limit },
    });
    return response.data;
  },

  // Request stock notification
  notifyMe: async (productId) => {
    const response = await api.post('/products/notify-me', null, {
      params: { product_id: productId },
    });
    return response.data;
  },
};
