import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
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
  ShieldAlert
} from 'lucide-react-native';
import { NavMode } from '../../types';

interface SectionMeta {
  title: string;
  icon: React.ReactNode;
}

const SECTION_DETAILS: Record<NavMode, SectionMeta> = {
  assist: {
    title: 'AI VISION ASSIST',
    icon: <Home size={44} color="#FFFFFF" />,
  },
  navigate: {
    title: 'SPATIAL NAVIGATION',
    icon: <Compass size={44} color="#FFFFFF" />,
  },
  read: {
    title: 'READ & OCR SCANNER',
    icon: <BookOpen size={44} color="#FFFFFF" />,
  },
  medicine: {
    title: 'MEDICINE DOSAGE SCAN',
    icon: <Pill size={44} color="#FFFFFF" />,
  },
  transport: {
    title: 'PUBLIC TRANSIT ASSIST',
    icon: <Bus size={44} color="#FFFFFF" />,
  },
  emergency: {
    title: 'EMERGENCY SOS',
    icon: <ShieldAlert size={44} color="#FFFFFF" />,
  },
  family: {
    title: 'FAMILY REMOTE ASSIST',
    icon: <Users size={44} color="#FFFFFF" />,
  },
  history: {
    title: 'SCAN HISTORY & LOGS',
    icon: <Clock size={44} color="#FFFFFF" />,
  },
  languages: {
    title: 'VOICE LANGUAGE SELECT',
    icon: <Globe size={44} color="#FFFFFF" />,
  },
  settings: {
    title: 'SYSTEM SETTINGS',
    icon: <Settings size={44} color="#FFFFFF" />,
  },
  location: {
    title: 'LIVE LOCATION & GPS',
    icon: <Compass size={44} color="#FFFFFF" />,
  },
  medical: {
    title: 'MEDICAL & PRESCRIPTION',
    icon: <Pill size={44} color="#FFFFFF" />,
  },
};

export const SectionToastNotification: React.FC = () => {
  const { activeMode, isFirstTimeUser } = useNavidoorStore();
  const [currentMode, setCurrentMode] = useState<NavMode>(activeMode);
  
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.75)).current;

  useEffect(() => {
    if (isFirstTimeUser) return;

    setCurrentMode(activeMode);

    // Reset animation values: Fully Transparent (0.0) and scaled down (0.75)
    opacityAnim.setValue(0);
    scaleAnim.setValue(0.75);

    // 1. Quick, crisp Fade-In from Transparent -> Fully Visible (300ms) with scale up (0.8 -> 1.05)
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Hold in middle for 1.8 seconds (~2s total duration), then quickly Fade-Out (400ms)
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }, 1800);

    return () => clearTimeout(timer);
  }, [activeMode, isFirstTimeUser]);

  if (isFirstTimeUser) return null;

  const info = SECTION_DETAILS[currentMode] || SECTION_DETAILS.assist;

  return (
    <Animated.View 
      style={[
        styles.centerOverlayContainer, 
        { 
          opacity: opacityAnim,
        }
      ]} 
      pointerEvents="none"
    >
      <Animated.View 
        style={[
          styles.circularBadgeWrapper, 
          { 
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        {/* CENTER CIRCULAR ICON BUTTON BADGE */}
        <View style={styles.circularIconBadge}>
          {info.icon}
        </View>

        {/* SECTION TITLE TAG BELOW CIRCULAR ICON */}
        <View style={styles.sectionTitleCard}>
          <Text style={styles.sectionTitleText}>{info.title}</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  centerOverlayContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 90,
  },
  circularBadgeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularIconBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0284C7',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 16,
  },
  sectionTitleCard: {
    backgroundColor: '#CBD5E1',
    borderWidth: 1.5,
    borderColor: '#64748B',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    marginTop: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionTitleText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
});
