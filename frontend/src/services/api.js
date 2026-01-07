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

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login page
      // Using window.location to ensure a full redirect, 
      // though ideally we could use a history object if we had access to it outside of React context
      if (window.location.pathname !== '/login') {
         window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API methods for Templates
export const getTemplates = (params) => {
  return api.get('/templates', { params });
};

export const getCategories = (params) => {
  return api.get('/categories', { params });
};

export const getTags = (params) => {
  return api.get('/tags', { params });
};

export const createTemplate = (templateData) => {
  return api.post('/templates', templateData);
};

export const getTemplate = (id) => {
  return api.get(`/templates/${id}`);
};

export const updateTemplate = (id, templateData) => {
  return api.put(`/templates/${id}`, templateData);
};

export const deleteTemplate = (id) => {
  return api.delete(`/templates/${id}`);
};

export const listTemplateVersions = (templateId, params) => {
  return api.get(`/templates/${templateId}/versions`, { params });
};

// API methods for Prompts
export const createPrompt = (promptData) => {
  return api.post('/prompts', promptData);
};

export const listPrompts = (params) => {
  return api.get('/prompts', { params });
};

export const deletePrompt = (id) => {
  return api.delete(`/prompts/${id}`);
};

// API methods for Auth (placeholder for now)
export const login = (credentials) => {
  return api.post('/login', credentials);
};

export const register = (userData) => {
  return api.post('/register', userData);
};

export default api;
