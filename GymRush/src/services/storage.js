import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';

export const storage = {
  async set(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      throw error;
    }
  },

  async get(key) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  },

  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  },

  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },
};

export const authStorage = {
  async saveTokens(authToken, refreshToken) {
    await storage.set(STORAGE_KEYS.AUTH_TOKEN, authToken);
    if (refreshToken) {
      await storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  },

  async getAuthToken() {
    return await storage.get(STORAGE_KEYS.AUTH_TOKEN);
  },

  async getRefreshToken() {
    return await storage.get(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async clearTokens() {
    await storage.remove(STORAGE_KEYS.AUTH_TOKEN);
    await storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async saveUserProfile(profile) {
    await storage.set(STORAGE_KEYS.USER_PROFILE, profile);
  },

  async getUserProfile() {
    return await storage.get(STORAGE_KEYS.USER_PROFILE);
  },

  async clearUserProfile() {
    await storage.remove(STORAGE_KEYS.USER_PROFILE);
  },

  async saveMembership(membership) {
    await storage.set(STORAGE_KEYS.ACTIVE_MEMBERSHIP, membership);
  },

  async getMembership() {
    return await storage.get(STORAGE_KEYS.ACTIVE_MEMBERSHIP);
  },

  async clearMembership() {
    await storage.remove(STORAGE_KEYS.ACTIVE_MEMBERSHIP);
  },

  async saveGymDetails(details) {
    await storage.set(STORAGE_KEYS.GYM_DETAILS, details);
  },

  async getGymDetails() {
    return await storage.get(STORAGE_KEYS.GYM_DETAILS);
  },

  async clearGymDetails() {
    await storage.remove(STORAGE_KEYS.GYM_DETAILS);
  },

  async clearAll() {
    await this.clearTokens();
    await this.clearUserProfile();
    await this.clearMembership();
    await this.clearGymDetails();
    await storage.remove(STORAGE_KEYS.GYM_INFO);
  },
};

export const gymStorage = {
  async saveGymInfo(gymInfo) {
    await storage.set(STORAGE_KEYS.GYM_INFO, gymInfo);
  },

  async getGymInfo() {
    return await storage.get(STORAGE_KEYS.GYM_INFO);
  },

  async clearGymInfo() {
    await storage.remove(STORAGE_KEYS.GYM_INFO);
  },

  async saveCurrentRush(rushInfo) {
    await storage.set(STORAGE_KEYS.CURRENT_RUSH, rushInfo);
  },

  async getCurrentRush() {
    return await storage.get(STORAGE_KEYS.CURRENT_RUSH);
  },

  async clearCurrentRush() {
    await storage.remove(STORAGE_KEYS.CURRENT_RUSH);
  },
};
