import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import { gymService } from '../services';
import { useAuth } from '../hooks';

const initialState = {
  checkedIn: false,
  lastCheckin: null,
  lastBodyParts: [],
  lastCheckinAt: null,
  gymId: null,
  gymName: null,
  lastSlot: null,
  lastActivityIds: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CHECKIN': {
      const session = action.payload ?? null;
      // normalize session id: backend groups activities and returns `activity_ids`.
      // if a top-level `id` is missing, use the first activity id as the session id.
      const sessionId = session?.id ?? (session?.activity_ids && session.activity_ids.length ? session.activity_ids[0] : null);
      const sessionWithId = session ? { ...session, id: sessionId } : null;
      const bodyParts = session?.body_parts ?? [];
      const at = sessionWithId?.started_at ?? null;
      const gymId = sessionWithId?.gym_id ?? null;
      const gymName = sessionWithId?.gym_name ?? null;
      const slot = sessionWithId?.slot ?? null;
      const activityIds = sessionWithId?.activity_ids ?? [];

      return {
        ...state,
        checkedIn: !!sessionWithId,
        lastCheckin: sessionWithId,
        lastBodyParts: bodyParts,
        lastCheckinAt: at,
        gymId,
        gymName,
        lastSlot: slot,
        lastActivityIds: activityIds,
      };
    }
    case 'CLEAR_CHECKIN':
      return { ...initialState };
    default:
      return state;
  }
}

const CheckinContext = createContext(undefined);

export function CheckinProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { isAuthenticated } = useAuth();

  // Restore current activity when authenticated (or on mount if already authenticated)
  useEffect(() => {
    let mounted = true;
    if (!isAuthenticated) {
      // don't attempt restore until we have a valid auth token
      return () => { mounted = false; };
    }

    (async () => {
      try {
        const data = await gymService.getMyActivity();
        if (!mounted) return;
        if (data && Object.keys(data).length > 0) {
          dispatch({ type: 'SET_CHECKIN', payload: data });
        } else {
          dispatch({ type: 'CLEAR_CHECKIN' });
        }
      } catch (e) {
        // ignore restore errors
      }
    })();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  // setCheckin expects a full session object (the API response)
  const setCheckin = useCallback(async (session) => {
      try {
      if (!session || typeof session !== 'object') {
        return;
      }
      dispatch({ type: 'SET_CHECKIN', payload: session });
    } catch (e) {
      // ignore setCheckin errors
    }
  }, []);

  const clearCheckin = useCallback(async () => {
    try {
      dispatch({ type: 'CLEAR_CHECKIN' });
    } catch (e) {
      // ignore clearCheckin errors
    }
  }, []);

  // local loading/error for async checkin actions
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkIn = useCallback(async (gymId = null, bodyParts = []) => {
    setLoading(true); setError(null);
    try {
      const session = await gymService.checkIn(gymId, bodyParts);
      await setCheckin(session);
      return session;
    } catch (e) {
      setError(e?.message || String(e));
      throw e;
    } finally { setLoading(false); }
  }, [setCheckin]);

  // checkOut(sessionId?) - if sessionId provided, checkout that activity; otherwise checkout all activities for current gym
  const checkOut = useCallback(async (sessionId = null) => {
    console.log('CheckinContext.checkOut() called, explicit sessionId:', sessionId);
    setLoading(true); setError(null);
    try {
      let res;
      if (sessionId) {
        console.log('CheckinContext.checkOut: calling gymService.checkOut with id', sessionId);
        res = await gymService.checkOut(sessionId);
      } else {
        console.log('CheckinContext.checkOut: calling gymService.checkOut (bulk for current gym)');
        res = await gymService.checkOut();
      }
      console.log('CheckinContext.checkOut: gymService.checkOut response', res);
      // clear local checkin state when we've successfully checked out
      await clearCheckin();
      console.log('CheckinContext.checkOut: cleared local checkin state');
      return res;
    } catch (e) {
      console.error('CheckinContext.checkOut error', e);
      setError(e?.message || String(e));
      throw e;
    } finally { setLoading(false); }
  }, [clearCheckin]);

  const value = { ...state, setCheckin, clearCheckin, checkIn, checkOut, loading, error };
  return <CheckinContext.Provider value={value}>{children}</CheckinContext.Provider>;
}


export default CheckinContext;
