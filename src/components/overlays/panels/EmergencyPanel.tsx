import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Phone, ShieldAlert, Mic } from 'lucide-react-native';
import { useNavidoorStore } from '../../../store/useNavidoorStore';
import { voiceRecordingService } from '../../../services/voiceRecordingService';

export const EmergencyPanel = () => {
  const { emergencyContacts, speak, setVoiceState, activeLanguageCode } = useNavidoorStore();
  const [callingContact, setCallingContact] = React.useState<{ name: string, phone: string } | null>(null);
  const [activeCall, setActiveCall] = React.useState<{ name: string, phone: string } | null>(null);

  const initiateCallConfirm = (name: string, phone: string) => {
    setCallingContact({ name, phone });
    speak(`Do you want to call ${name}? Say yes or no.`);
    
    setTimeout(async () => {
      setVoiceState('listening');
      useNavidoorStore.setState({ lastAnnouncement: `🎤 Listening... Say Yes to call ${name}` });

      await voiceRecordingService.startRecording(activeLanguageCode, async (autoText) => {
        setVoiceState('thinking');
        const text = (autoText || '').toLowerCase().trim();
        if (text.includes('yes') || text.includes('yup') || text.includes('yeah') || text.includes('हाँ') || text.includes('हो')) {
          setVoiceState('idle');
          executeCall(name, phone);
        } else {
          setVoiceState('idle');
          setCallingContact(null);
          speak('Call cancelled.');
        }
      });
    }, 500);
  };

  const executeCall = (name: string, phone: string) => {
    speak(`Calling ${name} now.`);
    setCallingContact(null);
    setVoiceState('idle');
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (e) {}
    setActiveCall({ name, phone });
  };

  const cancelCall = () => {
    setCallingContact(null);
    setVoiceState('idle');
    speak('Call cancelled.');
  };

  const startGeneralVoiceCommand = () => {
    speak('Who do you want to call? Please say their name.');
    setVoiceState('listening');
    useNavidoorStore.setState({ lastAnnouncement: '🎤 Listening... Say a contact name' });
    
    voiceRecordingService.startRecording(activeLanguageCode, async (autoText) => {
      setVoiceState('thinking');
      const name = (autoText || '').trim();
      if (name) {
        setVoiceState('idle');
        initiateCallConfirm(name, '+1 (555) 000-0000');
      } else {
        setVoiceState('idle');
        speak('I did not catch a name. Cancelled.');
      }
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <ShieldAlert size={18} color="#E11D48" />
        <Text style={styles.title}>EMERGENCY CONTACT CALLING</Text>
      </View>
      <TouchableOpacity 
        style={styles.voiceCommandBtn}
        onPress={startGeneralVoiceCommand}
        accessibilityLabel="Voice call someone"
      >
        <Mic size={20} color="#FFFFFF" />
        <Text style={styles.voiceCommandText}>VOICE CALL SOMEONE</Text>
      </TouchableOpacity>

      {emergencyContacts.map(contact => (
        <TouchableOpacity 
          key={contact.id} 
          style={styles.contactBtn}
          onPress={() => initiateCallConfirm(contact.name, contact.phone)}
          accessibilityLabel={`Call ${contact.name}`}
        >
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{contact.name} ({contact.relation})</Text>
            <Text style={styles.contactPhone}>{contact.phone}</Text>
          </View>
          <View style={styles.callIconBox}>
            <Phone size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      ))}

      {/* CONFIRMATION MODAL */}
      <Modal visible={!!callingContact} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>CALL {callingContact?.name.toUpperCase()}?</Text>
            <Text style={styles.modalText}>
              Do you want to proceed calling this contact?
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtnNo} onPress={cancelCall}>
                <Text style={styles.modalBtnNoText}>NO</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtnYes} 
                onPress={() => callingContact && executeCall(callingContact.name, callingContact.phone)}
              >
                <Text style={styles.modalBtnYesText}>YES</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ACTIVE CALL MODAL */}
      <Modal visible={!!activeCall} transparent animationType="fade">
        <View style={styles.activeCallBackdrop}>
          <View style={styles.activeCallCard}>
            <View style={styles.activeCallAvatar}>
              <Text style={styles.activeCallInitials}>
                {activeCall?.name.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.activeCallName}>{activeCall?.name}</Text>
            <Text style={styles.activeCallStatus}>Calling...</Text>
            
            <TouchableOpacity 
              style={styles.endCallBtn} 
              onPress={() => {
                setActiveCall(null);
                speak('Call ended.');
                try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch (e) {}
              }}
              accessibilityLabel="End Call"
            >
              <Phone size={28} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#475569',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E11D48',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  contactPhone: {
    color: '#FFE4E6',
    fontSize: 14,
    marginTop: 4,
  },
  callIconBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 20,
  },
  voiceCommandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
  },
  voiceCommandText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  modalTitle: {
    color: '#0284C7',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
    marginTop: 24,
  },
  modalBtnNo: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
  },
  modalBtnNoText: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 14,
  },
  modalBtnYes: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    alignItems: 'center',
  },
  modalBtnYesText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  activeCallBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  activeCallCard: {
    alignItems: 'center',
    width: '100%',
  },
  activeCallAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#475569',
  },
  activeCallInitials: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
  },
  activeCallName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
  },
  activeCallStatus: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 48,
  },
  endCallBtn: {
    backgroundColor: '#E11D48',
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  }
});
