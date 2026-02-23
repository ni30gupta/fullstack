import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService, authStorage, gymStorage } from '../services';

// Initial state - split into auth, user and membership slices
const initialState = {
  auth: { isAuthenticated: false, token: null },
  user: null,
  membership: null,
  isLoading: true,
  error: null,
  activeGymId: null,
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_AUTH':
      return { ...state, auth: { ...state.auth, ...action.payload }, error: null };
    case 'CLEAR_AUTH':
      return {
        ...state,
        auth: { isAuthenticated: false, token: null },
        user: null,
        membership: null,
        error: null,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload?.user ?? action.payload,
      };
    case 'SET_MEMBERSHIP':
      return { ...state, membership: action.payload, activeGymId: action.payload?.gym_id ?? state.activeGymId };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_ACTIVE_GYM':
      return { ...state, activeGymId: action.payload };
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext(undefined);

// Provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const storedUser = await authStorage.getUserProfile();
      const token = await authStorage.getAuthToken();

      if (!token || !storedUser) {
        dispatch({ type: 'CLEAR_AUTH' });
        return;
      }

      // If we have stored credentials, use them (offline-first approach)
      dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: true, token } });
      dispatch({ type: 'SET_USER', payload: storedUser });
      if (storedUser?.active_membership) {
        dispatch({ type: 'SET_MEMBERSHIP', payload: storedUser.active_membership });
      }
      // persistence disabled: not saving stored user gym info to storage

      // Optionally validate with server in background (don't block)
      try {
        const result = await authService.checkAuthStatus();
        const isAuthenticatedServer = result?.isAuthenticated;
        const serverUser = result?.user;
        const serverTokens = result?.tokens ?? { access: result?.token ?? null, refresh: result?.refresh ?? null };
        if (isAuthenticatedServer && serverUser) {
          dispatch({ type: 'SET_USER', payload: serverUser });
          if (serverTokens?.access) {
            dispatch({ type: 'SET_AUTH', payload: { token: serverTokens.access, isAuthenticated: true } });
            // persistence disabled: not saving server tokens to storage
          }
        }
      } catch (error) {
        // Keep using stored user if server check fails
        console.log('Server auth check failed, using cached credentials');
      }
    } catch (error) {
      console.log('Auth check error:', error);
      dispatch({ type: 'CLEAR_AUTH' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = useCallback(async (username, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authService.login({ username, password });
      console.log('res',response)

      const user = response?.user ?? null;
      const tokens = response?.tokens ?? { access: response?.token ?? null, refresh: response?.refresh ?? null };
      const access = tokens?.access ?? null;
      const refresh = tokens?.refresh ?? null;
      const message = response?.message ?? 'Login successful';
      const activeMembership = response?.active_membership ?? response?.activeMembership ?? null;

      if (user) {
        dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: true, token: access } });
        dispatch({ type: 'SET_USER', payload: user });
        dispatch({ type: 'SET_MEMBERSHIP', payload: activeMembership });
        // persistence disabled: not saving profile/tokens/gym info to storage
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: true, user, message };
      }

      dispatch({ type: 'SET_ERROR', payload: message });
      return { success: false, message };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, message: error.message };
    }
  }, []);

  const register = useCallback(async (data) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const registerData = {
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
      };

      const response = await authService.register(registerData);
      // treat register similar to login if server returns token/user
      const user = response?.user ?? null;
      const tokens = response?.tokens ?? { access: response?.token ?? null, refresh: response?.refresh ?? null };
      const access = tokens?.access ?? null;
      const refresh = tokens?.refresh ?? null;
      const activeMembership = response?.active_membership ?? null;
      if (user) {
        dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: true, token: access } });
        dispatch({ type: 'SET_USER', payload: user });
        dispatch({ type: 'SET_MEMBERSHIP', payload: activeMembership });
        // persistence disabled: not saving profile/tokens to storage
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  const setProfile = useCallback(async (profile) => {
    try {
      dispatch({ type: 'SET_USER', payload: profile });
      // persistence disabled: not saving profile or gym info to storage
      try {
        if (profile?.active_membership) {
          dispatch({ type: 'SET_MEMBERSHIP', payload: profile.active_membership });
          dispatch({ type: 'SET_ACTIVE_GYM', payload: profile.active_membership.gym_id });
        }
      } catch (e) {
        console.log('Failed to set active gym on setProfile:', e);
      }
    } catch (e) {
      console.log('Failed to set profile:', e);
    }
  }, []);

  const getProfile = useCallback(async () => {
    try {
      const p = await authStorage.getUserProfile();
      return p;
    } catch (e) {
      return null;
    }
            // persistence disabled: not saving profile/tokens/gym info to storage
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // clear all auth-related state (storage clearing disabled)
      dispatch({ type: 'CLEAR_AUTH' });
    }
  }, []);


  const updateProfile = useCallback(async (data) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      dispatch({ type: 'SET_USER', payload: updatedUser });
    } catch (error) {
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const refreshAuth = useCallback(async () => {
    await checkAuthStatus();
  }, []);

  const value = {
    // flattened helpers for consumers
    isAuthenticated: state.auth?.isAuthenticated ?? false,
    token: state.auth?.token ?? null,
    user: state.user,
    membership: state.membership,
    activeGymId: state.activeGymId,
    isLoading: state.isLoading,
    error: state.error,
    // actions
    login,
    register,
    logout,
    updateProfile,
    setProfile,
    getProfile,
    clearError,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
