import { useState, useEffect, useCallback } from 'react';
import gymService from '../api/gymService';

// Mock body part load data for development
const mockBodyPartLoad = {
  current: [
    { id: 1, name: 'Chest', icon: '💪', currentLoad: 75, maxCapacity: 20, currentUsers: 15 },
    { id: 2, name: 'Back', icon: '🔙', currentLoad: 45, maxCapacity: 15, currentUsers: 7 },
    { id: 3, name: 'Legs', icon: '🦵', currentLoad: 90, maxCapacity: 25, currentUsers: 23 },
    { id: 4, name: 'Shoulders', icon: '🏋️', currentLoad: 30, maxCapacity: 10, currentUsers: 3 },
    { id: 5, name: 'Arms', icon: '💪', currentLoad: 60, maxCapacity: 12, currentUsers: 7 },
    { id: 6, name: 'Core', icon: '🎯', currentLoad: 20, maxCapacity: 15, currentUsers: 3 },
    { id: 7, name: 'Cardio', icon: '🏃', currentLoad: 85, maxCapacity: 30, currentUsers: 26 },
  ],
  slots: [
    { id: 'current', label: 'Current' },
    { id: 'next', label: 'Next Slot (7:00 AM - 8:00 AM)' },
    { id: 'next2', label: 'Next +1 (8:00 AM - 9:00 AM)' },
    { id: 'next3', label: 'Next +2 (9:00 AM - 10:00 AM)' },
  ],
};

export const useBodyPartLoad = ( ) => {
  
  const [bodyPartLoad, setBodyPartLoad] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('current');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  
  const getCurrentRush = useCallback(async (dateStr) => {
    console.log('hook', dateStr);
    try {
      const data = await gymService.getCurrentRush(2, dateStr);
      console.log('in hook data',data);
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  
  const fetchBodyPartLoad = useCallback(async (slotId = null) => {
    try {
      setLoading(true);
      const response = await gymService.getBodyPartLoad(slotId);
      setBodyPartLoad(response.data.bodyParts || response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch body part load');
      // Use mock data for development
      setBodyPartLoad(mockBodyPartLoad.current);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSlots = useCallback(async () => {
    try {
      const response = await gymService.getAvailableSlots();
      setSlots(response.data);
    } catch (err) {
      // Use mock slots for development
      setSlots(mockBodyPartLoad.slots);
    }
  }, []);

  useEffect(() => {
    // On mount fetch available slots and initial body part load
    fetchBodyPartLoad();
  }, [ fetchBodyPartLoad]);

  const changeSlot = useCallback((slotId) => {
    setSelectedSlot(slotId);
    fetchBodyPartLoad(slotId === 'current' ? null : slotId);
  }, [fetchBodyPartLoad]);

  return {
    // bodyPartLoad,
    // slots,
    // selectedSlot,
    // changeSlot,
    loading,
    error,
    getCurrentRush,
    refetch: () => fetchBodyPartLoad(selectedSlot === 'current' ? null : selectedSlot),
  };
};

export default useBodyPartLoad;
