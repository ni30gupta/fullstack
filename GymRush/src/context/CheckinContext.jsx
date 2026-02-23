import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { gymService } from '../services';

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
      const payload = action.payload || {};
      const full = payload.full || payload; // support either { full: session } or direct session
      const bodyParts = full.body_parts ?? payload.body_parts ?? state.lastBodyParts;
      const at = full.started_at ?? payload.at ?? state.lastCheckinAt;
      const gymId = full.gym_id ?? state.gymId;
      const gymName = full.gym_name ?? state.gymName;
      const slot = full.slot ?? state.lastSlot;
      const activityIds = full.activity_ids ?? payload.activity_ids ?? state.lastActivityIds;

      return {
        ...state,
        checkedIn: true,
        lastCheckin: full ?? null,
        lastBodyParts: bodyParts,
        lastCheckinAt: at,
        gymId: gymId,
        gymName: gymName,
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

  // on mount, try to restore current activity from backend (`/api/gyms/my-activity/`)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await gymService.getMyActivity();
        if (!mounted) return;
        if (data && Object.keys(data).length > 0) {
          dispatch({ type: 'SET_CHECKIN', payload: { full: data } });
        } else {
          dispatch({ type: 'CLEAR_CHECKIN' });
        }
      } catch (e) {
        // don't block mount on errors; keep checkin cleared
        console.log('Checkin restore error', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // setCheckin now accepts either a full session object or an array of bodyParts
  const setCheckin = useCallback(async (sessionOrBody = []) => {
    try {
      let payload;
      if (sessionOrBody && typeof sessionOrBody === 'object' && (sessionOrBody.gym_id || sessionOrBody.started_at || sessionOrBody.activity_ids)) {
        payload = { full: sessionOrBody };
      } else {
        payload = { checkedIn: true, body_parts: Array.isArray(sessionOrBody) ? sessionOrBody : [], at: new Date().toISOString() };
      }
      dispatch({ type: 'SET_CHECKIN', payload });
    } catch (e) {
      console.log('Checkin setCheckin error', e);
    }
  }, []);

  const clearCheckin = useCallback(async () => {
    try {
      dispatch({ type: 'CLEAR_CHECKIN' });
    } catch (e) {
      console.log('Checkin clearCheckin error', e);
    }
  }, []);

  const value = { ...state, setCheckin, clearCheckin };
  return <CheckinContext.Provider value={value}>{children}</CheckinContext.Provider>;
}

export function useCheckin() {
  const ctx = useContext(CheckinContext);
  if (ctx === undefined) throw new Error('useCheckin must be used within CheckinProvider');
  return ctx;
}

export default CheckinContext;
