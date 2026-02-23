
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Avatar } from '../../components';
import { useAuth, useCheckin } from '../../context';

import { useCheckinActions, useMyActivity } from '../../hooks';
import { COLORS, SIZES } from '../../constants/theme';
import {  useCallback, useEffect } from 'react';

// Format time from ISO string
const formatTime = (isoStr) => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

export const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { gymName, lastSlot, lastBodyParts, lastCheckinAt } = useCheckin();
  const { checkIn, checkOut, isCheckedIn, loading: checkInLoading } = useCheckinActions();

  const { activity, isLoading, currentActivity } = useMyActivity();

  const handleRefresh = useCallback(async () => {
    try {
      await currentActivity(); // re-fetches and updates `activity` in the hook
    } catch (e) {
      console.error('Refresh failed', e);
    }
  }, [currentActivity]);


  const handleCheckInOut = async () => {
    if (isCheckedIn) {
      await checkOut();
    } else {
      // open QR scanner to perform a secure check-in via the printed gym QR
      navigation.navigate('QRScanner');
    }
    try {
      await currentActivity();
    } catch (e) {
      console.error('Failed to refresh activity after check-in/out', e);
    }
  };



  

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading || checkInLoading} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>Hello,</Text>
            <Text style={styles.userName}>{user?.username || 'Member'} 👋</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar source={user?.avatar} name={user?.name} size="medium" />
          </TouchableOpacity>
        </View>

        {/* Check-in Card */}
        <Card style={styles.checkInCard}>
          <View style={styles.checkInContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.checkInTitle}>
                {isCheckedIn ? "You're Checked In! 🔥" : 'Ready to Workout?'}
              </Text>
              <Text style={styles.checkInSubtitle}>
                {isCheckedIn ? (gymName || 'Great job! Keep pushing!') : 'Check in to start your session'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.checkInButton, isCheckedIn && styles.checkOutButton]}
              onPress={handleCheckInOut}
              disabled={checkInLoading}
            >
              <Text style={styles.checkInButtonText}>
                {checkInLoading ? '...' : isCheckedIn ? 'Check Out' : 'Check In'}
              </Text>
            </TouchableOpacity>
          </View>
          {/* Expanded info when checked in */}
          {isCheckedIn && (
            <View style={styles.checkinDetails}>
              {lastSlot ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>🕐</Text>
                  <Text style={styles.detailText}>Slot: {lastSlot}</Text>
                </View>
              ) : null}
              {lastCheckinAt ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>⏱️</Text>
                  <Text style={styles.detailText}>Started: {formatTime(lastCheckinAt)}</Text>
                </View>
              ) : null}
              {lastBodyParts && lastBodyParts.length > 0 ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>💪</Text>
                  <Text style={styles.detailText}>{lastBodyParts.join(', ')}</Text>
                </View>
              ) : null}
            </View>
          )}
        </Card>

        {/* Stats and membership removed — backend has no /dashboard endpoint */}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Workouts')}>
            <Text style={styles.quickActionIcon}>🏋️</Text>
            <Text style={styles.quickActionText}>Workouts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Trainers')}>
            <Text style={styles.quickActionIcon}>👨‍🏫</Text>
            <Text style={styles.quickActionText}>Trainers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.quickActionIcon}>📊</Text>
            <Text style={styles.quickActionText}>Progress</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SIZES.padding,
    paddingBottom: SIZES.paddingLarge * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.marginLarge,
  },
  greeting: {},
  greetingText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
  },
  checkInCard: {
    backgroundColor: COLORS.primary,
    marginBottom: SIZES.margin,
  },
  checkInContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkInTitle: {
    fontSize: SIZES.h4,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  checkInSubtitle: {
    fontSize: SIZES.bodySmall,
    color: COLORS.white,
    opacity: 0.9,
  },
  checkinDetails: {
    marginTop: SIZES.paddingSmall,
    paddingTop: SIZES.paddingSmall,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  detailText: {
    fontSize: SIZES.bodySmall,
    color: COLORS.white,
    opacity: 0.95,
  },
  checkInButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
  },
  checkOutButton: {
    backgroundColor: COLORS.secondary,
  },
  checkInButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: SIZES.body,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SIZES.margin,
    marginBottom: SIZES.paddingSmall,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.base,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  membershipContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membershipType: {
    fontSize: SIZES.h5,
    fontWeight: '600',
    color: COLORS.text,
  },
  membershipExpiry: {
    fontSize: SIZES.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.base,
  },
  quickAction: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: SIZES.padding,
    borderRadius: SIZES.radiusLarge,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: SIZES.bodySmall,
    color: COLORS.text,
    fontWeight: '500',
  },
});

export default DashboardScreen;
