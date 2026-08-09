import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { socketClient } from '../../services/socketClient';
import { Flag, PlayCircle, MapPin, CheckCircle, ShieldAlert, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export const FamilyActivityTab: React.FC = () => {
  const { familyConnectedUserData, familyConnectedUserPhone, setFamilyConnectedUserData } = useNavidoorStore();

  const journey = familyConnectedUserData?.journey || { from: 'Home', to: 'Hospital', status: 'In Progress', started: '10:15 PM', eta: '10:42 PM' };
  const timeline = familyConnectedUserData?.timeline || [{ time: '10:15 PM', text: 'Journey started' }];
  const permissions = familyConnectedUserData?.permissions || { journey: true, activity: true };

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
  };

  useEffect(() => {
    if (!familyConnectedUserPhone) return;

    // Listen to real-time journey updates
    const socket = socketClient.getSocket();
    if (socket) {
      socket.on(`family:journey:${familyConnectedUserPhone}`, (data: any) => {
        if (familyConnectedUserData) {
          setFamilyConnectedUserData({
            ...familyConnectedUserData,
            journey: data.journey
          });
        }
      });

      socket.on(`family:activity:${familyConnectedUserPhone}`, (data: any) => {
        if (familyConnectedUserData) {
          setFamilyConnectedUserData({
            ...familyConnectedUserData,
            timeline: data.activity
          });
        }
      });
    }

    return () => {
      const socket = socketClient.getSocket();
      if (socket) {
        socket.off(`family:journey:${familyConnectedUserPhone}`);
        socket.off(`family:activity:${familyConnectedUserPhone}`);
      }
    };
  }, [familyConnectedUserPhone, familyConnectedUserData]);

  if (!permissions.journey && !permissions.activity) {
    return (
      <View style={styles.errorContainer}>
        <ShieldAlert size={48} color="#E11D48" style={{ marginBottom: 16 }} />
        <Text style={styles.errorTitle}>JOURNEY SHARING DISABLED</Text>
        <Text style={styles.errorDesc}>
          {familyConnectedUserData?.name || 'The user'} has disabled journey and activity sharing.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Current Journey Panel */}
      {permissions.journey && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <PlayCircle size={20} color="#0284C7" />
            <Text style={styles.cardTag}>CURRENT JOURNEY</Text>
          </View>

          <View style={styles.journeyDetails}>
            <View style={styles.waypointRow}>
              <View style={[styles.bulletCircle, { backgroundColor: '#0284C7' }]} />
              <View>
                <Text style={styles.waypointLabel}>FROM</Text>
                <Text style={styles.waypointVal}>{journey.from}</Text>
              </View>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.waypointRow}>
              <View style={[styles.bulletCircle, { backgroundColor: '#10B981' }]} />
              <View>
                <Text style={styles.waypointLabel}>TO</Text>
                <Text style={styles.waypointVal}>{journey.to}</Text>
              </View>
            </View>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.journeyMetaGrid}>
            <View>
              <Text style={styles.metaLabel}>STARTED</Text>
              <Text style={styles.metaVal}>{journey.started}</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>EST. ARRIVAL (ETA)</Text>
              <Text style={styles.metaVal}>{journey.eta}</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>STATUS</Text>
              <Text style={[styles.metaVal, { color: '#10B981', fontWeight: '900' }]}>{journey.status}</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => {
                triggerHaptic();
                Alert.alert('Simulated Route', `Showing route directions from ${journey.from} to ${journey.to}`);
              }}
            >
              <Text style={styles.actionBtnText}>VIEW ROUTE</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, styles.actionBtnOutline]}
              onPress={() => {
                triggerHaptic();
                Alert.alert('Simulated Location', `User is currently near ${journey.to}`);
              }}
            >
              <Text style={styles.actionBtnOutlineText}>VIEW LOCATION</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Activity Timeline Panel */}
      {permissions.activity && (
        <View style={[styles.card, { marginTop: 16 }]}>
          <View style={styles.cardHeaderRow}>
            <Clock size={20} color="#0284C7" />
            <Text style={styles.cardTag}>ACTIVITY TIMELINE</Text>
          </View>

          <View style={styles.timelineContainer}>
            {timeline.map((item: { time: string; text: string }, idx: number) => {
              const isLast = idx === timeline.length - 1;
              return (
                <View key={idx} style={styles.timelineNode}>
                  {/* Left Bullet & Connector line */}
                  <View style={styles.timelineLeft}>
                    <View style={styles.timelineDot}>
                      <View style={styles.timelineInnerDot} />
                    </View>
                    {!isLast && <View style={styles.timelineConnector} />}
                  </View>

                  {/* Right Content */}
                  <View style={styles.timelineRight}>
                    <Text style={styles.timelineTime}>{item.time}</Text>
                    <Text style={styles.timelineText}>{item.text}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 100,
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
    textAlign: 'center',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#475569',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTag: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  journeyDetails: {
    paddingLeft: 8,
  },
  waypointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bulletCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  waypointLabel: {
    color: '#0284C7',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  waypointVal: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: '#94A3B8',
    marginLeft: 4,
    marginVertical: 4,
  },
  metaDivider: {
    height: 1.5,
    backgroundColor: '#94A3B8',
    marginVertical: 14,
  },
  journeyMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  metaLabel: {
    color: '#0284C7',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metaVal: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#0284C7',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  actionBtnOutlineText: {
    color: '#0284C7',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineNode: {
    flexDirection: 'row',
    gap: 16,
    minHeight: 56,
  },
  timelineLeft: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  timelineInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: '#0284C7',
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 14,
  },
  timelineTime: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '900',
  },
  timelineText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
  },
});
