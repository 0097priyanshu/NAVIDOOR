import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { Mic, Globe, User, Phone, ShieldAlert, Pill, Sparkles, ArrowRight, Check } from 'lucide-react-native';

export const VoiceOnboardingModal: React.FC = () => {
  const { 
    isFirstTimeUser, 
    setIsFirstTimeUser, 
    userName, 
    setUserName, 
    userPhone, 
    setUserPhone, 
    userLanguage, 
    setUserLanguage, 
    emergencyContacts, 
    medicines, 
    speak 
  } = useNavidoorStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [inputName, setInputName] = useState(userName);
  const [inputPhone, setInputPhone] = useState(userPhone);

  const languages = ['English (US)', 'Spanish', 'French', 'Hindi'];

  useEffect(() => {
    if (isFirstTimeUser) {
      setTimeout(() => {
        speakPromptForStep(1, 'English (US)');
      }, 500);
    }
  }, [isFirstTimeUser]);

  const speakPromptForStep = (currentStep: number, langChoice = userLanguage) => {
    switch (currentStep) {
      case 1:
        speak(
          `Welcome to NAVIDOOR AI Vision Assist. Let's set up your profile. Step 1: Select your preferred voice language. Available options are: 1, English US. 2, Spanish. 3, French. 4, Hindi. Tap your choice or tap anywhere to confirm.`
        );
        break;
      case 2:
        speak(
          `Language set to ${langChoice}. Step 2: What is your name? Current name set to ${inputName}. Tap anywhere to confirm.`
        );
        break;
      case 3:
        speak(
          `Hello ${inputName}. Step 3: Enter your personal phone number for emergency SMS notifications. Current number is ${inputPhone}. Tap anywhere to confirm.`
        );
        break;
      case 4:
        speak(
          `Phone number saved. Step 4: Confirm your primary emergency contact. Set to Sarah Jenkins, Daughter, phone number +1 555-234-5678. Tap anywhere to confirm.`
        );
        break;
      case 5:
        speak(
          `Emergency contact confirmed. Step 5: Medicine tracker setup. Currently loaded medicine is Lisinopril 10mg. Tap anywhere to save prescription schedule.`
        );
        break;
      case 6:
        speak(
          `Setup complete! All profile details saved for ${inputName}. NAVIDOOR AI Vision Assist is now active with live camera and voice guidance.`
        );
        break;
    }
  };

  if (!isFirstTimeUser) return null;

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
      speakPromptForStep(2);
    } else if (step === 2) {
      setUserName(inputName);
      setStep(3);
      speakPromptForStep(3);
    } else if (step === 3) {
      setUserPhone(inputPhone);
      setStep(4);
      speakPromptForStep(4);
    } else if (step === 4) {
      setStep(5);
      speakPromptForStep(5);
    } else if (step === 5) {
      setStep(6);
      speakPromptForStep(6);
    } else {
      setIsFirstTimeUser(false);
      speak('Starting live AI vision assist.');
    }
  };

  return (
    <Modal visible={isFirstTimeUser} transparent animationType="fade">
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={0.98}
        onPress={handleNextStep}
        accessibilityLabel="Tap anywhere to advance setup"
      >
        <View style={styles.container}>
          {/* Header Branding */}
          <View style={styles.brandRow}>
            <Sparkles size={24} color="#FFFFFF" />
            <Text style={styles.brandTitle}>NAVIDOOR AI SETUP</Text>
          </View>

          {/* Center Voice Mic Indicator */}
          <TouchableOpacity 
            style={styles.micCircle} 
            onPress={(e) => {
              e.stopPropagation();
              speakPromptForStep(step);
            }}
            accessibilityLabel="Tap to re-hear voice options"
          >
            <Mic size={38} color="#000000" />
          </TouchableOpacity>

          {/* STEP 1: LANGUAGE SELECTION */}
          {step === 1 && (
            <View style={styles.stepCard}>
              <Text style={styles.stepTag}>STEP 1 OF 6 • VOICE LANGUAGE</Text>
              <Text style={styles.stepTitle}>Select Preferred Language</Text>
              
              <View style={styles.langGrid}>
                {languages.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.langChip, userLanguage === lang && styles.langChipActive]}
                    onPress={(e) => {
                      e.stopPropagation();
                      setUserLanguage(lang);
                      speak(`Language selected: ${lang}`);
                    }}
                    accessibilityLabel={`Select language ${lang}`}
                  >
                    <Globe size={18} color={userLanguage === lang ? '#000000' : '#FFFFFF'} />
                    <Text style={[styles.langText, userLanguage === lang && styles.langTextActive]}>
                      {lang}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 2: USER NAME */}
          {step === 2 && (
            <View style={styles.stepCard}>
              <Text style={styles.stepTag}>STEP 2 OF 6 • USER PROFILE</Text>
              <Text style={styles.stepTitle}>What is your name?</Text>
              
              <TouchableOpacity style={styles.inputWrapper} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                <User size={20} color="#FFFFFF" />
                <TextInput
                  style={styles.input}
                  value={inputName}
                  onChangeText={setInputName}
                  placeholder="Enter your name"
                  placeholderTextColor="#A0A0A0"
                />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: PERSONAL PHONE */}
          {step === 3 && (
            <View style={styles.stepCard}>
              <Text style={styles.stepTag}>STEP 3 OF 6 • SMS NOTIFICATIONS</Text>
              <Text style={styles.stepTitle}>Your Phone Number</Text>
              
              <TouchableOpacity style={styles.inputWrapper} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                <Phone size={20} color="#FFFFFF" />
                <TextInput
                  style={styles.input}
                  value={inputPhone}
                  onChangeText={setInputPhone}
                  keyboardType="phone-pad"
                  placeholder="Enter phone number"
                  placeholderTextColor="#A0A0A0"
                />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: EMERGENCY SOS CONTACT */}
          {step === 4 && (
            <View style={styles.stepCard}>
              <Text style={styles.stepTag}>STEP 4 OF 6 • EMERGENCY SOS</Text>
              <Text style={styles.stepTitle}>Primary Emergency Contact</Text>
              
              {emergencyContacts.map((c) => (
                <View key={c.id} style={styles.contactItem}>
                  <ShieldAlert size={20} color="#E11D48" />
                  <View style={styles.contactTextGroup}>
                    <Text style={styles.contactName}>{c.name} ({c.relation})</Text>
                    <Text style={styles.contactPhone}>{c.phone}</Text>
                  </View>
                  <Check size={20} color="#05A357" />
                </View>
              ))}
            </View>
          )}

          {/* STEP 5: MEDICINE SCANNER SETUP */}
          {step === 5 && (
            <View style={styles.stepCard}>
              <Text style={styles.stepTag}>STEP 5 OF 6 • MEDICINE TRACKER</Text>
              <Text style={styles.stepTitle}>Upload Daily Medicines</Text>
              
              <View style={styles.medItem}>
                <Pill size={20} color="#FFFFFF" />
                <Text style={styles.medText}>{medicines[0]?.name || 'Lisinopril 10mg'} (Loaded)</Text>
              </View>
            </View>
          )}

          {/* STEP 6: SETUP COMPLETE */}
          {step === 6 && (
            <View style={styles.stepCard}>
              <Text style={styles.stepTag}>STEP 6 OF 6 • READY</Text>
              <Text style={styles.stepTitle}>Setup Complete!</Text>
              <Text style={styles.stepSub}>
                Profile saved for {inputName}. NAVIDOOR is observing your surroundings via camera and voice.
              </Text>
            </View>
          )}

          {/* Next Step Action Button */}
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={handleNextStep}
            accessibilityLabel="Confirm and continue setup"
          >
            <Text style={styles.actionBtnText}>
              {step === 6 ? 'START LIVE AI VISION ASSIST' : 'CONFIRM & CONTINUE'}
            </Text>
            <ArrowRight size={22} color="#000000" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  micCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },
  stepCard: {
    width: '100%',
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  stepTag: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
  },
  stepSub: {
    color: '#A0A0A0',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  langChip: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 8,
  },
  langChipActive: {
    backgroundColor: '#FFFFFF',
  },
  langText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  langTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 14,
    marginTop: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 52,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    borderRadius: 16,
    gap: 12,
    marginTop: 14,
  },
  contactTextGroup: {
    flex: 1,
  },
  contactName: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  contactPhone: {
    color: '#A0A0A0',
    fontSize: 13,
    marginTop: 2,
  },
  medItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 14,
    borderRadius: 16,
    gap: 10,
    marginTop: 14,
  },
  medText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  actionBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    width: '100%',
    gap: 10,
    minHeight: 64,
  },
  actionBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
