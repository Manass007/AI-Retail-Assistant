import api from './axios';

export const recommendationsAPI = {
  // Get personalized recommendations
  getRecommendations: async (limit = 10) => {
    const response = await api.get('/recommendations', {
      params: { limit },
    });
    return response.data;
  },

  // Track product view
  trackView: async (productId) => {
    const response = await api.post('/recommendations/track-view', null, {
      params: { product_id: productId },
    });
    return response.data;
  },

  // Get similar products
  getSimilar: async (productId, limit = 6) => {
    const response = await api.get(`/recommendations/similar/${productId}`, {
      params: { limit },
    });
    return response.data;
  },
};
