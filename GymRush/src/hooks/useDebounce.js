import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of the input value. The returned value only
 * updates after the specified delay has elapsed without further changes.
 *
 * This is useful for delaying expensive operations (e.g. API calls) until
 * the user has stopped typing. The hook is generic and can be used with any
 * value type.
 *
 * @param value The value to debounce
 * @param delay Delay in milliseconds (default 300)
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
