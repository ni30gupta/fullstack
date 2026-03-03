import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks';
import { gymService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';
import { Avatar } from '../../components';

export const BodyPartActivitiesScreen = ({ route, navigation }) => {
  const { bodyPart } = route.params;
  const { membership, gymDetails } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const gymId = membership?.gym_id ?? gymDetails?.id;
        const today = new Date().toISOString().split('T')[0];
        const res = await gymService.getActiveActivities(gymId, bodyPart, today, 'current');
        setData(res);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [bodyPart, membership, gymDetails]);

  const reportAsFalse = (activityId) => {
    // TODO: call API to flag this activity if needed
    console.warn('reportAsFalse called for', activityId);
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Avatar source={item.avatar_url ? { uri: item.avatar_url } : null} name={item.username} size="medium" />
      <View style={styles.info}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.started}>{new Date(item.started_at).toLocaleTimeString()}</Text>
      </View>
      <TouchableOpacity style={styles.action} onPress={() => reportAsFalse(item.activity_id)}>
        <Text style={styles.actionIcon}>🚫</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{bodyPart} - Active</Text>
      {loading && <ActivityIndicator />}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={data}
        keyExtractor={(item) => item.activity_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
  },
  header: {
    fontSize: SIZES.h4,
    fontWeight: '700',
    marginTop: SIZES.paddingLarge,  // extra top margin
    marginBottom: SIZES.padding,
    color: COLORS.text,
  },
  list: {
    paddingBottom: SIZES.padding,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.paddingSmall,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionIcon: {
    fontSize: 24,  // bigger icon
    color: COLORS.error,
  },
  info: {
    flex: 1,
    marginLeft: SIZES.paddingSmall,
  },
  username: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  started: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
  },
  action: {
    padding: SIZES.paddingSmall,
  },
  actionIcon: {
    fontSize: 24,
    color: COLORS.error,
  },
  error: {
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
});

export default BodyPartActivitiesScreen;
