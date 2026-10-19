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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    speak('Scanning surroundings...', true);
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
        {/* 1. Manual AI Vision Scan Button */}
        <TouchableOpacity
          style={[styles.utilityPill, styles.scanPill]}
          onPress={handleScanPress}
          accessibilityLabel="Scan surroundings for objects and obstacles"
          accessibilityHint="Scans the camera view and speaks detected objects out loud"
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
            {torchOn ? 'LIGHT' : 'LIGHT'}
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

        {/* 5. YOLO AI Vision Scan Button */}
        <TouchableOpacity
          style={[styles.utilityPill, styles.utilityPillYolo]}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            } catch (e) {}
            useNavidoorStore.getState().runLiveYoloScan();
          }}
          accessibilityLabel="Run YOLO AI Vision Scan"
          accessibilityHint="Scans the camera view for obstacles and announces distances"
          accessibilityRole="button"
        >
          <Camera size={iconSize} color="#FFFFFF" />
          <Text style={styles.utilityPillTextYolo}>{isNarrowScreen ? 'YOLO' : 'YOLO SCAN'}</Text>
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
    paddingTop: Platform.OS === 'ios' ? 56 : (Platform.OS === 'android' ? 48 : 36),
  },
  topUtilityBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: isNarrowScreen ? 4 : 6,
  },
  utilityPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isNarrowScreen ? 3 : 5,
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
  },
  utilityPillYolo: {
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#34D399',
  },
  utilityPillText: {
    color: '#FFFFFF',
    fontSize: isNarrowScreen ? 10 : 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  utilityPillTextTorch: {
    color: '#FFFFFF',
  },
  utilityPillTextYolo: {
    color: '#FFFFFF',
    fontSize: isNarrowScreen ? 10 : 10.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
