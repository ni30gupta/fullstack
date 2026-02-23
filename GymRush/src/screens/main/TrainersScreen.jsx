import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Avatar, Badge, Button, Loading } from '../../components';
import { useTrainers, useBookings } from '../../hooks';
import { COLORS, SIZES } from '../../constants/theme';

const TrainerCard = ({ trainer, onBook }) => (
  <Card style={styles.trainerCard}>
    <View style={styles.trainerHeader}>
      <Avatar source={trainer.avatar} name={trainer.name} size="large" />
      <View style={styles.trainerInfo}>
        <Text style={styles.trainerName}>{trainer.name}</Text>
        <Text style={styles.trainerSpecialty}>{trainer.specialty}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>⭐ {trainer.rating.toFixed(1)}</Text>
          <Text style={styles.experience}> • {trainer.experience}+ years</Text>
        </View>
      </View>
    </View>

    <View style={styles.trainerStats}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{trainer.clientsCount}</Text>
        <Text style={styles.statLabel}>Clients</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{trainer.sessionsCompleted}</Text>
        <Text style={styles.statLabel}>Sessions</Text>
      </View>
      <View style={styles.statItem}>
        <Badge
          label={trainer.availability ? 'Available' : 'Busy'}
          variant={trainer.availability ? 'success' : 'secondary'}
          size="small"
        />
      </View>
    </View>

    <Text style={styles.trainerBio} numberOfLines={3}>{trainer.bio}</Text>

    <Button
      title="Book Session"
      onPress={() => onBook(trainer)}
      disabled={!trainer.availability}
      style={styles.bookButton}
      size="small"
    />
  </Card>
);

export const TrainersScreen = () => {
  const { data: trainers, loading, error, refetch } = useTrainers();
  const { bookSession, loading: bookingLoading } = useBookings();
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleBook = (trainer) => {
    setSelectedTrainer(trainer);
    setShowModal(true);
  };

  const handleConfirmBooking = async () => {
    if (selectedTrainer) {
      await bookSession(selectedTrainer.id);
      setShowModal(false);
      setSelectedTrainer(null);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>👨‍🏫</Text>
      <Text style={styles.emptyTitle}>No Trainers Available</Text>
      <Text style={styles.emptyText}>
        Check back later for available personal trainers
      </Text>
    </View>
  );

  if (loading && !trainers) {
    return <Loading fullScreen message="Loading trainers..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Personal Trainers</Text>
        <Text style={styles.subtitle}>
          {trainers?.filter((t) => t.availability).length || 0} available now
        </Text>
      </View>

      <FlatList
        data={trainers || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TrainerCard trainer={item} onBook={handleBook} />}
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

      {/* Booking Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Book Session</Text>

            {selectedTrainer && (
              <View style={styles.modalTrainer}>
                <Avatar source={selectedTrainer.avatar} name={selectedTrainer.name} size="large" />
                <Text style={styles.modalTrainerName}>{selectedTrainer.name}</Text>
                <Text style={styles.modalTrainerSpecialty}>{selectedTrainer.specialty}</Text>
              </View>
            )}

            <Text style={styles.modalText}>
              Would you like to book a personal training session with {selectedTrainer?.name}?
            </Text>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowModal(false)}
                style={styles.modalButton}
              />
              <Button
                title="Confirm"
                onPress={handleConfirmBooking}
                loading={bookingLoading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  trainerCard: {
    marginBottom: SIZES.margin,
  },
  trainerHeader: {
    flexDirection: 'row',
    marginBottom: SIZES.paddingSmall,
  },
  trainerInfo: {
    flex: 1,
    marginLeft: SIZES.padding,
    justifyContent: 'center',
  },
  trainerName: {
    fontSize: SIZES.h4,
    fontWeight: '700',
    color: COLORS.text,
  },
  trainerSpecialty: {
    fontSize: SIZES.bodySmall,
    color: COLORS.primary,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    fontSize: SIZES.bodySmall,
    color: COLORS.warning,
    fontWeight: '600',
  },
  experience: {
    fontSize: SIZES.bodySmall,
    color: COLORS.textSecondary,
  },
  trainerStats: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardLight,
    borderRadius: SIZES.radius,
    padding: SIZES.paddingSmall,
    marginBottom: SIZES.paddingSmall,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: SIZES.h5,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: SIZES.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  trainerBio: {
    fontSize: SIZES.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SIZES.paddingSmall,
  },
  bookButton: {
    marginTop: SIZES.base,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: SIZES.radiusLarge,
    borderTopRightRadius: SIZES.radiusLarge,
    padding: SIZES.paddingLarge,
    paddingBottom: SIZES.paddingLarge * 2,
  },
  modalTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.margin,
  },
  modalTrainer: {
    alignItems: 'center',
    marginBottom: SIZES.margin,
  },
  modalTrainerName: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SIZES.base,
  },
  modalTrainerSpecialty: {
    fontSize: SIZES.body,
    color: COLORS.primary,
  },
  modalText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.margin,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default TrainersScreen;
