import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { Sparkles, Volume2 } from 'lucide-react-native';

export const AIVisionOverlay: React.FC = () => {
  const { 
    lastAnnouncement, 
    speak, 
    activeMode 
  } = useNavidoorStore();

  const isVisionMode = ['assist', 'navigate', 'read', 'medicine', 'transport'].includes(activeMode);
  if (!isVisionMode) return null;

  const handleSpeechReplay = () => {
    if (lastAnnouncement) {
      speak(lastAnnouncement, true);
    }
  };

  return (
    <View style={styles.voiceHudContainer} pointerEvents="box-none">
      {/* Accessible Voice Guidance HUD */}
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
});
