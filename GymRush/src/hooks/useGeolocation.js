import { useState, useCallback, useEffect,  useRef } from 'react';
import { Alert, Linking } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Geolocation from '@react-native-community/geolocation';
import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';

Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
  locationProvider: 'playServices',
});

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  let warmupWatchId = useRef(null);

  useEffect(() => {
    return () => {
      if (warmupWatchId && warmupWatchId.current !== null) {
        Geolocation.clearWatch(warmupWatchId.current);
        warmupWatchId.current = null;
      }
    };
  }, []);


  /**
   * requestPermission — called on Dashboard mount.
   * Asks for location permission and pre-warms the GPS enable dialog
   * so both are out of the way before the user taps Check In.
   */
  const requestPermission = useCallback(async () => {
    try {
      const status = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      if (status === RESULTS.GRANTED) {
        await promptForEnableLocationIfNeeded({
          interval: 10000,
          fastInterval: 5000,
        }).catch(() => { });

        // watchPosition use karo getCurrentPosition ki jagah
        // taaki ID mile aur unmount pe clear kar sako
        warmupWatchId.current = Geolocation.watchPosition(
          () => {
            console.log('[Geolocation] GPS warm-up complete');
            // Ek baar fix mil gaya, ab clear karo
            if (warmupWatchId.current !== null) {
              Geolocation.clearWatch(warmupWatchId.current);
              warmupWatchId.current = null;
            }
          },
          () => { }, // ignore errors
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
        );
      }
    } catch {
      // Silently ignore
    }
  }, []);
  /**
   * getLocation — requests permission, enables GPS if needed, then
   * returns { latitude, longitude }. Throws on denial or GPS failure.
   */
  const getLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Runtime permission
      const status = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      console.log('[Geolocation] permission status:', status);
      if (status === 'denied' || status === 'blocked') {
        throw new Error('Location permission denied');
      }

      // 2. Prompt to enable GPS if it is off
      try {
        const gpsResult = await promptForEnableLocationIfNeeded({
          interval: 10000,
          fastInterval: 5000,
        });
        console.log('[Geolocation] GPS enable result:', gpsResult);
      } catch {
        // User dismissed the dialog — proceed; getCurrentPosition will
        // fail with code 2 if GPS is genuinely still off.
      }

      // 3. Fetch position — try high-accuracy GPS first; if no cached fix
      // exists yet (cold start, code 2), fall back to network/cell location
      // which is always available and accurate enough for a 50 m check.
      console.log('[Geolocation] fetching position…');
      const fetchPosition = (highAccuracy) =>
        new Promise((resolve, reject) => {
          Geolocation.getCurrentPosition(
            loc => resolve({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }),
            err => reject(err),
            {
              enableHighAccuracy: highAccuracy,
              timeout: highAccuracy ? 5000 : 10000,
              maximumAge: highAccuracy ? 3000 : 30000,
            },
          );
        });

      // small helper to pause a bit before retrying the radio
      const wait = ms => new Promise(r => setTimeout(r, ms));

      let coords;
      try {
        coords = await fetchPosition(true);
        console.log('[Geolocation] GPS position:', coords);
      } catch (gpsErr) {
        if (gpsErr?.code === 2) {
          // cold start - give the GPS a moment and try high accuracy once more
          console.warn('[Geolocation] GPS unavailable (cold start), retrying in 2s…');
          await wait(2000);
          try {
            coords = await fetchPosition(true);
            console.log('[Geolocation] GPS position (second attempt):', coords);
          } catch (gpsErr2) {
            if (gpsErr2?.code === 2) {
              // still no fix - fall back to network provider
              console.warn('[Geolocation] still no GPS fix, falling back to network location…');
              coords = await fetchPosition(false);
              console.log('[Geolocation] network position:', coords);
            } else {
              throw gpsErr2;
            }
          }
        } else {
          throw gpsErr;
        }
      }

      return coords;
    } catch (e) {
      const msg = e?.message || 'Failed to get location';
      console.warn('[Geolocation] error — code:', e?.code, 'message:', msg);

      // code 2 = GPS still off after prompt — show alert here and mark as
      // handled so the caller does not show a second alert.
      if (e?.code === 2) {
        Alert.alert(
          'GPS Required',
          'Please enable Location Services in your device settings to check in automatically.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        e.handled = true;
      }

      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getLocation, requestPermission, loading, error };
}

export default useGeolocation;
