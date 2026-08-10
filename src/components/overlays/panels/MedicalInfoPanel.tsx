import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Activity, Share2, Droplet, AlertTriangle, Pill, Check, ShieldAlert, UserPlus, Phone, X } from 'lucide-react-native';
import { useNavidoorStore } from '../../../store/useNavidoorStore';

const DUMMY_CONTACTS = [
  { id: 'c1', name: 'John Doe', phone: '+1 555-0101' },
  { id: 'c2', name: 'Alice Smith', phone: '+1 555-0102' },
  { id: 'c3', name: 'Michael Johnson', phone: '+1 555-0103' },
  { id: 'c4', name: 'Emma Brown', phone: '+1 555-0104' },
];

type FlowStep = 'idle' | 'choose_type' | 'choose_contact' | 'success';

export const MedicalInfoPanel = () => {
  const { speak, emergencyContacts } = useNavidoorStore();
  const [step, setStep] = React.useState<FlowStep>('idle');
  const [selectedContactName, setSelectedContactName] = React.useState<string | null>(null);

  const startShareFlow = () => {
    speak('Who would you like to share your medical info with?');
    setStep('choose_type');
  };

  const handleShareEmergency = () => {
    const targetName = emergencyContacts[0]?.name || 'your emergency contacts';
    setSelectedContactName(targetName);
    setStep('success');
    speak(`Medical report sent to ${targetName}.`);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
    
    setTimeout(() => {
      setStep('idle');
      setSelectedContactName(null);
    }, 4000);
  };

  const handleShareOther = () => {
    speak('Select a contact from your list.');
    setStep('choose_contact');
  };

  const handleContactSelect = (name: string) => {
    setSelectedContactName(name);
    setStep('success');
    speak(`Medical report sent to ${name}.`);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
    
    setTimeout(() => {
      setStep('idle');
      setSelectedContactName(null);
    }, 4000);
  };

  const cancelFlow = () => {
    setStep('idle');
    setSelectedContactName(null);
    speak('Sharing cancelled.');
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Activity size={20} color="#0284C7" />
        <Text style={styles.title}>MEDICAL ID & INFO</Text>
      </View>

      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <Droplet size={18} color="#E11D48" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.infoLabel}>Blood Type</Text>
            <Text style={styles.infoValue}>O Positive (O+)</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <AlertTriangle size={18} color="#D97706" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.infoLabel}>Allergies</Text>
            <Text style={styles.infoValue}>Penicillin, Peanuts</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <Pill size={18} color="#059669" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.infoLabel}>Current Medications</Text>
            <Text style={styles.infoValue}>Lisinopril 10mg (Daily)</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.shareBtn} 
        onPress={startShareFlow}
        accessibilityLabel="Share medical info"
      >
        <Share2 size={20} color="#FFFFFF" />
        <Text style={styles.shareBtnText}>SHARE MEDICAL INFO</Text>
      </TouchableOpacity>

      <Modal visible={step !== 'idle'} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            
            {step === 'choose_type' && (
              <>
                <Text style={styles.modalTitle}>SHARE WITH WHO?</Text>
                <Text style={styles.modalText}>
                  Choose whether to share with your primary emergency contacts or another person.
                </Text>
                
                <View style={styles.actionBtnCol}>
                  <TouchableOpacity style={styles.emergencyChoiceBtn} onPress={handleShareEmergency}>
                    <ShieldAlert size={20} color="#FFFFFF" />
                    <Text style={styles.emergencyChoiceText}>EMERGENCY CONTACTS</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.otherChoiceBtn} onPress={handleShareOther}>
                    <UserPlus size={20} color="#0F172A" />
                    <Text style={styles.otherChoiceText}>OTHER CONTACT</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.cancelLinkBtn} onPress={cancelFlow}>
                    <Text style={styles.cancelLinkText}>CANCEL</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 'choose_contact' && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
                  <Text style={styles.modalTitle}>SELECT CONTACT</Text>
                  <TouchableOpacity onPress={cancelFlow} style={{ padding: 4 }}>
                    <X size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.contactListWrapper}>
                  {DUMMY_CONTACTS.map((c, index) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.contactListItem, 
                        index === DUMMY_CONTACTS.length - 1 && { borderBottomWidth: 0 }
                      ]}
                      onPress={() => handleContactSelect(c.name)}
                    >
                      <View style={styles.contactAvatar}>
                        <Text style={styles.contactInitials}>
                          {c.name.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{c.name}</Text>
                        <Text style={styles.contactPhone}>{c.phone}</Text>
                      </View>
                      <Phone size={18} color="#0284C7" />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {step === 'success' && (
              <>
                <View style={styles.successIconCircle}>
                  <Check size={42} color="#FFFFFF" />
                </View>
                <Text style={styles.modalTitle}>REPORT SENT</Text>
                <Text style={styles.modalText}>
                  Your medical ID has been successfully shared with {selectedContactName}.
                </Text>
              </>
            )}

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
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  infoValue: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  shareBtnText: {
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
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#0F172A',
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
    marginBottom: 8,
  },
  actionBtnCol: {
    width: '100%',
    gap: 12,
    marginTop: 20,
  },
  emergencyChoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E11D48',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  emergencyChoiceText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  otherChoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  otherChoiceText: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 14,
  },
  cancelLinkBtn: {
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelLinkText: {
    color: '#64748B',
    fontWeight: '800',
    fontSize: 13,
  },
  contactListWrapper: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    width: '100%',
  },
  contactListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
  },
  contactPhone: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  }
});
