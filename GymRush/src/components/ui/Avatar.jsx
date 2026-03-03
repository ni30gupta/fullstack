import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, SIZES } from '../../constants/theme';

export const Avatar = ({ source, name, size = 'medium', style }) => {
  const getSize = () => {
    switch (size) {
      case 'small': return 32;
      case 'large': return 64;
      case 'xlarge': return 96;
      default: return 48;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return SIZES.bodySmall;
      case 'large': return SIZES.h4;
      case 'xlarge': return SIZES.h2;
      default: return SIZES.body;
    }
  };

  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  const dimension = getSize();
  const iconSize = dimension * 0.6; // make icon proportionally larger when no initials

  if (source) {
    return (
      <Image
        source={{ uri: source }}
        style={[styles.image, { width: dimension, height: dimension, borderRadius: dimension / 2 }, style]}
      />
    );
  }

  return (
    <View style={[styles.placeholder, { width: dimension, height: dimension, borderRadius: dimension / 2 }, style]}>
      {name ? (
        <Text style={[styles.initials, { fontSize: getFontSize() }]}>{getInitials(name)}</Text>
      ) : (
        <Icon name="person" size={iconSize} color={COLORS.white} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: COLORS.cardLight,
  },
  placeholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default Avatar;
