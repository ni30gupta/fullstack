import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

export const Card = ({
  children,
  title,
  subtitle,
  onPress,
  style,
  variant = 'default',
  headerRight,
}) => {
  const getCardStyle = () => {
    switch (variant) {
      case 'elevated':
        return { ...styles.card, ...SHADOWS.medium };
      case 'outlined':
        return { ...styles.card, borderWidth: 1, borderColor: COLORS.border };
      default:
        return styles.card;
    }
  };

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={[getCardStyle(), style]} onPress={onPress} activeOpacity={0.9}>
      {(title || subtitle || headerRight) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding,
    marginVertical: SIZES.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.paddingSmall,
  },
  headerText: {
    flex: 1,
  },
  headerRight: {
    marginLeft: SIZES.base,
  },
  title: {
    fontSize: SIZES.h5,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: SIZES.bodySmall,
    color: COLORS.textSecondary,
  },
  content: {},
});

export default Card;
