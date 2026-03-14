import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES } from '../../constants/theme';
import { useUpdates } from '../../hooks';
import NotificationBadgeContext from '../../context/NotificationBadgeContext';

export const UpdatesScreen = () => {
  const { updates, loading, error, refetch } = useUpdates();
  const { resetBadge } = useContext(NotificationBadgeContext);

  useFocusEffect(
    React.useCallback(() => {
      resetBadge();
    }, [resetBadge]),
  );

  const renderItem = ({ item }) => (
    <View style={styles.updateCard}>
      <Text style={styles.updateTitle}>{item.title}</Text>
      <Text style={styles.updateBody}>{item.message}</Text>
      <Text style={styles.updateDate}>{new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{error ? error : 'No updates available'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={updates}
        keyExtractor={(u) => String(u.id)}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={COLORS.primary} />}
      />
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
  updateCard: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 8,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  updateBody: {
    fontSize: SIZES.body,
    color: COLORS.textMuted,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: SIZES.body,
  },
});

export default UpdatesScreen;
