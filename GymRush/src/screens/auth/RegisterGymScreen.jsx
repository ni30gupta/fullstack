import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Picker } from '../../components';
import { useForm } from '../../hooks';
import { useAuth } from '../../hooks';
import { COLORS, SIZES } from '../../constants/theme';
import { VALIDATION } from '../../constants/config';

const validationSchema = {
  username: (value) => {
    if (!value) return 'Mobile number is required';
    if (!VALIDATION.PHONE_REGEX.test(value)) return 'Invalid mobile number';
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
  gymName: (value) => {
    if (!value) return 'Gym name is required';
    return null;
  },
  gymAddress: (value) => {
    if (!value) return 'Gym address is required';
    return null;
  },
  gymType: (value) => {
    if (!value) return 'Gym type is required';
    return null;
  },
};

export const RegisterGymScreen = ({ navigation }) => {
  const { registerGym } = useAuth();
  const [localLoading, setLocalLoading] = React.useState(false);
  const [localError, setLocalError] = React.useState(null);

  // example defaults — you can change or remove before production
  const initialValues = {
    username: '9113265630',
    password: 'ni30@1234',
    confirmPassword: 'ni30@1234',
    gymName: 'hoo',
    gymAddress: 'mansa',
    gymType: 'yoga',
    latitude: null,
    longitude: null,
  };

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isValid, setValues } = useForm(
    initialValues,
    validationSchema
  );

  console.log('va', values); // ensure this prints when screen renders

  // attempt to get current location once on mount
  useEffect(() => {
    if (navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setValues({ ...values, latitude, longitude });
        },
        (err) => console.warn('location error', err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    }
  }, []);

  const onSubmit = async () => {
    const payload = {
      username: values.username,
      password: values.password,
      password2: values.confirmPassword,
      gymName: values.gymName,
      gymAddress: values.gymAddress,
      gymType: values.gymType,
      latitude: values.latitude,
      longitude: values.longitude,
    };

    setLocalError(null);
    setLocalLoading(true);
    try {
      const result = await registerGym(payload);
      if (result.success) {
        // successful registration, maybe navigate or show alert
        Alert.alert('Success', 'Gym registered. Please login.');
        navigation.navigate('Login');
      } else {
        setLocalError(result.message);
      }
    } catch (error) {
      console.warn('registerGym exception', error);
      setLocalError(error.message || 'Unexpected error');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.logo}>GymRush</Text>
            <Text style={styles.title}>Register Your Gym</Text>
            <Text style={styles.subtitle}>Create an owner account and add your gym</Text>
          </View>

          <View style={styles.form}>
            {localError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{localError}</Text>
              </View>
            )}

            <Input
              label="Mobile Number"
              placeholder="Enter your mobile number"
              keyboardType="phone-pad"
              value={values.username}
              onChangeText={handleChange('username')}
              onBlur={handleBlur('username')}
              error={errors.username}
              touched={touched.username}
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

            <Input
              label="Gym Name"
              placeholder="Enter your gym's name"
              value={values.gymName}
              onChangeText={handleChange('gymName')}
              onBlur={handleBlur('gymName')}
              error={errors.gymName}
              touched={touched.gymName}
            />

            <Input
              label="Gym Address"
              placeholder="Enter your gym's address"
              value={values.gymAddress}
              onChangeText={handleChange('gymAddress')}
              onBlur={handleBlur('gymAddress')}
              error={errors.gymAddress}
              touched={touched.gymAddress}
            />

            <Input
              label="Gym Type"
              placeholder="e.g. CrossFit, Yoga, General Fitness"
              value={values.gymType}
              onChangeText={handleChange('gymType')}
              onBlur={handleBlur('gymType')}
              error={errors.gymType}
              touched={touched.gymType}
            />

            <Button
              title="Register Gym"
              onPress={handleSubmit(onSubmit)}
              loading={localLoading}
              disabled={!isValid || localLoading}
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
    color: COLORS.primary,
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

export default RegisterGymScreen;
