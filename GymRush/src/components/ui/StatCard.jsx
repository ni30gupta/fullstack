import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

export const StatCard = ({ title, value, total_load, change, onPress, style }) => {
  const Wrapper = onPress ? TouchableOpacity : View;

  // compute progress percent
  let percent = parseFloat(value) || 0;
  if (total_load && total_load > 0) {
    percent = (value / total_load) * 100;
  }
  percent = Math.max(0, Math.min(100, percent));

  const radius = 40;
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <Wrapper style={[styles.card, SHADOWS.small, style]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.circleWrapper}>
        <Svg height={radius * 2} width={radius * 2} style={{ transform: [{ rotate: '180deg' }] }}>
          <Circle
            stroke={COLORS.border}
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <Circle
            stroke={COLORS.primary}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
          />
        </Svg>
        <Text style={styles.circleText}>{title.charAt(0)}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {typeof change === 'number' && (
        <Text
          style={[
            styles.change,
            change > 0 ? styles.changePositive : change < 0 ? styles.changeNegative : null,
          ]}
        >
          {change > 0 ? `+${change}` : change}
        </Text>
      )}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding,
    minWidth: 140,
    alignItems: 'center',
  },
  circleWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  circleText: {
    position: 'absolute',
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  title: {
    fontSize: SIZES.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  value: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  change: {
    fontSize: SIZES.caption,
    marginTop: 2,
  },
  changePositive: {
    color: COLORS.success,
  },
  changeNegative: {
    color: COLORS.error,
  },
});

export default StatCard;
