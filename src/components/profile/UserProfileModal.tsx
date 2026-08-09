import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { User, Phone, ShieldAlert, Pill, X, Edit2, Check, Mic, Loader2, LogOut } from 'lucide-react-native';
import { UnifiedMicButton } from '../common/UnifiedMicButton';

export const UserProfileModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const { 
    userName, 
    setUserName, 
    userPhone, 
    setUserPhone, 
    userLanguage, 
    emergencyContacts, 
    medicines, 
    setIsProfileModalOpen,
    setIsFirstTimeUser,
    voiceState,
    setVoiceState,
    speak,
    stopVoice
  } = useNavidoorStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editPhone, setEditPhone] = useState(userPhone);

  useEffect(() => {
    setIsProfileModalOpen(visible);
    if (visible) {
      setTimeout(() => {
        speak(`User Profile open for ${userName}. Tap the microphone to edit details.`);
      }, 300);
    }
  }, [visible]);

  if (!visible) return null;

  const handleClose = () => {
    setIsProfileModalOpen(false);
    onClose();
  };

  const handleSave = () => {
    setUserName(editName);
    setUserPhone(editPhone);
    setIsEditing(false);
    speak('Profile updated successfully.');
  };

  const handleLogout = () => {
    setIsProfileModalOpen(false);
    onClose();
    setIsFirstTimeUser(true);
    speak('Logged out. Starting voice profile setup again.');
  };

  const handleMicPress = () => {
    if (voiceState === 'listening') {
      setVoiceState('thinking');
      setTimeout(() => {
        setVoiceState('speaking');
        speak(`Profile updated. User name set to ${editName}.`);
        setVoiceState('idle');
      }, 1000);
    } else if (voiceState === 'speaking') {
      stopVoice();
    } else {
      setVoiceState('listening');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        
        {/* HIGH-VISIBILITY INTERACTIVE VOICE MICROPHONE FAB */}
        <View style={styles.topMicAnchor}>
          <UnifiedMicButton
            voiceState={voiceState}
            onPress={handleMicPress}
            showLabel={true}
            size={68}
            labelOverride={voiceState === 'idle' ? 'SPEAK PROFILE EDIT' : undefined}
          />
        </View>

        {/* PROFILE SHEET CARD */}
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <User size={22} color="#0284C7" />
              <Text style={styles.headerTitle}>USER PROFILE & MEDICAL ID</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} accessibilityLabel="Close Profile">
              <X size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* User Avatar Badge */}
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.nameGroup}>
                <Text style={styles.userNameText}>{userName}</Text>
                <Text style={styles.userLangText}>Voice Language: {userLanguage}</Text>
              </View>
            </View>

            {/* Editable Profile Information */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTag}>PERSONAL DETAILS</Text>
                <TouchableOpacity onPress={() => isEditing ? handleSave() : setIsEditing(true)}>
                  {isEditing ? <Check size={18} color="#0284C7" /> : <Edit2 size={18} color="#0F172A" />}
                </TouchableOpacity>
              </View>

              {isEditing ? (
                <View style={styles.editGroup}>
                  <TextInput
                    style={styles.editInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="User Name"
                    placeholderTextColor="#475569"
                  />
                  <TextInput
                    style={styles.editInput}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    keyboardType="phone-pad"
                    placeholder="Phone Number"
                    placeholderTextColor="#475569"
                  />
                </View>
              ) : (
                <View style={styles.infoRow}>
                  <Phone size={16} color="#0284C7" />
                  <Text style={styles.infoText}>{userPhone}</Text>
                </View>
              )}
            </View>

            {/* Emergency Medical ID */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTag}>EMERGENCY MEDICAL ID</Text>
              <View style={styles.medIdChip}>
                <ShieldAlert size={18} color="#E11D48" />
                <Text style={styles.medIdText}>Allergic to Penicillin • Blood Type O+</Text>
              </View>
            </View>

            {/* Primary SOS Contact */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTag}>PRIMARY EMERGENCY CONTACT</Text>
              <View style={styles.contactChip}>
                <Phone size={18} color="#0284C7" />
                <View style={styles.contactTextGroup}>
                  <Text style={styles.contactName}>{emergencyContacts[0]?.name} ({emergencyContacts[0]?.relation})</Text>
                  <Text style={styles.contactSub}>{emergencyContacts[0]?.phone}</Text>
                </View>
              </View>
            </View>

            {/* Loaded Prescription Medicines */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTag}>LOADED PRESCRIPTION MEDICINES</Text>
              {medicines.map((m) => (
                <View key={m.id} style={styles.medicineChip}>
                  <Pill size={18} color="#0284C7" />
                  <View style={styles.contactTextGroup}>
                    <Text style={styles.contactName}>{m.name}</Text>
                    <Text style={styles.contactSub}>{m.dosage} • {m.instructions}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* LOGOUT & RESET PROFILE SETUP BUTTON */}
            <TouchableOpacity 
              style={styles.logoutBtn}
              onPress={handleLogout}
              accessibilityLabel="Logout and Reset Profile Setup"
              accessibilityHint="Tap to log out and re-run voice setup"
            >
              <LogOut size={20} color="#E11D48" />
              <Text style={styles.logoutBtnText}>LOGOUT & RESET PROFILE SETUP</Text>
            </TouchableOpacity>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  topMicAnchor: {
    marginBottom: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  card: {
    width: '100%',
    backgroundColor: '#CBD5E1',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '74%',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#94A3B8',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scrollArea: {
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    backgroundColor: '#94A3B8',
    padding: 14,
    borderRadius: 20,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  nameGroup: {
    flex: 1,
  },
  userNameText: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '900',
  },
  userLangText: {
    color: '#1E293B',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '600',
  },
  sectionBox: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTag: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#94A3B8',
    padding: 12,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#64748B',
  },
  infoText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  editGroup: {
    gap: 8,
  },
  editInput: {
    backgroundColor: '#94A3B8',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  medIdChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    padding: 12,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E11D48',
  },
  medIdText: {
    color: '#E11D48',
    fontSize: 13,
    fontWeight: '800',
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#94A3B8',
    padding: 12,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#64748B',
  },
  contactTextGroup: {
    flex: 1,
  },
  contactName: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
  },
  contactSub: {
    color: '#1E293B',
    fontSize: 12,
    marginTop: 2,
  },
  medicineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#94A3B8',
    padding: 12,
    borderRadius: 14,
    gap: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#64748B',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    borderWidth: 1.5,
    borderColor: '#E11D48',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 12,
    marginBottom: 24,
  },
  logoutBtnText: {
    color: '#E11D48',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
