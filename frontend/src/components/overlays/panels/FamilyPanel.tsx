import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavidoorStore } from '../../../store/useNavidoorStore';
import { QrCode, Users, ShieldAlert, Heart, Link, Check, LogOut } from 'lucide-react-native';
import { ACCESSIBILITY } from '../../../theme/designSystem';
import * as Haptics from 'expo-haptics';

export const FamilyPanel: React.FC = () => {
  const { 
    setFamilyCompanionOpen, 
    setIsFamilyQrModalOpen,
    familyConnectionStatus,
    familyConnectedUserData,
    familyConnectedUserPhone,
    disconnectActivePairing,
    speak
  } = useNavidoorStore();

  const isConnected = familyConnectionStatus === 'connected';

  const handleOpenQr = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    setIsFamilyQrModalOpen(true);
    speak('Opening pairing QR code. It will be valid for 5 minutes.');
  };

  const handleOpenCompanion = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    setFamilyCompanionOpen(true);
    speak('Opening Family Companion controls.');
  };

  const handleDisconnect = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {}

    Alert.alert(
      'Disconnect Companion',
      'Are you sure you want to disconnect your family companion?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive', 
          onPress: () => {
            disconnectActivePairing();
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Users size={22} color="#0284C7" />
        <Text style={styles.title}>FAMILY COMPANION PORTAL</Text>
      </View>

      <Text style={styles.subtitle}>
        Connect your trusted family member or caregiver to monitor location, view safety status, and send remote voice notes.
      </Text>

      {/* Connection Status Badge */}
      <View style={[styles.statusBadge, isConnected ? styles.statusBadgeConnected : styles.statusBadgeIdle]}>
        <View style={[styles.dot, { backgroundColor: isConnected ? '#10B981' : '#F59E0B' }]} />
        <Text style={[styles.statusText, { color: isConnected ? '#065F46' : '#92400E' }]}>
          {isConnected 
            ? `Connected: ${familyConnectedUserData?.userName || 'Sunita Sharma'} (${familyConnectedUserData?.relationship || 'Daughter'})` 
            : 'No Active Family Companion Paired'}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsCol}>
        {/* 1. Generate QR Code Button */}
        <TouchableOpacity 
          style={styles.qrBtn}
          onPress={handleOpenQr}
          accessibilityLabel="Show Pairing QR Code for family companion to scan"
          accessibilityRole="button"
        >
          <QrCode size={22} color="#FFFFFF" />
          <Text style={styles.qrBtnText}>SHOW PAIRING QR CODE</Text>
        </TouchableOpacity>

        {/* 2. Companion Stream / Controls Modal */}
        <TouchableOpacity 
          style={styles.familyBtn}
          onPress={handleOpenCompanion}
          accessibilityLabel="Open Family Companion controls and remote voice notes"
          accessibilityRole="button"
        >
          <Heart size={20} color="#FFFFFF" />
          <Text style={styles.familyBtnText}>OPEN COMPANION CONTROLS</Text>
        </TouchableOpacity>

        {/* 3. Disconnect Button if active */}
        {isConnected && (
          <TouchableOpacity 
            style={styles.disconnectBtn}
            onPress={handleDisconnect}
            accessibilityLabel="Disconnect active family companion"
            accessibilityRole="button"
          >
            <LogOut size={18} color="#FFFFFF" />
            <Text style={styles.disconnectBtnText}>DISCONNECT COMPANION</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: '#0284C7',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 8,
    marginBottom: 16,
  },
  statusBadgeConnected: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  statusBadgeIdle: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontWeight: '800',
    fontSize: 12,
  },
  actionsCol: {
    gap: 10,
  },
  qrBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: ACCESSIBILITY.borderRadiusButton,
    gap: 10,
    minHeight: ACCESSIBILITY.minTouchTargetSize,
  },
  qrBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  familyBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: ACCESSIBILITY.borderRadiusButton,
    gap: 10,
    minHeight: ACCESSIBILITY.minTouchTargetSize,
  },
  familyBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  disconnectBtn: {
    backgroundColor: '#E11D48',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: ACCESSIBILITY.borderRadiusButton,
    gap: 8,
    minHeight: ACCESSIBILITY.minTouchTargetSize,
  },
  disconnectBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
