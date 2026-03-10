import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from './useAuth';
import { gymService, gymStorage } from '../services';

// we'll expose the same values that the old hook returned
const BodyPartLoadContext = React.createContext(null);

export function BodyPartLoadProvider({ children }) {
  const { membership, gymDetails } = useAuth();
  const gymIdFromCtx =
    membership?.gym_id ?? membership?.gym?.id ?? gymDetails?.id ?? null;

  // debug logging helps debug missing gym id
  console.log('[BodyPartLoad] membership', membership, 'gymDetails', gymDetails);

  const [data, setData] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('current');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentRush = useCallback(
    async (dateStr, slot = 'current', overrideGymId = null) => {
      let id = overrideGymId || gymIdFromCtx;
      console.log('[BodyPartLoad] getCurrentRush, id', id);
      if (!id) {
        try {
          const stored = await gymStorage.getGymInfo();
          console.log('[BodyPartLoad] storage value', stored);
          if (stored) {
            id = stored?.gym_id ?? stored?.id ?? null;
          }
        } catch (e) {
          // ignore
        }
      }
      if (!id) {
        console.warn('[BodyPartLoad] no gym id available, skipping rush fetch');
        return { data: null };
      }

      setLoading(true);
      setError(null);

      try {
        const stored = await gymStorage.getGymInfo();
        console.log('[BodyPartLoad] storage value', stored);
        if (stored) {
          id = stored?.gym_id ?? stored?.id ?? null;
        }

        if (!id) {
          try {
            const info = await gymService.getGymInfo();
            console.log('[BodyPartLoad] gymInfo fallback', info);
            id = info?.gym_id ?? info?.id ?? null;
          } catch (e) {
            // swallow
          }
        }

        if (!id) {
          console.warn('[BodyPartLoad] no gym id available, skipping rush fetch');
          return { data: null };
        }

        console.log('[BodyPartLoad] fetching rush', { id, dateStr, slot });
        const paramsSlot = slot === 'current' ? 'current' : slot;
        const result = await gymService.getCurrentRush(id, dateStr, paramsSlot);
        setData(result);
        return { data: result };
      } catch (err) {
        setError(err);
        console.error('[BodyPartLoad] error', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [gymIdFromCtx],
  );

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    console.log('[BodyPartLoad] auto-fetch', { selectedSlot });
    getCurrentRush(today, selectedSlot).catch(() => {});
  }, [getCurrentRush, selectedSlot]);

  const value = {
    data,
    loading,
    error,
    selectedSlot,
    setSelectedSlot,
    getCurrentRush,
  };

  return (
    <BodyPartLoadContext.Provider value={value}>
      {children}
    </BodyPartLoadContext.Provider>
  );
}

export function useBodyPartLoad() {
  const ctx = useContext(BodyPartLoadContext);
  if (!ctx) {
    throw new Error('useBodyPartLoad must be used within a BodyPartLoadProvider');
  }
  return ctx;
}

export default useBodyPartLoad;
