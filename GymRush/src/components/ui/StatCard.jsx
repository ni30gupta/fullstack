import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

export const StatCard = ({ title, value, subtitle, icon, trend, onPress, style }) => {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={[styles.card, SHADOWS.small, style]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>

      <Text style={styles.value}>{value}</Text>

      <View style={styles.footer}>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {trend && (
          <View style={[styles.trend, trend.isPositive ? styles.trendPositive : styles.trendNegative]}>
            <Text style={[styles.trendText, { color: trend.isPositive ? COLORS.success : COLORS.error }]}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </Text>
          </View>
        )}
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding,
    minWidth: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  title: {
    fontSize: SIZES.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtitle: {
    fontSize: SIZES.caption,
    color: COLORS.textMuted,
  },
  trend: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSmall,
  },
  trendPositive: {
    backgroundColor: `${COLORS.success}20`,
  },
  trendNegative: {
    backgroundColor: `${COLORS.error}20`,
  },
  trendText: {
    fontSize: SIZES.caption,
    fontWeight: '600',
  },
});

export default StatCard;
