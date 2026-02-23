export const API_CONFIG = {
  BASE_URL: 'http://127.0.0.1:8000',
  TIMEOUT: 30000,
  VERSION: 'v1',
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@GymRush:authToken',
  REFRESH_TOKEN: '@GymRush:refreshToken',
  USER_PROFILE: '@GymRush:userProfile',
  GYM_INFO: '@GymRush:gymInfo',
  ONBOARDING_COMPLETE: '@GymRush:onboardingComplete',
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
