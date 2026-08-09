import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, ScrollView } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { X, Volume2, Camera, Sparkles, FileText, CheckCircle2 } from 'lucide-react-native';

export const CapturedPhotoPreviewModal: React.FC = () => {
  const { 
    isCapturedPhotoModalOpen, 
    setIsCapturedPhotoModalOpen, 
    capturedPhotoUri, 
    activeMode,
    speak,
    stopVoice
  } = useNavidoorStore();

  const handleClose = () => {
    stopVoice();
    setIsCapturedPhotoModalOpen(false);
  };

  const getAnalysisResultText = () => {
    switch (activeMode) {
      case 'read':
        return 'SCANNED DOCUMENT TEXT:\n"PHARMACY PRESCRIPTION - DR. SMITH.\nTAKE 1 TABLET DAILY WITH WATER AFTER MEAL.\nREFILLS: 3 • EXPIRY: 12/2027."';
      case 'medicine':
        return 'MEDICINE BOTTLE SCANNED:\n"LISINOPRIL 10MG TABLETS.\nDOSAGE: 1 PILL AT 8:00 AM.\nWARNING: TAKE WITH FOOD."';
      case 'transport':
        return 'BUS STOP SIGNBOARD SCANNED:\n"BUS ROUTE 102 - OAK RIDGE EXPRESS.\nARRIVING IN 4 MINUTES."';
      case 'navigate':
        return 'NAVIGATION SCENE SCANNED:\n"Clear hallway ahead. Exit door located 3 meters straight. Crosswalk signal green."';
      default:
        return 'AI VISION SCENE SCAN:\n"Surroundings captured clearly. Clear path ahead with no immediate hazards."';
    }
  };

  const analysisText = getAnalysisResultText();

  const handleReadAloud = () => {
    speak(`Photo Scan Results: ${analysisText.replace(/[\n"]/g, ' ')}`, true);
  };

  const displayUri = capturedPhotoUri || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80';

  return (
    <Modal
      visible={Boolean(isCapturedPhotoModalOpen)}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <Sparkles size={20} color="#0284C7" />
              <Text style={styles.headerTitle}>CAPTURED PHOTO SCAN</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} accessibilityLabel="Close Captured Photo Preview">
              <X size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
            {/* Captured Photo Image Container */}
            <View style={styles.imageCard}>
              <Image 
                source={{ uri: displayUri }} 
                style={styles.photoImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlayBadge}>
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text style={styles.badgeText}>PHOTO CAPTURED & ANALYZED</Text>
              </View>
            </View>

            {/* OCR & AI Vision Analysis Output Box */}
            <View style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <FileText size={18} color="#0284C7" />
                <Text style={styles.analysisTag}>EXTRACTED TEXT & SCENE ANALYSIS</Text>
              </View>
              <Text style={styles.analysisBodyText}>{analysisText}</Text>
            </View>

            {/* Interactive Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.readAloudBtn}
                onPress={handleReadAloud}
                accessibilityLabel="Read scanned text out loud"
                accessibilityRole="button"
              >
                <Volume2 size={20} color="#FFFFFF" />
                <Text style={styles.readAloudBtnText}>READ OUT LOUD</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.retakeBtn}
                onPress={handleClose}
                accessibilityLabel="Retake Photo"
                accessibilityRole="button"
              >
                <Camera size={18} color="#0284C7" />
                <Text style={styles.retakeBtnText}>RE-TAKE</Text>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#CBD5E1',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '88%',
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
    marginBottom: 16,
    paddingBottom: 10,
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
    letterSpacing: 1.2,
  },
  closeBtn: {
    padding: 4,
  },
  imageCard: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    backgroundColor: '#94A3B8',
    borderWidth: 1.5,
    borderColor: '#64748B',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  analysisCard: {
    backgroundColor: '#94A3B8',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#64748B',
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  analysisTag: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  analysisBodyText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  readAloudBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    borderRadius: 18,
    paddingVertical: 16,
  },
  readAloudBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#94A3B8',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    borderRadius: 18,
    paddingVertical: 16,
  },
  retakeBtnText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
