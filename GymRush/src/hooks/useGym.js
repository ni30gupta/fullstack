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

export function useWorkoutHistory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await gymService.getMyWorkouts();
      // transform API records into shape expected by WorkoutsScreen
      // our new API returns [ {date, body_part, started_at, ended_at, total_time} ]
      const formatted = resp.map((rec) => ({
        // use started_at timestamp plus body part as key to avoid collisions
        id: `${rec.started_at}-${rec.body_part}`,
        date: rec.date,
        type: rec.body_part || 'Unknown',
        startedAt: rec.started_at,
        endedAt: rec.ended_at,
        totalTime: rec.total_time, // seconds
      }));
      setData(formatted);
      return formatted;
    } catch (err) {
      setError(err.message || String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
