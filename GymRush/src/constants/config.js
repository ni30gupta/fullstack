export const API_CONFIG = {
  BASE_URL: 'http://127.0.0.1:8000',            // adb reverse tcp:8000 tcp:8000 active
  // BASE_URL: 'http://192.168.1.9:8000',     // physical device on WiFi (no adb reverse)
  TIMEOUT: 30000,
  VERSION: 'v1',
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@GymRush:authToken',
  REFRESH_TOKEN: '@GymRush:refreshToken',
  USER_PROFILE: '@GymRush:userProfile',
  GYM_DETAILS: '@GymRush:gymDetails',
  GYM_INFO: '@GymRush:gymInfo',
  CURRENT_RUSH: '@GymRush:currentRush',
  ACTIVE_MEMBERSHIP: '@GymRush:activeMembership',
  IS_OWNER: '@GymRush:isOwner',
  UPDATES_BADGE_COUNT: '@GymRush:updatesBadgeCount',
  THEME_PREFERENCE: '@GymRush:themePreference',
};

export const APP_CONFIG = {
  APP_NAME: 'GymRush',
  APP_VERSION: '1.0.0',
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000,
};

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  PHONE_REGEX: /^[0-9]{10}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

// Centralized API endpoint declarations
export const config = {
  // Auth
  AUTH_LOGIN: '/api/auth/login/',
  AUTH_REGISTER: '/api/auth/register/',
  AUTH_REGISTER_GYM: '/api/auth/register-gym/',
  AUTH_LOGOUT: '/api/auth/logout/',
  AUTH_PROFILE: '/api/auth/profile/',
  AUTH_USER_PROFILE: '/api/auth/profiles/me/',
  AUTH_AVATAR: '/api/auth/profiles/me/avatar/',
  AUTH_FORGOT_PASSWORD: '/api/auth/forgot-password/',
  AUTH_TOKEN_REFRESH: '/api/auth/token/refresh/',

  // Gym / checkin
  GYM_INFO: '/api/gym/info/',
  GYM_CHECKIN: '/api/gyms/:id/checkin/',
  GYM_CHECKOUT: '/api/gym/check-out/:id/',
  GYM_CHECKOUT_BASE: '/api/gym/check-out/',
  GYM_SESSIONS: '/api/gym/sessions/',
  GYMS_MY_ACTIVITY: '/api/gyms/my-activity/',
  GYMS_MY_WORKOUTS: '/api/gyms/my-workouts/',
  GYM_SEARCH: '/api/gyms/search/',
  GYM_DETAIL: '/api/gyms/:id/',
  GYM_UPDATES: '/api/gym/updates/',
  GYM_MEMBERS: '/api/gyms/:id/members-list/',
};

export function buildEndpoint(template, params = {}) {
  if (!template) return template;
  let path = template;
  Object.keys(params).forEach((k) => {
    path = path.replace(`:${k}`, encodeURIComponent(String(params[k])));
  });
  return path;
}

// Backwards-compatible alias used by services
export const ENDPOINTS = config;
