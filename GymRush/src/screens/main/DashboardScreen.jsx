import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Avatar, GymRush, ActiveSessionCard } from '../../components';
import { useAuth, useCheckin, useBodyPartLoad, useGeolocation } from '../../hooks';
import { gymService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';
import { getDistanceMeters } from '../../utils';
import { useState, useEffect, useCallback } from 'react';
import Geolocation from 'react-native-geolocation-service';

const GYM_CHECKIN_RADIUS_METERS = 50;

export const DashboardScreen = ({ navigation }) => {
  const { user, membership, activeGymId, refreshProfile } = useAuth();
  const { lastCheckin, checkedIn: isCheckedIn, checkIn, checkOut, loading: checkInLoading, setCheckin, clearCheckin } = useCheckin();
  const { getCurrentRush, loading: rushLoading } = useBodyPartLoad();
  const { locPermModal, setLocPermModal, getLocation, requestPermission, loading: locationLoading } = useGeolocation();
  const [selectedParts, setSelectedParts] = useState([]);

  const requestLiveLocation = useCallback(async () => {
    // TODO: implement your own location permission + enabling logic here
    setLocPermModal(false);
    
  }, []);

  // Ask for location permission as soon as the dashboard mounts (member only).
  // This surfaces the system dialog early so the user understands why it's needed.
  useEffect(() => {
    if (membership?.is_active) {
      console.log('###### membership',membership?.is_active)
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
    console.log('[handleCheckIn] triggered — selectedParts:', selectedParts);

    if (!membership?.is_active) {
      console.warn('[handleCheckIn] No active membership, aborting.');
      Alert.alert('No active membership', 'You must have an active membership to check in.');
      return;
    }

    const gymLat = parseFloat(membership?.latitude);
    const gymLng = parseFloat(membership?.longitude);
    const hasGymCoords = !isNaN(gymLat) && !isNaN(gymLng);
    console.log('[handleCheckIn] gym coords:', { gymLat, gymLng, hasGymCoords });

    // Always attempt to get location — this triggers the permission dialog
    // if it hasn't been granted yet.
    try {
      console.log('[handleCheckIn] requesting location…');
      const position = await getLocation();
      console.log('[handleCheckIn] location obtained:', position);

      if (hasGymCoords) {
        const distance = getDistanceMeters(
          position.latitude,
          position.longitude,
          gymLat,
          gymLng,
        );
        console.log('[handleCheckIn] distance to gym:', distance, 'm (threshold:', GYM_CHECKIN_RADIUS_METERS, 'm)');

        if (distance <= GYM_CHECKIN_RADIUS_METERS) {
          // ✅ Within range — check in directly
          console.log('[handleCheckIn] within radius, checking in — activeGymId:', activeGymId);
          await checkIn(activeGymId, selectedParts);
          console.log('[handleCheckIn] check-in successful');
          setSelectedParts([]);
        } else {
          // ❌ Too far — fallback to QR scan
          console.warn('[handleCheckIn] too far from gym (', Math.round(distance), 'm), prompting QR scan.');
          Alert.alert(
            'Not at gym location',
            `You appear to be ${Math.round(distance)} m away from the gym. Please scan the QR code to check in.`,
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
        // Gym has no coordinates stored — location obtained but can't verify
        // distance, fall back to QR.
        console.warn('[handleCheckIn] gym has no stored coordinates, falling back to QR scan.');
        navigation.navigate('QRScanner', { initialParts: selectedParts });
      }
    } catch (e) {
      // Location permission denied or GPS error — fallback to QR scan
      const isDenied = e?.message?.toLowerCase().includes('denied');
      console.error('[handleCheckIn] location error:', e?.message, '| isDenied:', isDenied);
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
            disabled={checkInLoading || locationLoading}
          >
            <Text style={styles.checkInButtonText}>{locationLoading ? '📍...' : checkInLoading ? '...' : 'Check In'}</Text>
          </TouchableOpacity>
        </View>
      )}


      {/* <Modal
        animationType="slide"
        transparent={false}
        visible={locPermModal}
        onRequestClose={() => setLocPermModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Use your location</Text>
            <Text style={styles.modalBody}>Permission info line 1</Text>
            <Text style={styles.modalBody}>Permission info line 2</Text>
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalButtonDeny} onPress={() => setLocPermModal(false)}>
              <Text style={styles.modalButtonDenyText}>Deny</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButtonAccept} onPress={requestLiveLocation}>
              <Text style={styles.modalButtonAcceptText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal> */}


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
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding * 2,
    gap: SIZES.paddingSmall,
  },
  modalTitle: {
    fontSize: SIZES.h4,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.paddingSmall,
  },
  modalBody: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingLarge,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  modalButtonDeny: {
    flex: 1,
    marginRight: SIZES.paddingSmall,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  modalButtonDenyText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: SIZES.body,
  },
  modalButtonAccept: {
    flex: 1,
    marginLeft: SIZES.paddingSmall,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalButtonAcceptText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: SIZES.body,
  },
});

export default DashboardScreen;
