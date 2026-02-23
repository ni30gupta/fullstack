import { useState, useEffect, useCallback } from 'react';
import gymService from '../api/gymService';

export const useGymInfo = () => {
  const [gymInfo, setGymInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGymInfo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await gymService.getGymInfo();
      setGymInfo(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch gym info');
      // Mock data for development
      setGymInfo({
        name: 'FitZone Gym',
        logo: null,
        address: '123 Fitness Street, Health City',
        phone: '+1 234 567 890',
        email: 'contact@fitzone.com',
        openingHours: '6:00 AM - 10:00 PM',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGymInfo();
  }, [fetchGymInfo]);

  return { gymInfo, loading, error, refetch: fetchGymInfo };
};
