import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Platform, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavidoorStore } from '../../store/useNavidoorStore';
import { SUPPORTED_LANGUAGES_META } from '../../services/voiceAssistantBackend';
import { Mic, User, Phone, ShieldAlert, Pill, Sparkles, ArrowRight, ArrowLeft, Check } from 'lucide-react-native';

import { voiceRecordingService } from '../../services/voiceRecordingService';
import { requestWhisperSTT } from '../../services/voiceAssistantBackend';
import { stopSpeech } from '../../utils/speechUtils';
import { UnifiedMicButton } from '../common/UnifiedMicButton';

export const VoiceOnboardingModal: React.FC = () => {
  const { 
    userRole,
    isFirstTimeUser, 
    setIsFirstTimeUser, 
    userName, 
    setUserName, 
    userPhone, 
    setUserPhone, 
    userLanguage, 
    setUserLanguage,
    activeLanguageCode,
    setActiveLanguageCode, 
    emergencyContacts, 
    medicines, 
    speak 
  } = useNavidoorStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [inputName, setInputName] = useState(userName);
  const [inputPhone, setInputPhone] = useState(userPhone);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (isFirstTimeUser && userRole === 'navidoor_user') {
      setStep(1);
      setTimeout(() => {
        speakPromptForStep(1, userLanguage);
      }, 500);
    } else {
      setStep(1);
    }
  }, [isFirstTimeUser, userRole]);

  const handlePrevStep = () => {
    if (step > 1) {
      const prevStep = (step - 1) as 1 | 2 | 3 | 4 | 5;
      setStep(prevStep);
      speakPromptForStep(prevStep);
    }
  };

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
      setStep(1);
      setIsFirstTimeUser(false);
      speak('Starting live AI vision assist.');
    }
  };

  const handleVoiceSetupAnswer = async () => {
    stopSpeech();

    if (isListening) {
      setIsListening(false);
      const { blob, uri, liveTranscript } = await voiceRecordingService.stopRecording();
      let answer = liveTranscript ? liveTranscript.trim().toLowerCase() : '';
      if (!answer && (blob || uri)) {
        const text = await requestWhisperSTT(blob, activeLanguageCode, uri || 'setup_mic');
        if (text) answer = text.trim().toLowerCase();
      }

      if (answer) {
        // Voice Back / Previous Step Command
        if (answer.includes('back') || answer.includes('previous') || answer.includes('go back') || answer.includes('पीछे') || answer.includes('मागे')) {
          handlePrevStep();
          return;
        }

        if (step === 1) {
          const matchedLang = SUPPORTED_LANGUAGES_META.find(
            l => answer.includes(l.name.toLowerCase()) || answer.includes(l.nativeName.toLowerCase())
          );
          if (matchedLang) {
            setActiveLanguageCode(matchedLang.code);
            setUserLanguage(matchedLang.name);
            speak(`Language selected: ${matchedLang.name}. Moving to Step 2.`);
          } else {
            speak(`Language set to English. Moving to Step 2.`);
          }
          setStep(2);
        } else if (step === 2) {
          const cleanName = answer.replace(/my name is|i am|name is/gi, '').trim();
          const finalName = cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : inputName;
          setInputName(finalName);
          setUserName(finalName);
          speak(`Name set to ${finalName}. Moving to Step 3.`);
          setStep(3);
        } else if (step === 3) {
          setInputPhone(answer);
          setUserPhone(answer);
          speak(`Phone number saved. Moving to Step 4.`);
          setStep(4);
        } else if (step === 4) {
          speak(`Emergency contact confirmed. Moving to Step 5.`);
          setStep(5);
        } else if (step === 5) {
          speak(`Medicine schedule confirmed. Setup complete.`);
          setStep(6);
        } else {
          setStep(1);
          setIsFirstTimeUser(false);
          speak('Starting live AI vision assist.');
        }
      } else {
        speak('No speech detected. Please tap the microphone and speak your setup answer.');
      }
    } else {
      setIsListening(true);
      await voiceRecordingService.startRecording(activeLanguageCode, async (autoText) => {
        if (autoText && autoText.trim()) {
          setIsListening(false);
          const answer = autoText.trim().toLowerCase();

          // Voice Back / Previous Step Command
          if (answer.includes('back') || answer.includes('previous') || answer.includes('go back') || answer.includes('पीछे') || answer.includes('मागे')) {
            handlePrevStep();
            return;
          }

          if (step === 1) {
            const matchedLang = SUPPORTED_LANGUAGES_META.find(
              l => answer.includes(l.name.toLowerCase()) || answer.includes(l.nativeName.toLowerCase())
            );
            if (matchedLang) {
              setActiveLanguageCode(matchedLang.code);
              setUserLanguage(matchedLang.name);
              speak(`Language selected: ${matchedLang.name}. Moving to Step 2.`);
            } else {
              speak(`Language set to English. Moving to Step 2.`);
            }
            setStep(2);
          } else if (step === 2) {
            const cleanName = answer.replace(/my name is|i am|name is/gi, '').trim();
            const finalName = cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : inputName;
            setInputName(finalName);
            setUserName(finalName);
            speak(`Name set to ${finalName}. Moving to Step 3.`);
            setStep(3);
          } else if (step === 3) {
            setInputPhone(answer);
            setUserPhone(answer);
            speak(`Phone number saved. Moving to Step 4.`);
            setStep(4);
          } else if (step === 4) {
            speak(`Emergency contact confirmed. Moving to Step 5.`);
            setStep(5);
          } else if (step === 5) {
            speak(`Medicine schedule confirmed. Setup complete.`);
            setStep(6);
          } else {
            setStep(1);
            setIsFirstTimeUser(false);
            speak('Starting live AI vision assist.');
          }
        }
      });
    }
  };

  const speakPromptForStep = (currentStep: number, langChoice = userLanguage) => {
    switch (currentStep) {
      case 1:
        speak(
          `Welcome to NAVIDOOR AI Vision Assist. Let's set up your profile. Step 1: Select your preferred offline voice language from 10 supported options. Tap your choice.`
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
          `Phone number saved. Step 4: Confirm your primary emergency contact. Set to Sunita Sharma, Daughter, phone number +91 98765-43210. Tap anywhere to confirm.`
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

  if (!isFirstTimeUser || userRole !== 'navidoor_user') return null;

  return (
    <Modal visible={isFirstTimeUser} transparent statusBarTranslucent animationType="fade">
      <View style={styles.fullScreenWrapper}>
        <StatusBar barStyle="light-content" backgroundColor="#64748B" />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Header Branding */}
            <View style={styles.brandRow}>
              <Sparkles size={24} color="#0284C7" />
              <Text style={styles.brandTitle}>NAVIDOOR AI SETUP</Text>
            </View>

            {/* Center Voice Mic Indicator */}
            <TouchableOpacity 
              style={styles.micAnchorContainer}
              onPress={(e) => {
                e.stopPropagation();
                handleVoiceSetupAnswer();
              }}
              accessibilityLabel="Tap to speak setup answer"
            >
              <UnifiedMicButton
                voiceState={isListening ? 'listening' : 'idle'}
                onPress={handleVoiceSetupAnswer}
                showLabel={false}
                size={68}
              />
            </TouchableOpacity>

            {/* STEP 1: LANGUAGE SELECTION */}
            {step === 1 && (
              <View style={styles.stepCard}>
                <Text style={styles.stepTag}>STEP 1 OF 6 • VOICE LANGUAGE (OFFLINE ENGINE)</Text>
                <Text style={styles.stepTitle}>Select Preferred Language</Text>
                
                <View style={styles.langGrid}>
                  {SUPPORTED_LANGUAGES_META.map((lang) => {
                    const isActive = activeLanguageCode === lang.code;
                    return (
                      <TouchableOpacity
                        key={lang.code}
                        style={[styles.langChip, isActive && styles.langChipActive]}
                        onPress={(e) => {
                          e.stopPropagation();
                          setActiveLanguageCode(lang.code);
                          setUserLanguage(lang.name);
                          speak(`Language selected: ${lang.name}`);
                        }}
                        accessibilityLabel={`Select language ${lang.name}`}
                      >
                        <Text style={{ fontSize: 16 }}>{lang.flag}</Text>
                        <Text style={[styles.langText, isActive && styles.langTextActive]}>{lang.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* STEP 2: USER NAME */}
            {step === 2 && (
              <View style={styles.stepCard}>
                <Text style={styles.stepTag}>STEP 2 OF 6 • USER PROFILE</Text>
                <Text style={styles.stepTitle}>What is your name?</Text>
                <Text style={styles.stepDesc}>Speak your full name into the microphone or type below.</Text>
                
                <View style={styles.inputBox}>
                  <User size={20} color="#0284C7" />
                  <TextInput
                    style={styles.textInput}
                    value={inputName}
                    onChangeText={setInputName}
                    placeholder="Enter your name..."
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>
            )}

            {/* STEP 3: USER PHONE */}
            {step === 3 && (
              <View style={styles.stepCard}>
                <Text style={styles.stepTag}>STEP 3 OF 6 • CONTACT INFO</Text>
                <Text style={styles.stepTitle}>Your Phone Number</Text>
                <Text style={styles.stepDesc}>Used for emergency SMS alerts and family caregiver connection.</Text>

                <View style={styles.inputBox}>
                  <Phone size={20} color="#0284C7" />
                  <TextInput
                    style={styles.textInput}
                    value={inputPhone}
                    onChangeText={setInputPhone}
                    keyboardType="phone-pad"
                    placeholder="Enter phone number..."
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>
            )}

            {/* STEP 4: EMERGENCY CONTACT */}
            {step === 4 && (
              <View style={styles.stepCard}>
                <Text style={styles.stepTag}>STEP 4 OF 6 • EMERGENCY CONTACT</Text>
                <Text style={styles.stepTitle}>Primary Contact Confirmed</Text>

                {emergencyContacts.map((c) => (
                  <View key={c.id} style={styles.contactItem}>
                    <ShieldAlert size={20} color="#E11D48" />
                    <View style={styles.contactTextGroup}>
                      <Text style={styles.contactName}>{c.name} ({c.relation})</Text>
                      <Text style={styles.contactPhone}>{c.phone}</Text>
                    </View>
                    <Check size={20} color="#0284C7" />
                  </View>
                ))}
              </View>
            )}

            {/* STEP 5: MEDICINE SCANNER SETUP */}
            {step === 5 && (
              <View style={styles.stepCard}>
                <Text style={styles.stepTag}>STEP 5 OF 6 • MEDICINE TRACKER & DOSAGE</Text>
                <Text style={styles.stepTitle}>Prescription Schedule</Text>

                {medicines.map((m) => (
                  <View key={m.id} style={styles.medItem}>
                    <Pill size={20} color="#0284C7" />
                    <View style={styles.contactTextGroup}>
                      <Text style={styles.contactName}>{m.name}</Text>
                      <Text style={styles.contactPhone}>{m.dosage} • {m.instructions}</Text>
                    </View>
                    <Check size={20} color="#0284C7" />
                  </View>
                ))}
              </View>
            )}

            {/* STEP 6: SETUP COMPLETE */}
            {step === 6 && (
              <View style={styles.stepCard}>
                <Text style={styles.stepTag}>STEP 6 OF 6 • SETUP COMPLETE</Text>
                <Text style={styles.stepTitle}>Ready for AI Vision Assist</Text>
                <Text style={styles.stepSub}>
                  All profile settings, emergency contacts, and language options are configured.
                </Text>
              </View>
            )}

            {/* DUAL ACTION BUTTON ROW: PREVIOUS & CONTINUE */}
            <View style={styles.actionRow}>
              {step > 1 && (
                <TouchableOpacity
                  style={styles.prevBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePrevStep();
                  }}
                  accessibilityLabel="Go back to previous setup step"
                  accessibilityHint="Tap to return to the previous setup step"
                >
                  <ArrowLeft size={18} color="#0284C7" />
                  <Text style={styles.prevBtnText}>BACK</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[styles.actionBtn, step === 1 && { flex: 1 }]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleNextStep();
                }}
                accessibilityLabel="Advance setup step"
              >
                <Text style={styles.actionBtnText}>
                  {step === 6 ? 'START AI ASSIST' : 'CONTINUE'}
                </Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#64748B',
    zIndex: 9999,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#64748B',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#64748B',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  brandTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  micAnchorContainer: {
    marginBottom: 24,
  },
  stepCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#475569',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  stepTag: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  stepTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
  },
  stepDesc: {
    color: '#334155',
    fontSize: 14,
    marginBottom: 16,
  },
  stepSub: {
    color: '#334155',
    fontSize: 14,
    marginTop: 4,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
  },
  langChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  langText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  langTextActive: {
    color: '#FFFFFF',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 54,
    gap: 10,
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
  },
  textInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    padding: 14,
    borderRadius: 16,
    gap: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  contactTextGroup: {
    flex: 1,
  },
  contactName: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 15,
  },
  contactPhone: {
    color: '#334155',
    fontSize: 13,
    marginTop: 2,
  },
  medItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    padding: 14,
    borderRadius: 16,
    gap: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    gap: 12,
  },
  prevBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E2E8F0',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    minHeight: 56,
  },
  prevBtnText: {
    color: '#0284C7',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.8,
  },
  actionBtn: {
    flex: 1.5,
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 10,
    minHeight: 56,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});

