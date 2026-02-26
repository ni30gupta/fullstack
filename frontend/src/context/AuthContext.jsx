import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [gymDetails, setGymDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    const storedGym = localStorage.getItem('gymDetails');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }

    if (storedGym) {
      try {
        setGymDetails(JSON.parse(storedGym));
      } catch {
        localStorage.removeItem('gymDetails');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authService.login(credentials);
      // Backend returns { user, tokens: { access, refresh }, message }
      const { tokens, user: userData, gym_details } = response.data;
      const accessToken = tokens?.access;
      
      if (!accessToken) {
        throw new Error('No access token in response');
      }
      
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      if (gym_details) {
        localStorage.setItem('gymDetails', JSON.stringify(gym_details));
        setGymDetails(gym_details);
      } else {
        localStorage.removeItem('gymDetails');
        setGymDetails(null);
      }
      setUser(userData);
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Login failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authService.register(data);
      // Backend returns { user, tokens: { access, refresh }, message }
      const { tokens, user: userData } = response.data;
      const accessToken = tokens?.access;
      
      if (!accessToken) {
        throw new Error('No access token in response');
      }
      
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      // registration won't return gym_details; clear any stale gymDetails
      localStorage.removeItem('gymDetails');
      setGymDetails(null);
      setUser(userData);
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('gymDetails');
    setUser(null);
    setGymDetails(null);
  }, []);

  const value = {
    user,
    gymDetails,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
