import React, { useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Text, 
  Dimensions, 
  PanResponder, 
  Animated 
} from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { FamilyHomeTab } from './FamilyHomeTab';
import { FamilyLocationTab } from './FamilyLocationTab';
import { FamilyActivityTab } from './FamilyActivityTab';
import { FamilyAlertsTab } from './FamilyAlertsTab';
import { FamilyProfileTab } from './FamilyProfileTab';
import { Home, MapPin, Activity, AlertTriangle, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
type TabType = 'home' | 'location' | 'activity' | 'alerts' | 'profile';

interface WheelItem {
  id: TabType;
  label: string;
  icon: (color: string) => React.ReactNode;
  isAlert?: boolean;
}

const FAMILY_WHEEL_ITEMS: WheelItem[] = [
  { id: 'home', label: 'HOME', icon: (color) => <Home size={22} color={color} /> },
  { id: 'location', label: 'LOCATION', icon: (color) => <MapPin size={22} color={color} /> },
  { id: 'activity', label: 'ACTIVITY', icon: (color) => <Activity size={22} color={color} /> },
  { id: 'alerts', label: 'ALERTS', icon: (color) => <AlertTriangle size={22} color={color} />, isAlert: true },
  { id: 'profile', label: 'PROFILE', icon: (color) => <User size={22} color={color} /> },
];

export const FamilyModeContainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const activeIndex = Math.max(0, FAMILY_WHEEL_ITEMS.findIndex((item) => item.id === activeTab));

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
  };

  const cycleNextTab = () => {
    triggerHaptic();
    const nextIdx = (activeIndex + 1) % FAMILY_WHEEL_ITEMS.length;
    setActiveTab(FAMILY_WHEEL_ITEMS[nextIdx].id);
  };

  const cyclePrevTab = () => {
    triggerHaptic();
    const prevIdx = (activeIndex - 1 + FAMILY_WHEEL_ITEMS.length) % FAMILY_WHEEL_ITEMS.length;
    setActiveTab(FAMILY_WHEEL_ITEMS[prevIdx].id);
  };

  // Full Screen Horizontal Swipe Handler
  const lastStepDx = useRef(0);
  const screenPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -20) {
          cycleNextTab();
        } else if (gestureState.dx > 20) {
          cyclePrevTab();
        }
      },
    })
  ).current;

  // Wheel Navbar Specific Swipe Handler
  const wheelPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderMove: (_, gestureState) => {
        const dx = gestureState.dx;
        const diff = dx - lastStepDx.current;
        if (Math.abs(diff) > 28) {
          if (diff < 0) {
            cycleNextTab();
          } else {
            cyclePrevTab();
          }
          lastStepDx.current = dx;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(lastStepDx.current) < 10) {
          if (gestureState.dx < -20) {
            cycleNextTab();
          } else if (gestureState.dx > 20) {
            cyclePrevTab();
          }
        }
        lastStepDx.current = 0;
      },
    })
  ).current;

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <FamilyHomeTab />;
      case 'location':
        return <FamilyLocationTab />;
      case 'activity':
        return <FamilyActivityTab />;
      case 'alerts':
        return <FamilyAlertsTab />;
      case 'profile':
        return <FamilyProfileTab />;
      default:
        return <FamilyHomeTab />;
    }
  };

  // Continuous 5-Item Wheel Arc Indices
  const visibleIndices: number[] = [];
  const total = FAMILY_WHEEL_ITEMS.length;
  for (let offset = -2; offset <= 2; offset++) {
    let idx = (activeIndex + offset) % total;
    if (idx < 0) idx += total;
    visibleIndices.push(idx);
  }

  return (
    <SafeAreaView 
      style={styles.container}
      {...screenPanResponder.panHandlers}
    >
      {/* Active Tab Content Area */}
      <View style={styles.screenContent}>
        {renderActiveTab()}
      </View>

      {/* Continuous Semi-Circle Arc Wheel Navbar */}
      <View style={styles.wheelRootContainer} pointerEvents="box-none">
        <View style={styles.bottomCurvedDock} {...wheelPanResponder.panHandlers}>
          {visibleIndices.map((idx, posIndex) => {
            const item = FAMILY_WHEEL_ITEMS[idx];
            const offset = posIndex - 2;
            const isActive = idx === activeIndex;

            // Semi-Circle Arc Geometry (1:1 with User Portal Wheel)
            const angle = (offset * Math.PI) / 6.2;
            const posX = Math.sin(angle) * 135;
            const posY = (1 - Math.cos(angle)) * 16;

            const scale = isActive ? 1.25 : offset === -1 || offset === 1 ? 0.95 : 0.78;
            const opacity = isActive ? 1.0 : offset === -1 || offset === 1 ? 0.88 : 0.58;

            const badgeBg = isActive 
              ? (item.isAlert ? '#E11D48' : '#0284C7') 
              : '#94A3B8';

            const iconColor = isActive ? '#FFFFFF' : '#0F172A';
            const labelColor = isActive ? (item.isAlert ? '#E11D48' : '#0284C7') : '#0F172A';

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
                  style={[styles.dockCircleIcon, { backgroundColor: badgeBg }]}
                  onPress={() => {
                    triggerHaptic();
                    setActiveTab(item.id);
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.label} tab`}
                >
                  {item.icon(iconColor)}
                </TouchableOpacity>

                <Text style={[styles.dockItemLabel, { color: labelColor, fontWeight: isActive ? '900' : '700' }]}>
                  {item.label}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#64748B',
  },
  screenContent: {
    flex: 1,
    paddingBottom: 95,
  },
  wheelRootContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bottomCurvedDock: {
    width: SCREEN_WIDTH - 14,
    height: 92,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    backgroundColor: '#CBD5E1', // High-clarity light slate background matching user portal dock
    borderWidth: 1.5,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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
  dockCircleIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dockItemLabel: {
    fontSize: 11.5,
    marginTop: 3,
    letterSpacing: 0.6,
  },
});
