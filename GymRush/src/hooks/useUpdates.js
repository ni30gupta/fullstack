import { useState, useEffect, useCallback } from 'react';
import { gymService } from '../services';

export function useUpdates() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gymService.getUpdates();
      setUpdates(data);
      return data;
    } catch (err) {
      setError(err.message || String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  return { updates, loading, error, refetch: fetchUpdates };
}
