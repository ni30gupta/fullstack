// Format date to human-readable string
export const formatDate = (dateString, options = {}) => {
  const date = new Date(dateString);
  const defaultOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  return date.toLocaleDateString('en-US', defaultOptions);
};

// Format time to human-readable string
export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Format duration in minutes to human-readable
export const formatDuration = (minutes) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '?';
  const names = name.trim().split(' ');
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return names[0].substring(0, 2).toUpperCase();
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Truncate text with ellipsis
export const truncate = (str, length = 50) => {
  if (!str || str.length <= length) return str;
  return `${str.substring(0, length)}...`;
};

// Validate email format
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validate phone format
export const isValidPhone = (phone) => {
  const regex = /^[+]?[\d\s-]{10,}$/;
  return regex.test(phone);
};

// Delay helper for async operations
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Parse error message from API response
export const parseError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.message) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
