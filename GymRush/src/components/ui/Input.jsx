import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

export const Input = ({
  label,
  error,
  touched,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  onRightIconPress,
  secureTextEntry,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const showError = touched && error;

  const getBorderColor = () => {
    if (showError) return COLORS.error;
    if (isFocused) return COLORS.primary;
    return COLORS.border;
  };

  const handleTogglePassword = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      <View style={[styles.inputContainer, { borderColor: getBorderColor() }]}>
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || secureTextEntry) && styles.inputWithRightIcon,
            inputStyle,
          ]}
          placeholderTextColor={COLORS.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...rest}
        />

        {secureTextEntry ? (
          <TouchableOpacity style={styles.iconContainer} onPress={handleTogglePassword}>
            <Text style={styles.toggleText}>{isPasswordVisible ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        ) : (
          rightIcon && (
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
            >
              {rightIcon}
            </TouchableOpacity>
          )
        )}
      </View>

      {showError && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.margin,
  },
  label: {
    fontSize: SIZES.bodySmall,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    borderWidth: 1.5,
    height: SIZES.inputHeight,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: SIZES.padding,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  iconContainer: {
    paddingHorizontal: SIZES.paddingSmall,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    color: COLORS.primary,
    fontSize: SIZES.bodySmall,
    fontWeight: '600',
  },
  errorText: {
    fontSize: SIZES.caption,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default Input;
