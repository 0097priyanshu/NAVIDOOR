import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { User, Phone, ShieldAlert, Pill, X, Edit2, Check, Mic, Loader2 } from 'lucide-react-native';

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
        speak(`User Profile open for ${userName}. Tap the white microphone to edit your name or phone number by voice.`);
      }, 400);
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
      speak('Listening for profile edits. Speak your new name or phone number.', true);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        
        {/* HIGH-VISIBILITY INTERACTIVE VOICE MICROPHONE FAB */}
        <View style={styles.topMicAnchor}>
          {voiceState !== 'idle' && <View style={styles.pulseGreen} />}

          <TouchableOpacity
            style={[
              styles.modalMicFab,
              { backgroundColor: voiceState === 'idle' ? '#FFFFFF' : '#05A357' }
            ]}
            onPress={handleMicPress}
            activeOpacity={0.8}
            accessibilityLabel="Voice Edit Profile Button"
            accessibilityHint="Tap once to dictate profile updates"
          >
            {voiceState === 'thinking' ? (
              <Loader2 size={34} color="#000000" />
            ) : (
              <Mic size={34} color={voiceState === 'idle' ? '#000000' : '#FFFFFF'} />
            )}
          </TouchableOpacity>

          <Text style={styles.micHintText}>
            {voiceState === 'idle' ? 'SPEAK PROFILE EDIT' : voiceState.toUpperCase()}
          </Text>
        </View>

        {/* PROFILE SHEET CARD */}
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <User size={22} color="#FFFFFF" />
              <Text style={styles.headerTitle}>USER PROFILE & MEDICAL ID</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} accessibilityLabel="Close Profile">
              <X size={24} color="#FFFFFF" />
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
                  {isEditing ? <Check size={18} color="#05A357" /> : <Edit2 size={18} color="#FFFFFF" />}
                </TouchableOpacity>
              </View>

              {isEditing ? (
                <View style={styles.editGroup}>
                  <TextInput
                    style={styles.editInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="User Name"
                    placeholderTextColor="#A0A0A0"
                  />
                  <TextInput
                    style={styles.editInput}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    keyboardType="phone-pad"
                    placeholder="Phone Number"
                    placeholderTextColor="#A0A0A0"
                  />
                </View>
              ) : (
                <View style={styles.infoRow}>
                  <Phone size={16} color="#A0A0A0" />
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
                <Phone size={18} color="#FFFFFF" />
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
                  <Pill size={18} color="#FFFFFF" />
                  <View style={styles.contactTextGroup}>
                    <Text style={styles.contactName}>{m.name}</Text>
                    <Text style={styles.contactSub}>{m.dosage} • {m.instructions}</Text>
                  </View>
                </View>
              ))}
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
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  topMicAnchor: {
    marginBottom: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  pulseGreen: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(5, 163, 87, 0.35)',
  },
  modalMicFab: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 16,
  },
  micHintText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(18, 18, 18, 0.98)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '74%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.6,
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
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    borderRadius: 20,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },
  userLangText: {
    color: '#A0A0A0',
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
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
    borderRadius: 14,
    gap: 10,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  editGroup: {
    gap: 8,
  },
  editInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  medIdChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    padding: 12,
    borderRadius: 14,
    gap: 10,
  },
  medIdText: {
    color: '#E11D48',
    fontSize: 13,
    fontWeight: '800',
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    borderRadius: 14,
    gap: 10,
  },
  contactTextGroup: {
    flex: 1,
  },
  contactName: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  contactSub: {
    color: '#A0A0A0',
    fontSize: 12,
    marginTop: 2,
  },
  medicineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    borderRadius: 14,
    gap: 10,
    marginBottom: 6,
  },
});
