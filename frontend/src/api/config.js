// API Base URLs for different services
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const GYM_SERVICE_URL = import.meta.env.VITE_GYM_SERVICE_URL || 'http://localhost:8000';
export const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8000';

// Auth endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login/',
  REGISTER: '/api/auth/register/',
  LOGOUT: '/api/auth/logout/',
  REFRESH_TOKEN: '/api/auth/token/refresh/',
  VERIFY_TOKEN: '/api/auth/token/verify/',
};

// User endpoints
export const USER_ENDPOINTS = {
  PROFILE: '/api/user/profile/',
  UPDATE_PROFILE: '/api/user/profile/',
  CHANGE_PASSWORD: '/api/user/change-password/',
};

// Gym endpoints
export const GYM_ENDPOINTS = {
  INFO: '/api/gym/info/',
  DASHBOARD_STATS: '/api/gym/dashboard/stats/',
  UPDATE_INFO: '/api/gym/info/',
};

// Rush/Load endpoints
export const RUSH_ENDPOINTS = {
  CURRENT:(gym_id, dateStr)=> `/api/gyms/${gym_id}/rush-data/?date=${dateStr}`,
  BY_SLOT: (slotId) => `/api/gym/rush/slot/${slotId}/`,
  BODYPART_LOAD: '/api/gym/bodypart-load/',
};
// api / gyms / 2 / rush - data /
// Slots endpoints
export const SLOT_ENDPOINTS = {
  LIST: '/api/gym/slots/',
  DETAIL: (slotId) => `/api/gym/slots/${slotId}/`,
};

// Members endpoints
export const MEMBER_ENDPOINTS = {
  LIST: (gymId) => `/api/gyms/${gymId}/members-list/`,
  DETAIL: (gymId, memberId) => `/api/gyms/${gymId}/members-list/${memberId}/`,
  CHECK_IN: (gymId) => `/api/gyms/${gymId}/members-list/check-in/`,
  CHECK_OUT: (gymId) => `/api/gyms/${gymId}/members-list/check-out/`,
};

// Equipment endpoints
export const EQUIPMENT_ENDPOINTS = {
  LIST: '/api/gym/equipment/',
  DETAIL: (equipmentId) => `/api/gym/equipment/${equipmentId}/`,
  BY_BODYPART: (bodyPartId) => `/api/gym/equipment/bodypart/${bodyPartId}/`,
};

// Reports endpoints
export const REPORT_ENDPOINTS = {
  DAILY: '/api/gym/reports/daily/',
  WEEKLY: '/api/gym/reports/weekly/',
  MONTHLY: '/api/gym/reports/monthly/',
  CUSTOM: '/api/gym/reports/custom/',
};

// Export all endpoints as a single object for convenience
export const API = {
  AUTH: AUTH_ENDPOINTS,
  USER: USER_ENDPOINTS,
  GYM: GYM_ENDPOINTS,
  RUSH: RUSH_ENDPOINTS,
  SLOTS: SLOT_ENDPOINTS,
  MEMBERS: MEMBER_ENDPOINTS,
  EQUIPMENT: EQUIPMENT_ENDPOINTS,
  REPORTS: REPORT_ENDPOINTS,
};

export default API;
