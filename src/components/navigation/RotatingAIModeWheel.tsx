import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  PanResponder, 
  Animated, 
  Dimensions 
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
  Camera
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WheelItem {
  id: NavMode;
  label: string;
  icon: React.ReactNode;
}

const WHEEL_ITEMS: WheelItem[] = [
  { id: 'assist', label: 'Assist', icon: <Home size={22} /> },
  { id: 'navigate', label: 'Guide', icon: <Compass size={22} /> },
  { id: 'read', label: 'Read', icon: <BookOpen size={22} /> },
  { id: 'medicine', label: 'Medicine', icon: <Pill size={22} /> },
  { id: 'transport', label: 'Transit', icon: <Bus size={22} /> },
  { id: 'family', label: 'Family', icon: <Users size={22} /> },
  { id: 'history', label: 'History', icon: <Clock size={22} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={22} /> },
  { id: 'languages', label: 'Lang', icon: <Globe size={22} /> },
  { id: 'accessibility', label: 'Access', icon: <Eye size={22} /> },
];

export const RotatingAIModeWheel: React.FC = () => {
  const { 
    activeMode, 
    rotateWheelToMode, 
    voiceState, 
    setVoiceState, 
    speak, 
    stopVoice, 
    generateSceneDescription, 
    isProfileModalOpen 
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

  const handleStep = (step: number) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}

    const curr = activeIndexRef.current;
    let nextIdx = (curr + step) % WHEEL_ITEMS.length;
    if (nextIdx < 0) nextIdx += WHEEL_ITEMS.length;
    
    activeIndexRef.current = nextIdx;
    setActiveIndex(nextIdx);
    rotateWheelToMode(WHEEL_ITEMS[nextIdx].id);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderGrant: () => {
        lastStepDx.current = 0;
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {}
      },
      onPanResponderMove: (_, gestureState) => {
        const delta = gestureState.dx - lastStepDx.current;
        if (delta > 25) {
          handleStep(-1);
          lastStepDx.current = gestureState.dx;
        } else if (delta < -25) {
          handleStep(1);
          lastStepDx.current = gestureState.dx;
        }
      },
      onPanResponderRelease: () => {
        lastStepDx.current = 0;
      },
    })
  ).current;

  const handleItemPress = (index: number) => {
    setActiveIndex(index);
    rotateWheelToMode(WHEEL_ITEMS[index].id);
  };

  const handleMicPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    if (voiceState === 'listening') {
      setVoiceState('thinking');
      setTimeout(() => {
        setVoiceState('speaking');
        generateSceneDescription();
      }, 750);
    } else if (voiceState === 'speaking') {
      stopVoice();
    } else {
      setVoiceState('listening');
      speak('Listening. Speak your question or command.', true);
    }
  };

  const handlePhotoSnapPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}

    speak('Photo taken. Reading text and scanning surroundings out loud...', true);
    setTimeout(() => {
      generateSceneDescription();
    }, 600);
  };

  const visibleIndices: number[] = [];
  const total = WHEEL_ITEMS.length;
  for (let offset = -2; offset <= 2; offset++) {
    let idx = (activeIndex + offset) % total;
    if (idx < 0) idx += total;
    visibleIndices.push(idx);
  }

  const isMicActive = voiceState !== 'idle';

  return (
    <View style={styles.wheelRootContainer} pointerEvents="box-none">
      {/* 1. DUAL PRIMARY ACTION DOCK - ENHANCED 66px ACCESSIBLE BUTTONS */}
      {!isProfileModalOpen && (
        <View style={styles.dualActionDockContainer} pointerEvents="box-none">
          {/* Left Action: Voice Assistant Mic FAB */}
          <View style={styles.actionItemCol}>
            {isMicActive && <View style={styles.pulseGreen} />}
            <TouchableOpacity
              style={[
                styles.actionFab,
                { 
                  backgroundColor: isMicActive ? COLORS.uberSafetyGreen : '#FFFFFF', 
                  borderColor: isMicActive ? COLORS.uberSafetyGreen : 'rgba(255, 255, 255, 0.4)' 
                }
              ]}
              onPress={handleMicPress}
              accessibilityLabel={`Voice Assistant (${voiceState})`}
              accessibilityHint="Tap to speak or issue voice commands"
              accessibilityRole="button"
            >
              {voiceState === 'thinking' ? (
                <Loader2 size={26} color="#000000" />
              ) : (
                <Mic size={26} color={isMicActive ? '#FFFFFF' : '#000000'} />
              )}
            </TouchableOpacity>
            <Text style={styles.actionLabelText}>
              {voiceState === 'idle' ? 'TALK / ASK' : voiceState.toUpperCase()}
            </Text>
          </View>

          {/* Right Action: Click Picture Shutter FAB (Matching 66px size, Crisp White) */}
          <View style={styles.actionItemCol}>
            <TouchableOpacity
              style={[styles.actionFab, styles.shutterFabUberTheme]}
              onPress={handlePhotoSnapPress}
              accessibilityLabel="Click Picture to Read or Scan"
              accessibilityHint="Takes a photo snapshot and reads text or describes surroundings out loud"
              accessibilityRole="button"
            >
              <Camera size={26} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.actionLabelText}>CLICK PHOTO</Text>
          </View>
        </View>
      )}

      {/* 2. ENHANCED HIGH-CLARITY AI MODE WHEEL NAVBAR DOCK */}
      <View style={styles.bottomCurvedDock} {...panResponder.panHandlers}>
        {visibleIndices.map((idx, posIndex) => {
          const item = WHEEL_ITEMS[idx];
          const offset = posIndex - 2;
          const isActive = idx === activeIndex;

          const angle = (offset * Math.PI) / 6.2;
          const posX = Math.sin(angle) * 140;
          const posY = (1 - Math.cos(angle)) * 16;

          const scale = isActive ? 1.25 : offset === -1 || offset === 1 ? 0.95 : 0.78;
          const opacity = isActive ? 1.0 : offset === -1 || offset === 1 ? 0.88 : 0.5;

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
                    backgroundColor: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)',
                    borderColor: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.25)',
                  },
                ]}
                onPress={() => handleItemPress(idx)}
                accessibilityRole="button"
                accessibilityLabel={`${item.label} mode selected`}
              >
                {React.cloneElement(item.icon as React.ReactElement, {
                  color: isActive ? '#000000' : '#FFFFFF',
                })}
              </TouchableOpacity>

              <Text style={[
                styles.itemLabel, 
                { 
                  color: isActive ? '#FFFFFF' : '#D1D5DB', 
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
    bottom: 104,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 50,
  },
  actionItemCol: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseGreen: {
    position: 'absolute',
    top: -4,
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(5, 163, 87, 0.35)',
  },
  actionFab: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 14,
  },
  shutterFabUberTheme: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  actionLabelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: 0.6,
    backgroundColor: 'rgba(18, 18, 18, 0.96)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  bottomCurvedDock: {
    width: SCREEN_WIDTH - 14,
    height: 92,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    backgroundColor: 'rgba(18, 18, 18, 0.96)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 16,
    paddingBottom: 6,
  },
  dockItemWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  dockItem: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  itemLabel: {
    fontSize: 11.5,
    marginTop: 3,
    letterSpacing: 0.6,
  },
});
