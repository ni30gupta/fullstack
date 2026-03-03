import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useBodyPartLoad, useCheckin, useAuth } from '../../hooks';
import useSlots from '../../hooks/useSlots';
import { StatCard } from './StatCard';
import { COLORS, SIZES } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';

function getTotalBodyPartLoad(payload) {
  return (payload?.time_slot || []).reduce((total, slot) => {
    const breakdown = slot.body_part_breakdown || {};
    return (
      total +
      Object.values(breakdown).reduce((sum, value) => sum + value, 0)
    );
  }, 0);
}

export const GymRush = ({ onSelectionChange }) => {
  const { data: gymRushData, loading, error, selectedSlot, setSelectedSlot, getCurrentRush } = useBodyPartLoad();
  const [totalLoad, setTotalLoad] = useState(0);

  const { isCheckedIn, checkIn, loading: checkinLoading } = useCheckin();
  const { slots, fmt } = useSlots();

  const { gymDetails } = useAuth();
  const navigation = useNavigation();
  const isOwner = !!gymDetails;

  const [selectedParts, setSelectedParts] = useState([]);
  const togglePart = (part) => {
    setSelectedParts((prev) => {
      if (prev.includes(part)) return prev.filter((p) => p !== part);
      return [...prev, part];
    });
  };

  // inform parent of selection changes
  useEffect(() => {
    if (onSelectionChange) onSelectionChange(selectedParts);
  }, [selectedParts, onSelectionChange]);

  useEffect(() => {
    console.log('use effect')
    setTotalLoad(getTotalBodyPartLoad(gymRushData));
  }, [gymRushData]);

  useEffect(() => {
    // clear selected parts if we become checked in or rush data resets
    if (isCheckedIn || !gymRushData) {
      setSelectedParts([]);
    }
  }, [isCheckedIn, gymRushData]);

  const currentSlot = slots.find((s) => s.key === selectedSlot) || slots[0];
  // (checkin loading could be shown via separate state if desired)

  const renderSlotSelector = () => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slotRowContent}
        style={styles.slotRow}
      >
        {slots.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[
              styles.slotButton,
              selectedSlot === s.key && styles.slotButtonSelected,
            ]}
            onPress={() => setSelectedSlot(s.key)}
          >
            <Text
              style={
                selectedSlot === s.key
                  ? styles.slotTextSelected
                  : styles.slotText
              }
            >
              {s.label}
            </Text>
            <Text
              style={
                selectedSlot === s.key
                  ? styles.slotTimeSelected
                  : styles.slotTime
              }
            >
              {fmt(s.range.start)} - {fmt(s.range.end)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
      {checkinLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {/* header with total load and slot selector */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.smallLabel}>Total Load</Text>
          <Text style={styles.total}>{totalLoad}</Text>
        </View>
        {renderSlotSelector()}
      </View>

      {/* body part stats grid */}
      <View style={styles.grid}>
        {gymRushData?.time_slot?.[0] &&
          Object.entries(gymRushData.time_slot[0].body_part_breakdown || {}).map(
            ([bodyPart, load]) => {
              const isSelected = selectedParts.includes(bodyPart);
              return (
                <StatCard
                  key={bodyPart}
                  title={bodyPart}
                  value={load}
                  total_load={totalLoad}
                  change={
                    gymRushData.time_slot[0].change?.[bodyPart] || 0
                  }
                  style={[styles.statCard, isSelected && styles.selectedCard]}
                  onPress={() => {
                    if (isOwner) {
                      // owner wants to see people working on this part
                      navigation.navigate('BodyPartActivities', { bodyPart });
                      return;
                    }
                    if (isCheckedIn || checkinLoading) return;
                    togglePart(bodyPart);
                  }}
                />
              );
            }
          )}
      </View>

      {error && <Text style={styles.error}>Error loading data</Text>}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SIZES.padding,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.marginLarge,
  },
  smallLabel: {
    fontSize: SIZES.bodySmall,
    color: COLORS.textSecondary,
  },
  total: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
  },
  slotRow: {
    marginBottom: SIZES.margin, // space below slot selector
    // container for horizontal scroll
  },
  slotRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotButton: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.card,
    marginLeft: SIZES.base,
  },
  slotButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  slotText: {
    fontSize: SIZES.bodySmall,
    color: COLORS.text,
  },
  slotTextSelected: {
    fontSize: SIZES.bodySmall,
    color: COLORS.white,
    fontWeight: '600',
  },
  slotTime: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
  },
  slotTimeSelected: {
    fontSize: SIZES.caption,
    color: COLORS.white,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    marginBottom: SIZES.margin,
    width: '48%',
  },
  selectedCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  error: {
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SIZES.margin,
  },
  fab: {
    position: 'absolute',
    bottom: SIZES.padding,
    right: SIZES.padding,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radiusLarge,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 20,
  },
  fabText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: SIZES.bodySmall,
  },
});

export default GymRush;
