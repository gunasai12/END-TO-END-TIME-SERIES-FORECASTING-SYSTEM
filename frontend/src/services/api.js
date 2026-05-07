import axios from 'axios';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      throw new Error('Resource not found');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    } else {
      throw new Error(error.response?.data?.detail || error.message || 'An error occurred');
    }
  }
);

export const apiService = {
  // Get API status
  getStatus: async () => {
    return await api.get('/');
  },

  // Get available states
  getStates: async () => {
    return await api.get('/states');
  },

  // Train models
  trainModels: async (maxStates = 5) => {
    return await api.post('/train', null, {
      params: { max_states: maxStates }
    });
  },

  // Get prediction for a state
  getPrediction: async (state, model = null, days = 56) => {
    const payload = { state, days };
    if (model) {
      payload.model = model;
    }
    return await api.post('/predict', payload);
  },

  // Get forecast for a state
  getForecast: async (state, days = 56) => {
    return await api.get(`/forecast/${state}`, {
      params: { days }
    });
  },

  // Get model comparison
  getModelComparison: async () => {
    return await api.get('/models');
  },

  // Get training summary
  getSummary: async () => {
    return await api.get('/summary');
  },

  // Health check
  healthCheck: async () => {
    return await api.get('/health');
  }
};

export default api;
