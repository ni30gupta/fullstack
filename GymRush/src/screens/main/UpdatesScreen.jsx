import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../../constants/theme';

// placeholder data; later this could be pulled from an API
const dummyUpdates = [];

export const UpdatesScreen = () => {
  const renderItem = ({ item }) => (
    <View style={styles.updateCard}>
      <Text style={styles.updateTitle}>{item.title}</Text>
      <Text style={styles.updateBody}>{item.body}</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No updates available</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={[ 'top' ]}>
      <FlatList
        data={dummyUpdates}
        keyExtractor={(u, i) => String(i)}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.content}
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
