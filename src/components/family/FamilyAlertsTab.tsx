import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { AlertOctagon, Phone, ShieldCheck, MapPin, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export const FamilyAlertsTab: React.FC = () => {

  const { activeSosAlert, setActiveSosAlert, familyConnectedUserData } = useNavidoorStore();

  const { activeSosAlert, setActiveSosAlert, familyConnectedUserData, speak } = useNavidoorStore();


  const handleCall = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    const phone = familyConnectedUserData?.phone || '';
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Call Failed', 'User phone number not available.');
    }
  };

  const handleAcknowledge = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    setActiveSosAlert(null);


    speak('Emergency alert acknowledged.');

    Alert.alert('Alert Acknowledged', 'Emergency state cleared and logged.');
  };

  const handleLocate = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    const location = activeSosAlert?.location || 'Unknown';
    Alert.alert('Locate User', `User last reported location: ${location}`);
  };

  return (
    <View style={styles.container}>
      {/* 1. SOS ACTIVE STATE */}
      {activeSosAlert ? (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <AlertOctagon size={40} color="#FFFFFF" />
            <Text style={styles.alertHeaderTitle}>🚨 EMERGENCY SOS ALERT</Text>
          </View>

          <View style={styles.alertContent}>
            <Text style={styles.alertMessage}>
              <Text style={styles.alertUser}>{activeSosAlert.name || 'User'}</Text> has triggered an emergency SOS!
            </Text>

            <View style={styles.divider} />

            <View style={styles.detailItem}>
              <MapPin size={20} color="#E11D48" />
              <View>
                <Text style={styles.detailLabel}>REPORTED LOCATION</Text>
                <Text style={styles.detailVal}>{activeSosAlert.location}</Text>
              </View>
            </View>

            <View style={[styles.detailItem, { marginTop: 16 }]}>
              <Calendar size={20} color="#E11D48" />
              <View>
                <Text style={styles.detailLabel}>TRIGGERED AT</Text>
                <Text style={styles.detailVal}>{activeSosAlert.time}</Text>
              </View>
            </View>
          </View>

          <View style={styles.btnRow}>
            {/* CALL USER */}
            <TouchableOpacity style={[styles.btn, styles.callBtn]} onPress={handleCall}>
              <Phone size={20} color="#FFFFFF" />
              <Text style={styles.btnText}>CALL USER</Text>
            </TouchableOpacity>

            {/* VIEW LOCATION */}
            <TouchableOpacity style={[styles.btn, styles.locateBtn]} onPress={handleLocate}>
              <MapPin size={20} color="#0284C7" />
              <Text style={[styles.btnText, { color: '#0284C7' }]}>VIEW LOCATION</Text>
            </TouchableOpacity>
          </View>

          {/* ACKNOWLEDGE */}
          <TouchableOpacity style={styles.ackBtn} onPress={handleAcknowledge}>
            <ShieldCheck size={20} color="#FFFFFF" />
            <Text style={styles.btnText}>ACKNOWLEDGE ALERT</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* 2. SAFE STATE (NO ALERTS) */
        <View style={styles.safeCard}>
          <View style={styles.safeLogoCircle}>
            <ShieldCheck size={48} color="#FFFFFF" fill="#10B981" />
          </View>
          <Text style={styles.safeTitle}>No Active Alerts</Text>
          <Text style={styles.safeDesc}>
            All connected family members are safe. Emergency channels are monitored in real time.
          </Text>
          
          <View style={styles.monitorList}>
            <View style={styles.monitorItem}>
              <View style={styles.bulletDot} />
              <Text style={styles.monitorText}>Real-Time SOS trigger channel active</Text>
            </View>
            <View style={styles.monitorItem}>
              <View style={styles.bulletDot} />
              <Text style={styles.monitorText}>GPS position heartbeats active</Text>
            </View>
            <View style={styles.monitorItem}>
              <View style={styles.bulletDot} />
              <Text style={styles.monitorText}>Consent and security tokens valid</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#64748B',
    justifyContent: 'center',
  },
  alertCard: {
    backgroundColor: '#E11D48', // Red alert background
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    padding: 20,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  alertHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  alertContent: {
    backgroundColor: '#CBD5E1', // slate card insert
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E11D48',
  },
  alertMessage: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  alertUser: {
    color: '#E11D48',
    fontWeight: '900',
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#94A3B8',
    marginVertical: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    color: '#E11D48',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  detailVal: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  callBtn: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  locateBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  ackBtn: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  safeCard: {
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#475569',
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  safeLogoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  safeTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  safeDesc: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 24,
  },
  monitorList: {
    alignSelf: 'stretch',
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  monitorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  monitorText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
});
