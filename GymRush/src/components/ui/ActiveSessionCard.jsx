import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Body part images mapping
const partImages = {
  CHEST: require('../../assets/body_parts/chest.jpeg'),
  BACK: require('../../assets/body_parts/back.jpeg'),
  LEGS: require('../../assets/body_parts/legs.jpeg'),
  SHOULDER: require('../../assets/body_parts/shoulder.jpeg'),
  CARDIO: require('../../assets/body_parts/cardio.jpeg'),
  ARMS: require('../../assets/body_parts/arms.jpeg'),
  BICEPS: require('../../assets/body_parts/biceps.jpeg'),
  TRICEPS: require('../../assets/body_parts/triceps.jpeg'),
  ABS: require('../../assets/body_parts/abs.jpeg'),
  MIXED: require('../../assets/body_parts/mixed.jpeg'),
};

// Format seconds to HH:MM:SS or MM:SS
const formatDuration = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

// Live Timer Hook
const useElapsedTimer = (startedAt) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;

    const startTime = new Date(startedAt).getTime();

    const updateElapsed = () => {
      const now = Date.now();
      const diffSeconds = Math.floor((now - startTime) / 1000);
      setElapsed(Math.max(0, diffSeconds));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsed;
};

// Pulsing animation for the timer
const PulsingDot = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.pulsingDot, { opacity: pulseAnim }]} />
  );
};

// Single Body Part Display
const BodyPartImage = ({ part, size = 'large' }) => {
  const normalizedPart = part?.toUpperCase?.() || 'MIXED';
  const imageSource = partImages[normalizedPart] || partImages.MIXED;
  const imageSize = size === 'large' ? styles.bodyPartLarge : styles.bodyPartMedium;

  return (
    <View style={[styles.bodyPartContainer, size === 'large' && styles.bodyPartContainerLarge]}>
      <Image source={imageSource} style={[styles.bodyPartImage, imageSize]} />
      <View style={styles.bodyPartLabelContainer}>
        <Text style={styles.bodyPartLabel}>{part}</Text>
      </View>
    </View>
  );
};

// helper to format start time (HH:MM)
const formatStartTime = (isoStr) => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export const ActiveSessionCard = ({
  gymName,
  slot,
  startedAt,
  bodyParts = [],
  onCheckOut,
  loading = false,
}) => {
  const elapsed = useElapsedTimer(startedAt);
  const displayParts = bodyParts.slice(0, 2); // Show max 2 parts
  const startTimeLabel = formatStartTime(startedAt);

  return (
    <View style={styles.container}>
      {/* Header with gym name and live indicator */}
      <View style={styles.header}>
        <View style={styles.liveIndicator}>
          <PulsingDot />
          <Text style={styles.liveText}>LIVE SESSION</Text>
        </View>
        {gymName && <Text style={styles.gymName}>{gymName}</Text>}
      </View>

      {/* Body Parts Display */}
      <View style={styles.bodyPartsSection}>
        {displayParts.length === 0 ? (
          <BodyPartImage part="MIXED" size="large" />
        ) : displayParts.length === 1 ? (
          <BodyPartImage part={displayParts[0]} size="large" />
        ) : (
          <View style={styles.twoPartsContainer}>
            {displayParts.map((part, index) => (
              <BodyPartImage key={index} part={part} size="medium" />
            ))}
          </View>
        )}
      </View>

      {/* Timer Section */}
      <View style={styles.timerSection}>
        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>STARTED</Text>
          <Text style={styles.startTimeText}>{startTimeLabel || '--:--'}</Text>
        </View>
        <View style={styles.timerDivider} />
        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>ELAPSED</Text>
          <Text style={styles.timerText}>{formatDuration(elapsed)}</Text>
        </View>
      </View>

      {slot && (
        <View style={styles.slotBadge}>
          <Text style={styles.slotText}>🕐 {slot}</Text>
        </View>
      )}

      {/* Motivational Message */}
      <Text style={styles.motivation}>
        {elapsed < 1800
          ? "🔥 You're crushing it! Keep going!"
          : elapsed < 3600
          ? "💪 Great progress! Stay focused!"
          : "🏆 Amazing endurance! You're a beast!"}
      </Text>

      {/* Check Out Button */}
      <TouchableOpacity
        style={styles.checkOutButton}
        onPress={onCheckOut}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.checkOutText}>
          {loading ? 'Checking Out...' : 'End Workout'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding,
    marginHorizontal: SIZES.padding,
    marginBottom: SIZES.base,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  gymName: {
    fontSize: SIZES.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  bodyPartsSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SIZES.padding,
  },
  twoPartsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SIZES.padding,
  },
  bodyPartContainer: {
    alignItems: 'center',
  },
  bodyPartContainerLarge: {
    marginBottom: SIZES.base,
  },
  bodyPartImage: {
    borderRadius: SIZES.radiusLarge,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  bodyPartLarge: {
    width: 180,
    height: 180,
  },
  bodyPartMedium: {
    width: 130,
    height: 130,
  },
  bodyPartLabelContainer: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: -16,
    zIndex: 1,
  },
  bodyPartLabel: {
    color: COLORS.white,
    fontSize: SIZES.bodySmall,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    paddingVertical: 16,
    paddingHorizontal: SIZES.padding,
    marginTop: SIZES.padding,
    marginBottom: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timerBox: {
    flex: 1,
    alignItems: 'center',
  },
  timerDivider: {
    width: 1,
    height: 50,
    backgroundColor: COLORS.border,
    marginHorizontal: SIZES.padding,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  startTimeText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  slotBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.base,
  },
  slotText: {
    fontSize: SIZES.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  motivation: {
    textAlign: 'center',
    fontSize: SIZES.body,
    color: COLORS.text,
    marginVertical: SIZES.padding,
    fontWeight: '500',
  },
  checkOutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 'auto',
  },
  checkOutText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ActiveSessionCard;
