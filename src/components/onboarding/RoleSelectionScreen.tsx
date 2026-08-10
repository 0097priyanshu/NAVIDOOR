import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { Sparkles, Eye, ShieldCheck, Heart, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export const RoleSelectionScreen: React.FC = () => {
  const { setUserRole, setIsFirstTimeUser, speak } = useNavidoorStore();

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
  },
});
