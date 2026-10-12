import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { Sparkles, Volume2 } from 'lucide-react-native';

export const AIVisionOverlay: React.FC = () => {
  const { 
    lastAnnouncement, 
    speak, 
    activeMode,
    detectedObjects 
  } = useNavidoorStore();

  const isVisionMode = ['assist', 'navigate', 'read', 'medicine', 'transport'].includes(activeMode);
  if (!isVisionMode) return null;

  const handleSpeechReplay = () => {
    if (lastAnnouncement) {
      speak(lastAnnouncement, true);
    }
  };

  return (
    <>
      {/* 1. Live Spatial Bounding Box Overlays for Caregiver / Visual Feedback */}
      <View style={styles.boundingBoxLayer} pointerEvents="none">
        {detectedObjects.map((obj, i) => {
          const x1 = obj.xRatio ?? 0.1;
          const y1 = obj.yRatio ?? 0.1;
          const x2 = obj.x2Ratio ?? (x1 + 0.3);
          const y2 = obj.y2Ratio ?? (y1 + 0.3);

          const leftPercent = `${(Math.max(0, Math.min(0.95, x1)) * 100).toFixed(1)}%`;
          const topPercent = `${(Math.max(0, Math.min(0.95, y1)) * 100).toFixed(1)}%`;
          const widthPercent = `${(Math.max(0.05, Math.min(1.0 - x1, x2 - x1)) * 100).toFixed(1)}%`;
          const heightPercent = `${(Math.max(0.05, Math.min(1.0 - y1, y2 - y1)) * 100).toFixed(1)}%`;

          const isHazard = obj.isHazard || obj.distanceMeters < 2.0;

          if (__DEV__) {
            console.log(`[OVERLAY DIAG] Rendering Box ${i+1}/${detectedObjects.length}: label='${obj.label}', left=${leftPercent}, top=${topPercent}, width=${widthPercent}, height=${heightPercent}`);
          }

          return (
            <View
              key={obj.id}
              style={[
                styles.boundingBox,
                {
                  left: leftPercent as any,
                  top: topPercent as any,
                  width: widthPercent as any,
                  height: heightPercent as any,
                  borderColor: isHazard ? '#E11D48' : '#0284C7',
                  backgroundColor: isHazard ? 'rgba(225, 29, 72, 0.18)' : 'rgba(2, 132, 199, 0.18)',
                },
              ]}
            >
              <View style={[styles.boxLabelBadge, { backgroundColor: isHazard ? '#E11D48' : '#0284C7' }]}>
                <Text style={styles.boxLabelText}>
                  {obj.emojiIcon} {obj.label.toUpperCase()} • {obj.distanceMeters}m
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* 2. Accessible Voice Guidance HUD Card */}
      <View style={styles.voiceHudContainer} pointerEvents="box-none">
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
  boundingBoxLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 2.5,
    borderRadius: 12,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  boxLabelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    margin: 4,
  },
  boxLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
