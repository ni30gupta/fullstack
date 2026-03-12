// Centralized API endpoint declarations
// Use plain path strings; use `buildEndpoint` to substitute params like :id
const ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/api/auth/login/',
  AUTH_REGISTER: '/api/auth/register/',
  AUTH_REGISTER_GYM: '/api/auth/register-gym/',
  AUTH_LOGOUT: '/api/auth/logout/',
  AUTH_PROFILE: '/api/auth/profile/',
  AUTH_FORGOT_PASSWORD: '/api/auth/forgot-password/',
  AUTH_TOKEN_REFRESH: '/api/auth/token/refresh/',

  // Gym / checkin
  GYM_INFO: '/api/gym/info/',
  GYM_CHECKIN: '/api/gyms/:id/checkin/',
  GYM_CHECKOUT: '/api/gym/check-out/:id/',
  GYM_SESSIONS: '/api/gym/sessions/',
  GYMS_MY_ACTIVITY: '/api/gyms/my-activity/',
  GYM_DETAIL: '/api/gyms/:id/',
};

function buildEndpoint(template, params = {}) {
  if (!template) return template;
  let path = template;
  Object.keys(params).forEach((k) => {
    path = path.replace(`:${k}`, encodeURIComponent(String(params[k])));
  });
  return path;
}

export { ENDPOINTS, buildEndpoint };
