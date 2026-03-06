import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Avatar, GymRush, ActiveSessionCard } from '../../components';
import { useAuth, useCheckin, useBodyPartLoad } from '../../hooks';
import { gymService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';
import { useState, useEffect, useCallback } from 'react';

export const DashboardScreen = ({ navigation }) => {
  const { user, membership, activeGymId, refreshProfile } = useAuth();
  const { lastCheckin, checkedIn: isCheckedIn, checkIn, checkOut, loading: checkInLoading, setCheckin, clearCheckin } = useCheckin();
  const { getCurrentRush, loading: rushLoading } = useBodyPartLoad();
  const [selectedParts, setSelectedParts] = useState([]);

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
    try {
      await checkIn(activeGymId, selectedParts);
      setSelectedParts([]);
    } catch {}
  }, [membership, activeGymId, selectedParts, checkIn]);

  const isLoading = checkInLoading || rushLoading;

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
            disabled={checkInLoading}
          >
            <Text style={styles.checkInButtonText}>{checkInLoading ? '...' : 'Check In'}</Text>
          </TouchableOpacity>
        </View>
      )}
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
