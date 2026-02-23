import axios from 'axios';
import { API_BASE_URL } from './config';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Skip adding Authorization header for auth endpoints (login/register/refresh)
    // Sending an expired/invalid Authorization header causes DRF's JWTAuthentication
    // to raise AuthenticationFailed and return 401 even for AllowAny views (like login).
    const url = config.url || '';
    const isAuthEndpoint = url.includes('/api/auth/login') || url.includes('/api/auth/register') || url.includes('/api/auth/token/refresh');
    if (!isAuthEndpoint) {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/api/auth/login') || url.includes('/api/auth/register');
    
    // Don't redirect on 401 for auth endpoints - let the component handle the error
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
