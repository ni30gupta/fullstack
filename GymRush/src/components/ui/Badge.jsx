import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

export const Badge = ({ label, variant = 'primary', size = 'medium', style }) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: `${COLORS.primary}20`, borderColor: COLORS.primary };
      case 'secondary':
        return { backgroundColor: `${COLORS.secondary}40`, borderColor: COLORS.border };
      case 'success':
        return { backgroundColor: `${COLORS.success}20`, borderColor: COLORS.success };
      case 'warning':
        return { backgroundColor: `${COLORS.warning}20`, borderColor: COLORS.warning };
      case 'error':
        return { backgroundColor: `${COLORS.error}20`, borderColor: COLORS.error };
      case 'info':
        return { backgroundColor: `${COLORS.accent}20`, borderColor: COLORS.accent };
      default:
        return {};
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary': return COLORS.primary;
      case 'secondary': return COLORS.textSecondary;
      case 'success': return COLORS.success;
      case 'warning': return COLORS.warning;
      case 'error': return COLORS.error;
      case 'info': return COLORS.accent;
      default: return COLORS.text;
    }
  };

  return (
    <View style={[styles.badge, getVariantStyle(), size === 'small' && styles.badgeSmall, style]}>
      <Text style={[styles.label, { color: getTextColor() }, size === 'small' && styles.labelSmall]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SIZES.paddingSmall,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSmall,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  label: {
    fontSize: SIZES.bodySmall,
    fontWeight: '600',
  },
  labelSmall: {
    fontSize: SIZES.caption,
  },
});

export default Badge;
