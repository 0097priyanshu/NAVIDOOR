import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Platform } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { Zap, ZapOff, RefreshCw, Volume2, Camera, Eye } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isNarrowScreen = SCREEN_WIDTH < 390;

export const CameraControlsOverlay: React.FC = () => {
  const { 
    cameraFacing, 
    toggleCameraFacing, 
    torchOn, 
    toggleTorch, 
    activeMode, 
    speak,
    lastAnnouncement,
    triggerYoloScan,
  } = useNavidoorStore();

  const isVisionMode = ['assist', 'navigate', 'read', 'medicine', 'transport'].includes(activeMode);
  if (!isVisionMode) return null;

  const handleScanPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}
    speak('Scanning surroundings with YOLO...', true);
    triggerYoloScan();
  };

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

  const iconSize = isNarrowScreen ? 15 : 18;

  return (
    <View style={styles.accessibleOverlayContainer} pointerEvents="box-none">
      {/* UBER CYAN MONOCHROME TOP UTILITY ACTION BAR */}
      <View style={styles.topUtilityBar} pointerEvents="box-none">
        {/* 1. Integrated YOLO AI Vision Scan Button */}
        <TouchableOpacity
          style={[styles.utilityPill, styles.scanPill]}
          onPress={handleScanPress}
          accessibilityLabel="Scan surroundings with YOLO AI Vision for obstacles and distances"
          accessibilityHint="Scans camera view with YOLO AI and speaks detected objects, distances, and path clearance"
          accessibilityRole="button"
        >
          <Eye size={iconSize} color="#FFFFFF" />
          <Text style={styles.utilityPillText}>SCAN</Text>
        </TouchableOpacity>

        {/* 2. Flashlight Light Mode Toggle */}
        <TouchableOpacity
          style={[styles.utilityPill, torchOn && styles.utilityPillActiveTorch]}
          onPress={handleTorchPress}
          accessibilityLabel={torchOn ? 'Flashlight is ON. Tap to turn off flashlight.' : 'Flashlight is OFF. Tap to illuminate environment.'}
          accessibilityHint="Toggles camera flashlight for scanning in low light"
          accessibilityRole="button"
        >
          {torchOn ? <Zap size={iconSize} color="#F59E0B" /> : <ZapOff size={iconSize} color="#FFFFFF" />}
          <Text style={[styles.utilityPillText, torchOn && styles.utilityPillTextTorch]}>
            LIGHT
          </Text>
        </TouchableOpacity>

        {/* 3. Rear / Front Camera Facing Toggle */}
        <TouchableOpacity
          style={styles.utilityPill}
          onPress={handleCameraFlipPress}
          accessibilityLabel={`Camera pointing ${cameraFacing === 'back' ? 'outward to environment' : 'towards user'}. Tap to switch camera.`}
          accessibilityHint="Switches between rear environment camera and front self camera"
          accessibilityRole="button"
        >
          <RefreshCw size={iconSize} color="#FFFFFF" />
          <Text style={styles.utilityPillText}>FLIP</Text>
        </TouchableOpacity>

        {/* 4. Repeat Speech / Read Out Loud */}
        <TouchableOpacity
          style={styles.utilityPill}
          onPress={handleRepeatSpeechPress}
          accessibilityLabel="Repeat audio announcement out loud"
          accessibilityHint="Re-reads the last scene description or obstacle info"
          accessibilityRole="button"
        >
          <Volume2 size={iconSize} color="#FFFFFF" />
          <Text style={styles.utilityPillText}>REPEAT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  accessibleOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 25,
    paddingHorizontal: isNarrowScreen ? 8 : 14,
    paddingTop: Platform.OS === 'ios' ? 112 : (Platform.OS === 'android' ? 94 : 74),
  },
  topUtilityBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: isNarrowScreen ? 6 : 8,
  },
  utilityPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isNarrowScreen ? 4 : 6,
    height: isNarrowScreen ? 42 : 46,
    borderRadius: 23,
    backgroundColor: '#0284C7',
    paddingHorizontal: isNarrowScreen ? 4 : 6,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
  },
  utilityPillActiveTorch: {
    backgroundColor: '#F59E0B',
  },
  scanPill: {
    backgroundColor: '#0D9488',
    borderWidth: 1.5,
    borderColor: '#2DD4BF',
  },
  utilityPillText: {
    color: '#FFFFFF',
    fontSize: isNarrowScreen ? 10.5 : 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  utilityPillTextTorch: {
    color: '#FFFFFF',
  },
});
