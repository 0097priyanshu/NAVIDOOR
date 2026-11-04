import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { Sparkles, Volume2, VolumeX, Eye, BookOpen, Camera, FileText } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  hospital_department: { label: 'HOSPITAL DEPT', icon: '🏢', color: '#EF4444' },
  bus_board: { label: 'BUS BOARD', icon: '🚌', color: '#F59E0B' },
  medicine_label: { label: 'MEDICINE', icon: '💊', color: '#10B981' },
  door_label: { label: 'DOOR SIGN', icon: '🚪', color: '#3B82F6' },
  document: { label: 'DOCUMENT', icon: '📜', color: '#8B5CF6' },
  notice: { label: 'NOTICE', icon: '⚠️', color: '#F97316' },
  menu: { label: 'MENU', icon: '🍽️', color: '#EC4899' },
  product_label: { label: 'PRODUCT', icon: '🏷️', color: '#14B8A6' },
  signboard: { label: 'SIGNBOARD', icon: '🛑', color: '#06B6D4' },
};

export const AIVisionOverlay: React.FC = () => {
  const { 
    lastAnnouncement, 
    speak, 
    activeMode,
    detectedObjects,
    ocrLines,
    detectedOcrCategory,
    activeReadText,
    isReadingAloud,
    toggleReadAloud,
    runOcrScan,
    isOcrScanning
  } = useNavidoorStore();

  const isVisionMode = ['assist', 'navigate', 'read', 'medicine', 'transport'].includes(activeMode);
  if (!isVisionMode) return null;

  const isReadMode = activeMode === 'read';

  const handleSpeechReplay = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    if (lastAnnouncement) {
      speak(lastAnnouncement, true);
    }
  };

  const handleQuickScan = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    runOcrScan('glance');
  };

  const handleDeepScan = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}
    runOcrScan('deep');
  };

  const catMeta = detectedOcrCategory && CATEGORY_META[detectedOcrCategory]
    ? CATEGORY_META[detectedOcrCategory]
    : { label: 'READING ASSISTANT', icon: '📖', color: '#0284C7' };

  return (
    <>
      {/* 1. VISUAL BOUNDING BOXES */}
      {/* A. If in READ mode, display real OCR text bounding boxes */}
      {isReadMode && ocrLines && ocrLines.length > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {ocrLines.slice(0, 6).map((line, idx) => {
            const bbox = line.normalized_bbox || [0.1, 0.2 + idx * 0.1, 0.9, 0.28 + idx * 0.1];
            const left = Math.max(12, Math.min(SCREEN_WIDTH - 80, bbox[0] * SCREEN_WIDTH));
            const top = Math.max(80, Math.min(SCREEN_HEIGHT - 260, bbox[1] * SCREEN_HEIGHT));
            const width = Math.max(70, Math.min(SCREEN_WIDTH - 24, (bbox[2] - bbox[0]) * SCREEN_WIDTH));
            const height = Math.max(30, (bbox[3] - bbox[1]) * SCREEN_HEIGHT);

            return (
              <View
                key={`ocr-box-${idx}`}
                style={[
                  styles.ocrBoundingBox,
                  {
                    top,
                    left,
                    width,
                    minHeight: height,
                    borderColor: catMeta.color,
                  }
                ]}
              >
                <View style={[styles.ocrBadge, { backgroundColor: catMeta.color }]}>
                  <Text style={styles.ocrBadgeText} numberOfLines={1}>
                    {catMeta.icon} {line.text}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* B. If in non-READ mode, display standard YOLO Obstacle Bounding Boxes */}
      {!isReadMode && detectedObjects && detectedObjects.length > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {detectedObjects.slice(0, 3).map((obj) => {
            const isHazard = obj.isHazard || obj.distanceMeters < 2.0;
            const borderColor = isHazard ? '#EF4444' : '#10B981';
            const bgColor = isHazard ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)';
            const topPos = Math.max(190, Math.min(430, (obj.yRatio || 0.4) * 500));
            const leftPos = Math.max(24, Math.min(220, (obj.xRatio || 0.3) * 300));

            return (
              <View
                key={obj.id}
                style={[
                  styles.yoloBoundingBox,
                  {
                    top: topPos,
                    left: leftPos,
                    borderColor,
                    backgroundColor: bgColor,
                  }
                ]}
              >
                <View style={[styles.yoloBadge, { backgroundColor: borderColor }]}>
                  <Text style={styles.yoloBadgeText}>
                    {obj.emojiIcon} {obj.label}
                  </Text>
                </View>
                <Text style={[styles.yoloDistanceTag, { color: borderColor }]}>
                  {obj.distanceMeters}m • {obj.direction?.toUpperCase()}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* 2. ACCESSIBLE VOICE & OCR HUD CARDS */}
      <View style={styles.voiceHudContainer} pointerEvents="box-none">
        {isReadMode ? (
          // DEDICATED OCR READING ASSISTANT HUD CARD
          <View style={styles.ocrHudCard}>
            {/* Header row with Category Badge */}
            <View style={styles.ocrHeaderRow}>
              <View style={[styles.ocrCatPill, { backgroundColor: catMeta.color }]}>
                <Text style={styles.ocrCatPillText}>
                  {catMeta.icon} {catMeta.label}
                </Text>
              </View>
              {isOcrScanning && (
                <Text style={styles.ocrScanningTag}>SCANNING...</Text>
              )}
            </View>

            {/* Main Text Content */}
            <TouchableOpacity 
              style={styles.ocrTextContainer}
              onPress={handleSpeechReplay}
              accessibilityLabel={`Read aloud: ${lastAnnouncement || activeReadText}`}
              accessibilityHint="Tap to listen to scanned text again"
              accessibilityRole="button"
            >
              <Text style={styles.ocrHudText} numberOfLines={3}>
                {lastAnnouncement || activeReadText || 'Point camera at any sign, label, or document to read.'}
              </Text>
            </TouchableOpacity>

            {/* Interactive Control Action Bar */}
            <View style={styles.ocrActionRow}>
              {/* Play / Pause Toggle */}
              <TouchableOpacity
                style={[styles.ocrActionBtn, isReadingAloud ? styles.ocrActionBtnActive : styles.ocrActionBtnPrimary]}
                onPress={toggleReadAloud}
                accessibilityLabel={isReadingAloud ? "Pause reading aloud" : "Read scanned text out loud"}
                accessibilityRole="button"
              >
                {isReadingAloud ? <VolumeX size={16} color="#FFFFFF" /> : <Volume2 size={16} color="#FFFFFF" />}
                <Text style={styles.ocrActionBtnText}>
                  {isReadingAloud ? 'PAUSE' : 'LISTEN'}
                </Text>
              </TouchableOpacity>

              {/* Quick Glance Scan Button */}
              <TouchableOpacity
                style={styles.ocrActionBtnSecondary}
                onPress={handleQuickScan}
                accessibilityLabel="Scan text in camera view"
                accessibilityRole="button"
              >
                <Eye size={16} color="#0284C7" />
                <Text style={styles.ocrActionBtnTextSecondary}>GLANCE</Text>
              </TouchableOpacity>

              {/* Deep High-Resolution Capture Button */}
              <TouchableOpacity
                style={styles.ocrActionBtnSecondary}
                onPress={handleDeepScan}
                accessibilityLabel="Capture high definition document snapshot"
                accessibilityRole="button"
              >
                <Camera size={16} color="#0284C7" />
                <Text style={styles.ocrActionBtnTextSecondary}>DEEP</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // STANDARD YOLO VISION VOICE HUD CARD
          <TouchableOpacity 
            style={styles.voiceHudCard}
            onPress={handleSpeechReplay}
            accessibilityLabel={`AI Voice Guidance: ${lastAnnouncement}`}
            accessibilityHint="Tap to replay spatial voice description out loud"
            accessibilityRole="button"
          >
            <View style={styles.voiceIconBadge}>
              <Sparkles size={18} color="#0284C7" />
            </View>
            <Text style={styles.voiceHudText} numberOfLines={2}>
              {lastAnnouncement || 'AI Vision active. Scanning surroundings...'}
            </Text>
            <View style={styles.replayBadge}>
              <Volume2 size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  voiceHudContainer: {
    position: 'absolute',
    top: 130,
    left: 16,
    right: 16,
    zIndex: 20,
    alignItems: 'center',
  },
  voiceHudCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CBD5E1',
    borderWidth: 1.5,
    borderColor: '#64748B',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  voiceIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(2, 132, 199, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceHudText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  replayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yoloBoundingBox: {
    position: 'absolute',
    borderWidth: 2.5,
    borderRadius: 12,
    padding: 6,
    minWidth: 110,
    zIndex: 15,
  },
  yoloBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  yoloBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  yoloDistanceTag: {
    fontSize: 11,
    fontWeight: '800',
  },
  // OCR Specialized Styles
  ocrBoundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    padding: 4,
    zIndex: 16,
  },
  ocrBadge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ocrBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  ocrHudCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    borderRadius: 20,
    padding: 14,
    gap: 10,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  ocrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ocrCatPill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ocrCatPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ocrScanningTag: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  ocrTextContainer: {
    paddingVertical: 2,
  },
  ocrHudText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  ocrActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  ocrActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 8,
    gap: 6,
  },
  ocrActionBtnPrimary: {
    backgroundColor: '#0284C7',
  },
  ocrActionBtnActive: {
    backgroundColor: '#EF4444',
  },
  ocrActionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 8,
    gap: 5,
  },
  ocrActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ocrActionBtnTextSecondary: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
