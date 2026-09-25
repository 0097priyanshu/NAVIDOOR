import React, { useRef } from 'react';
import { StyleSheet, StatusBar, PanResponder, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useNavidoorStore } from './src/store/useNavidoorStore';
import { CameraViewCanvas } from './src/components/camera/CameraViewCanvas';
import { CameraHeader } from './src/components/header/CameraHeader';
import { RotatingAIModeWheel } from './src/components/navigation/RotatingAIModeWheel';
import { SectionViewPanel } from './src/components/overlays/SectionViewPanel';
import { VoiceOnboardingModal } from './src/components/onboarding/VoiceOnboardingModal';
import { SOSModal } from './src/components/sos/SOSModal';
import { FamilyCompanionModal } from './src/components/family/FamilyCompanionModal';
import { DesignSystemModal } from './src/components/designSystem/DesignSystemModal';
import { SectionToastNotification } from './src/components/overlays/SectionToastNotification';
import { RoleSelectionScreen } from './src/components/onboarding/RoleSelectionScreen';
import { FamilyAuthScreen } from './src/components/family/FamilyAuthScreen';
import { FamilyModeContainer } from './src/components/family/FamilyModeContainer';
import { FamilyRequestReceivedModal } from './src/components/family/FamilyRequestReceivedModal';
import * as Haptics from 'expo-haptics';

export default function App() {
  const { cycleNextMode, cyclePrevMode, userRole, familyUser } = useNavidoorStore();

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

  const renderContent = () => {
    // 1. Role Selection Screen (App Launch)
    if (userRole === 'undecided') {
      return <RoleSelectionScreen />;
    }

    // 2. Family Caregiver Mode Experience
    if (userRole === 'family_member') {
      if (!familyUser) {
        return <FamilyAuthScreen />;
      }
      return <FamilyModeContainer />;
    }

    // 3. Existing NAVIDOOR User Experience (role === 'navidoor_user')
    return (
      <SafeAreaView 
        style={styles.rootContainer}
        {...panResponder.panHandlers}
      >
        <StatusBar barStyle="light-content" backgroundColor="#64748B" />

        {/* 1. CONTINUOUS CAMERA CANVAS / SOLID SLATE GRAY UTILITY BACKDROP */}
        <CameraViewCanvas />

        {/* 2. TOP STATUS HEADER (Uber SOS Emergency & User Profile) */}
        <CameraHeader />

        {/* 3. DEDICATED FULL SECTION PANELS (Settings, History, Languages, Family) */}
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

        {/* Real-time family caregiver connection request approval popup */}
        <FamilyRequestReceivedModal />
      </SafeAreaView>
    );
  };

  return (
    <SafeAreaProvider>
      {renderContent()}
    </SafeAreaProvider>
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
