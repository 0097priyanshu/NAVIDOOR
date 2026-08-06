import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { getThemeColors, ACCESSIBILITY } from '../../theme/designSystem';
import { AlertCircle, Phone, X, Check, MapPin, Radio } from 'lucide-react-native';

export const SOSModal: React.FC = () => {
  const { isSosModalOpen, setSosModalOpen, emergencyContacts, themeMode, speak } = useNavidoorStore();
  const colors = getThemeColors(themeMode);

  const [countdown, setCountdown] = useState(5);
  const [isBroadcastSent, setIsBroadcastSent] = useState(false);

  useEffect(() => {
    let timer: any = null;
    if (isSosModalOpen && !isBroadcastSent) {
      if (countdown > 0) {
        timer = setInterval(() => {
          setCountdown((prev) => prev - 1);
        }, 1000);
      } else if (countdown === 0) {
        setIsBroadcastSent(true);
        speak('Emergency broadcast sent to Sarah Jenkins and Emergency Dispatch.');
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSosModalOpen, countdown, isBroadcastSent]);

  const handleCancel = () => {
    setSosModalOpen(false);
    setCountdown(5);
    setIsBroadcastSent(false);
    speak('Emergency alert cancelled.');
  };

  if (!isSosModalOpen) return null;

  return (
    <Modal visible={isSosModalOpen} transparent animationType="slide">
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: '#000000', borderColor: '#E11D48' }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <AlertCircle size={28} color="#E11D48" />
              <Text style={styles.headerTitle}>EMERGENCY SOS ALERT</Text>
            </View>
            <TouchableOpacity onPress={handleCancel} style={styles.closeBtn} accessibilityLabel="Cancel SOS">
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Alert Content */}
          {!isBroadcastSent ? (
            <View style={styles.countdownContainer}>
              <Text style={styles.warningText}>Broadcasting live GPS location & audio stream in:</Text>
              
              <View style={styles.timerCircle}>
                <Text style={styles.timerNumber}>{countdown}</Text>
                <Text style={styles.timerUnit}>SECONDS</Text>
              </View>

              <Text style={styles.contactListHeader}>NOTIFYING PRIMARY CONTACTS:</Text>
              {emergencyContacts.map((c) => (
                <View key={c.id} style={styles.contactChip}>
                  <Phone size={16} color="#E11D48" />
                  <Text style={styles.contactText}>{c.name} ({c.relation})</Text>
                </View>
              ))}

              <TouchableOpacity
                style={styles.cancelBigBtn}
                onPress={handleCancel}
                accessibilityLabel="Cancel Emergency Alert Now"
              >
                <Text style={styles.cancelBigBtnText}>CANCEL SOS (FALSE ALARM)</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.sentContainer}>
              <View style={styles.successBadge}>
                <Check size={36} color="#FFFFFF" />
              </View>
              <Text style={styles.sentTitle}>EMERGENCY DISTRESS BROADCAST ACTIVE</Text>
              <Text style={styles.sentSub}>
                Live video feed & GPS coordinates are being transmitted to Sarah Jenkins (+1 555 234-5678) and Emergency Dispatch.
              </Text>

              <View style={styles.gpsBox}>
                <Radio size={18} color="#10B981" />
                <Text style={styles.gpsText}>GPS Broadcast: 37.7749° N, 122.4194° W</Text>
              </View>

              <TouchableOpacity style={styles.cancelBigBtn} onPress={handleCancel}>
                <Text style={styles.cancelBigBtnText}>END EMERGENCY SESSION</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 2,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: '#E11D48',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 6,
  },
  countdownContainer: {
    alignItems: 'center',
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 16,
  },
  timerCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(225, 29, 72, 0.2)',
    borderWidth: 4,
    borderColor: '#E11D48',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerNumber: {
    color: '#E11D48',
    fontSize: 44,
    fontWeight: '900',
  },
  timerUnit: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  contactListHeader: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    width: '100%',
    marginBottom: 8,
    gap: 10,
  },
  contactText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelBigBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 14,
    borderRadius: ACCESSIBILITY.borderRadiusButton,
    width: '100%',
    alignItems: 'center',
    marginTop: 14,
    minHeight: ACCESSIBILITY.minTouchTargetSize,
  },
  cancelBigBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
  sentContainer: {
    alignItems: 'center',
  },
  successBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sentTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  sentSub: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  gpsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 12,
    borderRadius: 14,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gpsText: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 13,
  },
});
