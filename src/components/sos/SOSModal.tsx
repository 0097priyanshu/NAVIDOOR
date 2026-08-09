import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { ACCESSIBILITY } from '../../theme/designSystem';
import { AlertCircle, Phone, X, Check, Radio } from 'lucide-react-native';

export const SOSModal: React.FC = () => {
  const { isSosModalOpen, setSosModalOpen, emergencyContacts, speak } = useNavidoorStore();

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
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <AlertCircle size={28} color="#E11D48" />
              <Text style={styles.headerTitle}>EMERGENCY SOS ALERT</Text>
            </View>
            <TouchableOpacity onPress={handleCancel} style={styles.closeBtn} accessibilityLabel="Cancel SOS">
              <X size={24} color="#0F172A" />
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
                  <Phone size={18} color="#E11D48" />
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
                <Radio size={18} color="#0284C7" />
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
    backgroundColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E11D48',
    padding: 20,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#94A3B8',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: '#E11D48',
    fontSize: 17,
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
    color: '#0F172A',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '800',
    marginBottom: 16,
  },
  timerCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E2E8F0',
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
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  contactListHeader: {
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#94A3B8',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    width: '100%',
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: '#64748B',
  },
  contactText: {
    color: '#0F172A',
    fontWeight: '800',
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
    letterSpacing: 0.5,
  },
  sentContainer: {
    alignItems: 'center',
  },
  successBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sentTitle: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  sentSub: {
    color: '#334155',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '600',
  },
  gpsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#94A3B8',
    padding: 12,
    borderRadius: 14,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#64748B',
  },
  gpsText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 13,
  },
});
