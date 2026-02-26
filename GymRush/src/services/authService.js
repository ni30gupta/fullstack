import api from './api';
import { ENDPOINTS } from '../constants/config';
// authService should only call APIs and return data.
// Persistence is handled by the AuthProvider (context).

const handleError = (error) => {
  if (error.response) {
    const { data, status } = error.response;
    const message = data?.message || data?.detail || data?.error || 'An error occurred';

    switch (status) {
      case 400:
        return new Error(message || 'Invalid request');
      case 401:
        return new Error('Invalid credentials');
      case 403:
        return new Error('Access denied');
      case 404:
        return new Error('Resource not found');
      case 422:
        return new Error(message || 'Validation error');
      case 500:
        return new Error('Server error. Please try again later.');
      default:
        return new Error(message);
    }
  }

  if (error.request) {
    return new Error('Network error. Please check your connection.');
  }

  return new Error(error.message || 'An unexpected error occurred');
};

export const authService = {
  async login(credentials) {
    try {
      const response = await api.post(ENDPOINTS.AUTH_LOGIN, credentials);
      // Return the raw API response data; AuthProvider will handle persistence/state.
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async register(data) {
    try {
      const response = await api.post(ENDPOINTS.AUTH_REGISTER, data);
      // Return API response; persistence handled by AuthProvider
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async logout() {
    try {
      await api.post(ENDPOINTS.AUTH_LOGOUT);
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Do not clear storage here; AuthProvider is responsible for clearing/persisting state
    }
  },

  async getProfile() {
    try {
      const response = await api.get(ENDPOINTS.AUTH_PROFILE);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async updateProfile(data) {
    try {
      const response = await api.patch(ENDPOINTS.AUTH_PROFILE, data);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async forgotPassword(email) {
    try {
      await api.post(ENDPOINTS.AUTH_FORGOT_PASSWORD, { email });
    } catch (error) {
      throw handleError(error);
    }
  },

  async checkAuthStatus() {
    // Try to fetch current profile from server to validate auth.
    try {
      const profile = await this.getProfile();
      return { isAuthenticated: true, user: profile, tokens: null };
    } catch (error) {
      return { isAuthenticated: false, user: null };
    }
  },
};

export default authService;
