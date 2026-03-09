import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { api, gymService, gymStorage } from '../../services';
import { useCheckin } from '../../hooks';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../../constants/theme';
import Icon from 'react-native-vector-icons/MaterialIcons';

export const QRScanner = ({ navigation, route }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  // Pre-populate body parts if passed from Dashboard (location fallback)
  const [selectedParts, setSelectedParts] = useState(route?.params?.initialParts ?? []);
  const [gymPreview, setGymPreview] = useState(null);
  const [isScanning, setIsScanning] = useState(true);

  const { setCheckin } = useCheckin();

  const BODY_PARTS = ['CHEST', 'BACK', 'LEGS', 'ARMS', 'SHOULDERS', 'CORE'];

  // Get back camera device
  const device = useCameraDevice('back');

  // Request camera permission on mount
  useEffect(() => {
    const requestPermission = async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to scan QR codes for check-in.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    };
    requestPermission();
  }, [navigation]);

  // Parse gym ID from the scanned URL
  const parseGymIdFromUrl = useCallback((url) => {
    try {
      const m = url.match(/\/api\/gyms\/(\d+)\/checkin/);
      if (m) return m[1];
      return null;
    } catch (e) {
      return null;
    }
  }, []);

  // Handle QR code detection
  const handleCodeScanned = useCallback(async (scanned) => {
    if (!scanned || !isScanning) return;

    // Pause scanning
    setIsScanning(false);
    setScannedData(scanned);
    setConfirmVisible(true);

    // Try to fetch gym info for preview
    const gid = parseGymIdFromUrl(scanned);
    if (gid) {
      try {
        const { buildEndpoint, ENDPOINTS } = await import('../../constants/config');
        const resp = await api.get(buildEndpoint(ENDPOINTS.GYM_DETAIL, { id: gid }));
        setGymPreview(resp.data);
        // persist so mobile can later fetch rush even without membership
        try { await gymStorage.saveGymInfo(resp.data); } catch (e) {}
      } catch (err) {
        setGymPreview({ gym_id: gid });
        try { await gymStorage.saveGymInfo({ gym_id: gid }); } catch (e) {}
      }
    } else {
      setGymPreview(null);
    }
  }, [isScanning, parseGymIdFromUrl]);

  // Built-in code scanner from react-native-vision-camera v4
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && isScanning) {
        const code = codes[0];
        const value = code.value;
        if (value) {
          handleCodeScanned(value);
        }
      }
    },
  });

  // Confirm check-in
  const doConfirmCheckin = async () => {
    if (!scannedData) return;
    if (!selectedParts || selectedParts.length === 0) {
      Alert.alert('Select Body Parts', 'Please select at least one body part to continue.');
      return;
    }
    

    setLoading(true);
    try {
      // prefer using gymService when we can extract a gym id so the
      // request goes through the app API client (ensures auth header).
      const gid = parseGymIdFromUrl(scannedData);
      let session = null;
      if (gid) {
        session = await gymService.checkIn(gid, selectedParts);
        // store id in case preview was missing
        try { await gymStorage.saveGymInfo({ gym_id: gid }); } catch (e) {}
      } else {
        // Fallback to posting the scanned URL directly
        const url = scannedData.startsWith('http') ? scannedData : scannedData;
        const resp = await api.post(url, { body_parts: selectedParts });
        session = resp.data;
      }
      // update global checkin state with the full session so provider stores gym/slot metadata
      try {
        await setCheckin(session ?? selectedParts);
      } catch (e) {
        // ignore setCheckin failures
      }

      setConfirmVisible(false);
      // navigate back immediately so user doesn't stay on scanner
      navigation.goBack();
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Check-in failed';
      Alert.alert('Check-in Failed', message);
      // Reset to allow retry
      resetScanner();
    } finally {
      setLoading(false);
    }
  };

  // Reset scanner state to allow re-scanning
  const resetScanner = () => {
    setConfirmVisible(false);
    setScannedData(null);
    setGymPreview(null);
    setSelectedParts([]);
    setIsScanning(true);
  };

  const togglePart = (part) => {
    setSelectedParts((prev) => {
      if (prev.includes(part)) return prev.filter((p) => p !== part);
      return [...prev, part];
    });
  };

  // Render loading or permission denied states
  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <Icon name="videocam-off" size={48} color={COLORS.textSecondary} />
          <Text style={styles.permissionText}>No camera device found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top header */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Scan QR to Check In</Text>
      </View>

      {/* Bottom controls (moved from top for easier reach) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.bottomButton}>
          <Icon name="close" size={32} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFlash((f) => !f)} style={styles.bottomButton}>
          <Icon name={flash ? 'flash-on' : 'flash-off'} size={28} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isScanning && !confirmVisible}
          codeScanner={codeScanner}
          torch={flash ? 'on' : 'off'}
        />

        {/* Scan overlay / frame */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Hint text */}
        <View style={styles.hintContainer}>
          <Text style={styles.hint}>Point your camera at the gym's QR code</Text>
        </View>
      </View>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Processing check-in…</Text>
        </View>
      )}

      {/* Confirmation Modal */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmHeader}>
              <Icon name="qr-code-scanner" size={40} color={COLORS.primary} />
              <Text style={styles.confirmTitle}>Confirm Check-in</Text>
            </View>
            <View style={styles.gymInfo}>
              <Icon name="fitness-center" size={24} color={COLORS.textSecondary} />
              <Text style={styles.confirmGym}>
                {gymPreview?.name ?? `Gym ID: ${gymPreview?.gym_id ?? 'Unknown'}`}
              </Text>
            </View>
            {/* Body parts selection */}
            <View style={styles.partList}>
              <Text style={[styles.confirmTitle, { fontSize: SIZES.body }]}>Which body parts today?</Text>
              <View style={{ height: 12 }} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {BODY_PARTS.map((part) => {
                  const selected = selectedParts.includes(part);
                  return (
                    <TouchableOpacity
                      key={part}
                      onPress={() => togglePart(part)}
                      style={[
                        styles.partItem,
                        selected ? styles.partItemSelected : null,
                      ]}
                    >
                      <Text style={[styles.partText, selected ? styles.partTextSelected : null]}>{part}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={resetScanner}>
                <Icon name="refresh" size={18} color={COLORS.text} />
                <Text style={styles.btnText}>Scan Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnConfirm]}
                onPress={doConfirmCheckin}
                disabled={loading}
              >
                <Icon name="check" size={18} color={COLORS.white} />
                <Text style={[styles.btnText, { color: COLORS.white }]}>
                  {loading ? 'Checking in...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    marginTop: 16,
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
  },
  backButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomButton: {
    padding: 12,
  },
  topButton: {
    padding: 8,
  },
  topTitle: {
    color: COLORS.white,
    fontSize: SIZES.h4,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
    marginTop:20
  },
  cameraContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hint: {
    color: COLORS.white,
    fontSize: SIZES.body,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: SIZES.radius,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.white,
    fontSize: SIZES.body,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  confirmHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  gymInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: SIZES.radius,
    marginBottom: 20,
  },
  confirmGym: {
    fontSize: SIZES.body,
    color: COLORS.text,
    marginLeft: 10,
    fontWeight: '500',
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: SIZES.radius,
    gap: 6,
  },
  btnCancel: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnConfirm: {
    backgroundColor: COLORS.primary,
  },
  btnText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  partList: {
    marginBottom: 16,
  },
  partItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  partItemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  partText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  partTextSelected: {
    color: COLORS.white,
  },
});

export default QRScanner;
