import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useNavidoorStore } from '../../../store/useNavidoorStore';
import { Sliders, Eye } from 'lucide-react-native';

export const SettingsPanel = () => {
  const { 
    speechRate, 
    setSpeechRate, 
    spatialAudioEnabled, 
    toggleSpatialAudio,
    themeMode,
    setThemeMode,
    fontScale,
    setFontScale,
    speak
  } = useNavidoorStore();

  return (
    <View style={styles.card}>
      {/* 1. SYSTEM & VOICE AUDIO SETTINGS */}
      <View style={styles.subSectionBox}>
        <View style={styles.subSectionHeader}>
          <Sliders size={18} color="#0284C7" />
          <Text style={styles.subSectionTitle}>SYSTEM & VOICE AUDIO</Text>
        </View>

        <View style={styles.settingItemColumn}>
          <Text style={styles.settingLabel}>Voice Speech Speed</Text>
          <View style={styles.rateBtnRow}>
            {[
              { label: '0.85x', val: 0.85 },
              { label: '1.0x', val: 1.0 },
              { label: '1.25x', val: 1.25 },
            ].map((item) => {
              const isActive = Math.abs(speechRate - item.val) < 0.05;
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.rateBtn, isActive && styles.rateBtnActive]}
                  onPress={() => {
                    setSpeechRate(item.val);
                    speak(`Speech rate ${item.label}`);
                  }}
                  accessibilityLabel={`Set speech speed to ${item.label}`}
                >
                  <Text style={[styles.rateBtnText, isActive && styles.rateBtnTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Spatial Audio Beeps</Text>
          <Switch 
            value={spatialAudioEnabled} 
            onValueChange={toggleSpatialAudio} 
            trackColor={{ false: '#94A3B8', true: '#0284C7' }}
          />
        </View>
      </View>

      {/* 2. ACCESSIBILITY PREFERENCES */}
      <View style={styles.accessibilitySubBox}>
        <View style={styles.subSectionHeader}>
          <Eye size={18} color="#0284C7" />
          <Text style={styles.subSectionTitle}>ACCESSIBILITY PREFERENCES</Text>
        </View>

        <View style={styles.settingItemColumn}>
          <Text style={styles.settingLabel}>Text Font Scaling</Text>
          <View style={styles.rateBtnRow}>
            {(['normal', 'large', 'extraLarge'] as const).map((scale) => {
              const isActive = fontScale === scale;
              return (
                <TouchableOpacity
                  key={scale}
                  style={[styles.rateBtn, isActive && styles.rateBtnActive]}
                  onPress={() => {
                    setFontScale(scale);
                    speak(`Font size ${scale}`);
                  }}
                >
                  <Text style={[styles.rateBtnText, isActive && styles.rateBtnTextActive]}>
                    {scale.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>High Contrast Theme</Text>
          <Switch 
            value={themeMode === 'highContrastAmber'} 
            onValueChange={(val) => setThemeMode(val ? 'highContrastAmber' : 'standard')} 
            trackColor={{ false: '#94A3B8', true: '#0284C7' }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#475569',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  subSectionBox: {
    marginBottom: 12,
  },
  accessibilitySubBox: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1.5,
    borderTopColor: '#94A3B8',
  },
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  subSectionTitle: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#94A3B8',
  },
  settingItemColumn: {
    paddingVertical: 8,
  },
  settingLabel: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  rateBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  rateBtn: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  rateBtnActive: {
    backgroundColor: '#0284C7',
  },
  rateBtnText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 13,
  },
  rateBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
