import React, { useRef } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, PanResponder, Dimensions } from 'react-native';
import { useNavidoorStore } from './src/store/useNavidoorStore';
import { getThemeColors } from './src/theme/designSystem';
import { CameraViewCanvas } from './src/components/camera/CameraViewCanvas';
import { CameraHeader } from './src/components/header/CameraHeader';
import { RotatingAIModeWheel } from './src/components/navigation/RotatingAIModeWheel';
import { SectionViewPanel } from './src/components/overlays/SectionViewPanel';
import { VoiceOnboardingModal } from './src/components/onboarding/VoiceOnboardingModal';
import { SOSModal } from './src/components/sos/SOSModal';
import { FamilyCompanionModal } from './src/components/family/FamilyCompanionModal';
import { DesignSystemModal } from './src/components/designSystem/DesignSystemModal';
import { CapturedPhotoPreviewModal } from './src/components/camera/CapturedPhotoPreviewModal';
import { SectionToastNotification } from './src/components/overlays/SectionToastNotification';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function App() {
  const { themeMode, cycleNextMode, cyclePrevMode } = useNavidoorStore();
  const colors = getThemeColors(themeMode);

  // WhatsApp / Instagram-style Full-Screen Horizontal Swipe Gesture Handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // Intercept horizontal swipe gesture unconditionally across entire screen and navbar (dx > 15px & dx > dy)
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -20) {
          // Swiped LEFT -> Move to NEXT section (like Instagram Stories / WhatsApp tabs)
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch (e) {}
          cycleNextMode();
        } else if (gestureState.dx > 20) {
          // Swiped RIGHT -> Move to PREVIOUS section
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch (e) {}
          cyclePrevMode();
        }
      },
    })
  ).current;

  return (
    <SafeAreaView 
      style={[styles.rootContainer, { backgroundColor: '#64748B' }]}
      {...panResponder.panHandlers}
    >
      <StatusBar barStyle="light-content" backgroundColor="#64748B" />

      {/* 1. CONTINUOUS CAMERA CANVAS / SOLID SLATE GRAY UTILITY BACKDROP */}
      <CameraViewCanvas />

      {/* 2. TOP STATUS HEADER (Uber SOS Emergency & User Profile) */}
      <CameraHeader />

      {/* 3. DEDICATED FULL SECTION PANELS (Settings, History, Languages, Accessibility, Family) */}
      <SectionViewPanel />

      {/* 4. SIGNATURE ROTATING AI MODE WHEEL & FIXED CENTER MIC (Voice-First Audio Guidance) */}
      <RotatingAIModeWheel />

      {/* 5. SLOW FADING SECTION CHANGE TOAST NOTIFICATION POPUP */}
      <SectionToastNotification />

      {/* 6. FIRST-TIME VOICE ONBOARDING SETUP MODAL */}
      <VoiceOnboardingModal />

      {/* 7. EMERGENCY SOS & REMOTE FAMILY COMPANION MODALS */}
      <SOSModal />
      <FamilyCompanionModal />
      <DesignSystemModal />
      <CapturedPhotoPreviewModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#64748B',
  },
});
