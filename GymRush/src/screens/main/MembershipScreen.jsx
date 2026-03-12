import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks';
import { COLORS, SIZES } from '../../constants/theme';

// helper to format ISO date string
const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString() : '-');

export const MembershipScreen = () => {
  const { membership } = useAuth();

  if (!membership) {
    return (
      <SafeAreaView style={styles.container} edges={[ 'top' ]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No active membership found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const start = membership.start_date;
  const end = membership.end_date;
  const duration = start && end ? Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) : null;

  return (
    <SafeAreaView style={styles.container} edges={[ 'top' ]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>{membership.gym_name}</Text>
          {membership.gym_owner_name ? (
            <Text style={styles.subtitle}>Owned by {membership.gym_owner_name}</Text>
          ) : null}
          <Text style={styles.address}>{membership.address}</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Start:</Text>
            <Text style={styles.value}>{fmt(start)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>End:</Text>
            <Text style={styles.value}>{fmt(end)}</Text>
          </View>
          {duration !== null ? (
            <View style={styles.row}>
              <Text style={styles.label}>Duration:</Text>
              <Text style={styles.value}>{duration} days</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, membership.is_active ? styles.active : styles.inactive]}>
              {membership.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
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
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: SIZES.body,
  },
  value: {
    color: COLORS.text,
    fontSize: SIZES.body,
    fontWeight: '500',
  },
  active: {
    color: COLORS.success,
  },
  inactive: {
    color: COLORS.error,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: SIZES.body,
  },
});

export default MembershipScreen;
