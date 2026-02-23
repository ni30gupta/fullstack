import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  ...rest
}) => {
  const getButtonStyle = () => {
    const baseStyle = { ...styles.button, ...getSizeStyle() };

    switch (variant) {
      case 'primary':
        return { ...baseStyle, backgroundColor: disabled ? COLORS.grayDark : COLORS.primary };
      case 'secondary':
        return { ...baseStyle, backgroundColor: disabled ? COLORS.grayDark : COLORS.secondary };
      case 'outline':
        return { ...baseStyle, backgroundColor: COLORS.transparent, borderWidth: 2, borderColor: disabled ? COLORS.grayDark : COLORS.primary };
      case 'ghost':
        return { ...baseStyle, backgroundColor: COLORS.transparent };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = () => {
    const baseStyle = { ...styles.buttonText, ...getTextSizeStyle() };

    switch (variant) {
      case 'outline':
      case 'ghost':
        return { ...baseStyle, color: disabled ? COLORS.grayDark : COLORS.primary };
      default:
        return { ...baseStyle, color: disabled ? COLORS.gray : COLORS.white };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { height: SIZES.buttonHeightSmall, paddingHorizontal: SIZES.paddingSmall };
      case 'large':
        return { height: SIZES.buttonHeight + 8, paddingHorizontal: SIZES.paddingLarge };
      default:
        return { height: SIZES.buttonHeight, paddingHorizontal: SIZES.padding };
    }
  };

  const getTextSizeStyle = () => {
    switch (size) {
      case 'small':
        return { fontSize: SIZES.bodySmall };
      case 'large':
        return { fontSize: SIZES.h5 };
      default:
        return { fontSize: SIZES.body };
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.white} />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={[getTextStyle(), textStyle, icon && styles.textWithIcon]}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.radius,
  },
  buttonText: {
    fontWeight: '600',
  },
  textWithIcon: {
    marginHorizontal: 8,
  },
});

export default Button;
