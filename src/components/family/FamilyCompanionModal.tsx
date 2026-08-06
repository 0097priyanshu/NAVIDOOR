import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { getThemeColors, ACCESSIBILITY } from '../../theme/designSystem';
import { Users, Video, Mic, Volume2, X, ShieldCheck, MessageSquare } from 'lucide-react-native';

export const FamilyCompanionModal: React.FC = () => {
  const { isFamilyCompanionOpen, setFamilyCompanionOpen, themeMode, speak } = useNavidoorStore();
  const colors = getThemeColors(themeMode);
  const [isAudioConnected, setIsAudioConnected] = useState(true);

  if (!isFamilyCompanionOpen) return null;

  return (
    <Modal visible={isFamilyCompanionOpen} transparent animationType="slide">
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.bgCard, borderColor: '#10B981' }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <Users size={24} color="#10B981" />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>REMOTE FAMILY COMPANION</Text>
            </View>
            <TouchableOpacity onPress={() => setFamilyCompanionOpen(false)} style={styles.closeBtn}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Connection Status Banner */}
          <View style={styles.statusBanner}>
            <View style={styles.livePulseDot} />
            <Text style={styles.statusText}>Sarah Jenkins Connected (Live Video Shared)</Text>
          </View>

          {/* Remote Caretaker Voice Note */}
          <View style={styles.voiceNoteCard}>
            <View style={styles.noteTop}>
              <MessageSquare size={16} color="#10B981" />
              <Text style={styles.noteSender}>Sarah Jenkins (Daughter):</Text>
            </View>
            <Text style={styles.noteText}>
              "Dad, I'm watching your stream! The bakery entrance is directly to your right, next to the red awning."
            </Text>
            <TouchableOpacity 
              style={styles.listenBtn}
              onPress={() => speak("Sarah says: The bakery entrance is directly to your right next to the red awning.")}
            >
              <Volume2 size={16} color="#FFFFFF" />
              <Text style={styles.listenBtnText}>Listen Voice Note</Text>
            </TouchableOpacity>
          </View>

          {/* Direct Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.ctrlBtn, { backgroundColor: isAudioConnected ? '#10B981' : 'rgba(255,255,255,0.1)' }]}
              onPress={() => setIsAudioConnected(!isAudioConnected)}
            >
              <Mic size={20} color="#FFFFFF" />
              <Text style={styles.ctrlBtnText}>{isAudioConnected ? 'Mic Live' : 'Muted'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctrlBtn, styles.closeCompanionBtn]}
              onPress={() => setFamilyCompanionOpen(false)}
              accessibilityLabel="Close Family Companion Session"
              accessibilityRole="button"
            >
              <ShieldCheck size={20} color="#FFFFFF" />
              <Text style={styles.closeCompanionBtnText}>Close Companion</Text>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
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
    marginBottom: 14,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 8,
    marginBottom: 14,
  },
  livePulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 13,
  },
  voiceNoteCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 14,
    marginBottom: 16,
  },
  noteTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  noteSender: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 13,
  },
  noteText: {
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 6,
  },
  listenBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ctrlBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: ACCESSIBILITY.borderRadiusButton,
    gap: 8,
    minHeight: ACCESSIBILITY.minTouchTargetSize,
  },
  ctrlBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  closeCompanionBtn: {
    backgroundColor: '#E11D48',
    borderWidth: 1.5,
    borderColor: '#F43F5E',
  },
  closeCompanionBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
