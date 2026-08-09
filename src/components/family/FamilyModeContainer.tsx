import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, Platform } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { FamilyHomeTab } from './FamilyHomeTab';
import { FamilyLocationTab } from './FamilyLocationTab';
import { FamilyActivityTab } from './FamilyActivityTab';
import { FamilyAlertsTab } from './FamilyAlertsTab';
import { FamilyProfileTab } from './FamilyProfileTab';
import { Home, MapPin, Activity, AlertTriangle, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

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

  // Determine if tab is disabled (e.g. if not connected to a Navidoor user, block access to details tabs)
  const isDetailsDisabled = familyConnectionStatus !== 'connected';

  return (
    <SafeAreaView style={styles.container}>
      {/* Active Screen Area */}
      <View style={styles.screenContent}>
        {renderActiveTab()}
      </View>

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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
});
