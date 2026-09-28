import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  PanResponder, 
  Animated, 
  Dimensions,
  Platform,
  Easing 
} from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { COLORS } from '../../theme/designSystem';
import { NavMode } from '../../types';
import * as Haptics from 'expo-haptics';
import { 
  Home, 
  Compass, 
  BookOpen, 
  Pill, 
  Bus, 
  Users, 
  Clock, 
  Settings, 
  Globe, 
  Eye,
  Mic,
  Loader2,
  Camera,
  MapPin,
  Phone,
  Activity
} from 'lucide-react-native';

import { voiceRecordingService } from '../../services/voiceRecordingService';
import { requestWhisperSTT } from '../../services/voiceAssistantBackend';
import { UnifiedMicButton } from '../common/UnifiedMicButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WheelItem {
  id: NavMode;
  label: string;
  icon: React.ReactNode;
}

const WHEEL_ITEMS: WheelItem[] = [
  { id: 'assist', label: 'ASSIST', icon: <Home size={22} color="#FFFFFF" /> },
  { id: 'navigate', label: 'NAVIGATE', icon: <Compass size={22} color="#FFFFFF" /> },
  { id: 'read', label: 'READ', icon: <BookOpen size={22} color="#FFFFFF" /> },
  { id: 'medicine', label: 'MEDICINE', icon: <Pill size={22} color="#FFFFFF" /> },
  { id: 'transport', label: 'TRANSIT', icon: <Bus size={22} color="#FFFFFF" /> },
  { id: 'location', label: 'LIVE LOC', icon: <MapPin size={22} color="#FFFFFF" /> },
  { id: 'emergency', label: 'CALL SOS', icon: <Phone size={22} color="#FFFFFF" /> },
  { id: 'medical', label: 'MEDICAL', icon: <Activity size={22} color="#FFFFFF" /> },
  { id: 'family', label: 'FAMILY', icon: <Users size={22} color="#FFFFFF" /> },
  { id: 'history', label: 'HISTORY', icon: <Clock size={22} color="#FFFFFF" /> },
  { id: 'languages', label: 'LANG', icon: <Globe size={22} color="#FFFFFF" /> },
  { id: 'settings', label: 'SETTINGS', icon: <Settings size={22} color="#FFFFFF" /> },
];

