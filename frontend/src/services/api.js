import axios from 'axios';

// Create an axios instance with default configuration
const api = axios.create({
  baseURL: '/api/v1', // Base URL for the API
  timeout: 10000, // Request timeout
});

// Add a request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API methods for Templates
export const getTemplates = (params) => {
  return api.get('/templates', { params });
};

export const getCategories = () => {
  return api.get('/categories');
};

export const getTags = () => {
  return api.get('/tags');
};

// API methods for Auth (placeholder for now)
export const login = (credentials) => {
  return api.post('/login', credentials);
};

export const register = (userData) => {
  return api.post('/register', userData);
};

export default api;
