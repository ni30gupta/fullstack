
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Avatar, GymRush } from '../../components';
import { useAuth, useCheckin, useBodyPartLoad } from '../../hooks';
import { gymService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';
import { useState, useEffect } from 'react';


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
  // lastCheckin / isCheckedIn reflect the "my-activity" endpoint result
  const { lastCheckin, checkedIn: isCheckedIn, checkIn, checkOut, loading: checkInLoading, setCheckin } = useCheckin();
  const { getCurrentRush, loading: rushLoading } = useBodyPartLoad();
  const [selectedParts, setSelectedParts] = useState([]);

  useEffect(() => {
    if (isCheckedIn) {
      setSelectedParts([]);
    }
  }, [isCheckedIn]);

  const { activeGymId } = useAuth()
  console.log(activeGymId)

  const handleCheckInOut = async () => {
    if (isCheckedIn) {
      console.log('checking out')
      await checkOut();
    } else {
      // open QR scanner to perform a secure check-in via the printed gym QR
      navigation.navigate('QRScanner');
    }
  };

  // navigate to profile using root navigator so back returns to dashboard
  const goToProfile = () => {
    // attempt to reach the root navigator
    const parent = navigation.getParent();
    const root = parent?.getParent() || parent;
    if (root && root.navigate) {
      root.navigate('ProfileRoot');
    } else {
      navigation.navigate('ProfileRoot');
    }
  };


const handleRefresh = async () => {
    // refresh "my activity" state and rush data
    try {
      const session = await gymService.getMyActivity();
      if (session && Object.keys(session).length > 0) {
        await setCheckin(session);
      } else {
        await clearCheckin();
      }
    } catch (e) {
      console.warn('refresh my-activity failed', e);
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      await getCurrentRush(today);
    } catch (e) {
      console.warn('refresh rush-data failed', e);
    }
  }
  

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greetingSingle}>Hello, {user?.username || 'Member'} 👋</Text>
        <TouchableOpacity onPress={goToProfile}>
          <Avatar source={user?.avatar } name={user?.name} size="small" />
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={checkInLoading || rushLoading} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >

        {/* Check-in heading/card area */}
        {isCheckedIn ? (
          <Card style={styles.checkInCard}>
            <View style={styles.checkInContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkInTitle}>
                  You're Checked In! 🔥
                </Text>
                <Text style={styles.checkInSubtitle}>
                  {lastCheckin?.gym_name || 'Great job! Keep pushing!'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.checkInButton, styles.checkOutButton]}
                onPress={handleCheckInOut}
                disabled={checkInLoading}
              >
                <Text style={styles.checkInButtonText}>
                  {checkInLoading ? '...' : 'Check Out'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.checkinDetails}>
              {lastCheckin?.slot ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>🕐</Text>
                  <Text style={styles.detailText}>Slot: {lastCheckin.slot}</Text>
                </View>
              ) : null}
              {lastCheckin?.started_at ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>⏱️</Text>
                  <Text style={styles.detailText}>Started: {formatTime(lastCheckin.started_at)}</Text>
                </View>
              ) : null}
              {lastCheckin?.body_parts && lastCheckin.body_parts.length > 0 ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>💪</Text>
                  <Text style={styles.detailText}>{lastCheckin.body_parts.join(', ')}</Text>
                </View>
              ) : null}
            </View>
          </Card>
        ) : (
          <Text style={styles.sectionTitle}>Choose body parts to check in</Text>
        )}

        {/* show gym rush load only when there is no active session */}
        {!isCheckedIn && <GymRush onSelectionChange={setSelectedParts} />}

        
      </ScrollView>
      {/* fixed bottom bar with selected body parts and check-in button */}
      {selectedParts.length > 0 && !isCheckedIn && (
        <View style={styles.checkinBar}>
          <Text style={styles.checkinParts} numberOfLines={1} ellipsizeMode="tail">
            {selectedParts.join(', ')}
          </Text>
          <TouchableOpacity
            style={[styles.checkInButton, styles.checkinBarButton]}
            onPress={async () => {
              try {
                await checkIn(activeGymId, selectedParts);
              } catch (e) {}
              setSelectedParts([]);
            }}
            disabled={checkInLoading}
          >
            <Text style={styles.checkInButtonText}>
              {checkInLoading ? '...' : 'Check In'}
            </Text>
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
    // padding: SIZES.padding,
    paddingBottom: SIZES.paddingLarge * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.card,
  },
  /* greetingRow no longer required - header flex handles layout */
  greetingSingle: {
    fontSize: SIZES.h5,
    color: COLORS.text,
    fontWeight: '600',
  },
  /* legacy styles kept for reference but no longer used */
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
    fontSize: SIZES.body,
    fontWeight: '700',
    color: COLORS.text,
    marginVertical: SIZES.paddingSmall,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
  },
  fab: {
    position: 'absolute',
    bottom: SIZES.padding,
    right: SIZES.padding,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.paddingSmall,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radiusLarge,
    elevation: 6,
    zIndex: 20,
  },
  fabText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: SIZES.bodySmall,
  },
  /* bottom bar when there are selected parts */
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
    fontSize: SIZES.body,      // larger size
    fontWeight: '600',        // bolder
    marginRight: SIZES.padding,
  },
  checkinBarButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
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
