import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService, authStorage } from '../services';
import { setAuthToken, clearAuthToken } from '../services/authToken';

// Initial state - split into auth, user and membership slices
const initialState = {
  auth: { isAuthenticated: false, token: null },
  user: null,
  membership: null,
  gymDetails: null,           // for owners
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
        gymDetails: null,
        error: null,
      };
    
      case 'SET_USER':
      return {
        ...state,
        user: action.payload?.user ?? action.payload,
      };
    
      case 'SET_MEMBERSHIP':
      return { ...state, membership: action.payload, activeGymId: action.payload?.gym_id ?? state.activeGymId };
      case 'SET_GYM_DETAILS':
      // owners get a gym_details object instead of active_membership
      return { ...state, gymDetails: action.payload, activeGymId: action.payload?.id ?? state.activeGymId };
    
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
      const membership = await authStorage.getMembership();
      const gymDetails = await authStorage.getGymDetails();

      if (!token || !storedUser) {
        dispatch({ type: 'CLEAR_AUTH' });
        return;
      }

      // offline-first: load whatever we have
      try { setAuthToken(token); } catch (e) {}
      dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: true, token } });
      dispatch({ type: 'SET_USER', payload: storedUser });
      if (membership) {
        dispatch({ type: 'SET_MEMBERSHIP', payload: membership });
      }
      if (gymDetails) {
        dispatch({ type: 'SET_GYM_DETAILS', payload: gymDetails });
      }

      // optionally refresh from server (non-blocking)
      try {
        const result = await authService.checkAuthStatus();
        if (result?.isAuthenticated && result?.tokens?.access) {
          try { setAuthToken(result.tokens.access); } catch (e) {}
          dispatch({ type: 'SET_AUTH', payload: { token: result.tokens.access, isAuthenticated: true } });
          try { await authStorage.saveTokens(result.tokens.access, result.tokens.refresh); } catch (e) {}
        }
        if (result?.user) {
          dispatch({ type: 'SET_USER', payload: result.user });
        }
        if (result?.active_membership) {
          dispatch({ type: 'SET_MEMBERSHIP', payload: result.active_membership });
          try { await authStorage.saveMembership(result.active_membership); } catch (e) {}
        }
        if (result?.gym_details) {
          dispatch({ type: 'SET_GYM_DETAILS', payload: result.gym_details });
          try { await authStorage.saveGymDetails(result.gym_details); } catch (e) {}
        }
      } catch (error) {
        // ignore server validation failure
      }
    } catch (error) {
      console.error('Auth check error:', error);
      dispatch({ type: 'CLEAR_AUTH' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = useCallback(async (username, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // assume backend returns { user, token, active_membership }
      const res = await authService.login({ username, password });
    // backend may return {token} or {tokens: {access,refresh}}
    const user = res?.user ?? null;
    const rawToken = res?.token ?? res?.tokens?.access ?? null;
    const active_membership = res?.active_membership ?? null;
    const message = res?.message;

    if (!user || !rawToken) {
      const errMsg = message || 'Invalid credentials';
      dispatch({ type: 'SET_ERROR', payload: errMsg });
      return { success: false, message: errMsg };
    }
    const token = rawToken; // normalized name

      // persist token + user + membership
      try { setAuthToken(token); } catch (e) {}
      try { await authStorage.saveTokens(token); } catch (e) {}
      try { await authStorage.saveUserProfile(user); } catch (e) {}
      if (active_membership) {
        try { await authStorage.saveMembership(active_membership); } catch (e) {}
      }
      if (res?.gym_details) {
        try { await authStorage.saveGymDetails(res.gym_details); } catch (e) {}
      }

      dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: true, token } });
      dispatch({ type: 'SET_USER', payload: user });
      if (active_membership) {
        dispatch({ type: 'SET_MEMBERSHIP', payload: active_membership });
      }
      if (res?.gym_details) {
        dispatch({ type: 'SET_GYM_DETAILS', payload: res.gym_details });
      }
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: true, user };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, message: error.message };
    }
  }, []);

  const register = useCallback(async (data) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const payload = {
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
      };
      const { user = null, token = null, active_membership = null } =
        await authService.register(payload);

      if (user && token) {
        try { setAuthToken(token); } catch (e) {}
        try { await authStorage.saveTokens(token); } catch (e) {}
        await authStorage.saveUserProfile(user);
        if (active_membership) {
          await authStorage.saveMembership(active_membership);
        }
        if (res?.gym_details) {
          await authStorage.saveGymDetails(res.gym_details);
        }
        dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: true, token } });
        dispatch({ type: 'SET_USER', payload: user });
        if (active_membership) {
          dispatch({ type: 'SET_MEMBERSHIP', payload: active_membership });
        }
        if (res?.gym_details) {
          dispatch({ type: 'SET_GYM_DETAILS', payload: res.gym_details });
        }
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
        // ignore profile set errors
      }
    } catch (e) {
      // ignore profile set errors
    }
  }, []);

  const getProfile = useCallback(async () => {
    try {
      return await authStorage.getUserProfile();
    } catch (e) {
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // clear in-memory token and all auth-related state
      try { clearAuthToken(); } catch (e) { /* ignore */ }
      try { await authStorage.clearAll(); } catch (e) { /* ignore */ }
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
    gymDetails: state.gymDetails,
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
export default AuthContext;
