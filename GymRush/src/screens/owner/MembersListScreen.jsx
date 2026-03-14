import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Card } from '../../components';
import { useAuth } from '../../hooks';
import { gymService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';

const MemberRow = ({ item }) => (
  <Card style={styles.memberCard}>
    <View style={styles.row}>
      <Avatar name={item.name} size="medium" />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.sub}>{item.phone || item.user_email || '—'}</Text>
      </View>
      <View
        style={[
          styles.statusBadge,
          item.has_active_membership ? styles.badgeActive : styles.badgeInactive,
        ]}
      >
        <Text style={styles.badgeText}>
          {item.has_active_membership ? 'Active' : 'Inactive'}
        </Text>
      </View>
    </View>
  </Card>
);

export const MembersListScreen = () => {
  const { gymDetails } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMembers = useCallback(async () => {
    if (!gymDetails?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await gymService.getMembers(gymDetails.id);
      setMembers(Array.isArray(data) ? data : data?.results ?? []);
    } catch (e) {
      setError(e.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [gymDetails]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Members</Text>
        {members.length > 0 && (
          <Text style={styles.count}>{members.length} total</Text>
        )}
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={fetchMembers} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={({ item }) => <MemberRow item={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchMembers}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.center}>
                <Text style={styles.empty}>No members yet</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: SIZES.h4, fontWeight: '700', color: COLORS.text },
  count: { fontSize: SIZES.bodySmall, color: COLORS.textMuted },
  list: { padding: SIZES.padding, paddingBottom: SIZES.paddingLarge },
  memberCard: { marginBottom: SIZES.margin },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginLeft: SIZES.padding },
  name: { fontSize: SIZES.body, fontWeight: '600', color: COLORS.text },
  sub: { fontSize: SIZES.bodySmall, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: SIZES.paddingSmall,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSmall,
  },
  badgeActive: { backgroundColor: COLORS.success + '33' },
  badgeInactive: { backgroundColor: COLORS.textMuted + '33' },
  badgeText: { fontSize: SIZES.caption, fontWeight: '600', color: COLORS.text },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.paddingLarge,
  },
  error: {
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
  },
  retryText: { color: COLORS.white, fontWeight: '600' },
  empty: { color: COLORS.textMuted, textAlign: 'center', fontSize: SIZES.body },
});

export default MembersListScreen;
