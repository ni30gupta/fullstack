import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Badge, Loading } from '../../components';
import { useWorkoutHistory } from '../../hooks';
import { COLORS, SIZES } from '../../constants/theme';

const WorkoutItem = ({ workout }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Card style={styles.workoutCard}>
      <View style={styles.workoutHeader}>
        <View style={styles.workoutInfo}>
          <Text style={styles.workoutType}>{workout.type}</Text>
          <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
        </View>
        <Badge
          label={formatDuration(workout.duration)}
          variant="primary"
          size="small"
        />
      </View>

      <View style={styles.workoutDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Calories</Text>
          <Text style={styles.detailValue}>{workout.caloriesBurned}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Exercises</Text>
          <Text style={styles.detailValue}>{workout.exerciseCount}</Text>
        </View>
        {workout.personalBests > 0 && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>PRs</Text>
            <Text style={[styles.detailValue, styles.prValue]}>🏆 {workout.personalBests}</Text>
          </View>
        )}
      </View>

      {workout.notes && (
        <Text style={styles.notes}>{workout.notes}</Text>
      )}
    </Card>
  );
};

export const WorkoutsScreen = () => {
  const { data: workouts, loading, error, refetch } = useWorkoutHistory();

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🏋️</Text>
      <Text style={styles.emptyTitle}>No Workouts Yet</Text>
      <Text style={styles.emptyText}>
        Check in at the gym to start tracking your workouts!
      </Text>
    </View>
  );

  if (loading && !workouts) {
    return <Loading fullScreen message="Loading workouts..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout History</Text>
        <Text style={styles.subtitle}>
          {workouts?.length || 0} workouts this month
        </Text>
      </View>

      <FlatList
        data={workouts || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <WorkoutItem workout={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor={COLORS.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SIZES.padding,
    paddingBottom: SIZES.paddingSmall,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  listContent: {
    padding: SIZES.padding,
    paddingTop: 0,
    paddingBottom: SIZES.paddingLarge * 2,
  },
  workoutCard: {
    marginBottom: SIZES.base,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.paddingSmall,
  },
  workoutInfo: {},
  workoutType: {
    fontSize: SIZES.h5,
    fontWeight: '600',
    color: COLORS.text,
  },
  workoutDate: {
    fontSize: SIZES.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  workoutDetails: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardLight,
    borderRadius: SIZES.radius,
    padding: SIZES.paddingSmall,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: SIZES.caption,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  prValue: {
    color: COLORS.warning,
  },
  notes: {
    fontSize: SIZES.bodySmall,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SIZES.paddingSmall,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.paddingLarge * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SIZES.margin,
  },
  emptyTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SIZES.paddingLarge,
  },
});

export default WorkoutsScreen;
