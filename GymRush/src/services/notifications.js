import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';

const topicName = (gymId) => `gym_${gymId}`;

/**
 * Request notification permission.
 * - Android 13+ (API 33): uses PermissionsAndroid to show the native
 *   POST_NOTIFICATIONS runtime dialog.
 * - Android <13: permission is granted at install time; always returns true.
 * - iOS: delegates to Firebase messaging's requestPermission().
 */
export async function requestNotificationPermission() {
  try {
    if (Platform.OS === 'android') {
      // Android 13+ (API 33) requires a runtime permission request
      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        const granted = result === PermissionsAndroid.RESULTS.GRANTED;
        if (!granted) {
          console.warn('Notification permission not granted');
        }
        return granted;
      }
      // Android <13: notifications are allowed by default
      return true;
    }

    // iOS: use Firebase messaging's requestPermission
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn('Notification permission not granted');
    }
    return enabled;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return false;
  }
}

/**
 * Check whether notification permission has already been granted WITHOUT
 * showing the system prompt.  Use this in places that should silently skip
 * if the user hasn't been asked yet (e.g. topic subscription during init).
 */
export async function hasNotificationPermission() {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const result = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return result;
    }
    if (Platform.OS === 'android') {
      return true; // pre-13 always has permission
    }
    // iOS
    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch (err) {
    console.warn('Failed to check notification permission:', err);
    return false;
  }
}

export async function getDeviceToken() {
  try {
    const token = await getApp().messaging().getToken();
    console.log('fcm token....',token)
    return token;
  } catch (err) {
    console.warn('Failed to get FCM token:', err);
    return null;
  }
}

export async function subscribeGymTopic(gymId) {
  console.log('trying subs for gym id',gymId)
  if (!gymId) return;
  try {
    let is_subscribed = getApp().messaging().subscribeToTopic(topicName(gymId));
    console.log('is_subscribed.......',is_subscribed)

  } catch (err) {
    console.warn('Failed to subscribe to gym topic', gymId, err);
  }
}

export async function unsubscribeGymTopic(gymId) {
  if (!gymId) return;
  try {
    await messaging().unsubscribeFromTopic(topicName(gymId));
  } catch (err) {
    console.warn('Failed to unsubscribe from gym topic', gymId, err);
  }
}

/**
 * Register a listener for FCM messages received while the app is in the
 * foreground.  Returns an unsubscribe function (call it in useEffect cleanup).
 */
export function onForegroundMessage(callback) {
  return messaging().onMessage(callback);
}

/**
 * Register a handler invoked when the user taps a notification that opened
 * the app from a background/quit state.  Returns an unsubscribe function.
 */
export function onNotificationOpenedApp(callback) {
  return messaging().onNotificationOpenedApp(callback);
}
