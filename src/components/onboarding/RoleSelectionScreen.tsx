import React from 'react';

import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { Sparkles, Eye, ShieldCheck, Heart, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export const RoleSelectionScreen: React.FC = () => {
  const { setUserRole, setIsFirstTimeUser, speak } = useNavidoorStore();

import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { Sparkles, Eye, ShieldCheck, Heart, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export const RoleSelectionScreen: React.FC = () => {
  const { setUserRole, speak, triggerSosAlert } = useNavidoorStore();


  const handleSelectRole = (role: 'navidoor_user' | 'family_member') => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    setUserRole(role);

    if (role === 'navidoor_user') {

      setIsFirstTimeUser(true);
      speak('Selected Navidoor User mode. Loading setup onboarding.');
    } else {
      setIsFirstTimeUser(false);

      speak('Selected Navidoor User mode. Loading setup onboarding.');
    } else {
      speak('Selected Family Companion mode. Opening auth login.');

    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#64748B" />
      

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top-Left Brand Header */}
        <View style={styles.topHeaderLeft}>
          <View style={styles.brandRowLeft}>
            <View style={styles.logoCircleSmall}>
              <Sparkles size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.brandTitleLeft}>NAVIDOOR</Text>
          </View>
          <Text style={styles.brandSubLeft}>AI MOBILITY & SAFETY</Text>
        </View>

        {/* Welcome Section - Shifted directly up near NAVIDOOR */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitleCenter}>Welcome</Text>
          <Text style={styles.welcomeSubtitleCenter}>Select your role to proceed:</Text>
        </View>

        {/* Role Cards Container */}
        <View style={styles.cardsContainer}>
          
          {/* Card 1: NAVIDOOR USER */}
          <TouchableOpacity
            style={[styles.card, styles.userCard]}
            onPress={() => handleSelectRole('navidoor_user')}
            activeOpacity={0.85}
            accessibilityLabel="Access as NAVIDOOR User. Voice guidance and camera assist."
            accessibilityRole="button"
          >
            <View style={[styles.iconBox, { backgroundColor: '#0284C7' }]}>
              <Eye size={24} color="#FFFFFF" />
            </View>

            <View style={styles.cardTextContent}>
              <Text style={styles.roleTitle}>NAVIDOOR USER</Text>
              <Text style={styles.cardDescription}>Voice navigation & camera vision</Text>
            </View>

            <ChevronRight size={22} color="#0284C7" />
          </TouchableOpacity>

          {/* Card 2: FAMILY MEMBER */}
          <TouchableOpacity
            style={[styles.card, styles.familyCard]}
            onPress={() => handleSelectRole('family_member')}
            activeOpacity={0.85}
            accessibilityLabel="Access as Family Companion. Live tracking and emergency alerts."
            accessibilityRole="button"
          >
            <View style={[styles.iconBox, { backgroundColor: '#4F46E5' }]}>
              <Heart size={24} color="#FFFFFF" />
            </View>

            <View style={styles.cardTextContent}>
              <Text style={styles.roleTitle}>FAMILY MEMBER</Text>
              <Text style={styles.cardDescription}>Live tracking & emergency alerts</Text>
            </View>

            <ChevronRight size={22} color="#4F46E5" />
          </TouchableOpacity>

        </View>

        {/* Bottom Footer Note */}
        <View style={styles.footer}>
          <ShieldCheck size={16} color="#E2E8F0" />
          <Text style={styles.footerText}>Secure Encrypted Link</Text>
        </View>
      </ScrollView>

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

        {/* Universal SOS Button */}
        <TouchableOpacity 
          style={styles.sosButton}
          onPress={triggerSosAlert}
          activeOpacity={0.8}
          accessibilityLabel="Trigger Emergency SOS"
          accessibilityRole="button"
        >
          <AlertCircle size={22} color="#FFFFFF" />
          <Text style={styles.sosButtonText}>EMERGENCY SOS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,

    backgroundColor: '#64748B',
  },
  scroll: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  topHeaderLeft: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  brandRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircleSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  brandTitleLeft: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
  brandSubLeft: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 1.2,
    paddingLeft: 2,
  },
  welcomeSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  welcomeTitleCenter: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
  },
  welcomeSubtitleCenter: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardsContainer: {
    width: '100%',
    maxWidth: 420,
    gap: 14,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userCard: {
    borderColor: '#0284C7',
  },
  familyCard: {
    borderColor: '#4F46E5',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardTextContent: {
    flex: 1,
  },
  roleTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  cardDescription: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 'auto',
  },
  footerText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
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
    marginBottom: 10,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
  sosButton: {
    flexDirection: 'row',
    backgroundColor: '#E11D48',
    padding: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
});
