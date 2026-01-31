import api from './axios';

export const gamificationAPI = {
  // Spin wheel for discount
  spinWheel: async () => {
    const response = await api.post('/gamification/spin-wheel');
    return response.data;
  },

  // Get user's coupons
  getMyCoupons: async () => {
    const response = await api.get('/gamification/my-coupons');
    return response.data;
  },

  // Use coupon
  useCoupon: async (code) => {
    const response = await api.post(`/gamification/use-coupon/${code}`);
    return response.data;
  },

  // Check if user can spin
  canSpin: async () => {
    const response = await api.get('/gamification/can-spin');
    return response.data;
  },

  // Get points information
  getPointsInfo: async () => {
    const response = await api.get('/gamification/points/info');
    return response.data;
  },

  // Update streak (called from daily check-in)
  updateStreak: async () => {
    const response = await api.post('/gamification/points/update-streak');
    return response.data;
  },
};
