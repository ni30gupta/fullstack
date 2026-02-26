import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context';
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
  
  
  const { gymDetails, membership } = useAuth();
  const gymId = gymDetails?.id || membership?.gym_id || null;

  const getCurrentRush = useCallback(async (dateStr, slot = null, overrideGymId = null) => {
    console.log('hook', dateStr);
    const id = overrideGymId || gymId;
    if (!id) {
      throw new Error('gym_id is required for getCurrentRush');
    }
    try {
      const effectiveSlot = slot || 'current';
    const data = await gymService.getCurrentRush(id, dateStr, effectiveSlot);
      console.log('in hook data', data);
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, [gymId]);

  


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
    getCurrentRush();
  }, [getCurrentRush]);

  const changeSlot = useCallback((slotId) => {
    setSelectedSlot(slotId);
    fetchBodyPartLoad(slotId === 'current' ? null : slotId);
  }, [getCurrentRush]);

  return {
    // bodyPartLoad,
    // slots,
    // selectedSlot,
    // changeSlot,
    loading,
    error,
    getCurrentRush,
    refetch: () => getCurrentRush(selectedSlot === 'current' ? null : selectedSlot),
  };
};

export default useBodyPartLoad;
