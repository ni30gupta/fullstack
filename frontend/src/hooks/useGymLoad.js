import { useState, useEffect, useCallback } from 'react';
import useBodyPartLoad from './useBodyPartLoad';

export const useGymLoad = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { getCurrentRush } = useBodyPartLoad()
  const simulateLoad = ()=> {
    getCurrentRush()
  }

  useEffect(() => {
    simulateLoad();
  }, []);

  return { isLoading, refetch: simulateLoad };
}