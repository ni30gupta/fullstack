import React, { createContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../services/storage';
import { STORAGE_KEYS } from '../constants/config';

const NotificationBadgeContext = createContext({
  badgeCount: 0,
  incrementBadge: () => {},
  resetBadge: () => {},
});

export function NotificationBadgeProvider({ children }) {
  const [badgeCount, setBadgeCount] = useState(0);

  const loadBadgeCount = useCallback(async () => {
    const saved = await storage.get(STORAGE_KEYS.UPDATES_BADGE_COUNT);
    setBadgeCount(Number(saved) || 0);
  }, []);

  const persistBadgeCount = useCallback(async (count) => {
    setBadgeCount(count);
    await storage.set(STORAGE_KEYS.UPDATES_BADGE_COUNT, count);
  }, []);

  const incrementBadge = useCallback(async () => {
    await persistBadgeCount(badgeCount + 1);
  }, [badgeCount, persistBadgeCount]);

  const resetBadge = useCallback(async () => {
    await persistBadgeCount(0);
  }, [persistBadgeCount]);

  useEffect(() => {
    loadBadgeCount();
  }, [loadBadgeCount]);

  return (
    <NotificationBadgeContext.Provider value={{ badgeCount, incrementBadge, resetBadge }}>
      {children}
    </NotificationBadgeContext.Provider>
  );
}

export default NotificationBadgeContext;
