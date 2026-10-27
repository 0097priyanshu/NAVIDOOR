import React, { useRef, useEffect } from 'react';
import { StyleSheet, PanResponder, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
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

  // 1. Triple-Tap Anywhere on Screen Detection for Emergency SOS
  const tapHistoryRef = useRef<number[]>([]);
  const lastTapTimestampRef = useRef<number>(0);

  const handleGlobalScreenTap = (source: string = 'screen-tap'): boolean => {
    const now = Date.now();
    // Ignore rapid duplicate event emissions for the same physical tap (within 70ms)
    if (now - lastTapTimestampRef.current < 70) {
      return false;
    }
    lastTapTimestampRef.current = now;

    // Filter taps occurring within the 850ms rolling gesture window
    const recentTaps = tapHistoryRef.current.filter((t) => now - t < 850);
    recentTaps.push(now);
    tapHistoryRef.current = recentTaps;

    console.log(`[ScreenTap] Tap registered via ${source} (${recentTaps.length}/3 in 850ms)`);

    if (recentTaps.length >= 3) {
      tapHistoryRef.current = [];
      console.log(`[ScreenTap] 🚨 TRIPLE TAP CONFIRMED! Triggering Emergency SOS alert...`);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}

      const store = useNavidoorStore.getState();
      if (!store.isSosModalOpen) {
        store.triggerSosAlert();
      }
      return true; // Claim the 3rd tap so child controls under finger don't trigger accidental clicks
    }
    return false;
  };

  // 2. Web Pointer Event Listener for Mouse/Touch Clicks Anywhere on Screen
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handlePointerDown = (e: MouseEvent | TouchEvent) => {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        handleGlobalScreenTap('web-pointerdown');
      };
      window.addEventListener('pointerdown', handlePointerDown, { capture: true });
      return () => {
        window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      };
    }
  }, []);

  // 3. Full-Screen Horizontal Swipe Gesture Handler & Triple-Tap Interceptor
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        return handleGlobalScreenTap('panresponder-capture');
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // If user is swiping horizontally, cancel tap sequence so swipe isn't counted as taps
        if (Math.abs(gestureState.dx) > 15) {
          tapHistoryRef.current = [];
          return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        }
        return false;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -20) {
          // Swiped LEFT -> Move to NEXT section
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
      <SafeAreaView style={styles.rootContainer}>
        <StatusBar style="light" />

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
      <View style={styles.outerContainer} {...panResponder.panHandlers}>
        {renderContent()}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#64748B',
  },
  rootContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#64748B',
  },
});
