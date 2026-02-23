import { useState, useCallback } from 'react';

export function useAsync(asyncFunction, immediate = false) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(immediate);

  const execute = useCallback(
    async (...args) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await asyncFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err.message || 'An error occurred');
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, error, isLoading, execute, reset, setData };
}

export default useAsync;
