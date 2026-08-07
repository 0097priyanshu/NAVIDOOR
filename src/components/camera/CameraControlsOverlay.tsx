import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { Zap, ZapOff, RefreshCw, Volume2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export const CameraControlsOverlay: React.FC = () => {
  const { 
    cameraFacing, 
    toggleCameraFacing, 
    torchOn, 
    toggleTorch, 
    activeMode, 
    speak,
    lastAnnouncement,
  } = useNavidoorStore();

  const isVisionMode = ['assist', 'navigate', 'read', 'medicine', 'transport'].includes(activeMode);
  if (!isVisionMode) return null;

  const handleTorchPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    toggleTorch();
  };

  const handleCameraFlipPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    toggleCameraFacing();
  };

  const handleRepeatSpeechPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    if (lastAnnouncement) {
      speak(lastAnnouncement, true);
    } else {
      speak('NAVIDOOR AI Vision Assist Ready.', true);
    }
  };

  return (
    <View style={styles.accessibleOverlayContainer} pointerEvents="box-none">
      {/* UBER DARK MONOCHROME TOP UTILITY ACTION BAR */}
      <View style={styles.topUtilityBar} pointerEvents="box-none">
        {/* 1. Flashlight Light Mode Toggle */}
        <TouchableOpacity
          style={[styles.utilityPill, torchOn && styles.utilityPillActiveTorch]}
          onPress={handleTorchPress}
          accessibilityLabel={torchOn ? 'Flashlight is ON. Tap to turn off flashlight.' : 'Flashlight is OFF. Tap to illuminate environment.'}
          accessibilityHint="Toggles camera flashlight for scanning in low light"
          accessibilityRole="button"
        >
          {torchOn ? <Zap size={18} color="#F59E0B" /> : <ZapOff size={18} color="#FFFFFF" />}
          <Text style={[styles.utilityPillText, torchOn && styles.utilityPillTextTorch]}>
            {torchOn ? 'LIGHT ON' : 'LIGHT OFF'}
          </Text>
        </TouchableOpacity>

        {/* 2. Rear / Front Camera Facing Toggle */}
        <TouchableOpacity
          style={styles.utilityPill}
          onPress={handleCameraFlipPress}
          accessibilityLabel={`Camera pointing ${cameraFacing === 'back' ? 'outward to environment' : 'towards user'}. Tap to switch camera.`}
          accessibilityHint="Switches between rear environment camera and front self camera"
          accessibilityRole="button"
        >
          <RefreshCw size={18} color="#FFFFFF" />
          <Text style={styles.utilityPillText}>
            {cameraFacing === 'back' ? 'REAR CAM' : 'FRONT CAM'}
          </Text>
        </TouchableOpacity>

        {/* 3. Repeat Speech / Read Out Loud */}
        <TouchableOpacity
          style={styles.utilityPill}
          onPress={handleRepeatSpeechPress}
          accessibilityLabel="Repeat audio announcement out loud"
          accessibilityHint="Re-reads the last scene description or obstacle info"
          accessibilityRole="button"
        >
          <Volume2 size={19} color="#FFFFFF" />
          <Text style={styles.utilityPillText}>REPEAT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  accessibleOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 25,
    paddingHorizontal: 16,
    paddingTop: 72,
  },
  topUtilityBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  utilityPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  utilityPillActiveTorch: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderColor: '#F59E0B',
  },
  utilityPillText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  utilityPillTextTorch: {
    color: '#F59E0B',
  },
});
