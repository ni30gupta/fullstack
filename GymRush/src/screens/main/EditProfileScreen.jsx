import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Loading } from '../../components';
import { useAuth } from '../../hooks';
import { authService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

const FITNESS_GOAL_OPTIONS = [
  { value: 'WEIGHT_LOSS', label: 'Weight Loss' },
  { value: 'MUSCLE_GAIN', label: 'Muscle Gain' },
  { value: 'GENERAL_FITNESS', label: 'General Fitness' },
  { value: 'ENDURANCE', label: 'Endurance' },
  { value: 'FLEXIBILITY', label: 'Flexibility' },
];

const TIME_PREFERENCE_OPTIONS = [
  { value: 'MORNING', label: 'Morning' },
  { value: 'AFTERNOON', label: 'Afternoon' },
  { value: 'EVENING', label: 'Evening' },
  { value: 'NIGHT', label: 'Night' },
  { value: 'ANYTIME', label: 'Anytime' },
];

const DAY_OPTIONS = [
  { value: 'MON', label: 'Mon' },
  { value: 'TUE', label: 'Tue' },
  { value: 'WED', label: 'Wed' },
  { value: 'THU', label: 'Thu' },
  { value: 'FRI', label: 'Fri' },
  { value: 'SAT', label: 'Sat' },
  { value: 'SUN', label: 'Sun' },
];

// Height options: 48 to 96 inches
const HEIGHT_OPTIONS = Array.from({ length: 49 }, (_, i) => {
  const inches = 48 + i;
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return {
    value: inches,
    label: `${feet}'${remainingInches}" (${inches} in)`,
  };
});

const DEFAULT_HEIGHT = 65;

const OptionPicker = ({ label, options, value, onChange, multi = false }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.optionsRow}>
      {options.map((opt) => {
        const isSelected = multi
          ? value?.includes(opt.value)
          : value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optionChip, isSelected && styles.optionChipSelected]}
            onPress={() => {
              if (multi) {
                const arr = value ? value.split(',').filter(Boolean) : [];
                if (arr.includes(opt.value)) {
                  onChange(arr.filter((v) => v !== opt.value).join(','));
                } else {
                  onChange([...arr, opt.value].join(','));
                }
              } else {
                onChange(opt.value);
              }
            }}
          >
            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.inputMultiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textMuted}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
    />
  </View>
);

