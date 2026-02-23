import axiosInstance from './axiosInstance';
import { AUTH_ENDPOINTS, USER_ENDPOINTS } from './config';

export const authService = {
  // Authentication
  login: (credentials) => axiosInstance.post(AUTH_ENDPOINTS.LOGIN, credentials),
  register: (data) => axiosInstance.post(AUTH_ENDPOINTS.REGISTER, data),
  logout: () => axiosInstance.post(AUTH_ENDPOINTS.LOGOUT),
  
  // Token management
  refreshToken: (refreshToken) => 
    axiosInstance.post(AUTH_ENDPOINTS.REFRESH_TOKEN, { refresh: refreshToken }),
  verifyToken: (token) => 
    axiosInstance.post(AUTH_ENDPOINTS.VERIFY_TOKEN, { token }),
  
  // Password
  changePassword: (data) => axiosInstance.post(USER_ENDPOINTS.CHANGE_PASSWORD, data),
};

export default authService;
