import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, GymRush } from '../../components';
import { useAuth, useBodyPartLoad } from '../../hooks';
import { COLORS, SIZES } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';

export const OwnerDashboardScreen = () => {
  const { user, gymDetails, refreshProfile } = useAuth();
  const { getCurrentRush, loading: rushLoading } = useBodyPartLoad();
  const navigation = useNavigation();

  const handleRefresh = useCallback(async () => {
    await Promise.allSettled([
      refreshProfile(),
      getCurrentRush(new Date().toISOString().split('T')[0]),
    ]);
  }, [refreshProfile, getCurrentRush]);

  const goToProfile = useCallback(() => {
    const parent = navigation.getParent();
    const root = parent?.getParent() || parent;
    (root || navigation).navigate('ProfileRoot');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.username || 'Owner'} 👋</Text>
          <Text style={styles.gymName}>{gymDetails?.name || 'Your Gym'}</Text>
        </View>
        <TouchableOpacity onPress={goToProfile}>
          <Avatar
            source={user?.profile?.profile_image}
            name={user?.profile?.name || user?.username}
            size="small"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={rushLoading}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <Text style={styles.sectionTitle}>
          Live Gym Load — tap a body part to see active members
        </Text>
        {/* GymRush detects isOwner=true via AuthContext and routes taps to BodyPartActivities */}
        <GymRush />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  gymName: {
    fontSize: SIZES.bodySmall,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scrollContent: {
    marginTop: SIZES.margin,
    paddingBottom: SIZES.paddingLarge,
  },
  sectionTitle: {
    fontSize: SIZES.bodySmall,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SIZES.paddingSmall,
    textAlign: 'center',
    paddingHorizontal: SIZES.padding,
  },
});

export default OwnerDashboardScreen;