export const RotatingAIModeWheel: React.FC = () => {
  const { 
    activeMode, 
    rotateWheelToMode, 
    cycleNextMode,
    cyclePrevMode,
    voiceState, 
    setVoiceState, 
    speak, 
    stopVoice, 
    capturePhotoAndAnalyze,
    isProfileModalOpen,
    isFirstTimeUser,
    activeLanguageCode,
    processVoiceInput
  } = useNavidoorStore();

  const [activeIndex, setActiveIndex] = useState(
    Math.max(0, WHEEL_ITEMS.findIndex((item) => item.id === activeMode))
  );

  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  React.useEffect(() => {
    const idx = WHEEL_ITEMS.findIndex((item) => item.id === activeMode);
    if (idx !== -1) {
      setActiveIndex(idx);
      activeIndexRef.current = idx;
    }
  }, [activeMode]);

  const lastStepDx = useRef(0);

  const spinAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (voiceState === 'thinking') {
      spinAnim.setValue(0);
      const animation = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();

      return () => animation.stop();
    }
  }, [voiceState]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderMove: (_, gestureState) => {
        const dx = gestureState.dx;
        const diff = dx - lastStepDx.current;
        if (Math.abs(diff) > 28) {
          if (diff < 0) {
            cycleNextMode();
          } else {
            cyclePrevMode();
          }
          lastStepDx.current = dx;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(lastStepDx.current) < 10) {
          if (gestureState.dx < -20) {
            cycleNextMode();
          } else if (gestureState.dx > 20) {
            cyclePrevMode();
          }
        }
        lastStepDx.current = 0;
      },
    })
  ).current;

  const handleItemPress = (index: number) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setActiveIndex(index);
    rotateWheelToMode(WHEEL_ITEMS[index].id);
  };

  const handleMicPress = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    if (voiceState === 'listening') {
      setVoiceState('thinking');
      useNavidoorStore.setState({ lastAnnouncement: '⚙️ Processing your speech...' });
      
      const result = await voiceRecordingService.stopRecording();
      console.log('[Voice] Recording result:', {
        uri: result.uri,
        blobSize: result.blob?.size ?? 0,
        liveTranscript: result.liveTranscript,
      });

      let textToProcess = result.liveTranscript ? result.liveTranscript.trim() : '';

      if (!textToProcess && (result.blob || result.uri)) {
        console.log('[Voice] Sending recorded audio to Whisper:', {
          sourceUri: result.uri,
          hasBlob: !!result.blob,
        });

        const text = await requestWhisperSTT(
          result.blob,
          activeLanguageCode,
          result.uri || 'device_mic'
        );
        if (text) textToProcess = text.trim();
      }

      if (textToProcess) {
        console.log(`[Voice] Recognized speech: "${textToProcess}". Processing...`);
        await processVoiceInput(textToProcess);
      } else {
        console.log('[Voice] No speech text recognized.');
        setVoiceState('idle');
        speak('I did not catch that. Tap the mic button to try speaking again.');
      }
    } else {
      stopVoice();
      setVoiceState('listening');
      useNavidoorStore.setState({ lastAnnouncement: '🎤 Listening... Speak now.' });
      console.log('[RotatingAIModeWheel] Starting voice recording...');
      
      await voiceRecordingService.startRecording(activeLanguageCode, async (autoText) => {
        if (autoText && autoText.trim()) {
          console.log(`[RotatingAIModeWheel] Live auto-transcript received: "${autoText.trim()}"`);
          setVoiceState('thinking');
          await processVoiceInput(autoText.trim());
        }
      });
    }
  };

  const handlePhotoSnapPress = async () => {
    await capturePhotoAndAnalyze();
  };

  const visibleIndices: number[] = [];
  const total = WHEEL_ITEMS.length;
  for (let offset = -2; offset <= 2; offset++) {
    let idx = (activeIndex + offset) % total;
    if (idx < 0) idx += total;
    visibleIndices.push(idx);
  }

  const isMicActive = voiceState === 'listening' || voiceState === 'thinking';

  if (isFirstTimeUser) return null;

  const isVisionMode = ['assist', 'navigate', 'read', 'medicine', 'transport'].includes(activeMode);

  return (
    <View style={styles.wheelRootContainer} pointerEvents="box-none">
      {/* 1. DUAL / SINGLE PRIMARY ACTION DOCK - CLEAN ELECTRIC CYAN BUTTONS */}
      {!isProfileModalOpen && (
        <View 
          style={[
            styles.dualActionDockContainer,
            !isVisionMode && { justifyContent: 'center' }
          ]} 
          pointerEvents="box-none"
        >
          {/* Voice Assistant Mic FAB */}
          <View style={styles.actionItemCol}>
            <UnifiedMicButton
              voiceState={voiceState}
              onPress={handleMicPress}
              showLabel={true}
              size={68}
            />
          </View>

          {/* Click Picture Shutter FAB - ONLY VISIBLE IN VISION/CAMERA MODES */}
          {isVisionMode && (
            <View style={styles.actionItemCol}>
              <TouchableOpacity
                style={styles.shutterFabUberTheme}
                onPress={handlePhotoSnapPress}
                activeOpacity={0.85}
                accessibilityLabel="Click Picture to Read or Scan"
                accessibilityHint="Takes a photo snapshot and reads text or describes surroundings out loud"
                accessibilityRole="button"
              >
                <Camera size={28} color="#FFFFFF" />
              </TouchableOpacity>
              
              {/* CLEAN PURE WHITE TEXT LABEL BELOW BUTTON */}
              <Text style={styles.shutterLabelSubtext}>SNAP PHOTO</Text>
            </View>
          )}
        </View>
      )}

      {/* 2. HIGH-CLARITY GRAY AI MODE WHEEL NAVBAR DOCK */}
      <View style={styles.bottomCurvedDock} {...panResponder.panHandlers}>
        {visibleIndices.map((idx, posIndex) => {
          const item = WHEEL_ITEMS[idx];
          const offset = posIndex - 2;
          const isActive = idx === activeIndex;

          const angle = (offset * Math.PI) / 6.2;
          const posX = Math.sin(angle) * 140;
          const posY = (1 - Math.cos(angle)) * 16;

          const scale = isActive ? 1.25 : offset === -1 || offset === 1 ? 0.95 : 0.78;
          const opacity = isActive ? 1.0 : offset === -1 || offset === 1 ? 0.88 : 0.55;

          return (
            <Animated.View
              key={`${item.id}-${idx}`}
              style={[
                styles.dockItemWrapper,
                {
                  transform: [
                    { translateX: posX },
                    { translateY: posY },
                    { scale: scale },
                  ],
                  opacity: opacity,
                  zIndex: isActive ? 15 : 5 - Math.abs(offset),
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.dockItem,
                  { 
                    backgroundColor: isActive ? '#0284C7' : '#94A3B8',
                  },
                ]}
                onPress={() => handleItemPress(idx)}
                accessibilityRole="button"
                accessibilityLabel={`${item.label} mode selected`}
              >
                {React.cloneElement(item.icon as React.ReactElement, {
                  color: isActive ? '#FFFFFF' : '#0F172A',
                })}
              </TouchableOpacity>

              <Text style={[
                styles.itemLabel, 
                { 
                  color: isActive ? '#0284C7' : '#0F172A', 
                  fontWeight: isActive ? '900' : '700' 
                }
              ]}>
                {item.label}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wheelRootContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 230,
    zIndex: 35,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  dualActionDockContainer: {
    position: 'absolute',
    bottom: 112,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 99,
  },
  actionItemCol: {
    alignItems: 'center',
  },
  shutterFabUberTheme: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  shutterLabelSubtext: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: 1.0,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomCurvedDock: {
    width: '96%',
    maxWidth: 600,
    height: 92,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    backgroundColor: '#CBD5E1',
    borderWidth: 1.5,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    paddingBottom: 6,
  },
  dockItemWrapper: {
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  dockItem: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  itemLabel: {
    fontSize: 11.5,
    marginTop: 3,
    letterSpacing: 0.6,
  },
});
