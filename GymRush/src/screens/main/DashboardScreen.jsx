import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, GymRush, ActiveSessionCard, OverlayLoader } from '../../components';
import { useAuth, useCheckin, useBodyPartLoad, useGeolocation } from '../../hooks';
import { gymService } from '../../services';
import { requestNotificationPermission, getDeviceToken, subscribeGymTopic } from '../../services/notifications';
import { COLORS, SIZES } from '../../constants/theme';
import { getDistanceMeters } from '../../utils';
import { useState, useEffect, useCallback, useRef } from 'react';

const GYM_CHECKIN_RADIUS_METERS = 50;

export const DashboardScreen = ({ navigation }) => {
  const { user, membership, activeGymId, refreshProfile } = useAuth();
  const { lastCheckin, checkedIn: isCheckedIn, checkIn, checkOut, loading: checkInLoading, setCheckin, clearCheckin } = useCheckin();
  const { getCurrentRush, loading: rushLoading } = useBodyPartLoad();
  const { getLocation, requestPermission, loading: locationLoading } = useGeolocation();
  const [selectedParts, setSelectedParts] = useState([]);

  const notifRequested = useRef(false);

  // Ask for notification permission as soon as the dashboard mounts.
  // On Android 13+ this triggers the runtime POST_NOTIFICATIONS dialog.
  useEffect(() => {
    if (notifRequested.current) return;
    notifRequested.current = true;

    (async () => {
      try {
        const granted = await requestNotificationPermission();
        if (granted) {
          await getDeviceToken();
          if (activeGymId) {
            await subscribeGymTopic(activeGymId);
          }
        }
      } catch (e) {
        console.warn('Notification setup error:', e);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ask for location permission as soon as the dashboard mounts (member only).
  // This surfaces the permission + GPS dialogs before the user taps Check In.
  useEffect(() => {
    if (membership?.is_active) {
      requestPermission();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isCheckedIn) setSelectedParts([]);
  }, [isCheckedIn]);

  const handleCheckInOut = useCallback(async () => {
    if (!membership?.is_active) {
      Alert.alert('No active membership', 'You must have an active membership to check in.');
      return;
    }
    if (isCheckedIn) {
      Alert.alert(
        'End Workout?',
        'Are you sure you want to end your current workout session?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'End Workout', style: 'destructive', onPress: () => checkOut() },
        ]
      );
    } else {
      navigation.navigate('QRScanner');
    }
  }, [membership, isCheckedIn, checkOut, navigation]);

  const goToProfile = useCallback(() => {
    const parent = navigation.getParent();
    const root = parent?.getParent() || parent;
    (root || navigation).navigate('ProfileRoot');
  }, [navigation]);

  const handleRefresh = useCallback(async () => {
    await Promise.allSettled([
      refreshProfile(),
      gymService.getMyActivity().then(session => 
        session && Object.keys(session).length > 0 ? setCheckin(session) : clearCheckin()
      ),
      getCurrentRush(new Date().toISOString().split('T')[0]),
    ]);
  }, [refreshProfile, setCheckin, clearCheckin, getCurrentRush]);

  const handleCheckIn = useCallback(async () => {
    if (!membership?.is_active) {
      Alert.alert('No active membership', 'You must have an active membership to check in.');
      return;
    }

    const gymLat = parseFloat(membership?.latitude);
    const gymLng = parseFloat(membership?.longitude);
    const hasGymCoords = !isNaN(gymLat) && !isNaN(gymLng);
    console.log('[CheckIn] gym coords available:', hasGymCoords, { gymLat, gymLng });

    try {
      const position = await getLocation();
      console.log('[CheckIn] user position:', position);

      if (hasGymCoords) {
        const distance = getDistanceMeters(
          position.latitude,
          position.longitude,
          gymLat,
          gymLng,
        );
        console.log(`[CheckIn] distance to gym: ${Math.round(distance)} m (limit: ${GYM_CHECKIN_RADIUS_METERS} m)`);

        if (distance <= GYM_CHECKIN_RADIUS_METERS) {
          console.log('[CheckIn] within radius → checking in');
          await checkIn(activeGymId, selectedParts);
          setSelectedParts([]);
        } else {
          console.log('[CheckIn] too far → QR fallback');
          Alert.alert(
            'Not at gym location!',
            `You're probably ${Math.round(distance)} m away from gym. \n Try to be in range of ${GYM_CHECKIN_RADIUS_METERS} m or use QR scan to check in instead.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Scan QR',
                onPress: () => navigation.navigate('QRScanner', { initialParts: selectedParts }),
              },
            ],
          );
        }
      } else {
        // Gym has no coordinates stored — fall back to QR
        console.log('[CheckIn] no gym coords → QR fallback');
        navigation.navigate('QRScanner', { initialParts: selectedParts });
      }
    } catch (e) {
      // Skip alert if the hook already showed one (e.g. GPS-off dialog)
      if (e?.handled) return;

      const isDenied = e?.message?.toLowerCase().includes('denied');
      console.warn('[CheckIn] location error:', e?.message);
      Alert.alert(
        isDenied ? 'Location permission required' : 'Could not get location',
        isDenied
          ? 'Location access was denied. Please scan the QR code to check in, or allow location access in settings.'
          : 'Unable to determine your location. Please scan the QR code to check in.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Scan QR',
            onPress: () => navigation.navigate('QRScanner', { initialParts: selectedParts }),
          },
        ],
      );
    }
  }, [membership, activeGymId, selectedParts, checkIn, getLocation, navigation]);

  const isLoading = checkInLoading || rushLoading || locationLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.username || 'Member'} 👋</Text>
        <TouchableOpacity onPress={goToProfile}>
          <Avatar source={user?.avatar} name={user?.name} size="small" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        {isCheckedIn ? (
          <ActiveSessionCard
            gymName={lastCheckin?.gym_name}
            slot={lastCheckin?.slot}
            startedAt={lastCheckin?.started_at}
            bodyParts={lastCheckin?.body_parts || []}
            onCheckOut={handleCheckInOut}
            loading={checkInLoading}
          />
        ) : (
          <Text style={styles.sectionTitle}>Choose body parts to check in</Text>
        )}

        {!isCheckedIn && <GymRush onSelectionChange={setSelectedParts} />}
      </ScrollView>

      {selectedParts.length > 0 && !isCheckedIn && (
        <View style={styles.checkinBar}>
          <Text style={styles.checkinParts} numberOfLines={1} ellipsizeMode="tail">
            {selectedParts.join(', ')}
          </Text>
          <TouchableOpacity
            style={[styles.checkInButton, styles.checkinBarButton]}
            onPress={handleCheckIn}
          >
            <Text style={styles.checkInButtonText}>Check In</Text>
          </TouchableOpacity>
        </View>
      )}

      <OverlayLoader
        visible={locationLoading || checkInLoading}
        message={locationLoading ? 'Getting your location…' : 'Checking in…'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    marginTop: SIZES.margin,
    paddingBottom: SIZES.paddingLarge,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.card,
  },
  greeting: {
    fontSize: SIZES.h5,
    color: COLORS.text,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: SIZES.body,
    fontWeight: '700',
    color: COLORS.text,
    marginVertical: SIZES.paddingSmall,
    textAlign: 'center',
  },
  checkinBar: {
    position: 'absolute',
    bottom: SIZES.padding,
    left: SIZES.padding,
    right: SIZES.padding,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radiusLarge,
    elevation: 6,
    zIndex: 20,
  },
  checkinParts: {
    flex: 1,
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '600',
    marginRight: SIZES.padding,
  },
  checkInButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
  },
  checkinBarButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
  },
  checkInButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: SIZES.body,
  },
});

export default DashboardScreen;
