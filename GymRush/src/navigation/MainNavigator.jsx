import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { DashboardScreen, WorkoutsScreen, UpdatesScreen, ProfileScreen } from '../screens';
import { COLORS, SIZES } from '../constants/theme';
import NotificationBadgeContext from '../context/NotificationBadgeContext';

const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, label, focused, badge }) => (
  <View style={styles.tabItem}>
    <View>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
      {badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
  </View>
);

export const MainNavigator = () => {
  const { badgeCount } = useContext(NotificationBadgeContext);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Workouts"
        component={WorkoutsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏋️" label="Workouts" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Updates"
        component={UpdatesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🔔" label="Updates" focused={focused} badge={badgeCount} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,

  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  tabIconFocused: {
    opacity: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  tabLabel: {
    fontSize: SIZES.caption,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  tabLabelFocused: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default MainNavigator;
