import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

/**
 * OverlayLoader — full-screen blocking overlay shown during async actions.
 *
 * Props:
 *   visible  (bool)    — whether to show the overlay
 *   message  (string)  — optional label below the spinner
 *
 * Usage:
 *   <OverlayLoader visible={isLoading} message="Getting your location…" />
 */
export const OverlayLoader = ({ visible = false, message = 'Please wait…' }) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const pulse    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    // Continuous spin for the outer ring
    const spin = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    // Gentle pulse for the inner icon
    const pulsate = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );

    spin.start();
    pulsate.start();

    return () => {
      spin.stop();
      pulsate.stop();
      rotation.setValue(0);
      pulse.setValue(1);
    };
  }, [visible, rotation, pulse]);

  const rotateDeg = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}} // prevent back-button dismiss
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Spinner ring + icon */}
          <View style={styles.spinnerWrapper}>
            <Animated.View style={[styles.ring, { transform: [{ rotate: rotateDeg }] }]} />
            <Animated.Text style={[styles.icon, { transform: [{ scale: pulse }] }]}>
              📍
            </Animated.Text>
          </View>

          <Text style={styles.message}>{message}</Text>
          <Text style={styles.subtext}>Please hold a second</Text>
        </View>
      </View>
    </Modal>
  );
};

const RING_SIZE = 80;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    paddingVertical: 36,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 220,
    elevation: 12,
  },
  spinnerWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderTopColor: 'transparent',
  },
  icon: {
    fontSize: 32,
  },
  message: {
    fontSize: SIZES.body,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtext: {
    fontSize: SIZES.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});

export default OverlayLoader;
