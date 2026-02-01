import axios from 'axios';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
      // Unauthorized - clear token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      // Don't redirect here, let components handle it
    }
    return Promise.reject(error);
  }
);

export default api;
