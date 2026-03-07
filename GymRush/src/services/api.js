import axios from 'axios';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { API_CONFIG } from '../constants/config';
import { authStorage } from './storage';
import { getAuthToken as getInMemoryToken, setAuthToken } from './authToken';
import { ENDPOINTS } from '../constants/config';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    let token = getInMemoryToken();
    if (!token) {
      token = await authStorage.getAuthToken();
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await authStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH_TOKEN_REFRESH}`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          try { await authStorage.saveTokens(access, refreshToken); } catch (e) {}
          try { setAuthToken(access); } catch (e) {}

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

  // File uploads use ReactNativeBlobUtil to stream directly from disk.
  // Axios/fetch/XHR cannot reliably handle file:// URIs in React Native.
  async uploadFile(url, fileAsset) {
    let token = getInMemoryToken();
    if (!token) token = await authStorage.getAuthToken();

    const response = await ReactNativeBlobUtil.fetch(
      'POST',
      `${API_CONFIG.BASE_URL}${url}`,
      {
        Authorization: token ? `Bearer ${token}` : undefined,
        'Content-Type': 'multipart/form-data',
      },
      [
        {
          name: 'profile_image',
          filename: fileAsset.fileName ?? 'avatar.jpg',
          type: fileAsset.type ?? 'image/jpeg',
          data: ReactNativeBlobUtil.wrap(fileAsset.uri.replace('file://', '')),
        },
      ]
    );

    const status = response.respInfo.status;
    const json = JSON.parse(response.data);

    if (status < 200 || status >= 300) {
      const err = new Error(json?.error || json?.detail || 'Upload failed');
      err.response = { status, data: json };
      throw err;
    }

    return { data: json };
  },
};

export default api;
