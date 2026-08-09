import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Switch,
  PanResponder
} from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { 
  Check, 
  Bookmark,
  Eye,
  Sliders
} from 'lucide-react-native';
import { SUPPORTED_LANGUAGES_META } from '../../services/voiceAssistantBackend';

export const SectionViewPanel: React.FC = () => {
  const { 
    activeMode, 
    speechRate, 
    setSpeechRate, 
    spatialAudioEnabled, 
    toggleSpatialAudio,
    themeMode,
    setThemeMode,
    fontScale,
    setFontScale,
    activeLanguageCode,
    setActiveLanguageCode,
    setUserLanguage,
    setFamilyCompanionOpen,
    speak
  } = useNavidoorStore();

  const isPanelMode = ['settings', 'languages', 'history', 'family'].includes(activeMode);

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
        {/* SETTINGS SECTION (MINIMALIST & CLEAN) */}
        {activeMode === 'settings' && (
          <View style={styles.card}>
            {/* 1. SYSTEM & VOICE AUDIO SETTINGS */}
            <View style={styles.subSectionBox}>
              <View style={styles.subSectionHeader}>
                <Sliders size={18} color="#0284C7" />
                <Text style={styles.subSectionTitle}>SYSTEM & VOICE AUDIO</Text>
              </View>

              {/* Voice Speech Speed Control */}
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

              {/* Spatial Audio Toggle */}
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

              {/* Text Font Scaling */}
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

              {/* High Contrast Amber Theme Toggle */}
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
        )}

        {/* LANGUAGES SECTION */}
        {activeMode === 'languages' && (
          <View style={styles.card}>
            <View style={styles.langGrid}>
              {SUPPORTED_LANGUAGES_META.map((lang) => {
                const isActive = activeLanguageCode === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.langChip, isActive && styles.langChipActive]}
                    onPress={() => {
                      setActiveLanguageCode(lang.code);
                      setUserLanguage(lang.name);
                      speak(`Language ${lang.name}`);
                    }}
                    accessibilityLabel={`Set language to ${lang.name}`}
                  >
                    <Text style={{ fontSize: 20 }}>{lang.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.langName, isActive && styles.langNameActive]}>{lang.name}</Text>
                    </View>
                    {isActive && <Check size={18} color="#FFFFFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* HISTORY SECTION */}
        {activeMode === 'history' && (
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.historyItem}
              onPress={() => speak('Prescription scan: Lisinopril 10mg')}
            >
              <Bookmark size={18} color="#0284C7" />
              <View style={styles.historyTextGroup}>
                <Text style={styles.historyTitle}>Lisinopril 10mg Prescription</Text>
                <Text style={styles.historyTime}>Today • Medicine Mode</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.historyItem}
              onPress={() => speak('Bus 42 schedule: Arrives 5th Avenue stop')}
            >
              <Bookmark size={18} color="#0284C7" />
              <View style={styles.historyTextGroup}>
                <Text style={styles.historyTitle}>Bus 42 Schedule</Text>
                <Text style={styles.historyTime}>Yesterday • Transport Mode</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* FAMILY COMPANION SECTION */}
        {activeMode === 'family' && (
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.familyBtn}
              onPress={() => setFamilyCompanionOpen(true)}
            >
              <Text style={styles.familyBtnText}>CONNECT FAMILY ASSIST</Text>
            </TouchableOpacity>
          </View>
        )}
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
  langGrid: {
    gap: 10,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    padding: 14,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
  },
  langChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  langName: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 15,
  },
  langNameActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    padding: 14,
    borderRadius: 16,
    gap: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  historyTextGroup: {
    flex: 1,
  },
  historyTitle: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
  },
  historyTime: {
    color: '#334155',
    fontSize: 12,
    marginTop: 2,
  },
  familyBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    gap: 10,
  },
  familyBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
