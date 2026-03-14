import React, { createContext, useReducer, useEffect, useCallback, useRef, useMemo } from 'react';
import { authService, authStorage } from '../services';
import { setAuthToken, clearAuthToken } from '../services/authToken';
import {
  hasNotificationPermission,
  subscribeGymTopic,
  unsubscribeGymTopic,
} from '../services/notifications';

// Initial state
const initialState = {
  isAuthenticated: false,
  token: null,
  user: null,
  membership: null,
  gymDetails: null,
  isOwner: false,
  isLoading: true,
  error: null,
  activeGymId: null,
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_TOKENS':
      return { ...state, isAuthenticated: true, token: action.payload, error: null };
    
    case 'SET_PROFILE':
      return {
        ...state,
        user: { ...action.payload.user, profile: action.payload.profile },
        membership: action.payload.active_membership ?? null,
        gymDetails: action.payload.gym_details ?? null,
        isOwner: action.payload.is_owner ?? false,
        activeGymId: action.payload.active_membership?.gym_id ?? action.payload.gym_details?.id ?? state.activeGymId,
      };
    
    case 'UPDATE_AVATAR':
      return {
        ...state,
        user: state.user
          ? { ...state.user, profile: { ...state.user.profile, profile_image: action.payload } }
          : state.user,
      };

    case 'CLEAR_AUTH':
      return { ...initialState, isLoading: false };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext(undefined);

// Provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const isFetchingProfile = useRef(false);
  const subscribedGymRef = useRef(null);

  // Helper: persist tokens and update state
  const saveTokens = useCallback(async (access, refresh) => {
    setAuthToken(access);
    await authStorage.saveTokens(access, refresh);
    dispatch({ type: 'SET_TOKENS', payload: access });
  }, []);

  // Helper: persist profile data to storage
  const persistProfile = useCallback(async (profileData) => {
    const { user, active_membership, gym_details, is_owner } = profileData;
    await Promise.all([
      user && authStorage.saveUserProfile(user),
      active_membership && authStorage.saveMembership(active_membership),
      gym_details && authStorage.saveGymDetails(gym_details),
      authStorage.saveIsOwner(is_owner ?? false),
    ].filter(Boolean));
  }, []);

  const updateTopicSubscription = useCallback(async (gymId) => {
    // Only subscribe if permission was already granted (never prompt here).
    // The actual permission prompt is handled by DashboardScreen on mount.
    const granted = await hasNotificationPermission();
    if (!granted) {
      return;
    }

    // If the user is already subscribed to a gym topic, unsubscribe first.
    if (subscribedGymRef.current && subscribedGymRef.current !== gymId) {
      await unsubscribeGymTopic(subscribedGymRef.current);
      subscribedGymRef.current = null;
    }

    if (gymId) {
      await subscribeGymTopic(gymId);
      subscribedGymRef.current = gymId;
    }
  }, []);

  // Fetch profile from server
  const fetchProfile = useCallback(async () => {
    if (isFetchingProfile.current) return;
    isFetchingProfile.current = true;

    try {
      const profileData = await authService.getProfile();
      dispatch({ type: 'SET_PROFILE', payload: profileData });
      await persistProfile(profileData);

      const gymId = profileData?.active_membership?.gym_id ?? profileData?.gym_details?.id;
      await updateTopicSubscription(gymId);

      return profileData;
    } finally {
      isFetchingProfile.current = false;
    }
  }, [persistProfile, updateTopicSubscription]);

  // Initialize auth on mount
  const initializeAuth = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const token = await authStorage.getAuthToken();
      if (!token) {
        dispatch({ type: 'CLEAR_AUTH' });
        return;
      }

      setAuthToken(token);
      dispatch({ type: 'SET_TOKENS', payload: token });
      
      // Load cached data (offline-first)
      const [user, membership, gymDetails, cachedIsOwner] = await Promise.all([
        authStorage.getUserProfile(),
        authStorage.getMembership(),
        authStorage.getGymDetails(),
        authStorage.getIsOwner(),
      ]);
      
      if (user) {
        dispatch({ 
          type: 'SET_PROFILE', 
          payload: { user, active_membership: membership, gym_details: gymDetails, is_owner: cachedIsOwner ?? false }
        });
        const gymId = membership?.gym_id ?? gymDetails?.id;
        await updateTopicSubscription(gymId);
      }

      // Refresh from server
      try {
        const profileData = await fetchProfile();
        const gymId = profileData?.active_membership?.gym_id ?? profileData?.gym_details?.id;
        await updateTopicSubscription(gymId);
      } catch (e) {
        if (e.message?.includes('401') || e.message?.includes('Unauthorized')) {
          await authStorage.clearAll();
          dispatch({ type: 'CLEAR_AUTH' });
        }
      }
    } catch (error) {
      console.error('Auth init error:', error);
      dispatch({ type: 'CLEAR_AUTH' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [fetchProfile, updateTopicSubscription]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Auth actions
  const login = useCallback(async (username, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      const tokens = await authService.login({ username, password });
      if (!tokens?.access) {
        const errMsg = tokens?.error || 'Invalid credentials';
        dispatch({ type: 'SET_ERROR', payload: errMsg });
        return { success: false, message: errMsg };
      }

      await saveTokens(tokens.access, tokens.refresh);
      await fetchProfile();
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, message: error.message };
    }
  }, [saveTokens, fetchProfile]);

  const register = useCallback(async (data) => {
    try {
      const tokens = await authService.register({
        username: data.username,
        password: data.password,
        password2: data.password2 || data.confirmPassword,
        gym_name: data.gymName,
      });
      
      if (!tokens?.access) {
        return { success: false, message: tokens?.error || 'Registration failed' };
      }

      await saveTokens(tokens.access, tokens.refresh);
      await fetchProfile();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [saveTokens, fetchProfile]);

  const registerGym = useCallback(async (data) => {
    try {
      const tokens = await authService.registerGym({
        username: data.username,
        password: data.password,
        password2: data.password2 || data.confirmPassword,
        gym_name: data.gymName,
        gym_address: data.gymAddress,
        gym_type: data.gymType,
        latitude: data.latitude,
        longitude: data.longitude,
      });
      
      if (!tokens?.access) {
        return { success: false, message: tokens?.error || 'Registration failed' };
      }

      await saveTokens(tokens.access, tokens.refresh);
      await fetchProfile();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [saveTokens, fetchProfile]);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch {}
    if (subscribedGymRef.current) {
      await unsubscribeGymTopic(subscribedGymRef.current);
      subscribedGymRef.current = null;
    }
    clearAuthToken();
    await authStorage.clearAll();
    dispatch({ type: 'CLEAR_AUTH' });
  }, []);

  const refreshProfile = useCallback(async () => {
    try { await fetchProfile(); } catch (e) { console.warn('Refresh profile failed:', e); }
  }, [fetchProfile]);

  const uploadAvatar = useCallback(async (imageAsset) => {
    const data = await authService.uploadAvatar(imageAsset);
    // update only the avatar field in state — no need for a full profile refetch
    dispatch({ type: 'UPDATE_AVATAR', payload: data.profile_image });
    return data;
  }, []);

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);

  const value = useMemo(() => ({
    ...state,
    login,
    register,
    registerGym,
    logout,
    uploadAvatar,
    refreshProfile,
    clearError,
  }), [state, login, register, registerGym, logout, uploadAvatar, refreshProfile, clearError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
