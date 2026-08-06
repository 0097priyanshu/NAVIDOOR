import React from 'react';
import { StyleSheet, SafeAreaView, StatusBar } from 'react-native';
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

export default function App() {
  const { themeMode } = useNavidoorStore();
  const colors = getThemeColors(themeMode);

  return (
    <SafeAreaView style={[styles.rootContainer, { backgroundColor: colors.bgCard }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* 1. CONTINUOUS 75% CAMERA CANVAS / SOLID UTILITY BACKDROP */}
      <CameraViewCanvas />

      {/* 2. TOP STATUS HEADER (Uber SOS Emergency & User Profile) */}
      <CameraHeader />

      {/* 3. DEDICATED FULL SECTION PANELS (Settings, History, Languages, Accessibility, Family) */}
      <SectionViewPanel />

      {/* 4. SIGNATURE ROTATING AI MODE WHEEL & FIXED CENTER MIC (Voice-First Audio Guidance) */}
      <RotatingAIModeWheel />

      {/* 5. FIRST-TIME VOICE ONBOARDING SETUP MODAL */}
      <VoiceOnboardingModal />

      {/* 6. EMERGENCY SOS & REMOTE FAMILY COMPANION MODALS */}
      <SOSModal />
      <FamilyCompanionModal />
      <DesignSystemModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
});
