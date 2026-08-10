import React from 'react';
import { View, Text, StyleSheet, ScrollView, PanResponder } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';

// Import all modular panels
import { SettingsPanel } from './panels/SettingsPanel';
import { EmergencyPanel } from './panels/EmergencyPanel';
import { LanguagesPanel } from './panels/LanguagesPanel';
import { HistoryPanel } from './panels/HistoryPanel';
import { FamilyPanel } from './panels/FamilyPanel';
import { LocationPanel } from './panels/LocationPanel';
import { MedicalInfoPanel } from './panels/MedicalInfoPanel';

export const SectionViewPanel: React.FC = () => {
  const { activeMode } = useNavidoorStore();

  const isPanelMode = ['settings', 'languages', 'history', 'family', 'location', 'emergency', 'medical'].includes(activeMode);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -20) {
          useNavidoorStore.getState().cycleNextMode();
        } else if (gestureState.dx > 20) {
          useNavidoorStore.getState().cyclePrevMode();
        }
      },
    })
  ).current;

  if (!isPanelMode) return null;

  return (
    <View style={styles.panelContainer} {...panResponder.panHandlers}>
      {/* Centered Top Header Bar */}
      <View style={styles.topHeaderBar}>
        <Text style={styles.topHeaderTag}>{activeMode.toUpperCase()} PANEL</Text>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {activeMode === 'settings' && <SettingsPanel />}
        {activeMode === 'emergency' && <EmergencyPanel />}
        {activeMode === 'medical' && <MedicalInfoPanel />}
        {activeMode === 'languages' && <LanguagesPanel />}
        {activeMode === 'history' && <HistoryPanel />}
        {activeMode === 'location' && <LocationPanel />}
        {activeMode === 'family' && <FamilyPanel />}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  panelContainer: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    bottom: 210,
    zIndex: 40,
  },
  topHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  topHeaderTag: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  scrollArea: {
    flex: 1,
  },
});
