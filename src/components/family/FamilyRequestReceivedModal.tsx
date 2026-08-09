import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { socketClient } from '../../services/socketClient';
import { BACKEND_URL } from '../../services/voiceAssistantBackend';
import { Users, Check, X, ShieldAlert } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export const FamilyRequestReceivedModal: React.FC = () => {
  const { userRole, userPhone, speak } = useNavidoorStore();
  const [pendingRequest, setPendingRequest] = useState<{
    familyPhone: string;
    familyName: string;
    relationship: string;
  } | null>(null);

  useEffect(() => {
    // Only run if the active role is navidoor_user
    if (userRole !== 'navidoor_user' || !userPhone) return;

    // 1. Fetch any pending requests immediately at launch
    const checkPending = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/user/pending-requests?phone=${encodeURIComponent(userPhone)}`);
        const data = await res.json();
        if (data.success && data.requests && data.requests.length > 0) {
          const req = data.requests[0];
          setPendingRequest({
            familyPhone: req.fromFamilyPhone,
            familyName: req.familyName,
            relationship: req.relationship
          });
          speak(`${req.familyName} wants to connect with you as a ${req.relationship}. Tap the left half of the screen to accept, or the right half to reject.`);
        }
      } catch (err) {
        console.warn('Failed to fetch pending requests:', err);
      }
    };
    checkPending();

    // 2. Register socket to listen for real-time connection requests
    socketClient.connect();
    socketClient.registerPhone(userPhone, 'navidoor_user');

    const socket = socketClient.getSocket();
    if (socket) {
      socket.on('family:connectionRequest', (data: any) => {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (e) {}
        
        setPendingRequest(data);
        speak(`${data.familyName} wants to connect with you as a ${data.relationship}. Tap the left half of the screen to accept, or the right half to reject.`);
      });
    }

    return () => {
      const socket = socketClient.getSocket();
      if (socket) {
        socket.off('family:connectionRequest');
      }
    };
  }, [userRole, userPhone]);

  if (!pendingRequest) return null;

  const handleResponse = async (approved: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}

    try {
      const response = await fetch(`${BACKEND_URL}/api/user/approve-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPhone,
          familyPhone: pendingRequest.familyPhone,
          approved
        })
      });

      if (response.ok) {
        speak(approved ? 'Connection request accepted.' : 'Connection request rejected.');
      } else {
        speak('Failed to respond to connection request.');
      }
    } catch (err) {
      console.error(err);
      speak('A connection network error occurred.');
    } finally {
      setPendingRequest(null);
    }
  };

  return (
    <Modal visible={!!pendingRequest} transparent animationType="fade">
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
            They will be able to monitor your location and assistant compliance checkups.
          </Text>

          <View style={styles.buttonRow}>
            {/* Accept Button (Left) */}
            <TouchableOpacity 
              style={[styles.btn, styles.acceptBtn]} 
              onPress={() => handleResponse(true)}
              accessibilityLabel="Accept Connection Request"
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
    backgroundColor: '#64748B', // Slate gray backdrop overlay
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
