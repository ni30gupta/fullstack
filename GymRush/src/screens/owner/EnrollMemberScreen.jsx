import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button, Card } from '../../components';
import { useAuth } from '../../hooks';
import { gymService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';

const DURATIONS = [
  { label: '1 Month',  value: 1 },
  { label: '3 Months', value: 3 },
  { label: '6 Months', value: 6 },
  { label: '1 Year',   value: 12 },
];

export const EnrollMemberScreen = ({ navigation, route }) => {
  const { gymDetails } = useAuth();
  const onSuccess = route.params?.onSuccess;

  const [form, setForm] = useState({
    name:            '',
    phone:           '',
    email:           '',
    duration_months: 1,
    amount:          '',
    amount_paid:     '',
    start_date:      new Date().toISOString().split('T')[0],
    is_active:       true,
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())           e.name  = 'Name is required';
    if (!form.phone.trim())          e.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit phone';
    if (!form.duration_months)       e.duration_months = 'Select a duration';
    if (form.amount && isNaN(parseFloat(form.amount)))       e.amount      = 'Invalid amount';
    if (form.amount_paid && isNaN(parseFloat(form.amount_paid))) e.amount_paid = 'Invalid amount';
    if (form.start_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.start_date)) e.start_date = 'Use YYYY-MM-DD format';
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      const payload = {
        name:            form.name.trim(),
        phone:           form.phone.trim(),
        email:           form.email.trim() || null,
        duration_months: form.duration_months,
        amount:          form.amount      ? parseFloat(form.amount)      : null,
        amount_paid:     form.amount_paid ? parseFloat(form.amount_paid) : null,
        start_date:      form.start_date  || null,
        is_active:       form.is_active,
      };
      await gymService.enrollMember(gymDetails.id, payload);
      onSuccess?.();
      Alert.alert('Success', `${form.name} has been enrolled!`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Enrollment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Enroll New Member</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Personal details */}
        <Text style={styles.sectionLabel}>Member Details</Text>
        <Card style={styles.section}>
          <Input
            label="Full Name *"
            placeholder="e.g. Arjun Sharma"
            value={form.name}
            onChangeText={v => set('name', v)}
            error={errors.name}
            touched={!!errors.name}
          />
          <Input
            label="Phone *"
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            value={form.phone}
            onChangeText={v => set('phone', v)}
            error={errors.phone}
            touched={!!errors.phone}
          />
          <Input
            label="Email"
            placeholder="Optional"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={v => set('email', v)}
            error={errors.email}
            touched={!!errors.email}
          />
        </Card>

        {/* Membership details */}
        <Text style={styles.sectionLabel}>Membership</Text>
        <Card style={styles.section}>
          <Text style={styles.fieldLabel}>Duration *</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map(d => (
              <TouchableOpacity
                key={d.value}
                style={[styles.durationBtn, form.duration_months === d.value && styles.durationBtnActive]}
                onPress={() => set('duration_months', d.value)}
              >
                <Text style={[styles.durationText, form.duration_months === d.value && styles.durationTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.duration_months && <Text style={styles.errText}>{errors.duration_months}</Text>}

          <Input
            label="Total Fee (₹)"
            placeholder="e.g. 2000"
            keyboardType="decimal-pad"
            value={form.amount}
            onChangeText={v => set('amount', v)}
            error={errors.amount}
            touched={!!errors.amount}
          />
          <Input
            label="Amount Paid (₹)"
            placeholder="e.g. 1000"
            keyboardType="decimal-pad"
            value={form.amount_paid}
            onChangeText={v => set('amount_paid', v)}
            error={errors.amount_paid}
            touched={!!errors.amount_paid}
          />
          <Input
            label="Start Date"
            placeholder="YYYY-MM-DD (default: today)"
            value={form.start_date}
            onChangeText={v => set('start_date', v)}
            error={errors.start_date}
            touched={!!errors.start_date}
          />

          {/* Activate toggle */}
          <TouchableOpacity
            style={[styles.toggleRow, form.is_active && styles.toggleRowOn]}
            onPress={() => set('is_active', !form.is_active)}
            activeOpacity={0.8}
          >
            <View style={[styles.toggleDot, form.is_active && styles.toggleDotOn]} />
            <Text style={[styles.toggleLabel, form.is_active && styles.toggleLabelOn]}>
              {form.is_active ? 'Activate membership immediately' : 'Save as pending (inactive)'}
            </Text>
          </TouchableOpacity>
        </Card>

        <Button
          title="Enroll Member"
          onPress={submit}
          loading={loading}
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.background },
  topBar:           {
    flexDirection: 'row', alignItems: 'center',
    padding: SIZES.padding, backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn:          { marginRight: SIZES.paddingSmall, padding: 4 },
  backArrow:        { fontSize: 28, color: COLORS.primary, lineHeight: 32 },
  topTitle:         { flex: 1, fontSize: SIZES.h5, fontWeight: '700', color: COLORS.text },

  scroll:           { padding: SIZES.padding, paddingBottom: 40 },
  sectionLabel:     { fontSize: SIZES.bodySmall, fontWeight: '700', color: COLORS.textMuted, marginBottom: 8, marginTop: SIZES.paddingSmall, textTransform: 'uppercase', letterSpacing: 0.8 },
  section:          { marginBottom: SIZES.margin },

  fieldLabel:       { fontSize: SIZES.bodySmall, color: COLORS.textSecondary, marginBottom: SIZES.paddingSmall, fontWeight: '600' },
  durationRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SIZES.margin },
  durationBtn:      {
    paddingHorizontal: SIZES.padding, paddingVertical: 8,
    borderRadius: SIZES.radius, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  durationBtnActive:{ borderColor: COLORS.primary, backgroundColor: COLORS.primary + '18' },
  durationText:     { fontSize: SIZES.bodySmall, color: COLORS.textMuted, fontWeight: '600' },
  durationTextActive:{ color: COLORS.primary },

  errText:          { color: COLORS.error, fontSize: SIZES.caption, marginBottom: SIZES.paddingSmall },

  toggleRow:        {
    flexDirection: 'row', alignItems: 'center',
    padding: SIZES.paddingSmall, borderRadius: SIZES.radius,
    backgroundColor: COLORS.textMuted + '18', borderWidth: 1, borderColor: COLORS.border,
    marginTop: SIZES.paddingSmall,
  },
  toggleRowOn:      { backgroundColor: COLORS.success + '18', borderColor: COLORS.success },
  toggleDot:        {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.textMuted, marginRight: SIZES.paddingSmall,
  },
  toggleDotOn:      { backgroundColor: COLORS.success },
  toggleLabel:      { fontSize: SIZES.bodySmall, color: COLORS.textMuted, fontWeight: '600' },
  toggleLabelOn:    { color: COLORS.success },

  submitBtn:        { marginTop: SIZES.padding },
});

export default EnrollMemberScreen;