const DropdownPicker = ({ label, options, value, onChange, placeholder }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setModalVisible(true)}>
        <Text style={[styles.dropdownText, !selectedOption && styles.dropdownPlaceholder]}>
          {selectedOption?.label || placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value.toString()}
              initialScrollIndex={options.findIndex((opt) => opt.value === (value || DEFAULT_HEIGHT))}
              getItemLayout={(_, index) => ({ length: 50, offset: 50 * index, index })}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, item.value === value && styles.modalOptionSelected]}
                  onPress={() => {
                    onChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, item.value === value && styles.modalOptionTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const SwitchField = ({ label, value, onChange }) => (
  <View style={styles.switchContainer}>
    <Text style={styles.switchLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: COLORS.border, true: COLORS.primary }}
      thumbColor={COLORS.white}
    />
  </View>
);

// Helper to get initial profile from user.profile
const getInitialProfile = (userProfile) => ({
  name: userProfile?.name || '',
  gender: userProfile?.gender || '',
  dob: userProfile?.dob || '',
  height: userProfile?.height || null,
  weight: userProfile?.weight?.toString() || '',
  fitness_goal: userProfile?.fitness_goal || '',
  preferred_time: userProfile?.preferred_time || '',
  preferred_days: userProfile?.preferred_days || '',
  education: userProfile?.education || '',
  profession: userProfile?.profession || '',
  address: userProfile?.address || '',
  married: userProfile?.married || false,
});

export const EditProfileScreen = ({ navigation }) => {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Handle Android hardware back button

  // Initial profile from auth context (fetched via auth/profile)
  const initialProfile = useMemo(() => getInitialProfile(user?.profile), [user?.profile]);
  const [profile, setProfile] = useState(initialProfile);

  const updateField = useCallback((field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Compute only changed fields
  const getChangedFields = useCallback(() => {
    const changes = {};
    Object.keys(profile).forEach((key) => {
      const current = profile[key];
      const initial = initialProfile[key];
      if (current !== initial) {
        if (key === 'weight') {
          changes[key] = current ? parseInt(current, 10) : null;
        } else if (key === 'dob') {
          changes[key] = current || null;
        } else {
          changes[key] = current;
        }
      }
    });
    return changes;
  }, [profile, initialProfile]);

  const hasChanges = useMemo(() => {
    return Object.keys(getChangedFields()).length > 0;
  }, [getChangedFields]);

  const handleSave = async () => {
    const changes = getChangedFields();
    if (Object.keys(changes).length === 0) {
      Alert.alert('No Changes', 'No changes to save.');
      return;
    }

    setLoading(true);
    try {
      await authService.updateUserProfile(changes);
      await refreshProfile();
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formatted = selectedDate.toISOString().split('T')[0];
      updateField('dob', formatted);
    }
  };

  const parsedDate = profile.dob ? new Date(profile.dob) : new Date(2000, 0, 1);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Personal Info Section */}
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <InputField
            label="Name"
            value={profile.name}
            onChangeText={(v) => updateField('name', v)}
            placeholder="Your full name"
          />

          <OptionPicker
            label="Gender"
            options={GENDER_OPTIONS}
            value={profile.gender}
            onChange={(v) => updateField('gender', v)}
          />

          {/* Date of Birth with Calendar */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowDatePicker(true)}>
              <Text style={[styles.dropdownText, !profile.dob && styles.dropdownPlaceholder]}>
                {profile.dob || 'Select date'}
              </Text>
              <Text style={styles.dropdownArrow}>📅</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={parsedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1920, 0, 1)}
            />
          )}

          <SwitchField
            label="Married"
            value={profile.married}
            onChange={(v) => updateField('married', v)}
          />

          <DropdownPicker
            label="Height (inches)"
            options={HEIGHT_OPTIONS}
            value={profile.height}
            onChange={(v) => updateField('height', v)}
            placeholder="Select height"
          />

          {/* Fitness Section */}
          <Text style={styles.sectionTitle}>Fitness Preferences</Text>

          <OptionPicker
            label="Fitness Goal"
            options={FITNESS_GOAL_OPTIONS}
            value={profile.fitness_goal}
            onChange={(v) => updateField('fitness_goal', v)}
          />

          <OptionPicker
            label="Preferred Time"
            options={TIME_PREFERENCE_OPTIONS}
            value={profile.preferred_time}
            onChange={(v) => updateField('preferred_time', v)}
          />

          <OptionPicker
            label="Preferred Days"
            options={DAY_OPTIONS}
            value={profile.preferred_days}
            onChange={(v) => updateField('preferred_days', v)}
            multi
          />

          {/* Text Input Fields at Bottom */}
          <Text style={styles.sectionTitle}>Additional Details</Text>

          <InputField
            label="Weight (kg)"
            value={profile.weight}
            onChangeText={(v) => updateField('weight', v)}
            placeholder="70"
            keyboardType="numeric"
          />

          <InputField
            label="Education"
            value={profile.education}
            onChangeText={(v) => updateField('education', v)}
            placeholder="Your education"
          />

          <InputField
            label="Profession"
            value={profile.profession}
            onChangeText={(v) => updateField('profession', v)}
            placeholder="Your profession"
          />

          <InputField
            label="Address"
            value={profile.address}
            onChangeText={(v) => updateField('address', v)}
            placeholder="Your address"
            multiline
          />
        </ScrollView>

        {/* Sticky Save Button */}
        <View style={styles.bottomBar}>
          <Button
            title={loading ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={loading || !hasChanges}
            style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex1: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.padding,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: SIZES.h4,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSpacer: { width: 50 },
  scrollContent: {
    padding: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.h5,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SIZES.margin,
    marginBottom: SIZES.base,
  },
  fieldContainer: {
    marginBottom: SIZES.margin,
  },
  label: {
    fontSize: SIZES.bodySmall,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SIZES.base,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    fontSize: SIZES.body,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -SIZES.base,
  },
  halfField: {
    flex: 1,
    paddingHorizontal: SIZES.base,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.base,
  },
  optionChip: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: SIZES.bodySmall,
    color: COLORS.text,
  },
  optionTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  dropdown: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  dropdownPlaceholder: {
    color: COLORS.textMuted,
  },
  dropdownArrow: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.margin,
  },
  switchLabel: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: SIZES.radiusLarge,
    borderTopRightRadius: SIZES.radiusLarge,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: SIZES.h5,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalClose: {
    fontSize: 20,
    color: COLORS.textMuted,
    padding: SIZES.paddingSmall,
  },
  modalOption: {
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    height: 50,
    justifyContent: 'center',
  },
  modalOptionSelected: {
    backgroundColor: COLORS.primary + '20',
  },
  modalOptionText: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  modalOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  bottomBar: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    marginTop: 0,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
});

export default EditProfileScreen;
