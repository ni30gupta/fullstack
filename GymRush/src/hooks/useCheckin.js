import { useContext } from 'react';
import CheckinContext from '../context/CheckinContext';

export function useCheckin() {
  const ctx = useContext(CheckinContext);
  if (ctx === undefined) throw new Error('useCheckin must be used within CheckinProvider');
  return ctx;
}

export default useCheckin;
