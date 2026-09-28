import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useNavidoorStore } from '../../../store/useNavidoorStore';
import { SUPPORTED_LANGUAGES_META } from '../../../services/voiceAssistantBackend';

export const LanguagesPanel = () => {
  const { 
    activeLanguageCode, 
    setActiveLanguageCode, 
    setUserLanguage, 
    speak 
  } = useNavidoorStore();

  return (
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
});
