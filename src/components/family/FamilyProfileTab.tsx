import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { socketClient } from '../../services/socketClient';
import { User, ShieldCheck, Bell, Lock, LogOut, Check, X, Phone } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export const FamilyProfileTab: React.FC = () => {
  const { 
    familyUser, 
    familyConnectedUserData, 
    setFamilyUser, 
    setFamilyConnectionStatus, 
    setFamilyConnectedUserPhone, 
    setFamilyConnectedUserData,
    setUserRole, 
    speak 
  } = useNavidoorStore();

  const permissions = familyConnectedUserData?.permissions || {
    location: true,
    journey: true,
    activity: true,
    medicine: true,
    emergency: true,
    cameraRemote: false
  };

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
  };

  const handleLogout = () => {
    triggerHaptic();
    speak('Logged out from family portal.');

    // Disconnect socket
    socketClient.disconnect();

    // Clear state
    setFamilyUser(null);
    setFamilyConnectedUserPhone(null);
    setFamilyConnectedUserData(null);
    setFamilyConnectionStatus('idle');
    setUserRole('undecided');
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Caregiver Profile Header */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarCircle}>
          <User size={30} color="#FFFFFF" />
        </View>
        <View>
          <Text style={styles.profileName}>{familyUser?.name || 'Caregiver'}</Text>
          <Text style={styles.profileRelation}>{familyUser?.relationship || 'Family Companion'}</Text>
        </View>
      </View>

      {/* Account Info Box */}
      <View style={styles.card}>
        <Text style={styles.cardTag}>ACCOUNT DETAILS</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Mobile Number</Text>
          <Text style={styles.detailVal}>{familyUser?.phone || 'Not available'}</Text>
        </View>

        {familyUser?.email && (
          <View style={[styles.detailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <Text style={styles.detailLabel}>Email Address</Text>
            <Text style={styles.detailVal}>{familyUser.email}</Text>
          </View>
        )}
      </View>

      {/* Connected Users Box */}
      {familyConnectedUserData && (
        <View style={styles.card}>
          <Text style={styles.cardTag}>CONNECTED NAVIDOOR USERS</Text>
          
          <View style={styles.userItem}>
            <View style={styles.userLeft}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{familyConnectedUserData.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.connectedUserName}>{familyConnectedUserData.name}</Text>
                <Text style={styles.connectedUserPhone}>{familyConnectedUserData.phone}</Text>
              </View>
            </View>
            <View style={styles.connectedBadge}>
              <Check size={14} color="#10B981" />
              <Text style={styles.connectedBadgeText}>Connected</Text>
            </View>
          </View>

          {/* Sharing Permissions list */}
          <Text style={[styles.cardTag, { marginTop: 18, marginBottom: 8 }]}>ACTIVE SHARING PERMISSIONS</Text>
          <Text style={styles.permNotice}>
            Permissions are managed by the NAVIDOOR user. Caregivers cannot override them.
          </Text>

          <View style={styles.permList}>
            {[
              { label: 'Location Sharing', key: 'location' },
              { label: 'Journey Monitoring', key: 'journey' },
              { label: 'Activity Timeline', key: 'activity' },
              { label: 'Medicine compliance checkup', key: 'medicine' },
              { label: 'Emergency Alerts', key: 'emergency' },
              { label: 'Camera Remote Assistance', key: 'cameraRemote' },
            ].map((item) => {
              const enabled = (permissions as any)[item.key];
              return (
                <View key={item.key} style={styles.permItem}>
                  <Text style={styles.permLabel}>{item.label}</Text>
                  {enabled ? (
                    <View style={[styles.statusIndicator, styles.statusIndicatorEnabled]}>
                      <Check size={12} color="#10B981" />
                      <Text style={styles.statusIndicatorTextEnabled}>Enabled</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusIndicator, styles.statusIndicatorDisabled]}>
                      <X size={12} color="#E11D48" />
                      <Text style={styles.statusIndicatorTextDisabled}>Disabled</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Notification Settings Box */}
      <View style={styles.card}>
        <Text style={styles.cardTag}>PREFERENCES & NOTIFICATIONS</Text>
        
        <View style={styles.prefItem}>
          <View>
            <Text style={styles.prefLabel}>Sound SOS Alarm</Text>
            <Text style={styles.prefDesc}>Play warning siren when alert is triggered</Text>
          </View>
          <Switch value={true} onValueChange={() => {}} trackColor={{ false: '#94A3B8', true: '#0284C7' }} />
        </View>

        <View style={styles.prefItem}>
          <View>
            <Text style={styles.prefLabel}>SMS Notifications</Text>
            <Text style={styles.prefDesc}>Send backup text alerts to mobile number</Text>
          </View>
          <Switch value={true} onValueChange={() => {}} trackColor={{ false: '#94A3B8', true: '#0284C7' }} />
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={20} color="#E11D48" />
        <Text style={styles.logoutBtnText}>LOG OUT FROM PORTAL</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#64748B',
  },
  container: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#475569',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
  },
  profileRelation: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#475569',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  cardTag: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#94A3B8',
  },
  detailLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
  },
  detailVal: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  connectedUserName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  connectedUserPhone: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  connectedBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '900',
  },
  permNotice: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    marginBottom: 12,
  },
  permList: {
    gap: 8,
  },
  permItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  permLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusIndicatorEnabled: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  statusIndicatorDisabled: {
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
  },
  statusIndicatorTextEnabled: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
  },
  statusIndicatorTextDisabled: {
    color: '#E11D48',
    fontSize: 10,
    fontWeight: '900',
  },
  prefItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  prefLabel: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  prefDesc: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    borderWidth: 1.5,
    borderColor: '#E11D48',
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutBtnText: {
    color: '#E11D48',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
