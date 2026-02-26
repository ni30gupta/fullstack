import { useState, useEffect, useCallback, useContext } from 'react';
import { gymService } from '../services';
import CheckinContext from '../context/CheckinContext';


// checkin actions now live on the CheckinContext provider; keep other hooks here

export function useMyActivity() {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setCheckin, clearCheckin } = useContext(CheckinContext);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await gymService.getMyActivity();
      if (!data || Object.keys(data).length === 0) {
        setActivity(null);
        await clearCheckin();
      } else {
        setActivity(data);
        await setCheckin(data);
      }
      return data;
    } catch (err) {
      setError(err.message || String(err));
      throw err;
    } finally { setLoading(false); }
  }, [setCheckin, clearCheckin]);

  useEffect(() => { fetch(); }, [fetch]);
  return { activity, loading, isLoading: loading, error, refetch: fetch, currentActivity: fetch };
}
