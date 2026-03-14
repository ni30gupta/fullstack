import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Card, Button } from '../../components';
import { useAuth } from '../../hooks';
import { gymService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';

// ─── small helpers ────────────────────────────────────────────────────────────
const fmt = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

const fmtMoney = (val) =>
  val != null ? `₹${parseFloat(val).toLocaleString('en-IN')}` : '—';

// ─── Membership card ──────────────────────────────────────────────────────────
const MembershipCard = ({ ms, gymId, onUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form, setForm] = useState({
    duration_months: String(ms.duration_months ?? ''),
    amount:          String(ms.amount          ?? ''),
    amount_paid:     String(ms.amount_paid     ?? ''),
    start_date:      ms.start_date ?? '',
    is_active:       ms.is_active ?? false,
  });

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        duration_months: form.duration_months ? parseInt(form.duration_months, 10) : undefined,
        amount:          form.amount          ? parseFloat(form.amount)            : null,
        amount_paid:     form.amount_paid     ? parseFloat(form.amount_paid)       : null,
        start_date:      form.start_date      || null,
        is_active:       form.is_active,
      };
      await gymService.updateMembership(gymId, ms.id, payload);
      setEditing(false);
      onUpdated();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not update membership.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async () => {
    setSaving(true);
    try {
      await gymService.updateMembership(gymId, ms.id, { is_active: !ms.is_active });
      onUpdated();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={styles.msCard}>
      <View style={styles.msHeader}>
        <View style={[styles.msBadge, ms.is_active ? styles.msBadgeActive : styles.msBadgeInactive]}>
          <Text style={[styles.msBadgeText, ms.is_active ? styles.msBadgeTextActive : styles.msBadgeTextInactive]}>
            {ms.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
        <Text style={styles.msDuration}>{ms.duration_months} month{ms.duration_months !== 1 ? 's' : ''}</Text>
      </View>

      <View style={styles.msRow}>
        <View style={styles.msCell}>
          <Text style={styles.msCellLabel}>Start</Text>
          <Text style={styles.msCellValue}>{fmt(ms.start_date)}</Text>
        </View>
        <View style={styles.msCell}>
          <Text style={styles.msCellLabel}>End</Text>
          <Text style={[styles.msCellValue, ms.is_active && styles.msEndActive]}>{fmt(ms.end_date)}</Text>
        </View>
        <View style={styles.msCell}>
          <Text style={styles.msCellLabel}>Fee</Text>
          <Text style={styles.msCellValue}>{fmtMoney(ms.amount)}</Text>
        </View>
        <View style={styles.msCell}>
          <Text style={styles.msCellLabel}>Paid</Text>
          <Text style={[styles.msCellValue, ms.amount_paid < ms.amount && styles.msPartialPaid]}>
            {fmtMoney(ms.amount_paid)}
          </Text>
        </View>
      </View>

      <View style={styles.msActions}>
        <TouchableOpacity style={styles.msEditBtn} onPress={() => setEditing(true)} disabled={saving}>
          <Text style={styles.msEditBtnText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.msToggleBtn, ms.is_active ? styles.msToggleBtnDeact : styles.msToggleBtnAct]}
          onPress={toggle}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color={COLORS.white} />
            : <Text style={styles.msToggleBtnText}>{ms.is_active ? 'Deactivate' : 'Activate'}</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Edit modal */}
      <Modal visible={editing} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Membership</Text>

            {[
              { label: 'Duration (months)', key: 'duration_months', kbd: 'numeric' },
              { label: 'Total Fee (₹)',     key: 'amount',          kbd: 'decimal-pad' },
              { label: 'Amount Paid (₹)',   key: 'amount_paid',     kbd: 'decimal-pad' },
              { label: 'Start Date (YYYY-MM-DD)', key: 'start_date', kbd: 'default' },
            ].map(({ label, key, kbd }) => (
              <View key={key} style={styles.field}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form[key]}
                  onChangeText={v => setForm(p => ({ ...p, [key]: v }))}
                  keyboardType={kbd}
                  placeholderTextColor={COLORS.textMuted}
                  placeholder={label}
                />
              </View>
            ))}

            <TouchableOpacity
              style={[styles.toggleSwitch, form.is_active && styles.toggleSwitchOn]}
              onPress={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
            >
              <Text style={styles.toggleSwitchText}>
                Active: {form.is_active ? 'Yes' : 'No'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalBtns}>
              <Button title="Cancel" variant="outline" onPress={() => setEditing(false)} style={styles.modalBtn} />
              <Button title="Save"   loading={saving}  onPress={save}                  style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </Card>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export const MemberDetailScreen = ({ route, navigation }) => {
  const { memberId, memberName } = route.params;
  const { gymDetails } = useAuth();
  const gymId = gymDetails?.id;

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // edit-member modal
  const [editModal,   setEditModal]   = useState(false);
  const [editForm,    setEditForm]    = useState({ name: '', phone: '', email: '' });
  const [editSaving,  setEditSaving]  = useState(false);

  // add-membership modal
  const [addMsModal,  setAddMsModal]  = useState(false);
  const [addMsForm,   setAddMsForm]   = useState({
    duration_months: '1', amount: '', amount_paid: '', start_date: '', is_active: true,
  });
  const [addMsSaving, setAddMsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!gymId || !memberId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await gymService.getMemberDetail(gymId, memberId);
      setData(res);
      setEditForm({
        name:  res.member?.name  ?? '',
        phone: res.member?.phone ?? '',
        email: res.member?.email ?? '',
      });
    } catch (e) {
      setError(e.message || 'Failed to load member');
    } finally {
      setLoading(false);
    }
  }, [gymId, memberId]);

  useEffect(() => { load(); }, [load]);

  const saveMemberEdit = async () => {
    setEditSaving(true);
    try {
      await gymService.updateMember(gymId, memberId, editForm);
      setEditModal(false);
      load();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not update member.');
    } finally {
      setEditSaving(false);
    }
  };

  const saveAddMembership = async () => {
    const dm = parseInt(addMsForm.duration_months, 10);
    if (!dm || dm < 1) {
      Alert.alert('Validation', 'Duration must be at least 1 month.');
      return;
    }
    setAddMsSaving(true);
    try {
      const payload = {
        duration_months: dm,
        amount:      addMsForm.amount      ? parseFloat(addMsForm.amount)      : null,
        amount_paid: addMsForm.amount_paid ? parseFloat(addMsForm.amount_paid) : null,
        start_date:  addMsForm.start_date  || null,
        is_active:   addMsForm.is_active,
      };
      await gymService.addMembershipForMember(gymId, memberId, payload);
      setAddMsModal(false);
      setAddMsForm({ duration_months: '1', amount: '', amount_paid: '', start_date: '', is_active: true });
      load();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not add membership.');
    } finally {
      setAddMsSaving(false);
    }
  };

  const member       = data?.member;
  const memberships  = data?.memberships ?? [];
  const activeMship  = memberships.find(m => m.is_active);

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={load} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back + title */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>{memberName ?? 'Member Detail'}</Text>
        <TouchableOpacity onPress={() => setEditModal(true)} style={styles.editIcon}>
          <Text style={styles.editIconText}>✏️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar name={member?.name} size="large" />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{member?.name}</Text>
              <Text style={styles.profileSub}>{member?.phone || '—'}</Text>
              {member?.email ? <Text style={styles.profileSub}>{member.email}</Text> : null}
            </View>
          </View>

          {activeMship ? (
            <View style={styles.activeMs}>
              <View style={styles.activeMsRow}>
                <Text style={styles.activeMsLabel}>Active until</Text>
                <Text style={styles.activeMsValue}>{fmt(activeMship.end_date)}</Text>
              </View>
              <View style={styles.activeMsRow}>
                <Text style={styles.activeMsLabel}>Paid / Fee</Text>
                <Text style={[
                  styles.activeMsValue,
                  parseFloat(activeMship.amount_paid) < parseFloat(activeMship.amount) && styles.partial,
                ]}>
                  {fmtMoney(activeMship.amount_paid)} / {fmtMoney(activeMship.amount)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noMsRow}>
              <Text style={styles.noMsText}>No active membership</Text>
            </View>
          )}
        </Card>

        {/* Memberships */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Membership History</Text>
          <TouchableOpacity onPress={() => setAddMsModal(true)} style={styles.addMsBtn}>
            <Text style={styles.addMsBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {memberships.length === 0 ? (
          <Text style={styles.empty}>No memberships yet</Text>
        ) : (
          memberships.map(ms => (
            <MembershipCard key={ms.id} ms={ms} gymId={gymId} onUpdated={load} />
          ))
        )}
      </ScrollView>

      {/* ── Edit Member modal ─────────────────────────────────────────────── */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Member</Text>
            {[
              { label: 'Name',  key: 'name',  kbd: 'default' },
              { label: 'Phone', key: 'phone', kbd: 'phone-pad' },
              { label: 'Email', key: 'email', kbd: 'email-address' },
            ].map(({ label, key, kbd }) => (
              <View key={key} style={styles.field}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editForm[key]}
                  onChangeText={v => setEditForm(p => ({ ...p, [key]: v }))}
                  keyboardType={kbd}
                  autoCapitalize="none"
                  placeholderTextColor={COLORS.textMuted}
                  placeholder={label}
                />
              </View>
            ))}
            <View style={styles.modalBtns}>
              <Button title="Cancel" variant="outline" onPress={() => setEditModal(false)} style={styles.modalBtn} />
              <Button title="Save"   loading={editSaving}  onPress={saveMemberEdit}       style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add Membership modal ──────────────────────────────────────────── */}
      <Modal visible={addMsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Membership</Text>
            {[
              { label: 'Duration (months)', key: 'duration_months', kbd: 'numeric' },
              { label: 'Total Fee (₹)',     key: 'amount',          kbd: 'decimal-pad' },
              { label: 'Amount Paid (₹)',   key: 'amount_paid',     kbd: 'decimal-pad' },
              { label: 'Start Date (YYYY-MM-DD)', key: 'start_date', kbd: 'default' },
            ].map(({ label, key, kbd }) => (
              <View key={key} style={styles.field}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={addMsForm[key]}
                  onChangeText={v => setAddMsForm(p => ({ ...p, [key]: v }))}
                  keyboardType={kbd}
                  placeholderTextColor={COLORS.textMuted}
                  placeholder={label}
                />
              </View>
            ))}
            <TouchableOpacity
              style={[styles.toggleSwitch, addMsForm.is_active && styles.toggleSwitchOn]}
              onPress={() => setAddMsForm(p => ({ ...p, is_active: !p.is_active }))}
            >
              <Text style={styles.toggleSwitchText}>
                Activate immediately: {addMsForm.is_active ? 'Yes' : 'No'}
              </Text>
            </TouchableOpacity>
            <View style={styles.modalBtns}>
              <Button title="Cancel" variant="outline" onPress={() => setAddMsModal(false)} style={styles.modalBtn} />
              <Button title="Add"    loading={addMsSaving} onPress={saveAddMembership}      style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: COLORS.background },
  center:             { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.paddingLarge },
  scroll:             { padding: SIZES.padding, paddingBottom: 40 },

  topBar:             {
    flexDirection: 'row', alignItems: 'center',
    padding: SIZES.padding, backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn:            { marginRight: SIZES.paddingSmall, padding: 4 },
  backArrow:          { fontSize: 28, color: COLORS.primary, lineHeight: 32 },
  topTitle:           { flex: 1, fontSize: SIZES.h5, fontWeight: '700', color: COLORS.text },
  editIcon:           { padding: 4 },
  editIconText:       { fontSize: 18 },

  profileCard:        { marginBottom: SIZES.margin },
  profileRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.paddingSmall },
  profileInfo:        { flex: 1, marginLeft: SIZES.padding },
  profileName:        { fontSize: SIZES.h5, fontWeight: '700', color: COLORS.text },
  profileSub:         { fontSize: SIZES.bodySmall, color: COLORS.textMuted, marginTop: 2 },

  activeMs:           {
    marginTop: SIZES.paddingSmall, padding: SIZES.paddingSmall,
    backgroundColor: COLORS.success + '15', borderRadius: SIZES.radiusSmall,
  },
  activeMsRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  activeMsLabel:      { fontSize: SIZES.bodySmall, color: COLORS.textMuted },
  activeMsValue:      { fontSize: SIZES.bodySmall, fontWeight: '600', color: COLORS.text },
  partial:            { color: COLORS.warning },

  noMsRow:            { marginTop: SIZES.paddingSmall, alignItems: 'center' },
  noMsText:           { color: COLORS.textMuted, fontSize: SIZES.bodySmall },

  sectionHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.paddingSmall },
  sectionTitle:       { fontSize: SIZES.body, fontWeight: '700', color: COLORS.text },
  addMsBtn:           { backgroundColor: COLORS.primary, paddingHorizontal: SIZES.padding, paddingVertical: 6, borderRadius: SIZES.radius },
  addMsBtnText:       { color: COLORS.white, fontWeight: '700', fontSize: SIZES.bodySmall },

  empty:              { color: COLORS.textMuted, textAlign: 'center', marginVertical: SIZES.margin },

  msCard:             { marginBottom: SIZES.margin },
  msHeader:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.paddingSmall },
  msBadge:            { paddingHorizontal: SIZES.paddingSmall, paddingVertical: 3, borderRadius: SIZES.radiusSmall },
  msBadgeActive:      { backgroundColor: COLORS.success + '22' },
  msBadgeInactive:    { backgroundColor: COLORS.textMuted + '22' },
  msBadgeText:        { fontSize: SIZES.caption, fontWeight: '700' },
  msBadgeTextActive:  { color: COLORS.success },
  msBadgeTextInactive:{ color: COLORS.textMuted },
  msDuration:         { fontSize: SIZES.bodySmall, color: COLORS.textSecondary, fontWeight: '600' },

  msRow:              { flexDirection: 'row', marginBottom: SIZES.paddingSmall },
  msCell:             { flex: 1 },
  msCellLabel:        { fontSize: SIZES.caption, color: COLORS.textMuted },
  msCellValue:        { fontSize: SIZES.bodySmall, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  msEndActive:        { color: COLORS.success },
  msPartialPaid:      { color: COLORS.warning },

  msActions:          { flexDirection: 'row', gap: 8 },
  msEditBtn:          { flex: 1, padding: 8, backgroundColor: COLORS.card, borderRadius: SIZES.radiusSmall, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  msEditBtnText:      { fontSize: SIZES.caption, color: COLORS.text, fontWeight: '600' },
  msToggleBtn:        { flex: 1, padding: 8, borderRadius: SIZES.radiusSmall, alignItems: 'center' },
  msToggleBtnAct:     { backgroundColor: COLORS.success },
  msToggleBtnDeact:   { backgroundColor: COLORS.error + 'CC' },
  msToggleBtnText:    { fontSize: SIZES.caption, color: COLORS.white, fontWeight: '700' },

  errorText:          { color: COLORS.error, textAlign: 'center', marginBottom: SIZES.padding },
  retryBtn:           { backgroundColor: COLORS.primary, paddingHorizontal: SIZES.padding, paddingVertical: SIZES.paddingSmall, borderRadius: SIZES.radius },
  retryText:          { color: COLORS.white, fontWeight: '600' },

  // shared modal styles
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox:           { backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: SIZES.paddingLarge, paddingBottom: 36 },
  modalTitle:         { fontSize: SIZES.h5, fontWeight: '700', color: COLORS.text, marginBottom: SIZES.padding },
  field:              { marginBottom: SIZES.paddingSmall },
  fieldLabel:         { fontSize: SIZES.bodySmall, color: COLORS.textMuted, marginBottom: 4 },
  fieldInput:         {
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: SIZES.radiusSmall, padding: SIZES.paddingSmall,
    color: COLORS.text, fontSize: SIZES.body,
  },
  toggleSwitch:       {
    padding: SIZES.paddingSmall, borderRadius: SIZES.radiusSmall,
    backgroundColor: COLORS.textMuted + '33', alignItems: 'center', marginBottom: SIZES.padding,
  },
  toggleSwitchOn:     { backgroundColor: COLORS.success + '33' },
  toggleSwitchText:   { color: COLORS.text, fontWeight: '600', fontSize: SIZES.bodySmall },
  modalBtns:          { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalBtn:           { flex: 1 },
});

export default MemberDetailScreen;
