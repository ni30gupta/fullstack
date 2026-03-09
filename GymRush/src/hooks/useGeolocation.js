import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { request, PERMISSIONS, checkMultiple } from 'react-native-permissions';
import Geolocation from '@react-native-community/geolocation';
import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState(null);
  const [locPermModal, setLocPermModal] = useState(false);

  /**
   * requestPermission — ask for location permission.
   * Write your own implementation here.
   */
  const requestPermission = useCallback(async () => {
    console.log('[useGeolocation] requestPermission called');
    try {
      const data = [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION, PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION];
      const statuses = await checkMultiple(data);
      console.log('[useGeolocation] permission statuses:', statuses);
      if (Object.values(statuses).find(s => s !== 'granted')) {
        console.log('[useGeolocation] permissions not fully granted → opening modal');
        setLocPermModal(true);
      } else {
        console.log('[useGeolocation] all permissions already granted');
      }
    } catch (err) {
      console.error('[useGeolocation] requestPermission error:', err);
      setError(err?.message || 'Permission check failed');
    }
  }, []);

  /**
   * getLocation — request permission, enable GPS if needed, and return { latitude, longitude }.
   */
  const getLocation = useCallback(async () => {
    console.log('[useGeolocation] getLocation called');
    setLoading(true);
    setError(null);
    try {
      // 1. Request fine location permission
      const status = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      console.log('[useGeolocation] getLocation permission status:', status);
      if (status === 'denied' || status === 'blocked') {
        throw new Error('Location permission denied');
      }

      // 2. Prompt user to enable GPS if it's off
      try {
        const gpsResult = await promptForEnableLocationIfNeeded({
          interval: 10000,
          fastInterval: 5000,
        });
        console.log('[useGeolocation] GPS enable result:', gpsResult);
      } catch (gpsErr) {
        // User dismissed the dialog — GPS might still be on, carry on
        console.warn('[useGeolocation] GPS enable dialog dismissed:', gpsErr?.message);
      }

      // 3. Fetch the actual position
      const coords = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          loc => resolve({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }),
          err => reject(err),
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
        );
      });

      console.log('[useGeolocation] getLocation → coords:', coords);
      setPosition(coords);
      return coords;
    } catch (e) {
      const msg = e?.message || 'Failed to get location';
      console.error('[useGeolocation] getLocation error:', msg);
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);



  const sendCurrentLocation = useCallback(() => {
    console.log('[useGeolocation] sendCurrentLocation called');
    Geolocation.getCurrentPosition(
      loc => {
        const { latitude, longitude } = loc.coords;
        console.log('[useGeolocation] position obtained:', { latitude, longitude, accuracy: loc.coords.accuracy });
        setPosition({ latitude, longitude });
      },
      err => {
        console.warn('[useGeolocation] getCurrentPosition error:', { code: err.code, message: err.message });
        Alert.alert('Error', err.message);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }, []);

  const checkLocationProvider = useCallback(() => {
    console.log('[useGeolocation] checkLocationProvider called → prompting GPS enable');
    promptForEnableLocationIfNeeded({
      interval: 10000,
      fastInterval: 5000,
    })
      .then(data => {
        console.log('[useGeolocation] GPS enable result:', data);
        sendCurrentLocation();
      })
      .catch(err => {
        console.warn('[useGeolocation] GPS enable rejected:', err);
        Alert.alert('', 'Please enable GPS to continue', [
          { text: 'No', onPress: () => console.log('[useGeolocation] user declined GPS enable') },
          { text: 'OK', onPress: () => { console.log('[useGeolocation] user retrying GPS enable'); checkLocationProvider(); } },
        ]);
      });
  }, [sendCurrentLocation]);

  useEffect(() => {
    console.log('[useGeolocation] locPermModal changed:', locPermModal);
    if (locPermModal) {
      console.log('[useGeolocation] modal opened → triggering checkLocationProvider');
      checkLocationProvider();
    }
  }, [locPermModal]);


  return { locPermModal, setLocPermModal, getLocation, requestPermission, checkLocationProvider, sendCurrentLocation, position, loading, error };
}

export default useGeolocation;
