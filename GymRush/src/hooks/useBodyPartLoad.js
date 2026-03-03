import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { gymService, gymStorage } from '../services';

// Hook to fetch "rush" (body‑part load) data for the current gym and date.
export function useBodyPartLoad() {
  const { membership, gymDetails } = useAuth();
  console.log(gymDetails)
  // membership object may differ shape depending on backend version; try multiple fields
  // gymDetails is present when the logged-in user is a gym owner
  const gymIdFromCtx =
    membership?.gym_id ?? membership?.gym?.id ?? gymDetails?.id ?? null;

  // debug: log membership and gymDetails whenever the hook runs to help diagnose missing gym_id
  console.log('[useBodyPartLoad] membership', membership, 'gymDetails', gymDetails);

  const [data, setData] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('current');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const getCurrentRush = useCallback(
    async (dateStr, slot = 'current', overrideGymId = null) => {
      setLoading(true);
      setError(null);

      try {
        let id = overrideGymId || gymIdFromCtx;
        console.log('getcurrentrush , id', id)
        // if still no id, check async storage (e.g. saved from last QR scan)
        if (!id) {
          const stored = await gymStorage.getGymInfo();
          console.log('[useBodyPartLoad] storage value', stored);
          if (stored) {
            id = stored?.gym_id ?? stored?.id ?? null;
          }
        }
        // final attempt using gymService endpoint if nothing else provided
        if (!id) {
          try {
            const info = await gymService.getGymInfo();
            console.log('[useBodyPartLoad] gymInfo fallback', info);
            id = info?.gym_id ?? info?.id ?? null;
          } catch (e) {
            // ignore 404 or other errors, we'll just bail out gracefully
          }
        }

        if (!id) {
          console.warn('[useBodyPartLoad] no gym id available, skipping rush fetch');
          return { data: null };
        }

        // log for debugging network issue
        console.log('[useBodyPartLoad] fetching rush', { id, dateStr, slot });

        const paramsSlot = slot === 'current' ? 'current' : slot;
        const result = await gymService.getCurrentRush(id, dateStr, paramsSlot);
        setData(result);
        return { data: result };
      } catch (err) {
        setError(err);
        console.error('[useBodyPartLoad] error', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [gymIdFromCtx],
  );

  // automatically fetch when slot changes or gym id becomes available
  useEffect(() => {
    // run whenever relevant inputs change; getCurrentRush will handle looking up
    // a gym id internally (via membership or gymInfo fallback).
    const today = new Date().toISOString().split('T')[0];
    console.log('useeffect---', { selectedSlot });
    getCurrentRush(today, selectedSlot).catch(() => {});
  }, [getCurrentRush, selectedSlot]);
// getCurrentRush, selectedSlot, gymIdFromCtx, membership
  return {
    data,
    loading,
    error,
    selectedSlot,
    setSelectedSlot,
    getCurrentRush,
  };
}

export default useBodyPartLoad;
