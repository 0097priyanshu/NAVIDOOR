import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { Volume2, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export const AIVisionOverlay: React.FC = () => {
  const { 
    lastAnnouncement, 
    isDetectionActive, 
    activeMode, 
    speak 
  } = useNavidoorStore();

  const isVisionMode = ['assist', 'navigate', 'read', 'medicine', 'transport'].includes(activeMode);

  if (!isDetectionActive || !isVisionMode) return null;

  const handleSpeechReplay = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    if (lastAnnouncement) {
      speak(lastAnnouncement, true);
    }
  };

  return (
    <View style={styles.voiceHudContainer} pointerEvents="box-none">
      {/* Accessible Voice Guidance HUD (Replaces visual floating tags) */}
      <TouchableOpacity 
        style={styles.voiceHudCard}
        onPress={handleSpeechReplay}
        accessibilityLabel={`AI Voice Guidance: ${lastAnnouncement}`}
        accessibilityHint="Tap to replay spatial voice description out loud"
        accessibilityRole="button"
      >
        <View style={styles.voiceIconBadge}>
          <Sparkles size={18} color="#05A357" />
        </View>
        <Text style={styles.voiceHudText} numberOfLines={2}>
          {lastAnnouncement || 'AI Vision active. Scanning surroundings...'}
        </Text>
        <View style={styles.replayBadge}>
          <Volume2 size={16} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
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
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  voiceIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(5, 163, 87, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceHudText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  replayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
