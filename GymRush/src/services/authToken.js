let _token = null;

export function setAuthToken(token) {
  _token = token;
}

export function getAuthToken() {
  return _token;
}

export function clearAuthToken() {
  _token = null;
}

export default { setAuthToken, getAuthToken, clearAuthToken };
