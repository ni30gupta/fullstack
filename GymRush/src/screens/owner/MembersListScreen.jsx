import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Card } from '../../components';
import { useAuth } from '../../hooks';
import { gymService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';

const FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'active',   label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

const MemberRow = ({ item, onPress }) => {
  const membership = item.latest_membership;
  const endDate = membership?.end_date
    ? new Date(membership.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={() => onPress(item)}>
      <Card style={styles.memberCard}>
        <View style={styles.row}>
          <Avatar name={item.name} size="medium" />
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>{item.phone || '—'}</Text>
            {endDate && (
              <Text style={[styles.expiry, !item.has_active_membership && styles.expired]}>
                {item.has_active_membership ? `Until ${endDate}` : `Expired ${endDate}`}
              </Text>
            )}
          </View>
          <View style={[
            styles.statusBadge,
            item.has_active_membership ? styles.badgeActive : styles.badgeInactive,
          ]}>
            <Text style={[
              styles.badgeText,
              item.has_active_membership ? styles.badgeTextActive : styles.badgeTextInactive,
            ]}>
              {item.has_active_membership ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

export const MembersListScreen = ({ navigation }) => {
  const { gymDetails } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

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

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const filtered = members.filter(m => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && m.has_active_membership) ||
      (filter === 'inactive' && !m.has_active_membership);
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      m.name?.toLowerCase().includes(q) ||
      m.phone?.includes(q) ||
      m.email?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const activeCount   = members.filter(m => m.has_active_membership).length;
  const inactiveCount = members.filter(m => !m.has_active_membership).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Members</Text>
          <Text style={styles.subtitle}>
            {activeCount} active · {inactiveCount} inactive
          </Text>
        </View>
        <TouchableOpacity
          style={styles.enrollBtn}
          onPress={() => navigation.navigate('EnrollMember', { onSuccess: fetchMembers })}
          activeOpacity={0.8}
        >
          <Text style={styles.enrollBtnText}>+ Enroll</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone or email…"
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={fetchMembers} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id?.toString()}
          renderItem={({ item }) => (
            <MemberRow
              item={item}
              onPress={m => navigation.navigate('MemberDetail', { memberId: m.id, memberName: m.name, onRefresh: fetchMembers })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchMembers} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.center}>
                <Text style={styles.empty}>
                  {search ? 'No members match your search' : 'No members yet'}
                </Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.background },
  header:           {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SIZES.padding, backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title:            { fontSize: SIZES.h4, fontWeight: '700', color: COLORS.text },
  subtitle:         { fontSize: SIZES.caption, color: COLORS.textMuted, marginTop: 2 },
  enrollBtn:        {
    backgroundColor: COLORS.primary, paddingHorizontal: SIZES.padding,
    paddingVertical: 8, borderRadius: SIZES.radius,
  },
  enrollBtnText:    { color: COLORS.white, fontWeight: '700', fontSize: SIZES.bodySmall },

  searchWrapper:    {
    flexDirection: 'row', alignItems: 'center',
    margin: SIZES.padding, marginBottom: 0,
    backgroundColor: COLORS.card, borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.paddingSmall, borderWidth: 1, borderColor: COLORS.border,
  },
  searchIcon:       { fontSize: 14, marginRight: 6 },
  searchInput:      { flex: 1, color: COLORS.text, fontSize: SIZES.bodySmall, paddingVertical: 10 },
  clearSearch:      { color: COLORS.textMuted, fontSize: 14, padding: 4 },

  filterRow:        { flexDirection: 'row', paddingHorizontal: SIZES.padding, paddingTop: SIZES.padding, paddingBottom: 4 },
  filterTab:        {
    paddingHorizontal: SIZES.padding, paddingVertical: 6,
    borderRadius: SIZES.radiusSmall, marginRight: 8,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
  },
  filterTabActive:  { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText:       { fontSize: SIZES.caption, color: COLORS.textMuted, fontWeight: '600' },
  filterTextActive: { color: COLORS.white },

  list:             { padding: SIZES.padding, paddingBottom: SIZES.paddingLarge },
  memberCard:       { marginBottom: SIZES.margin },
  row:              { flexDirection: 'row', alignItems: 'center' },
  info:             { flex: 1, marginLeft: SIZES.padding },
  name:             { fontSize: SIZES.body, fontWeight: '600', color: COLORS.text },
  sub:              { fontSize: SIZES.bodySmall, color: COLORS.textMuted, marginTop: 2 },
  expiry:           { fontSize: SIZES.caption, color: COLORS.success, marginTop: 2 },
  expired:          { color: COLORS.error },

  statusBadge:      {
    paddingHorizontal: SIZES.paddingSmall, paddingVertical: 4,
    borderRadius: SIZES.radiusSmall, alignItems: 'center',
  },
  badgeActive:      { backgroundColor: COLORS.success + '22' },
  badgeInactive:    { backgroundColor: COLORS.textMuted + '22' },
  badgeText:        { fontSize: SIZES.caption, fontWeight: '700' },
  badgeTextActive:  { color: COLORS.success },
  badgeTextInactive:{ color: COLORS.textMuted },

  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.paddingLarge, marginTop: 60 },
  error:            { color: COLORS.error, textAlign: 'center', marginBottom: SIZES.padding },
  retryBtn:         {
    backgroundColor: COLORS.primary, paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall, borderRadius: SIZES.radius,
  },
  retryText:        { color: COLORS.white, fontWeight: '600' },
  empty:            { color: COLORS.textMuted, textAlign: 'center', fontSize: SIZES.body },
});

export default MembersListScreen;
