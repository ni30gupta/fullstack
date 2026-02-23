import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { DashboardScreen, WorkoutsScreen, TrainersScreen, ProfileScreen } from '../screens';
import { COLORS, SIZES } from '../constants/theme';

const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, label, focused }) => (
  <View style={styles.tabItem}>
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
  </View>
);

export const MainNavigator = () => {
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
        name="Trainers"
        component={TrainersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👨‍🏫" label="Trainers" focused={focused} />
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
