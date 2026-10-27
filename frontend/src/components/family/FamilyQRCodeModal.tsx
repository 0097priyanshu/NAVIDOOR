import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Alert, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { familyPairingService } from '../../services/familyPairingService';
import { ACCESSIBILITY } from '../../theme/designSystem';
import { QrCode, RefreshCw, Clock, X, ShieldCheck, CheckCircle2, UserCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export const FamilyQRCodeModal: React.FC = () => {
  const { 
    isFamilyQrModalOpen, 
    setIsFamilyQrModalOpen, 
    userName, 
    userPhone, 
    speak 
  } = useNavidoorStore();

  const [qrValue, setQrValue] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300); // 5 minutes (300s)
  const [loading, setLoading] = useState<boolean>(true);
  const [isClaimed, setIsClaimed] = useState<boolean>(false);
  const [claimedByInfo, setClaimedByInfo] = useState<string>('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Generate pairing token when modal opens
  const generateNewToken = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    setLoading(true);
    setIsClaimed(false);
    setClaimedByInfo('');

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    try {
      const result = await familyPairingService.generatePairingToken({
        uid: `nav_${Date.now()}`,
        name: userName || 'NAVIDOOR User',
        phone: userPhone || '',
      });

      setToken(result.token);
      setQrValue(result.qrPayload);
      setSecondsRemaining(300);
      setLoading(false);

      speak('New pairing QR code generated. It is valid for 5 minutes. Show this screen to your family companion to scan.');

      // Listen for token claim by companion in real-time
      unsubscribeRef.current = familyPairingService.subscribeToPairingToken(result.token, (tokenData) => {
        if (tokenData.status === 'claimed') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {}

          setIsClaimed(true);
          const companionMsg = tokenData.claimedBy ? 'A family companion has scanned your QR code!' : 'QR Code scanned successfully!';
          setClaimedByInfo(companionMsg);
          speak('Your pairing QR code was scanned! A connection request has been received.');
        }
      });
    } catch (err: any) {
      console.error('[FamilyQRCodeModal] Generate error:', err);
      Alert.alert('Error', 'Unable to generate pairing QR code. Please try again.');
      speak('Could not generate pairing QR code. Please tap regenerate.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFamilyQrModalOpen) {
      generateNewToken();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isFamilyQrModalOpen]);

  // Countdown timer ticker
  useEffect(() => {
    if (!isFamilyQrModalOpen || loading || isClaimed) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          speak('Pairing QR code has expired. Please tap regenerate for a new code.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFamilyQrModalOpen, loading, isClaimed]);

  if (!isFamilyQrModalOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const isExpired = secondsRemaining === 0;

  return (
    <Modal visible={isFamilyQrModalOpen} transparent statusBarTranslucent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <QrCode size={24} color="#0284C7" />
              <Text style={styles.headerTitle}>PAIR FAMILY COMPANION</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setIsFamilyQrModalOpen(false)} 
              style={styles.closeBtn}
              accessibilityLabel="Close pairing QR screen"
              accessibilityRole="button"
            >
              <X size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Instruction */}
            <Text style={styles.instruction}>
              Present this QR code to your family companion. It contains a secure, temporary single-use token that expires in 5 minutes.
            </Text>

            {/* QR Code Container */}
            <View style={styles.qrWrapper}>
              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#0284C7" />
                  <Text style={styles.loadingText}>Generating secure pairing code...</Text>
                </View>
              ) : isClaimed ? (
                <View style={styles.claimedBox}>
                  <CheckCircle2 size={56} color="#10B981" />
                  <Text style={styles.claimedTitle}>SCANNED BY COMPANION</Text>
                  <Text style={styles.claimedSub}>{claimedByInfo || 'Connection request waiting for your approval.'}</Text>
                  <TouchableOpacity 
                    style={styles.reviewRequestBtn}
                    onPress={() => setIsFamilyQrModalOpen(false)}
                    accessibilityLabel="Review and approve companion request"
                    accessibilityRole="button"
                  >
                    <UserCheck size={20} color="#FFFFFF" />
                    <Text style={styles.reviewRequestBtnText}>View Connection Request</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.qrContainer, isExpired && styles.qrExpired]}>
                  {qrValue ? (
                    <QRCode
                      value={qrValue}
                      size={220}
                      color="#0F172A"
                      backgroundColor="#FFFFFF"
                    />
                  ) : null}

                  {isExpired && (
                    <View style={styles.expiredOverlay}>
                      <Clock size={40} color="#E11D48" />
                      <Text style={styles.expiredText}>QR Code Expired</Text>
                      <Text style={styles.expiredSub}>Please generate a new pairing code.</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Direct Pairing Code Box (for manual entry fallback) */}
            {!isClaimed && !loading && token ? (
              <View style={styles.codeBox}>
                <Text style={styles.codeBoxLabel}>OR ENTER PAIRING CODE MANUALLY:</Text>
                <Text style={styles.codeBoxValue} selectable>{token}</Text>
              </View>
            ) : null}

            {/* 5-Minute Timer Display */}
            {!isClaimed && (
              <View style={[styles.timerBadge, isExpired && styles.timerBadgeExpired]}>
                <Clock size={18} color={isExpired ? '#E11D48' : '#0284C7'} />
                <Text style={[styles.timerText, isExpired && styles.timerTextExpired]}>
                  {isExpired ? 'EXPIRED' : `Expires in: ${timeFormatted}`}
                </Text>
              </View>
            )}

            {/* Security Notice */}
            <View style={styles.securityBox}>
              <ShieldCheck size={18} color="#0284C7" />
              <Text style={styles.securityText}>
                End-to-end encrypted with single-use token verification. No personal credentials exposed.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.regenerateBtn}
                onPress={generateNewToken}
                disabled={loading}
                accessibilityLabel="Regenerate new pairing QR code"
                accessibilityRole="button"
              >
                <RefreshCw size={20} color="#FFFFFF" />
                <Text style={styles.regenerateBtnText}>Regenerate Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setIsFamilyQrModalOpen(false)}
                accessibilityLabel="Close pairing screen"
                accessibilityRole="button"
              >
                <Text style={styles.doneBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
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
    maxHeight: '90%',
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
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#94A3B8',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  instruction: {
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  qrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  qrExpired: {
    opacity: 0.25,
  },
  expiredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  expiredText: {
    color: '#E11D48',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 8,
  },
  expiredSub: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  loadingBox: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  claimedBox: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#10B981',
    gap: 8,
  },
  claimedTitle: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 6,
  },
  claimedSub: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
  reviewRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  reviewRequestBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  codeBox: {
    width: '100%',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  codeBoxLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  codeBoxValue: {
    color: '#0284C7',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0284C7',
    gap: 8,
    marginVertical: 12,
  },
  timerBadgeExpired: {
    borderColor: '#E11D48',
    backgroundColor: '#FFE4E6',
  },
  timerText: {
    color: '#0284C7',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerTextExpired: {
    color: '#E11D48',
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#94A3B8',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 10,
    marginBottom: 16,
  },
  securityText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  regenerateBtn: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: ACCESSIBILITY.borderRadiusButton,
    gap: 8,
    minHeight: ACCESSIBILITY.minTouchTargetSize,
  },
  regenerateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  doneBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#64748B',
    paddingVertical: 14,
    borderRadius: ACCESSIBILITY.borderRadiusButton,
    minHeight: ACCESSIBILITY.minTouchTargetSize,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
