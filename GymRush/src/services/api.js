import axios from 'axios';
import { API_CONFIG } from '../constants/config';
import { authStorage } from './storage';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});
// Add debug logging to help diagnose network issues from the app
apiClient.interceptors.request.use(
  async (config) => {
    // attach token if available
    const token = await authStorage.getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Diagnostic log
    try {
      // eslint-disable-next-line no-console
      console.log('[api] Request:', config.method?.toUpperCase(), config.baseURL + config.url, config.data || config.params || '');
    } catch (e) {}

    return config;
  },
  (error) => {
    // eslint-disable-next-line no-console
    console.error('[api] Request error:', error.message || error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    // eslint-disable-next-line no-console
    console.log('[api] Response:', response.status, response.config?.url);
    return response;
  },
  async (error) => {
    // Log the error details for debugging
    try {
      // eslint-disable-next-line no-console
      console.error('[api] Response error:', error?.response?.status, error?.config?.url, error?.message);
    } catch (e) {}
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await authStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_CONFIG.BASE_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          await authStorage.saveTokens(access, refreshToken);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          await authStorage.clearAll();
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export const api = {
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  patch: (url, data, config) => apiClient.patch(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),
};

export default api;
