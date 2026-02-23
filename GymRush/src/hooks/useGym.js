import { useState, useEffect, useCallback } from 'react';
import { gymService } from '../services';
import { useCheckin } from '../context';

export function useWorkoutHistory(page = 1) {
  const [sessions, setSessions] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await gymService.getWorkoutHistory(pageNum);
      const results = data?.results ?? [];
      setSessions((prev) => (append ? [...prev, ...results] : results));
      setCount(data?.count ?? 0);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(page); }, [page, fetch]);

  return { sessions, count, loading, error, refetch: () => fetch(1), fetchMore: (p) => fetch(p, true) };
}

export function useTrainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await gymService.getTrainers();
      setTrainers(data ?? []);
    } catch (err) {
      setError(err.message || String(err));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { trainers, loading, error, refetch: fetch };
}

export function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await gymService.getMyBookings();
      setBookings(data ?? []);
    } catch (err) {
      setError(err.message || String(err));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const cancelBooking = useCallback(async (id) => {
    await gymService.cancelBooking(id);
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return { bookings, loading, error, refetch: fetch, cancelBooking };
}

export function useCheckinActions() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setCheckin, clearCheckin, checkedIn } = useCheckin();

  const checkIn = useCallback(async (gymId = null, bodyParts = []) => {
    setLoading(true); setError(null);
    try {
      const s = await gymService.checkIn(gymId, bodyParts);
      setSession(s);
      await setCheckin(s);
      return s;
    } catch (err) {
      setError(err.message || String(err));
      throw err;
    } finally { setLoading(false); }
  }, [setCheckin]);

  const checkOut = useCallback(async () => {
    if (!session) return;
    setLoading(true); setError(null);
    try {
      const res = await gymService.checkOut(session.id);
      setSession(null);
      await clearCheckin();
      return res;
    } catch (err) {
      setError(err.message || String(err));
      throw err;
    } finally { setLoading(false); }
  }, [session, clearCheckin]);

  return { currentSession: session, isCheckedIn: checkedIn, loading, error, checkIn, checkOut };
}

export function useMyActivity() {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setCheckin, clearCheckin } = useCheckin();

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
