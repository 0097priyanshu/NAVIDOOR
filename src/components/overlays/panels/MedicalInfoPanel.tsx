import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Activity, Share2, Droplet, AlertTriangle, Pill, Check, Trash2, Plus, ShieldAlert, UserPlus, Phone, X } from 'lucide-react-native';
import { useNavidoorStore } from '../../../store/useNavidoorStore';

const DUMMY_CONTACTS = [
  { id: 'c1', name: 'John Doe', phone: '+1 555-0101' },
  { id: 'c2', name: 'Alice Smith', phone: '+1 555-0102' },
  { id: 'c3', name: 'Michael Johnson', phone: '+1 555-0103' },
  { id: 'c4', name: 'Emma Brown', phone: '+1 555-0104' },
];

type FlowStep = 'idle' | 'choose_type' | 'choose_contact' | 'success';

export const MedicalInfoPanel = () => {
  const { speak, emergencyContacts, medicines, confirmMedicineTaken, deleteMedicine } = useNavidoorStore();
  const [step, setStep] = React.useState<FlowStep>('idle');
  const [selectedContactName, setSelectedContactName] = React.useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newMedNameInput, setNewMedNameInput] = React.useState('');

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

  const handleConfirmTaken = (id: string, name: string) => {
    confirmMedicineTaken(id);
    speak(`Dose confirmed and logged for ${name}.`);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
  };

  const handleDeleteMedication = (id: string, name: string) => {
    deleteMedicine(id);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch (e) {}
  };

  const handleAddMedication = () => {
    const name = newMedNameInput.trim();
    if (!name) return;

    const newMed = {
      id: `med-${Date.now()}`,
      name,
      dosage: '1 Pill',
      instructions: 'Take daily as prescribed',
      remainingPills: 20,
      nextScheduledTime: '8:00 AM Today',
      prescribedFor: 'General Health'
    };

    useNavidoorStore.setState((state) => ({
      medicines: [newMed, ...(state.medicines || [])]
    }));

    speak(`Added medication ${name}.`);
    setNewMedNameInput('');
    setShowAddForm(false);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Activity size={22} color="#0284C7" />
          <Text style={styles.title}>EMERGENCY MEDICAL ID & INFO</Text>
        </View>
      </View>

      {/* Vitals & Allergies Box */}
      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <View style={[styles.iconContainer, { backgroundColor: '#FFE4E6' }]}>
            <Droplet size={18} color="#E11D48" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.infoLabel}>Blood Type</Text>
            <Text style={styles.infoValue}>O Positive (O+)</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
            <AlertTriangle size={18} color="#D97706" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.infoLabel}>Allergies & Sensitivities</Text>
            <Text style={styles.infoValue}>Penicillin, Peanuts</Text>
          </View>
        </View>
      </View>

      {/* Dynamic Current Medications Section */}
      <View style={styles.medSectionCard}>
        <View style={styles.medHeaderRow}>
          <View style={styles.medHeaderLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5' }]}>
              <Pill size={18} color="#059669" />
            </View>
            <Text style={styles.sectionHeaderTitle}>
              MEDICATIONS ({medicines ? medicines.length : 0})
            </Text>
          </View>
          
          {/* Add Medicine Toggle Button */}
          <TouchableOpacity 
            style={[styles.addMedHeaderBtn, showAddForm && styles.cancelAddBtn]} 
            onPress={() => setShowAddForm(!showAddForm)}
            accessibilityLabel="Add Medicine"
          >
            {showAddForm ? <X size={15} color="#64748B" /> : <Plus size={15} color="#FFFFFF" />}
            <Text style={[styles.addMedHeaderBtnText, showAddForm && styles.cancelAddBtnText]}>
              {showAddForm ? 'CANCEL' : 'ADD'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add Medicine Form */}
        {showAddForm && (
          <View style={styles.addFormContainer}>
            <TextInput
              style={styles.addInput}
              value={newMedNameInput}
              onChangeText={setNewMedNameInput}
              placeholder="Enter medicine (e.g. Paracetamol 10mg)"
              placeholderTextColor="#94A3B8"
              autoFocus
            />
            <TouchableOpacity style={styles.saveMedBtn} onPress={handleAddMedication}>
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.saveMedBtnText}>SAVE</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List of Medications with TAKEN and DELETE options */}
        <View style={{ marginTop: 12 }}>
          {medicines && medicines.length > 0 ? (
            medicines.map((med) => (
              <View key={med.id} style={styles.medicineItemCard}>
                <View style={styles.medInfoLeft}>
                  <Text style={styles.medNameText}>{med.name}</Text>
                  <Text style={styles.medSubText}>
                    {med.dosage || '1 Pill'} • {med.instructions || 'Daily'}
                  </Text>
                  <View style={styles.badgeRow}>
                    <Text style={styles.medPillBadge}>{med.remainingPills ?? 20} pills left</Text>
                  </View>
                </View>
                
                {/* Action Buttons: TAKEN & DELETE */}
                <View style={styles.actionBtnRow}>
                  <TouchableOpacity
                    style={styles.confirmDoseBtn}
                    onPress={() => handleConfirmTaken(med.id, med.name)}
                    accessibilityLabel={`Confirm dose for ${med.name}`}
                  >
                    <Check size={14} color="#FFFFFF" />
                    <Text style={styles.confirmDoseText}>TAKEN</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteMedBtn}
                    onPress={() => handleDeleteMedication(med.id, med.name)}
                    accessibilityLabel={`Delete ${med.name}`}
                  >
                    <Trash2 size={16} color="#E11D48" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyMedContainer}>
              <Pill size={28} color="#94A3B8" />
              <Text style={styles.noMedText}>No medications logged yet.</Text>
              <Text style={styles.noMedSubText}>Tap "+ ADD" above or say "Add Paracetamol 10mg"</Text>
            </View>
          )}
        </View>
      </View>

      {/* Share Medical Report Button */}
      <TouchableOpacity 
        style={styles.shareBtn} 
        onPress={startShareFlow}
        accessibilityLabel="Share medical info"
      >
        <Share2 size={20} color="#FFFFFF" />
        <Text style={styles.shareBtnText}>SHARE MEDICAL REPORT</Text>
      </TouchableOpacity>

      {/* Share Modal Dialog */}
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
    backgroundColor: '#FFFFFF', // Opaque pure white card
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  infoBox: {
    backgroundColor: '#FFFFFF', // Plain solid white box
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 14,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    marginVertical: 10,
  },
  medSectionCard: {
    backgroundColor: '#FFFFFF', // Plain solid white box
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  medHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionHeaderTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  addMedHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  cancelAddBtn: {
    backgroundColor: '#E2E8F0',
  },
  addMedHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cancelAddBtnText: {
    color: '#475569',
  },
  addFormContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  addInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  saveMedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  saveMedBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  medicineItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medInfoLeft: {
    flex: 1,
    marginRight: 8,
  },
  medNameText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  medSubText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  badgeRow: {
    marginTop: 6,
  },
  medPillBadge: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmDoseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  confirmDoseText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  deleteMedBtn: {
    backgroundColor: '#FFE4E6',
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  noMedText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  noMedSubText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
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
