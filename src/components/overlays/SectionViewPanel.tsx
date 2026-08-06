import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { getThemeColors } from '../../theme/designSystem';
import { 
  Settings, 
  Clock, 
  Globe, 
  Eye, 
  Users, 
  Bookmark, 
  ShieldCheck,
  Check
} from 'lucide-react-native';

export const SectionViewPanel: React.FC = () => {
  const { 
    activeMode, 
    themeMode, 
    setThemeMode, 
    spatialAudioEnabled, 
    toggleSpatialAudio,
    speechRate,
    setSpeechRate,
    userLanguage,
    setUserLanguage,
    fontScale,
    setFontScale,
    setFamilyCompanionOpen,
    speak 
  } = useNavidoorStore();

  const colors = getThemeColors(themeMode);

  // Vision modes render simple floating overlays, utility modes render full dedicated section views
  const isUtilityMode = ['settings', 'history', 'languages', 'accessibility', 'family'].includes(activeMode);

  if (!isUtilityMode) return null;

  return (
    <View style={styles.sectionContainer} pointerEvents="auto">
      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* SETTINGS SECTION */}
        {activeMode === 'settings' && (
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Settings size={24} color="#FFFFFF" />
              <Text style={styles.sectionTitle}>SYSTEM SETTINGS</Text>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingLabel}>Spatial Audio Beeps</Text>
                <Text style={styles.settingSub}>Plays directional audio when obstacles are near</Text>
              </View>
              <Switch 
                value={spatialAudioEnabled} 
                onValueChange={toggleSpatialAudio} 
                trackColor={{ false: '#333333', true: '#05A357' }}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingLabel}>High Contrast Gold Theme</Text>
                <Text style={styles.settingSub}>Switch between Obsidian Black & Amber Gold</Text>
              </View>
              <Switch 
                value={themeMode === 'highContrastAmber'} 
                onValueChange={() => setThemeMode(themeMode === 'standard' ? 'highContrastAmber' : 'standard')} 
                trackColor={{ false: '#333333', true: '#FFD700' }}
              />
            </View>

            <View style={styles.settingItemColumn}>
              <Text style={styles.settingLabel}>Voice Speech Speed ({speechRate}x)</Text>
              <View style={styles.rateBtnRow}>
                {[1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <TouchableOpacity
                    key={rate}
                    style={[styles.rateBtn, speechRate === rate && styles.rateBtnActive]}
                    onPress={() => setSpeechRate(rate)}
                  >
                    <Text style={[styles.rateBtnText, speechRate === rate && styles.rateBtnTextActive]}>
                      {rate}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* HISTORY & SAVED LOGS SECTION */}
        {activeMode === 'history' && (
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Clock size={24} color="#FFFFFF" />
              <Text style={styles.sectionTitle}>HISTORY & SAVED TEXT LOGS</Text>
            </View>

            <TouchableOpacity 
              style={styles.historyItem}
              onPress={() => speak('Lisinopril prescription scanned today at 8:00 AM. 1 pill daily after breakfast.')}
            >
              <Bookmark size={18} color="#FFFFFF" />
              <View style={styles.historyTextGroup}>
                <Text style={styles.historyTitle}>Lisinopril 10mg Prescription</Text>
                <Text style={styles.historyTime}>Today • 8:00 AM • OCR Scan</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.historyItem}
              onPress={() => speak('Bus 42 Northbound schedule: Arrives every 12 minutes at 5th Avenue stop.')}
            >
              <Bookmark size={18} color="#FFFFFF" />
              <View style={styles.historyTextGroup}>
                <Text style={styles.historyTitle}>Bus 42 Schedule</Text>
                <Text style={styles.historyTime}>Yesterday • 4:15 PM • Transport</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* LANGUAGES SECTION */}
        {activeMode === 'languages' && (
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Globe size={24} color="#FFFFFF" />
              <Text style={styles.sectionTitle}>VOICE SYSTEM LANGUAGE</Text>
            </View>

            <View style={styles.langList}>
              {['English (US)', 'Spanish (Español)', 'French (Français)', 'Hindi (हिंदी)', 'German (Deutsch)'].map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.langItem, userLanguage.includes(lang.split(' ')[0]) && styles.langItemActive]}
                  onPress={() => {
                    setUserLanguage(lang);
                    speak(`Voice language set to ${lang}`);
                  }}
                >
                  <Globe size={18} color={userLanguage.includes(lang.split(' ')[0]) ? '#000000' : '#FFFFFF'} />
                  <Text style={[styles.langLabel, userLanguage.includes(lang.split(' ')[0]) && styles.langLabelActive]}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ACCESSIBILITY SECTION */}
        {activeMode === 'accessibility' && (
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Eye size={24} color="#FFFFFF" />
              <Text style={styles.sectionTitle}>ACCESSIBILITY STANDARDS</Text>
            </View>
            <Text style={styles.cardDesc}>
              NAVIDOOR is built to WCAG 2.1 AAA accessibility guidelines with minimum touch target sizes of 64px.
            </Text>

            <View style={styles.settingItemColumn}>
              <Text style={styles.settingLabel}>Text Font Scaling</Text>
              <View style={styles.rateBtnRow}>
                {(['normal', 'large', 'extraLarge'] as const).map((scale) => (
                  <TouchableOpacity
                    key={scale}
                    style={[styles.rateBtn, fontScale === scale && styles.rateBtnActive]}
                    onPress={() => setFontScale(scale)}
                  >
                    <Text style={[styles.rateBtnText, fontScale === scale && styles.rateBtnTextActive]}>
                      {scale.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* FAMILY COMPANION SECTION */}
        {activeMode === 'family' && (
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Users size={24} color="#05A357" />
              <Text style={styles.sectionTitle}>FAMILY REMOTE ASSIST</Text>
            </View>
            <Text style={styles.cardDesc}>
              Connect with your designated family members for remote video assistance and live location tracking.
            </Text>

            <TouchableOpacity 
              style={styles.familyBtn}
              onPress={() => setFamilyCompanionOpen(true)}
            >
              <Users size={20} color="#000000" />
              <Text style={styles.familyBtnText}>CONNECT TO SARAH JENKINS (LIVE STREAM)</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    position: 'absolute',
    top: 70,
    left: 14,
    right: 14,
    bottom: 215,
    zIndex: 22,
  },
  scrollArea: {
    flex: 1,
  },
  card: {
    backgroundColor: 'rgba(18, 18, 18, 0.96)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cardDesc: {
    color: '#A0A0A0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  settingItemColumn: {
    paddingVertical: 12,
  },
  settingTextGroup: {
    flex: 1,
    paddingRight: 12,
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  settingSub: {
    color: '#A0A0A0',
    fontSize: 12,
    marginTop: 2,
  },
  rateBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  rateBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  rateBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  rateBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  rateBtnTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
    borderRadius: 16,
    gap: 12,
    marginBottom: 10,
  },
  historyTextGroup: {
    flex: 1,
  },
  historyTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  historyTime: {
    color: '#A0A0A0',
    fontSize: 12,
    marginTop: 2,
  },
  langList: {
    gap: 8,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    borderRadius: 16,
    gap: 10,
  },
  langItemActive: {
    backgroundColor: '#FFFFFF',
  },
  langLabel: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  langLabelActive: {
    color: '#000000',
    fontWeight: '900',
  },
  familyBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    gap: 10,
  },
  familyBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
