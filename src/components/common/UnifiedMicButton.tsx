import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Mic, Loader2 } from 'lucide-react-native';
import { VoiceState } from '../../types';
import { COLORS } from '../../theme/designSystem';

interface UnifiedMicButtonProps {
  voiceState: VoiceState;
  onPress: () => void;
  showLabel?: boolean;
  size?: number;
  labelOverride?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const UnifiedMicButton: React.FC<UnifiedMicButtonProps> = ({
  voiceState,
  onPress,
  showLabel = true,
  size = 68,
  labelOverride,
  accessibilityLabel = 'Voice Assistant Microphone',
  accessibilityHint = 'Tap once to activate listening'
}) => {
  const isMicActive = voiceState === 'listening' || voiceState === 'thinking';
  
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // 1. Spinning Loader Animation for Thinking State
  useEffect(() => {
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

  // 2. Smooth Expanding Wave Pulse Animation for Active States
  useEffect(() => {
    if (isMicActive) {
      pulseAnim.setValue(0);
      const loop = Animated.loop(
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isMicActive]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const haloScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.25],
  });

  const haloOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.55, 0.2, 0],
  });

  const getLabelText = () => {
    if (labelOverride) return labelOverride;
    if (voiceState === 'listening') return 'LISTENING...';
    if (voiceState === 'thinking') return 'PROCESSING...';
    return 'TALK';
  };

  const iconSize = Math.round(size * 0.41);

  return (
    <View style={styles.container}>
      {/* CONCENTRIC ANIMATED CYAN PULSE AURA */}
      <View style={[styles.buttonWrapper, { width: size, height: size }]}>
        {isMicActive && (
          <Animated.View
            style={[
              styles.pulseCyanHalo,
              {
                borderRadius: (size + 16) / 2,
                transform: [{ scale: haloScale }],
                opacity: haloOpacity,
              }
            ]}
          />
        )}

        {/* FAB MIC BUTTON - ELECTRIC CYAN BACKGROUND WITH WHITE ICON */}
        <TouchableOpacity
          style={[
            styles.micFab,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: isMicActive ? '#38BDF8' : '#0284C7',
            }
          ]}
          onPress={onPress}
          activeOpacity={0.85}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityRole="button"
        >
          {voiceState === 'thinking' ? (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Loader2 size={iconSize} color="#FFFFFF" />
            </Animated.View>
          ) : (
            <Mic size={iconSize} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* CLEAN PURE WHITE TEXT LABEL BELOW BUTTON (NO BOXY CONTAINER) */}
      {showLabel && (
        <Text style={styles.labelSubtext}>
          {getLabelText()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCyanHalo: {
    position: 'absolute',
    top: -8,
    bottom: -8,
    left: -8,
    right: -8,
    backgroundColor: 'rgba(2, 132, 199, 0.35)',
    zIndex: 1,
  },
  micFab: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 2,
  },
  labelSubtext: {
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
});
