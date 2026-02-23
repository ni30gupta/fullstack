import React from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '../../components';
import { useForm } from '../../hooks';
import { useAuth } from '../../context';
import { COLORS, SIZES } from '../../constants/theme';
import { VALIDATION } from '../../constants/config';

const validationSchema = {
  username: (value) => {
    if (!value) return 'Username is required';
    // If it's numeric, require exactly 10 digits (mobile number)
    if (/^\d+$/.test(value) && value.length !== 10) return 'Mobile number must be 10 digits';
    return null;
  },
  password: (value) => {
    if (!value) return 'Password is required';
    return null;
  },
};

export const LoginScreen = ({ navigation }) => {
  const { login, isLoading, error } = useAuth();

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isValid } = useForm(
    { username: '', password: '' },
    validationSchema
  );

  const onSubmit = async () => {
    console.log('first')
    const result = await login(values.username, values.password);
    if (!result.success) {
      // Error is handled by context
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.logo}>💪 GymRush</Text>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue your fitness journey</Text>
          </View>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Input
              label="Username"
              placeholder="Enter username or 10-digit mobile"
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              value={values?.username}
              onChangeText={handleChange('username')}
              onBlur={handleBlur('username')}
              error={errors.username}
              touched={touched.username}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={values?.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              error={errors.password}
              touched={touched.password}
            />

            <Button
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={!isValid}
              style={styles.button}
            />

            <Button
              title="Forgot Password?"
              variant="ghost"
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Button
              title="Sign Up"
              variant="outline"
              onPress={() => navigation.navigate('Register')}
              style={styles.signupButton}
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.marginLarge,
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
  forgotButton: {
    marginTop: SIZES.base,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    marginBottom: SIZES.base,
  },
  signupButton: {
    width: '100%',
  },
});

export default LoginScreen;
