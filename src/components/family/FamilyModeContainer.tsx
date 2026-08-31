<<<<<<< HEAD
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
=======
import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, Platform } from 'react-native';
>>>>>>> f6cb03da232ceddd3f6832afcb9fe8ca606ddd31
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { FamilyHomeTab } from './FamilyHomeTab';
import { FamilyLocationTab } from './FamilyLocationTab';
import { FamilyActivityTab } from './FamilyActivityTab';
import { FamilyAlertsTab } from './FamilyAlertsTab';
import { FamilyProfileTab } from './FamilyProfileTab';
import { Home, MapPin, Activity, AlertTriangle, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

<<<<<<< HEAD
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

=======
type TabType = 'home' | 'location' | 'activity' | 'alerts' | 'profile';

export const FamilyModeContainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const { familyConnectedUserPhone, familyConnectionStatus } = useNavidoorStore();

  const triggerHaptic = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
  };

  const handleTabPress = (tab: TabType) => {
    triggerHaptic();
    setActiveTab(tab);
  };

>>>>>>> f6cb03da232ceddd3f6832afcb9fe8ca606ddd31
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

<<<<<<< HEAD
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
=======
  // Determine if tab is disabled (e.g. if not connected to a Navidoor user, block access to details tabs)
  const isDetailsDisabled = familyConnectionStatus !== 'connected';

  return (
    <SafeAreaView style={styles.container}>
      {/* Active Screen Area */}
>>>>>>> f6cb03da232ceddd3f6832afcb9fe8ca606ddd31
      <View style={styles.screenContent}>
        {renderActiveTab()}
      </View>

<<<<<<< HEAD
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
=======
      {/* Premium Bottom Tab Navigation Bar */}
      <View style={styles.tabBar}>
        {/* Tab 1: Home */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => handleTabPress('home')}
          accessibilityLabel="Home Tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'home' }}
        >
          <Home size={22} color={activeTab === 'home' ? '#0284C7' : '#94A3B8'} />
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        {/* Tab 2: Location */}
        <TouchableOpacity
          style={[styles.tabItem, isDetailsDisabled && styles.tabItemDisabled]}
          onPress={() => !isDetailsDisabled && handleTabPress('location')}
          disabled={isDetailsDisabled}
          accessibilityLabel="Live Location Tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'location' }}
        >
          <MapPin size={22} color={activeTab === 'location' ? '#0284C7' : isDetailsDisabled ? '#475569' : '#94A3B8'} />
          <Text style={[
            styles.tabLabel, 
            activeTab === 'location' && styles.tabLabelActive,
            isDetailsDisabled && styles.tabLabelDisabled
          ]}>Location</Text>
        </TouchableOpacity>

        {/* Tab 3: Activity */}
        <TouchableOpacity
          style={[styles.tabItem, isDetailsDisabled && styles.tabItemDisabled]}
          onPress={() => !isDetailsDisabled && handleTabPress('activity')}
          disabled={isDetailsDisabled}
          accessibilityLabel="Activity and Journeys Tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'activity' }}
        >
          <Activity size={22} color={activeTab === 'activity' ? '#0284C7' : isDetailsDisabled ? '#475569' : '#94A3B8'} />
          <Text style={[
            styles.tabLabel, 
            activeTab === 'activity' && styles.tabLabelActive,
            isDetailsDisabled && styles.tabLabelDisabled
          ]}>Activity</Text>
        </TouchableOpacity>

        {/* Tab 4: Alerts */}
        <TouchableOpacity
          style={[styles.tabItem, isDetailsDisabled && styles.tabItemDisabled]}
          onPress={() => !isDetailsDisabled && handleTabPress('alerts')}
          disabled={isDetailsDisabled}
          accessibilityLabel="Emergency Alerts Tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'alerts' }}
        >
          <AlertTriangle size={22} color={activeTab === 'alerts' ? '#E11D48' : isDetailsDisabled ? '#475569' : '#94A3B8'} />
          <Text style={[
            styles.tabLabel, 
            activeTab === 'alerts' && styles.tabLabelActiveAlert,
            isDetailsDisabled && styles.tabLabelDisabled
          ]}>Alerts</Text>
        </TouchableOpacity>

        {/* Tab 5: Profile */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => handleTabPress('profile')}
          accessibilityLabel="Profile and Users Tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'profile' }}
        >
          <User size={22} color={activeTab === 'profile' ? '#0284C7' : '#94A3B8'} />
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profile</Text>
        </TouchableOpacity>
>>>>>>> f6cb03da232ceddd3f6832afcb9fe8ca606ddd31
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
<<<<<<< HEAD
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
=======
    backgroundColor: '#64748B', // Slate gray background
  },
  screenContent: {
    flex: 1,
    marginBottom: Platform.OS === 'ios' ? 0 : 4,
  },
  tabBar: {
    flexDirection: 'row',
    height: 72,
    backgroundColor: '#0F172A', // Deep dark slate background
    borderTopWidth: 1.5,
    borderTopColor: '#334155',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 12 : 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  tabItemDisabled: {
    opacity: 0.4,
  },
  tabLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: '#0284C7',
    fontWeight: '900',
  },
  tabLabelActiveAlert: {
    color: '#E11D48',
    fontWeight: '900',
  },
  tabLabelDisabled: {
    color: '#475569',
>>>>>>> f6cb03da232ceddd3f6832afcb9fe8ca606ddd31
  },
});
