import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

export const Loading = ({ size = 'large', color = COLORS.primary, message, fullScreen = false }) => {
  const content = (
    <View style={styles.content}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreen}>{content}</View>;
  }

  return content;
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  message: {
    marginTop: SIZES.margin,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
});

export default Loading;
