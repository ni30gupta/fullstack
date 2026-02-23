import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Avatar, Badge, Button } from '../../components';
import { useAuth } from '../../context';
import { COLORS, SIZES } from '../../constants/theme';

const MenuItem = ({ icon, title, subtitle, onPress, showBadge, badgeCount }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={styles.menuIcon}>{icon}</Text>
    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>{title}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    <View style={styles.menuRight}>
      {showBadge && badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount}</Text>
        </View>
      )}
      <Text style={styles.menuArrow}>›</Text>
    </View>
  </TouchableOpacity>
);

export const ProfileScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleMenuItem = (item) => {
    // Handle navigation or actions for menu items
    Alert.alert('Coming Soon', `${item} feature is coming soon!`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Avatar source={user?.avatar} name={user?.name} size="xlarge" />
          <Text style={styles.userName}>{user?.name || 'Member'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Badge label="Premium Member" variant="primary" style={styles.membershipBadge} />
        </View>

        {/* Stats Card */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.stats?.totalWorkouts || 0}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.stats?.totalHours || 0}</Text>
              <Text style={styles.statLabel}>Hours</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.stats?.currentStreak || 0}🔥</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </Card>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="👤"
              title="Edit Profile"
              subtitle="Update your personal info"
              onPress={() => handleMenuItem('Edit Profile')}
            />
            <MenuItem
              icon="🔔"
              title="Notifications"
              subtitle="Manage notifications"
              onPress={() => handleMenuItem('Notifications')}
              showBadge
              badgeCount={3}
            />
            <MenuItem
              icon="🔒"
              title="Privacy & Security"
              subtitle="Password, 2FA settings"
              onPress={() => handleMenuItem('Privacy')}
            />
          </Card>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Gym</Text>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="💳"
              title="Membership"
              subtitle="View plans & billing"
              onPress={() => handleMenuItem('Membership')}
            />
            <MenuItem
              icon="📅"
              title="My Bookings"
              subtitle="Trainer sessions & classes"
              onPress={() => handleMenuItem('Bookings')}
            />
            <MenuItem
              icon="🎯"
              title="Goals"
              subtitle="Set and track your goals"
              onPress={() => handleMenuItem('Goals')}
            />
          </Card>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="❓"
              title="Help Center"
              subtitle="FAQs and support"
              onPress={() => handleMenuItem('Help')}
            />
            <MenuItem
              icon="📝"
              title="Send Feedback"
              subtitle="Help us improve"
              onPress={() => handleMenuItem('Feedback')}
            />
            <MenuItem
              icon="ℹ️"
              title="About"
              subtitle="App version 1.0.0"
              onPress={() => handleMenuItem('About')}
            />
          </Card>
        </View>

        <Button
          title="Sign Out"
          variant="outline"
          onPress={handleLogout}
          style={styles.logoutButton}
        />

        <Text style={styles.version}>GymRush v1.0.0</Text>
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
    alignItems: 'center',
    paddingVertical: SIZES.paddingLarge,
  },
  userName: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SIZES.margin,
  },
  userEmail: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  membershipBadge: {
    marginTop: SIZES.base,
  },
  statsCard: {
    marginBottom: SIZES.margin,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: SIZES.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  menuSection: {
    marginBottom: SIZES.margin,
  },
  sectionTitle: {
    fontSize: SIZES.bodySmall,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: SIZES.base,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuCard: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: SIZES.padding,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  menuSubtitle: {
    fontSize: SIZES.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: SIZES.caption,
    fontWeight: '600',
  },
  menuArrow: {
    fontSize: 24,
    color: COLORS.textMuted,
  },
  logoutButton: {
    marginTop: SIZES.margin,
    borderColor: COLORS.error,
  },
  version: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: SIZES.caption,
    marginTop: SIZES.margin,
  },
});

export default ProfileScreen;
