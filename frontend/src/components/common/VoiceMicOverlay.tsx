import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { useContinuousVoiceLoop } from '../../hooks/useContinuousVoiceLoop';
import { UnifiedMicButton } from './UnifiedMicButton';

/** Top-level mic hit target, rendered above camera, panels, and navigation UI. */
export const VoiceMicOverlay: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const { voiceState, isFirstTimeUser, isProfileModalOpen } = useNavidoorStore();
  useContinuousVoiceLoop(enabled);

  if (isFirstTimeUser || isProfileModalOpen) return null;

  const toggleVoice = () => {
    console.log('[VoiceMicOverlay] TALK button pressed');
    setEnabled((current) => !current);
  };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.hitTarget} pointerEvents="auto">
        <UnifiedMicButton
          voiceState={voiceState}
          onPress={toggleVoice}
          showLabel
          size={68}
          labelOverride={enabled ? 'STOP' : undefined}
          accessibilityLabel={enabled ? 'Stop voice conversation' : 'Start hands-free voice conversation'}
          accessibilityHint="Tap to start or stop the hands-free voice conversation"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
    zIndex: 10000,
    elevation: 10000,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 112,
  },
  hitTarget: {
    minWidth: 100,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
