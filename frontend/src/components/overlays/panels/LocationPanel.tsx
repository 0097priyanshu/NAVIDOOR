import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useNavidoorStore } from '../../../store/useNavidoorStore';
import { voiceRecordingService } from '../../../services/voiceRecordingService';
import { MapPin, ShieldAlert, UserPlus, ChevronUp, ChevronDown, Check, X, Phone } from 'lucide-react-native';

const DUMMY_CONTACTS = [
  { id: 'c1', name: 'John Doe', phone: '+1 555-0101' },
  { id: 'c2', name: 'Alice Smith', phone: '+1 555-0102' },
  { id: 'c3', name: 'Michael Johnson', phone: '+1 555-0103' },
  { id: 'c4', name: 'Emma Brown', phone: '+1 555-0104' },
];

export const LocationPanel = () => {
  const { 
    speak,
    emergencyContacts,
    setVoiceState,
    activeLanguageCode,
    activeMode
  } = useNavidoorStore();

  const [sharedEmergency, setSharedEmergency] = React.useState(false);
  const [sharedOther, setSharedOther] = React.useState(false);
  const [sharedOtherName, setSharedOtherName] = React.useState<string | null>(null);
  const [cancelledOtherName, setCancelledOtherName] = React.useState<string | null>(null);
  const [successModalText, setSuccessModalText] = React.useState('');
  const [cancelModalText, setCancelModalText] = React.useState('');
  const [showContactList, setShowContactList] = React.useState(false);
  const [promptTarget, setPromptTarget] = React.useState<{ type: 'emergency' | 'other', contactName?: string } | null>(null);

  const [liveCoords, setLiveCoords] = React.useState<Location.LocationObjectCoords | null>(null);
  const [liveAddress, setLiveAddress] = React.useState<string>('Detecting exact location...');

  React.useEffect(() => {
    let locationSub: Location.LocationSubscription | null = null;
    let isMounted = true;

    if (activeMode === 'location') {
      const startTracking = async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            if (isMounted) setLiveAddress('Location access denied. Please enable in Settings.');
            return;
          }

          const initialLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (!isMounted) return;
          
          setLiveCoords(initialLoc.coords);
          
          const geocode = await Location.reverseGeocodeAsync({
            latitude: initialLoc.coords.latitude,
            longitude: initialLoc.coords.longitude
          });
          
          if (isMounted && geocode && geocode.length > 0) {
            const g = geocode[0];
            const name = g.name || (g.streetNumber ? `${g.streetNumber} ${g.street}` : g.street) || 'Unknown Place';
            const city = g.city || g.subregion || g.region || g.country || '';
            const addr = city ? `${name}, ${city}` : name;
            setLiveAddress(addr.trim());
          }

          if (sharedEmergency || sharedOther) {
             locationSub = await Location.watchPositionAsync(
               { accuracy: Location.Accuracy.Highest, distanceInterval: 5, timeInterval: 4000 },
               (newLoc) => {
                 if (isMounted) setLiveCoords(newLoc.coords);
               }
             );
          }
        } catch (e) {
           if (isMounted) setLiveAddress('Error acquiring location signal.');
        }
      };
      startTracking();
    }

    return () => {
      isMounted = false;
      if (locationSub) locationSub.remove();
    };
  }, [activeMode, sharedEmergency, sharedOther]);

  const executeEmergencyShare = () => {
    const contactName = emergencyContacts[0]?.name || 'your emergency contacts';
    const msg = `Live location shared directly with ${contactName}. Broadcasting your route.`;
    speak(msg);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
    setSharedEmergency(true);
    setSuccessModalText(msg);
    setTimeout(() => setSuccessModalText(''), 4000);
  };

  const executeOtherShare = async (manualContactName?: string) => {
    if (manualContactName) {
      speak(`Accessing contacts. Live location shared with ${manualContactName}.`);
      setVoiceState('thinking');
      setTimeout(() => {
        setVoiceState('idle');
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
        setSharedOther(true);
        setSharedOtherName(manualContactName);
        setSuccessModalText(`Live location shared with ${manualContactName}. Link sent.`);
        setShowContactList(false);
        setTimeout(() => setSuccessModalText(''), 4000);
      }, 1000);
      return;
    }

    speak('Who would you like to share your location with? Please speak their name now.');
    setVoiceState('listening');
    useNavidoorStore.setState({ lastAnnouncement: '🎤 Listening... Who to share with?' });
    
    await voiceRecordingService.startRecording(activeLanguageCode, async (autoText) => {
      if (autoText && autoText.trim()) {
        setVoiceState('thinking');
        setTimeout(() => {
          const name = autoText.trim();
          const msg = `Okay, sharing live location with ${name}. Link sent.`;
          speak(msg);
          setVoiceState('idle');
          try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
          setSharedOther(true);
          setSharedOtherName(name);
          setSuccessModalText(msg);
          setShowContactList(false);
          setTimeout(() => setSuccessModalText(''), 4000);
        }, 1500);
      } else {
        setVoiceState('idle');
        speak('I did not catch a name. Share cancelled.');
      }
    });
  };

  const promptShareBoth = async (target: { type: 'emergency' | 'other', contactName?: string }) => {
    setPromptTarget(target);
    speak('You are already sharing your location. Do you want to share it to both types of contacts? Say yes or no.');
    setVoiceState('listening');
    useNavidoorStore.setState({ lastAnnouncement: '🎤 Listening... Say Yes or No' });
    
    await voiceRecordingService.startRecording(activeLanguageCode, async (autoText) => {
      setVoiceState('thinking');
      const text = (autoText || '').toLowerCase().trim();
      if (text.includes('yes') || text.includes('yup') || text.includes('yeah') || text.includes('हाँ') || text.includes('हो')) {
        setVoiceState('idle');
        handlePromptBothConfirm(target);
      } else {
        setVoiceState('idle');
        setPromptTarget(null);
        speak('Okay, cancelled additional location sharing.');
      }
    });
  };

  const handlePromptBothConfirm = (target: { type: 'emergency' | 'other', contactName?: string }) => {
    setPromptTarget(null);
    setVoiceState('idle');
    
    if (target.type === 'emergency') {
      executeEmergencyShare();
    } else {
      if (target.contactName) {
        executeOtherShare(target.contactName);
      } else {
        setShowContactList(true);
        executeOtherShare();
      }
    }
  };

  const handlePromptBothCancel = () => {
    setPromptTarget(null);
    setVoiceState('idle');
    speak('Okay, cancelled additional location sharing.');
  };

  const handleEmergencySharePress = () => {
    if (sharedEmergency) {
      const msg = 'Emergency location sharing stopped.';
      speak(msg);
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch (e) {}
      setSharedEmergency(false);
      setCancelModalText(msg);
      setTimeout(() => setCancelModalText(''), 4000);
      return;
    }
    if (sharedOther) {
      promptShareBoth({ type: 'emergency' });
      return;
    }
    executeEmergencyShare();
  };

  const handleOtherContactPress = async () => {
    if (sharedOther) {
      const msg = 'Other contact location sharing stopped.';
      speak(msg);
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch (e) {}
      setSharedOther(false);
      const prevName = sharedOtherName;
      setSharedOtherName(null);
      setCancelledOtherName(prevName);
      setCancelModalText(msg);
      setTimeout(() => {
        setCancelModalText('');
        setCancelledOtherName(null);
      }, 4000);
      return;
    }
    if (sharedEmergency) {
      promptShareBoth({ type: 'other' });
      return;
    }
    await executeOtherShare();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.subSectionHeader}>
          <MapPin size={18} color="#0284C7" />
          <Text style={styles.subSectionTitle}>LIVE LOCATION SHARING</Text>
        </View>

        <TouchableOpacity 
          style={[styles.locationShareBtnEmergency, sharedEmergency && { backgroundColor: '#10B981', shadowColor: '#10B981' }]}
          onPress={handleEmergencySharePress}
          accessibilityLabel="Share location with Emergency Contacts"
        >
          <ShieldAlert size={20} color="#FFFFFF" />
          <View style={styles.locationBtnTextGroup}>
            <Text style={styles.locationBtnTitle}>{sharedEmergency ? 'SHARED TO EMERGENCY' : 'EMERGENCY CONTACTS'}</Text>
            <Text style={styles.locationBtnSub}>{sharedEmergency ? 'Live tracking active' : 'Share immediately with primary contacts'}</Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.locationShareBtnNormal, sharedOther && { backgroundColor: '#10B981', borderColor: '#059669' }]}>
          <TouchableOpacity 
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}
            onPress={handleOtherContactPress}
            accessibilityLabel="Share location with a normal contact"
          >
            <UserPlus size={20} color={sharedOther ? "#FFFFFF" : "#0F172A"} />
            <View style={styles.locationBtnTextGroup}>
              <Text style={[styles.locationBtnTitleNormal, sharedOther && { color: '#FFFFFF' }]}>
                {sharedOther && sharedOtherName ? `SHARED: ${sharedOtherName.toUpperCase()}` : 'OTHER CONTACT'}
              </Text>
              <Text style={[styles.locationBtnSubNormal, sharedOther && { color: '#E2E8F0' }]}>
                {sharedOther ? 'Live tracking active' : 'Choose a specific person via voice'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ padding: 16, borderLeftWidth: 1, borderLeftColor: sharedOther ? '#059669' : '#CBD5E1', justifyContent: 'center' }} 
            onPress={() => setShowContactList(!showContactList)}
            accessibilityLabel="Toggle contact list"
          >
            {showContactList ? <ChevronUp size={24} color={sharedOther ? "#FFFFFF" : "#0F172A"} /> : <ChevronDown size={24} color={sharedOther ? "#FFFFFF" : "#0F172A"} />}
          </TouchableOpacity>
        </View>

        {showContactList && (
          <View style={styles.contactListWrapper}>
            {DUMMY_CONTACTS.map((c, index) => {
              const isSelected = sharedOther && sharedOtherName?.toLowerCase() === c.name.toLowerCase();
              const isCancelled = cancelledOtherName?.toLowerCase() === c.name.toLowerCase();
              
              return (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.contactListItem, 
                  index === DUMMY_CONTACTS.length - 1 && { borderBottomWidth: 0 },
                  isSelected && { backgroundColor: '#10B981' },
                  isCancelled && { backgroundColor: '#E11D48' }
                ]}
                onPress={() => {
                  if (isSelected) {
                    handleOtherContactPress();
                  } else if (sharedEmergency && !sharedOther) {
                      promptShareBoth({ type: 'other', contactName: c.name });
                  } else {
                      executeOtherShare(c.name);
                  }
                }}
              >
                <View style={[styles.contactAvatar, (isSelected || isCancelled) && { backgroundColor: '#FFFFFF' }]}>
                  <Text style={[
                    styles.contactInitials, 
                    isSelected && { color: '#10B981' },
                    isCancelled && { color: '#E11D48' }
                  ]}>
                    {c.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, (isSelected || isCancelled) && { color: '#FFFFFF' }]}>{c.name}</Text>
                  <Text style={[styles.contactPhone, (isSelected || isCancelled) && { color: '#E2E8F0' }]}>{c.phone}</Text>
                </View>
                <Phone size={18} color={(isSelected || isCancelled) ? "#FFFFFF" : "#0284C7"} />
              </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.currentLocationBox}>
          <View style={styles.currentLocationHeader}>
            <MapPin size={14} color="#0284C7" />
            <Text style={styles.currentLocationTitle}>YOUR CURRENT LOCATION</Text>
          </View>
          <Text style={styles.currentLocationAddress}>{liveAddress}</Text>
          <Text style={styles.currentLocationCoords}>
            {liveCoords 
              ? `Lat: ${liveCoords.latitude.toFixed(5)}° N, Lon: ${liveCoords.longitude.toFixed(5)}° W` 
              : 'Acquiring GPS signal...'}
          </Text>
          <Text style={[
            styles.currentLocationStatus, 
            (sharedEmergency || sharedOther) ? { color: '#10B981' } : { color: '#64748B' }
          ]}>
            {(sharedEmergency || sharedOther) ? '🟢 Live broadcasting active' : '⚪ Not broadcasting'}
          </Text>
        </View>
      </View>

      {/* SUCCESS MODAL FOR LOCATION SHARING */}
      <Modal visible={!!successModalText} transparent animationType="fade">
        <View style={styles.successModalBackdrop}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <Check size={42} color="#FFFFFF" />
            </View>
            <Text style={styles.successModalTitle}>LOCATION SHARED</Text>
            <Text style={styles.successModalText}>{successModalText}</Text>
          </View>
        </View>
      </Modal>

      {/* CANCEL MODAL FOR LOCATION SHARING */}
      <Modal visible={!!cancelModalText} transparent animationType="fade">
        <View style={styles.successModalBackdrop}>
          <View style={styles.cancelModalCard}>
            <View style={styles.cancelIconCircle}>
              <X size={42} color="#FFFFFF" />
            </View>
            <Text style={styles.cancelModalTitle}>SHARING STOPPED</Text>
            <Text style={styles.successModalText}>{cancelModalText}</Text>
          </View>
        </View>
      </Modal>

      {/* PROMPT BOTH MODAL */}
      <Modal visible={!!promptTarget} transparent animationType="fade">
        <View style={styles.successModalBackdrop}>
          <View style={styles.promptModalCard}>
            <Text style={styles.promptModalTitle}>SHARE TO BOTH?</Text>
            <Text style={styles.successModalText}>
              You are already sharing your location. Do you want to share it to both types of contacts?
            </Text>
            <View style={styles.promptBtnRow}>
              <TouchableOpacity style={styles.promptBtnNo} onPress={handlePromptBothCancel}>
                <Text style={styles.promptBtnNoText}>NO</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.promptBtnYes} onPress={() => promptTarget && handlePromptBothConfirm(promptTarget)}>
                <Text style={styles.promptBtnYesText}>YES</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#475569',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  subSectionTitle: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  locationShareBtnEmergency: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E11D48',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 12,
    marginTop: 8,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  locationShareBtnNormal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
  },
  locationBtnTextGroup: {
    flex: 1,
  },
  locationBtnTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  locationBtnSub: {
    color: '#FFE4E6',
    fontSize: 12,
    marginTop: 2,
  },
  locationBtnTitleNormal: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  locationBtnSubNormal: {
    color: '#334155',
    fontSize: 12,
    marginTop: 2,
  },
  contactListWrapper: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  contactListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
  },
  contactPhone: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  currentLocationBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  currentLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  currentLocationTitle: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.0,
  },
  currentLocationAddress: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  currentLocationCoords: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 8,
  },
  currentLocationStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  successModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successModalTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  successModalText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  cancelModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  cancelIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E11D48',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelModalTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  promptModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  promptModalTitle: {
    color: '#0284C7',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  promptBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
    marginTop: 24,
  },
  promptBtnNo: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
  },
  promptBtnNoText: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 14,
  },
  promptBtnYes: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    alignItems: 'center',
  },
  promptBtnYesText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
});
