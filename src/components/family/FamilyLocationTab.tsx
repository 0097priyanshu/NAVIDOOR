import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { socketClient } from '../../services/socketClient';
import { MapPin, Battery, RefreshCw, Navigation, ShieldAlert } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export const FamilyLocationTab: React.FC = () => {
  const { familyConnectedUserData, familyConnectedUserPhone, setFamilyConnectedUserData } = useNavidoorStore();
  const [loading, setLoading] = useState(false);

  // Fallback to coordinates
  const location = familyConnectedUserData?.location || { latitude: 37.7749, longitude: -122.4194, address: 'Oak Lane' };
  const permissions = familyConnectedUserData?.permissions || { location: true };
  const battery = familyConnectedUserData?.battery || 84;
  const lastUpdated = familyConnectedUserData?.lastUpdated || '10:42 PM';

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
  };

  useEffect(() => {
    if (!familyConnectedUserPhone) return;

    // Listen to live location updates via socketClient
    const socket = socketClient.getSocket();
    if (socket) {
      const channel = `family:location:${familyConnectedUserPhone}`;
      socket.on(channel, (data: any) => {
        if (familyConnectedUserData) {
          setFamilyConnectedUserData({
            ...familyConnectedUserData,
            location: data.location,
            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      });

      // Socket permission updates
      socket.on('family:sharingUpdated', (data: any) => {
        if (familyConnectedUserData && data.userPhone === familyConnectedUserPhone) {
          setFamilyConnectedUserData({
            ...familyConnectedUserData,
            permissions: data.permissions
          });
        }
      });
    }

    return () => {
      const socket = socketClient.getSocket();
      if (socket) {
        socket.off(`family:location:${familyConnectedUserPhone}`);
        socket.off('family:sharingUpdated');
      }
    };
  }, [familyConnectedUserPhone, familyConnectedUserData]);

  if (!permissions.location) {
    return (
      <View style={styles.errorContainer}>
        <ShieldAlert size={48} color="#E11D48" style={{ marginBottom: 16 }} />
        <Text style={styles.errorTitle}>LOCATION SHARING DISABLED</Text>
        <Text style={styles.errorDesc}>
          {familyConnectedUserData?.name || 'The user'} has disabled location sharing permissions. Caregivers cannot access location details without active consent.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.leftGroup}>
          <View style={styles.livePulseDot} />
          <Text style={styles.headerTitle}>LIVE LOCATION</Text>
        </View>
        <Text style={styles.lastUpdatedText}>Updated: {lastUpdated}</Text>
      </View>

      {/* Simulated Map View Canvas */}
      <View style={styles.mapCanvas}>
        {/* Simple visual map elements */}
        <View style={styles.gridLineH1} />
        <View style={styles.gridLineH2} />
        <View style={styles.gridLineV1} />
        <View style={styles.gridLineV2} />
        
        {/* Simulated Streets */}
        <View style={styles.streetHorizontal}>
          <Text style={styles.streetName}>Market Street</Text>
        </View>
        <View style={styles.streetVertical}>
          <Text style={[styles.streetName, { transform: [{ rotate: '90deg' }] }]}>4th Street</Text>
        </View>

        {/* Pulsing Pin Marker */}
        <View style={styles.markerContainer}>
          <View style={styles.markerRadarRing} />
          <View style={styles.markerCircle}>
            <Navigation size={16} color="#FFFFFF" style={{ transform: [{ rotate: '45deg' }] }} />
          </View>
        </View>

        {/* Map UI controls */}
        <TouchableOpacity 
          style={styles.fullMapBtn}
          onPress={() => {
            triggerHaptic();
            Alert.alert('Map API', `Coordinates: ${location.latitude}, ${location.longitude}\nAddress: ${location.address}`);
          }}
        >
          <Text style={styles.fullMapText}>OPEN FULL MAP</Text>
        </TouchableOpacity>
      </View>

      {/* Footer Info details */}
      <View style={styles.footerDetails}>
        <View style={styles.detailRow}>
          <MapPin size={18} color="#0284C7" />
          <View style={{ flex: 1 }}>
            <Text style={styles.detailLabel}>CURRENT ADDRESS</Text>
            <Text style={styles.detailVal}>{location.address}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Battery size={18} color="#10B981" />
            <Text style={styles.metaVal}>{battery}% Battery</Text>
          </View>

          <View style={styles.metaItem}>
            <View style={[styles.pulseDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.metaVal}>GPS Active</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorDesc: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '700',
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#CBD5E1',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#475569',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284C7',
  },
  headerTitle: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  lastUpdatedText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
  },
  mapCanvas: {
    flex: 1,
    backgroundColor: '#94A3B8', // Prominent card background
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#475569',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLineH1: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    top: '30%',
  },
  gridLineH2: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    top: '70%',
  },
  gridLineV1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    left: '30%',
  },
  gridLineV2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    left: '70%',
  },
  streetHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: '#475569',
    top: '40%',
    justifyContent: 'center',
    paddingLeft: 16,
  },
  streetVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 48,
    backgroundColor: '#475569',
    left: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streetName: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  markerContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  markerRadarRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  markerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0284C7',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fullMapBtn: {
    position: 'absolute',
    bottom: 16,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  fullMapText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
  },
  footerDetails: {
    backgroundColor: '#CBD5E1',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#475569',
    padding: 16,
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    color: '#0284C7',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  detailVal: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#94A3B8',
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metaVal: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },
});
