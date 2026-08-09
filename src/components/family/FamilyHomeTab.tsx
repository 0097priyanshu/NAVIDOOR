import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { BACKEND_URL } from '../../services/voiceAssistantBackend';
import { socketClient } from '../../services/socketClient';
import { Users, Link, QrCode, Shield, CheckCircle, RefreshCw, Battery, MapPin, Activity } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export const FamilyHomeTab: React.FC = () => {
  const {
    familyUser,
    familyConnectionStatus,
    setFamilyConnectionStatus,
    familyConnectedUserPhone,
    setFamilyConnectedUserPhone,
    familyConnectedUserData,
    setFamilyConnectedUserData,
    speak
  } = useNavidoorStore();

  const [connectPhone, setConnectPhone] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Poll connection status & dashboard data
  const loadDashboardData = async (forceSpinner = false) => {
    if (!familyUser?.phone) return;

    if (forceSpinner) setRefreshing(true);
    try {
      // 1. Fetch connection states
      const connRes = await fetch(`${BACKEND_URL}/api/family/connection-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyPhone: familyUser.phone })
      });
      const connData = await connRes.json();

      if (connData.success) {
        if (connData.connectedUsers && connData.connectedUsers.length > 0) {
          const connectedPhone = connData.connectedUsers[0];
          setFamilyConnectedUserPhone(connectedPhone);
          setFamilyConnectionStatus('connected');

          // 2. Fetch dashboard details
          const dashRes = await fetch(
            `${BACKEND_URL}/api/family/dashboard-data?familyPhone=${encodeURIComponent(
              familyUser.phone
            )}&userPhone=${encodeURIComponent(connectedPhone)}`
          );
          const dashData = await dashRes.json();
          if (dashData.success) {
            setFamilyConnectedUserData(dashData.data);
          }
        } else if (connData.requests && connData.requests.length > 0) {
          const pending = connData.requests.find((r: any) => r.status === 'pending');
          if (pending) {
            setFamilyConnectedUserPhone(pending.toUserPhone);
            setFamilyConnectionStatus('pending');
          } else {
            setFamilyConnectionStatus('idle');
          }
        } else {
          setFamilyConnectionStatus('idle');
        }
      }
    } catch (err) {
      console.warn('Dashboard load error:', err);
    } finally {
      if (forceSpinner) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Listen to real-time socket events for connection acceptance
    const socket = socketClient.getSocket();
    if (socket && familyUser?.phone) {
      socket.on('family:connectionResponse', (data: any) => {
        if (data.approved) {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {}
          Alert.alert('Connection Approved', 'The NAVIDOOR User has accepted your request!');
          loadDashboardData();
        } else {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          } catch (e) {}
          Alert.alert('Connection Rejected', 'Your connection request was declined.');
          setFamilyConnectionStatus('rejected');
        }
      });
    }

    return () => {
      const socket = socketClient.getSocket();
      if (socket) {
        socket.off('family:connectionResponse');
      }
    };
  }, [familyUser?.phone]);

  const handleConnect = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    if (!connectPhone.trim()) {
      Alert.alert('Required Info', 'Please enter a valid mobile number.');
      return;
    }

    setConnecting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/family/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyPhone: familyUser?.phone,
          userPhone: connectPhone.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Connection failed.');
      }

      if (data.status === 'connected') {
        setFamilyConnectionStatus('connected');
        setFamilyConnectedUserPhone(connectPhone.trim());
        loadDashboardData();
      } else {
        setFamilyConnectionStatus('pending');
        setFamilyConnectedUserPhone(connectPhone.trim());
      }
      speak('Request submitted to user. Waiting for approval.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An error occurred.');
    } finally {
      setConnecting(false);
    }
  };

  const getGreetingTime = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good morning';
    if (hrs < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Greeting Banner */}
      <View style={styles.greetingHeader}>
        <View>
          <Text style={styles.greetText}>{getGreetingTime()},</Text>
          <Text style={styles.nameText}>{familyUser?.name || 'Caregiver'}</Text>
        </View>
        {familyConnectionStatus === 'connected' && (
          <TouchableOpacity 
            style={styles.refreshBtn} 
            onPress={() => loadDashboardData(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#0284C7" />
            ) : (
              <RefreshCw size={18} color="#0284C7" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* 1. NOT CONNECTED STATE */}
      {familyConnectionStatus === 'idle' && (
        <View style={styles.card}>
          <View style={styles.cardIconHeader}>
            <Link size={24} color="#0284C7" />
            <Text style={styles.cardTitle}>CONNECT NAVIDOOR USER</Text>
          </View>
          
          <Text style={styles.cardDesc}>
            Enter the registered mobile number of the NAVIDOOR user you wish to assist.
          </Text>

          <View style={styles.inputWrapper}>
            <Users size={18} color="#0284C7" />
            <TextInput
              style={styles.input}
              value={connectPhone}
              onChangeText={setConnectPhone}
              placeholder="Enter mobile number (+1 (555) 019-2831)..."
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.connectBtn} onPress={handleConnect} disabled={connecting}>
              {connecting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.connectBtnText}>Send Connection Request</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.qrBtn} 
              onPress={() => Alert.alert('Scan QR Code', 'Scanning is simulated. You can type the phone number "+1 (555) 019-2831" to connect to the active mock user.')}
            >
              <QrCode size={20} color="#FFFFFF" />
              <Text style={styles.qrBtnText}>Scan QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 2. PENDING REQUEST STATE */}
      {familyConnectionStatus === 'pending' && (
        <View style={styles.card}>
          <View style={styles.cardIconHeader}>
            <Shield size={24} color="#F59E0B" />
            <Text style={[styles.cardTitle, { color: '#F59E0B' }]}>WAITING FOR APPROVAL</Text>
          </View>
          
          <Text style={styles.cardDesc}>
            A connection request has been sent to <Text style={styles.highlightText}>{familyConnectedUserPhone}</Text>.
          </Text>

          <View style={styles.pendingIndicatorBox}>
            <ActivityIndicator size="large" color="#F59E0B" style={{ marginBottom: 12 }} />
            <Text style={styles.pendingIndicatorText}>Waiting for user approval...</Text>
          </View>

          <TouchableOpacity style={[styles.connectBtn, { backgroundColor: '#64748B' }]} onPress={() => loadDashboardData(true)}>
            <Text style={styles.connectBtnText}>Check Approval Status</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. REJECTED STATE */}
      {familyConnectionStatus === 'rejected' && (
        <View style={styles.card}>
          <View style={styles.cardIconHeader}>
            <Shield size={24} color="#E11D48" />
            <Text style={[styles.cardTitle, { color: '#E11D48' }]}>CONNECTION REJECTED</Text>
          </View>
          
          <Text style={styles.cardDesc}>
            The connection request to user phone was declined. Please confirm the number and try again.
          </Text>

          <TouchableOpacity style={styles.connectBtn} onPress={() => setFamilyConnectionStatus('idle')}>
            <Text style={styles.connectBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 4. CONNECTED STATE */}
      {familyConnectionStatus === 'connected' && familyConnectedUserData && (
        <>
          {/* User Profile Card */}
          <View style={styles.userProfileCard}>
            <View style={styles.userCardHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{familyConnectedUserData.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.userCardDetails}>
                <Text style={styles.userName}>{familyConnectedUserData.name}</Text>
                <View style={styles.statusBadge}>
                  <View style={[styles.pulseDot, { backgroundColor: familyConnectedUserData.online ? '#10B981' : '#94A3B8' }]} />
                  <Text style={styles.statusText}>{familyConnectedUserData.online ? 'Online' : 'Offline'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Battery size={18} color="#0284C7" />
                <View>
                  <Text style={styles.metricLabel}>BATTERY</Text>
                  <Text style={styles.metricVal}>{familyConnectedUserData.battery}%</Text>
                </View>
              </View>

              <View style={styles.metricItem}>
                <MapPin size={18} color="#0284C7" />
                <View>
                  <Text style={styles.metricLabel}>GPS STATUS</Text>
                  <Text style={styles.metricVal}>{familyConnectedUserData.gpsStatus}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.lastUpdatedText}>Last Updated: {familyConnectedUserData.lastUpdated}</Text>
          </View>

          {/* Quick Overview Cards */}
          <View style={styles.gridContainer}>
            {/* Live Location Box */}
            <View style={styles.smallCard}>
              <View style={styles.smallCardHeader}>
                <MapPin size={18} color="#0284C7" />
                <Text style={styles.smallCardTitle}>LOCATION</Text>
              </View>
              <Text style={styles.smallCardDesc}>{familyConnectedUserData.location.address}</Text>
            </View>

            {/* Active Journey Box */}
            <View style={styles.smallCard}>
              <View style={styles.smallCardHeader}>
                <Activity size={18} color="#0284C7" />
                <Text style={styles.smallCardTitle}>ACTIVE JOURNEY</Text>
              </View>
              <Text style={styles.smallCardDesc}>
                {familyConnectedUserData.journey.status === 'In Progress' 
                  ? `To: ${familyConnectedUserData.journey.to}`
                  : 'No Active Journey'
                }
              </Text>
            </View>
          </View>
        </>
      )}
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
  },
  greetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  card: {
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#475569',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 20,
  },
  cardIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    color: '#0284C7',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cardDesc: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  connectBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 16,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  qrBtn: {
    flexDirection: 'row',
    backgroundColor: '#0284C7',
    borderRadius: 16,
    width: 110,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  qrBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
  highlightText: {
    color: '#0284C7',
    fontWeight: '900',
  },
  pendingIndicatorBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  pendingIndicatorText: {
    color: '#F59E0B',
    fontWeight: '800',
    fontSize: 14,
  },
  userProfileCard: {
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    padding: 20,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 16,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  userCardDetails: {
    flex: 1,
  },
  userName: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },
  metricDivider: {
    height: 1.5,
    backgroundColor: '#94A3B8',
    marginVertical: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricLabel: {
    color: '#0284C7',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  metricVal: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  lastUpdatedText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'right',
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 14,
  },
  smallCard: {
    flex: 1,
    backgroundColor: '#CBD5E1',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#475569',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  smallCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  smallCardTitle: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  smallCardDesc: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
});
