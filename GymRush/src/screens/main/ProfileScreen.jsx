import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Card, Avatar, Badge, Button } from '../../components';
import { useAuth } from '../../hooks';
import { COLORS, SIZES } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';

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
  const { user, membership, logout, uploadAvatar } = useAuth();
  const navigation = useNavigation();
  const [avatarUploading, setAvatarUploading] = useState(false);

  const pickImage = async (source) => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
      includeBase64: false,
    };
    const result = source === 'camera'
      ? await launchCamera(options)
      : await launchImageLibrary(options);

    if (result.didCancel || !result.assets?.length) return;

    setAvatarUploading(true);
    try {
      await uploadAvatar(result.assets[0]);
    } catch (e) {
      Alert.alert('Upload Failed', e.message || 'Could not update profile picture.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarPress = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => pickImage('camera') },
        { text: 'Choose from Gallery', onPress: () => pickImage('gallery') },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

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

  const membershipLabel = membership
    ? membership.is_active
      ? 'Active Member'
      : 'Pending Membership'
    : 'No Membership';
  const membershipVariant = membership
    ? membership.is_active
      ? 'primary'
      : 'secondary'
    : 'ghost';
  const membershipIcon = membership
    ? membership.is_active
      ? '🏅'
      : '⏳'
    : '⚪️';

  const handleMenuItem = (item) => {
    if (item === 'Edit Profile') {
      navigation.navigate('EditProfile');
      return;
    }
    if (item === 'Membership') {
      navigation.navigate('Membership');
      return;
    }
    Alert.alert('Coming Soon', `${item} feature is coming soon!`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleAvatarPress}
            style={styles.avatarWrapper}
            activeOpacity={0.8}
            disabled={avatarUploading}
          >
            <Avatar
              source={user?.profile?.profile_image}
              name={user?.profile?.name || user?.username}
              size="xlarge"
            />
            <View style={styles.cameraIconBadge}>
              {avatarUploading
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Icon name="camera-alt" size={16} color={COLORS.white} />
              }
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.profile?.name || user?.username || 'Member'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Badge
            label={membershipLabel}
            variant={membershipVariant}
            style={styles.membershipBadge}
            icon={membershipIcon}
            iconPosition="left"
          />
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
              subtitle="View membership details"
              onPress={() => handleMenuItem('Membership')}
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
  avatarWrapper: {
    position: 'relative',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
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
    paddingHorizontal: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
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
