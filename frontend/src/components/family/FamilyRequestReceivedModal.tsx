import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { socketClient } from '../../services/socketClient';
import { familyPairingService, ConnectionData } from '../../services/familyPairingService';
import { BACKEND_URL } from '../../services/voiceAssistantBackend';
import { Users, Check, X, ShieldAlert } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export const FamilyRequestReceivedModal: React.FC = () => {
  const { 
    userRole, 
    userPhone, 
    speak, 
    setFamilyConnectionStatus, 
    setFamilyConnectedUserData, 
    setFamilyConnectedUserPhone,
    setActivePairingConnection 
  } = useNavidoorStore();

  const [pendingRequest, setPendingRequest] = useState<{
    connectionId?: string;
    familyPhone: string;
    familyName: string;
    relationship: string;
  } | null>(null);

  useEffect(() => {
    // Only active when in navidoor_user mode
    if (userRole !== 'navidoor_user') return;

    // 1. Fetch any pending requests immediately at launch from backend
    const checkPending = async () => {
      try {
        const queryParam = userPhone ? `phone=${encodeURIComponent(userPhone)}` : '';
        const res = await fetch(`${BACKEND_URL}/api/user/pending-requests?${queryParam}`);
        if (!res.ok) return;
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) return;

        const data = await res.json();
        if (data.success && data.requests && data.requests.length > 0) {
          const req = data.requests[0];
          setPendingRequest({
            connectionId: req.id,
            familyPhone: req.companionPhone || req.fromFamilyPhone,
            familyName: req.companionName || req.familyName || 'Family Caregiver',
            relationship: req.companionRelationship || req.relationship || 'Family Companion',
          });
          speak(`${req.companionName || req.familyName || 'A family companion'} wants to connect with you. Tap the green button to accept, or the red button to reject.`);
        }
      } catch (err) {
        // Silently handle backend fetch offline/error
      }
    };
    checkPending();

    // 2. Subscribe to familyPairingService for immediate zero-lag local & firestore requests
    const unsubPairingService = familyPairingService.subscribeToIncomingRequests(userPhone || 'navidoor_device_user', (req) => {
      if (req && req.status === 'pending') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (e) {}

        setPendingRequest({
          connectionId: req.id,
          familyPhone: req.companionPhone,
          familyName: req.companionName || 'Family Companion',
          relationship: req.companionRelationship || 'Family Companion',
        });
        speak(`${req.companionName || 'A family companion'} wants to connect with you. Tap the green button to accept, or the red button to reject.`);
      }
    });

    // 3. Register socket to listen for real-time connection requests
    socketClient.connect();
    if (userPhone) {
      socketClient.registerPhone(userPhone, 'navidoor_user');
    }

    const socket = socketClient.getSocket();
    let handleSocketRequest: any = null;
    if (socket) {
      handleSocketRequest = (data: any) => {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (e) {}

        setPendingRequest({
          connectionId: data.connectionId || data.id,
          familyPhone: data.familyPhone || data.companionPhone,
          familyName: data.familyName || data.companionName || 'Caregiver',
          relationship: data.relationship || data.companionRelationship || 'Family Companion',
        });
        speak(`${data.familyName || 'A family companion'} wants to connect with you as ${data.relationship || 'companion'}. Tap Accept or Reject.`);
      };

      socket.on('family:connectionRequest', handleSocketRequest);
    }

    return () => {
      unsubPairingService();
      if (socket && handleSocketRequest) {
        socket.off('family:connectionRequest', handleSocketRequest);
      }
    };
  }, [userRole, userPhone]);

  if (!pendingRequest) return null;

  const handleResponse = async (approved: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}

    const connId = pendingRequest.connectionId;

    try {
      if (approved) {
        if (connId) {
          await familyPairingService.approveConnection(connId);
        }
        setFamilyConnectionStatus('connected');
        setFamilyConnectedUserPhone(pendingRequest.familyPhone);
        setFamilyConnectedUserData({
          userName: pendingRequest.familyName,
          userPhone: pendingRequest.familyPhone,
          relationship: pendingRequest.relationship,
        });
        setActivePairingConnection({
          id: connId,
          companionName: pendingRequest.familyName,
          companionPhone: pendingRequest.familyPhone,
          companionRelationship: pendingRequest.relationship,
          status: 'connected',
        });
        speak('Connection request accepted. Your family companion is now connected.');
      } else {
        if (connId) {
          await familyPairingService.rejectConnection(connId);
        }
        speak('Connection request declined.');
      }

      // Also notify backend endpoint for fallback
      await fetch(`${BACKEND_URL}/api/user/approve-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: connId,
          userPhone,
          familyPhone: pendingRequest.familyPhone,
          approved,
        }),
      });
    } catch (err) {
      console.error('[FamilyRequestReceivedModal] Approval error:', err);
      speak(approved ? 'Connection accepted.' : 'Connection rejected.');
    } finally {
      setPendingRequest(null);
    }
  };

  return (
    <Modal visible={!!pendingRequest} transparent statusBarTranslucent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Users size={32} color="#0284C7" />
            <Text style={styles.title}>CONNECTION REQUEST</Text>
          </View>

          <Text style={styles.message}>
            <Text style={styles.boldText}>{pendingRequest.familyName}</Text> wants to connect with you as a{' '}
            <Text style={styles.boldText}>{pendingRequest.relationship}</Text>.
          </Text>

          <Text style={styles.subMessage}>
            They will be able to monitor your location and receive emergency SOS alerts.
          </Text>

          <View style={styles.buttonRow}>
            {/* Accept Button (Left) */}
            <TouchableOpacity 
              style={[styles.btn, styles.acceptBtn]} 
              onPress={() => handleResponse(true)}
              accessibilityLabel="Accept Connection Request from Family Companion"
              accessibilityRole="button"
            >
              <Check size={28} color="#FFFFFF" />
              <Text style={styles.btnText}>ACCEPT</Text>
            </TouchableOpacity>

            {/* Reject Button (Right) */}
            <TouchableOpacity 
              style={[styles.btn, styles.rejectBtn]} 
              onPress={() => handleResponse(false)}
              accessibilityLabel="Reject Connection Request"
              accessibilityRole="button"
            >
              <X size={28} color="#FFFFFF" />
              <Text style={styles.btnText}>REJECT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#0284C7',
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#94A3B8',
    paddingBottom: 10,
  },
  title: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  message: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 10,
  },
  boldText: {
    color: '#0284C7',
    fontWeight: '900',
  },
  subMessage: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 18,
    gap: 8,
    minHeight: 64,
  },
  acceptBtn: {
    backgroundColor: '#10B981',
  },
  rejectBtn: {
    backgroundColor: '#E11D48',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1,
  },
});
