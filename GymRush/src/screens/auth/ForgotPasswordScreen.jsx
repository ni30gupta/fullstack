import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '../../components';
import { useForm } from '../../hooks';
import { authService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';
import { VALIDATION } from '../../constants/config';

const validationSchema = {
  email: (value) => {
    if (!value) return 'Email is required';
    if (!VALIDATION.EMAIL_REGEX.test(value)) return 'Invalid email format';
    return null;
  },
};

export const ForgotPasswordScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isValid } = useForm(
    { email: '' },
    validationSchema
  );

  const onSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(values.email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>📧</Text>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successText}>
            We've sent password reset instructions to {values.email}
          </Text>
          <Button
            title="Back to Login"
            onPress={() => navigation.navigate('Login')}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.icon}>🔐</Text>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password
            </Text>
          </View>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Input
              label="Email"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              error={errors.email}
              touched={touched.email}
            />

            <Button
              title="Send Reset Link"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={!isValid}
              style={styles.button}
            />
          </View>

          <Button
            title="Back to Login"
            variant="ghost"
            onPress={() => navigation.goBack()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SIZES.padding,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.marginLarge,
  },
  icon: {
    fontSize: 64,
    marginBottom: SIZES.margin,
  },
  title: {
    fontSize: SIZES.h1,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SIZES.padding,
  },
  form: {
    marginBottom: SIZES.margin,
  },
  errorContainer: {
    backgroundColor: `${COLORS.error}20`,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.margin,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.bodySmall,
    textAlign: 'center',
  },
  button: {
    marginTop: SIZES.margin,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: SIZES.marginLarge,
  },
  successTitle: {
    fontSize: SIZES.h1,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  successText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SIZES.marginLarge,
    paddingHorizontal: SIZES.padding,
  },
});

export default ForgotPasswordScreen;
