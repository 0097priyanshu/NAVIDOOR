import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ActivityIndicator, 
  Alert, 
  TextInput, 
  Platform 
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { familyPairingService } from '../../services/familyPairingService';
import { ACCESSIBILITY } from '../../theme/designSystem';
import { 
  Camera, 
  X, 
  Flashlight, 
  Keyboard, 
  ShieldCheck, 
  AlertTriangle, 
  Check 
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export const FamilyQRScannerModal: React.FC = () => {
  const { 
    isFamilyScannerModalOpen, 
    setIsFamilyScannerModalOpen, 
    familyUser, 
    setFamilyConnectionStatus,
    setFamilyConnectedUserPhone,
    setFamilyConnectedUserData
  } = useNavidoorStore();

  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isScanningLockedRef = useRef(false);

  if (!isFamilyScannerModalOpen) return null;

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isScanningLockedRef.current || loading) return;
    isScanningLockedRef.current = true;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    await processPairingCode(data);
  };

  const processPairingCode = async (codeOrJson: string) => {
    setLoading(true);
    setErrorMessage('');

    const companionProfile = {
      uid: (familyUser as any)?.id || `fam_${Date.now()}`,
      name: familyUser?.name || 'Caregiver',
      phone: familyUser?.phone || '+91 98765 43210',
      relationship: familyUser?.relationship || 'Family Companion',
    };

    try {
      const connection = await familyPairingService.validateAndClaimPairingToken(codeOrJson, companionProfile);

      setFamilyConnectionStatus('pending');
      setFamilyConnectedUserPhone(connection.navidoorPhone || 'NAVIDOOR User');
      setFamilyConnectedUserData({
        userName: connection.navidoorName || 'NAVIDOOR User',
        userPhone: connection.navidoorPhone || '',
        relationship: connection.companionRelationship,
      });

      Alert.alert(
        'Request Sent!',
        `Connection request sent to ${connection.navidoorName || 'the NAVIDOOR user'}. Waiting for their approval on their device.`,
        [{ text: 'OK', onPress: () => setIsFamilyScannerModalOpen(false) }]
      );
    } catch (err: any) {
      console.warn('[FamilyQRScanner] Pairing error:', err);
      const msg = err.message || 'Failed to validate QR code. Please check that it has not expired and try again.';
      setErrorMessage(msg);
      Alert.alert('Pairing Error', msg);
    } finally {
      setLoading(false);
      setTimeout(() => {
        isScanningLockedRef.current = false;
      }, 1500);
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      Alert.alert('Required', 'Please enter a valid pairing code.');
      return;
    }
    processPairingCode(manualCode.trim());
  };

  return (
    <Modal visible={isFamilyScannerModalOpen} transparent statusBarTranslucent animationType="slide">
      <View style={styles.modalBackdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <Camera size={22} color="#0284C7" />
              <Text style={styles.headerTitle}>SCAN PAIRING QR CODE</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setIsFamilyScannerModalOpen(false)} 
              style={styles.closeBtn}
              accessibilityLabel="Close QR scanner"
              accessibilityRole="button"
            >
              <X size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <Text style={styles.instructions}>
            Point your camera at the QR code displayed on the NAVIDOOR user's device.
          </Text>

          {/* Camera View / Manual Input Mode */}
          {showManualInput ? (
            <View style={styles.manualBox}>
              <Text style={styles.manualLabel}>Enter Pairing Code or JSON:</Text>
              <TextInput
                style={styles.manualInput}
                value={manualCode}
                onChangeText={setManualCode}
                placeholder="Paste or enter pairing code (e.g. pair_...)"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleManualSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={18} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Verify Code</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cameraWrapper}>
              {!permission?.granted ? (
                <View style={styles.permissionBox}>
                  <AlertTriangle size={36} color="#F59E0B" />
                  <Text style={styles.permissionTitle}>Camera Permission Required</Text>
                  <Text style={styles.permissionText}>
                    NAVIDOOR requires camera access to scan pairing QR codes.
                  </Text>
                  <TouchableOpacity 
                    style={styles.grantBtn} 
                    onPress={requestPermission}
                    accessibilityLabel="Grant Camera Permission"
                    accessibilityRole="button"
                  >
                    <Text style={styles.grantBtnText}>Grant Camera Access</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.switchManualBtn}
                    onPress={() => setShowManualInput(true)}
                  >
                    <Text style={styles.switchManualText}>Or Enter Code Manually</Text>
                  </TouchableOpacity>
                </View>
              ) : Platform.OS === 'web' ? (
                <View style={styles.webFallbackBox}>
                  <Camera size={44} color="#0284C7" />
                  <Text style={styles.webTitle}>Web QR Scanner</Text>
                  <Text style={styles.webSub}>
                    On web browsers, you can enter the pairing code manually or scan with a mobile device.
                  </Text>
                  <TouchableOpacity 
                    style={styles.grantBtn} 
                    onPress={() => setShowManualInput(true)}
                  >
                    <Keyboard size={18} color="#FFFFFF" />
                    <Text style={styles.grantBtnText}>Enter Code Manually</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.cameraContainer}>
                  <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    enableTorch={torch}
                    barcodeScannerSettings={{
                      barcodeTypes: ['qr'],
                    }}
                    onBarcodeScanned={handleBarcodeScanned}
                  />

                  {/* Scanning Reticle Overlay */}
                  <View style={styles.reticleOverlay}>
                    <View style={styles.scannerTarget} />
                  </View>

                  {/* Torch Toggle */}
                  <TouchableOpacity 
                    style={[styles.torchBtn, torch && styles.torchBtnActive]}
                    onPress={() => setTorch(!torch)}
                    accessibilityLabel="Toggle Flashlight"
                  >
                    <Flashlight size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingBanner}>
              <ActivityIndicator color="#0284C7" />
              <Text style={styles.loadingBannerText}>Validating single-use token in Firestore...</Text>
            </View>
          )}

          {/* Error Message Notice */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <AlertTriangle size={16} color="#E11D48" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Footer Controls */}
          <View style={styles.footerRow}>
            <TouchableOpacity 
              style={styles.footerToggleBtn}
              onPress={() => {
                setShowManualInput(!showManualInput);
                setErrorMessage('');
              }}
            >
              {showManualInput ? (
                <>
                  <Camera size={18} color="#0284C7" />
                  <Text style={styles.footerToggleText}>Use Camera Scanner</Text>
                </>
              ) : (
                <>
                  <Keyboard size={18} color="#0284C7" />
                  <Text style={styles.footerToggleText}>Enter Code Manually</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeFooterBtn}
              onPress={() => setIsFamilyScannerModalOpen(false)}
            >
              <Text style={styles.closeFooterBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#0284C7',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#94A3B8',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 6,
  },
  instructions: {
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
  cameraWrapper: {
    height: 280,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginBottom: 14,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#0284C7',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  reticleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTarget: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#0284C7',
    borderRadius: 16,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
  },
  torchBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    padding: 10,
    borderRadius: 20,
  },
  torchBtnActive: {
    backgroundColor: '#0284C7',
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#E2E8F0',
    gap: 8,
  },
  permissionTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
  },
  permissionText: {
    color: '#334155',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  grantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 6,
    gap: 8,
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  switchManualBtn: {
    marginTop: 8,
    padding: 6,
  },
  switchManualText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '700',
  },
  webFallbackBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#E2E8F0',
    gap: 8,
  },
  webTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  webSub: {
    color: '#334155',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  manualBox: {
    padding: 16,
    backgroundColor: '#E2E8F0',
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  manualLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  manualInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#94A3B8',
    marginBottom: 12,
  },
  submitBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  loadingBannerText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E6',
    borderWidth: 1,
    borderColor: '#E11D48',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    marginBottom: 10,
  },
  errorText: {
    flex: 1,
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  footerToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
  },
  footerToggleText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '800',
  },
  closeFooterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#64748B',
    borderRadius: 12,
  },
  closeFooterBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
