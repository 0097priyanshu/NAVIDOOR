import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { Sparkles, Eye, ShieldCheck, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export const RoleSelectionScreen: React.FC = () => {
  const { setUserRole, speak } = useNavidoorStore();

  const handleSelectRole = (role: 'navidoor_user' | 'family_member') => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    setUserRole(role);

    if (role === 'navidoor_user') {
      speak('Selected Navidoor User mode. Loading setup onboarding.');
    } else {
      speak('Selected Family Companion mode. Opening auth login.');
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#64748B" />
      
      <View style={styles.container}>
        {/* Logo and Brand */}
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Sparkles size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.brandName}>NAVIDOOR</Text>
          <Text style={styles.brandSub}>AI-Powered Mobility & Safety Platform</Text>
        </View>

        {/* Instructions */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome</Text>
          <Text style={styles.welcomeDesc}>Please choose how you will be using NAVIDOOR today.</Text>
        </View>

        {/* Role Options */}
        <View style={styles.optionsContainer}>
          {/* Option 1: NAVIDOOR User */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleSelectRole('navidoor_user')}
            activeOpacity={0.9}
            accessibilityLabel="Access as NAVIDOOR User. I need mobility assistance."
            accessibilityRole="button"
          >
            <View style={[styles.iconContainer, { backgroundColor: '#0284C7' }]}>
              <Eye size={28} color="#FFFFFF" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.roleTitle}>NAVIDOOR USER</Text>
              <Text style={styles.roleDesc}>I need real-time voice guidance, camera object detection, and navigation assist.</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Voice-First Access</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Option 2: Family Member */}
          <TouchableOpacity
            style={[styles.roleCard, styles.roleCardBorder]}
            onPress={() => handleSelectRole('family_member')}
            activeOpacity={0.9}
            accessibilityLabel="Access as Family Member or Caregiver. I want to monitor a user."
            accessibilityRole="button"
          >
            <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
              <Heart size={28} color="#FFFFFF" />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.roleTitle, { color: '#10B981' }]}>FAMILY MEMBER</Text>
              <Text style={styles.roleDesc}>I want to monitor live location, view activity history, and receive emergency alerts.</Text>
              <View style={[styles.badge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Text style={[styles.badgeText, { color: '#10B981' }]}>Companion Portal</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer Brand Verification */}
        <View style={styles.footer}>
          <ShieldCheck size={16} color="#94A3B8" />
          <Text style={styles.footerText}>Secure Link • Approved Consent Required</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#64748B', // Slate gray base backdrop
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  brandName: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
  },
  brandSub: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  welcomeTitle: {
    color: '#0F172A',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 8,
  },
  welcomeDesc: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  optionsContainer: {
    gap: 20,
    marginVertical: 20,
  },
  roleCard: {
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#475569',
    gap: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  roleCardBorder: {
    borderColor: '#10B981',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  roleTitle: {
    color: '#0284C7',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  roleDesc: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
});
