import React from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '../../components';
import { useForm } from '../../hooks';
import { useAuth } from '../../context';
import { COLORS, SIZES } from '../../constants/theme';
import { VALIDATION } from '../../constants/config';

const validationSchema = {
  name: (value) => {
    if (!value) return 'Name is required';
    if (value.length < 2) return 'Name must be at least 2 characters';
    return null;
  },
  email: (value) => {
    if (!value) return 'Email is required';
    if (!VALIDATION.EMAIL_REGEX.test(value)) return 'Invalid email format';
    return null;
  },
  phone: (value) => {
    if (!value) return 'Phone number is required';
    if (!VALIDATION.PHONE_REGEX.test(value)) return 'Invalid phone number';
    return null;
  },
  password: (value) => {
    if (!value) return 'Password is required';
    if (value.length < VALIDATION.PASSWORD_MIN_LENGTH) return `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`;
    return null;
  },
  confirmPassword: (value, allValues) => {
    if (!value) return 'Please confirm your password';
    if (value !== allValues.password) return 'Passwords do not match';
    return null;
  },
};

export const RegisterScreen = ({ navigation }) => {
  const { register, isLoading, error } = useAuth();

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isValid } = useForm(
    { name: '', email: '', phone: '', password: '', confirmPassword: '' },
    validationSchema
  );

  const onSubmit = async () => {
    const result = await register({
      name: values.name,
      email: values.email,
      phone: values.phone,
      password: values.password,
    });
    if (result.success) {
      // Registration successful, user is auto logged in
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.logo}>💪 GymRush</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us and start your fitness journey</Text>
          </View>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Input
              label="Full Name"
              placeholder="Enter your full name"
              autoCapitalize="words"
              value={values.name}
              onChangeText={handleChange('name')}
              onBlur={handleBlur('name')}
              error={errors.name}
              touched={touched.name}
            />

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

            <Input
              label="Phone Number"
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              value={values.phone}
              onChangeText={handleChange('phone')}
              onBlur={handleBlur('phone')}
              error={errors.phone}
              touched={touched.phone}
            />

            <Input
              label="Password"
              placeholder="Create a password"
              secureTextEntry
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              error={errors.password}
              touched={touched.password}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              secureTextEntry
              value={values.confirmPassword}
              onChangeText={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              error={errors.confirmPassword}
              touched={touched.confirmPassword}
            />

            <Button
              title="Create Account"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={!isValid}
              style={styles.button}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Button
              title="Sign In"
              variant="outline"
              onPress={() => navigation.goBack()}
              style={styles.signinButton}
            />
          </View>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.marginLarge,
    marginTop: SIZES.margin,
  },
  logo: {
    fontSize: 42,
    marginBottom: SIZES.margin,
  },
  title: {
    fontSize: SIZES.h1,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: SIZES.marginLarge,
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
  footer: {
    alignItems: 'center',
    paddingBottom: SIZES.padding,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    marginBottom: SIZES.base,
  },
  signinButton: {
    width: '100%',
  },
});

export default RegisterScreen;
