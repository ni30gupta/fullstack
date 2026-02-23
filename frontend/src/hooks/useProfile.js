import { useState, useEffect, useCallback } from 'react';
import gymService from '../api/gymService';

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await gymService.getProfile();
      setProfile(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch profile');
      // Mock data for development
      setProfile({
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        avatar: null,
        role: 'Admin',
        memberSince: '2024-01-15',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
};

export default useProfile;
