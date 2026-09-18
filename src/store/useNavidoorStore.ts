import { create } from 'zustand';
import { 
  NavMode, 
  VoiceState, 
  ThemeMode, 
  FontScale, 
  DetectedObject, 
  MedicineInfo, 
  EmergencyContact,
  ContextInsight,
  SupportedLanguageCode
} from '../types';
import { speakAnnouncement, stopSpeech, playObstacleBeep } from '../utils/speechUtils';
import { getTranslation } from '../utils/translations';
import { voiceCommandProcessor } from '../services/voiceCommandProcessor';
import { voiceSearchService } from '../services/voiceSearchService';
import { voiceConversationService } from '../services/voiceConversationService';
import * as Haptics from 'expo-haptics';
import { requestTranslation } from '../services/voiceAssistantBackend';

interface NavidoorState {
  // Voice System First
  voiceState: VoiceState;
  setVoiceState: (state: VoiceState) => void;
  lastAnnouncement: string;
  speak: (text: string, interrupt?: boolean) => Promise<void> | void;
  stopVoice: () => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  processVoiceInput: (input: string) => Promise<void>;

  // User Profile & Voice Onboarding
  userName: string;
  setUserName: (name: string) => void;
  userPhone: string;
  setUserPhone: (phone: string) => void;
  userLanguage: string;
  setUserLanguage: (lang: string) => void;
  activeLanguageCode: SupportedLanguageCode;
  setActiveLanguageCode: (code: SupportedLanguageCode) => void;
  isFirstTimeUser: boolean;
  setIsFirstTimeUser: (firstTime: boolean) => void;

  // Active Mode & Wheel Navigation
  activeMode: NavMode;
  setActiveMode: (mode: NavMode) => void;
  rotateWheelToMode: (mode: NavMode) => void;
  cycleNextMode: () => void;
  cyclePrevMode: () => void;

  cameraRef: any;
  setCameraRef: (ref: any) => void;
  capturedPhotoUri: string | null;
  isCapturedPhotoModalOpen: boolean;
  setIsCapturedPhotoModalOpen: (open: boolean) => void;
  capturePhotoAndAnalyze: () => Promise<void>;

  spatialAudioEnabled: boolean;
  toggleSpatialAudio: () => void;

  currentInsight: ContextInsight;
  setCurrentInsight: (insight: ContextInsight) => void;

  isSimulatedCamera: boolean;
  setSimulatedCamera: (simulated: boolean) => void;
  cameraFacing: 'back' | 'front';
  setCameraFacing: (facing: 'back' | 'front') => void;
  toggleCameraFacing: () => void;
  torchOn: boolean;
  setTorchOn: (on: boolean) => void;
  toggleTorch: () => void;
  isDetectionActive: boolean;
  toggleDetection: () => void;
  detectedObjects: DetectedObject[];
  generateSceneDescription: () => void;

  themeMode: ThemeMode;
  setThemeMode: (theme: ThemeMode) => void;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;

  destination: string;
  navSteps: { id: string; instruction: string; distanceText: string }[];
  currentStepIndex: number;
  nextStep: () => void;

  activeReadText: string;
  isReadingAloud: boolean;
  toggleReadAloud: () => void;

  medicines: MedicineInfo[];
  detectedMedicine: MedicineInfo | null;
  confirmMedicineTaken: (medicineId: string) => void;

  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;

  isSosModalOpen: boolean;
  setSosModalOpen: (open: boolean) => void;
  emergencyContacts: EmergencyContact[];
  triggerSosAlert: () => void;

  isFamilyCompanionOpen: boolean;
  setFamilyCompanionOpen: (open: boolean) => void;

  isDesignSystemOpen: boolean;
  setDesignSystemOpen: (open: boolean) => void;

  // Family Mode additions
  userRole: 'undecided' | 'navidoor_user' | 'family_member';
  setUserRole: (role: 'undecided' | 'navidoor_user' | 'family_member') => void;
  familyUser: { name: string; phone: string; email?: string; relationship?: string } | null;
  setFamilyUser: (user: any) => void;
  familyConnectedUserPhone: string | null;
  setFamilyConnectedUserPhone: (phone: string | null) => void;
  familyConnectionStatus: 'idle' | 'pending' | 'connected' | 'rejected';
  setFamilyConnectionStatus: (status: 'idle' | 'pending' | 'connected' | 'rejected') => void;
  familyConnectedUserData: any | null;
  setFamilyConnectedUserData: (data: any) => void;
  familyRequests: any[];
  setFamilyRequests: (requests: any[]) => void;
  activeSosAlert: any | null;
  setActiveSosAlert: (alert: any | null) => void;
}

const INITIAL_OBJECTS: DetectedObject[] = [
  {
    id: 'obj-1',
    label: 'Chair',
    emojiIcon: '🪑',
    category: 'furniture',
    confidence: 0.95,
    distanceMeters: 1.2,
    direction: 'center',
    xRatio: 0.32,
    yRatio: 0.42,
  },
  {
    id: 'obj-2',
    label: 'Door',
    emojiIcon: '🚪',
    category: 'door',
    confidence: 0.98,
    distanceMeters: 2.8,
    direction: 'right',
    xRatio: 0.65,
    yRatio: 0.28,
  },
  {
    id: 'obj-3',
    label: 'Person',
    emojiIcon: '🚶',
    category: 'person',
    confidence: 0.92,
    distanceMeters: 5.4,
    direction: 'left',
    xRatio: 0.12,
    yRatio: 0.35,
  },
];

const INITIAL_MEDICINES: MedicineInfo[] = [
  {
    id: 'med-1',
    name: 'Lisinopril 10mg',
    dosage: '1 Pill',
    instructions: 'Take daily after breakfast',
    remainingPills: 14,
    nextScheduledTime: '8:00 AM Today',
    prescribedFor: 'Blood Pressure',
  },
];

const INITIAL_EMERGENCY_CONTACTS: EmergencyContact[] = [
  { id: 'ec-1', name: 'Sunita Sharma', relation: 'Daughter', phone: '+91 98765 43210', isPrimary: true },
];

export const useNavidoorStore = create<NavidoorState>((set, get) => ({
  // Voice System
  voiceState: 'idle',
  setVoiceState: (state) => set({ voiceState: state }),
  lastAnnouncement: 'NAVIDOOR AI Vision Assist Ready. Tap mic or rotate wheel.',
  speechRate: 1.0,
  setSpeechRate: (rate) => set({ speechRate: rate }),
  speak: async (text, interrupt = true) => {
    const activeLang = get().activeLanguageCode;
    let finalSpeechText = text;
    
    // Auto-translate any hardcoded English strings to the active selected language
    if (activeLang !== 'en') {
      finalSpeechText = await requestTranslation(text, activeLang);
    }

    set({ lastAnnouncement: finalSpeechText, voiceState: 'speaking' });
    speakAnnouncement(finalSpeechText, { rate: get().speechRate, interrupt, languageCode: activeLang });
    
    setTimeout(() => {
      if (get().voiceState === 'speaking') {
        set({ voiceState: 'idle' });
      }
    }, Math.max(2500, finalSpeechText.length * 60));
  },
  stopVoice: () => {
    stopSpeech();
    set({ voiceState: 'idle' });
  },

  processVoiceInput: async (input: string) => {
    if (!input || !input.trim()) return;

    set({ voiceState: 'thinking' });
    const parsed = voiceCommandProcessor.parseCommand(input);

    if (parsed.isCommand) {
      if (parsed.action === 'openProfileModal') {
        get().setIsProfileModalOpen(true);
        get().speak(parsed.feedbackPrompt || 'Opening Language and Profile settings.');
      } else if (parsed.action === 'logoutUser') {
        get().setIsProfileModalOpen(false);
        get().setFamilyUser(null);
        get().setFamilyConnectedUserPhone(null);
        get().setFamilyConnectedUserData(null);
        get().setFamilyConnectionStatus('idle');
        get().setUserRole('undecided');
        get().setIsFirstTimeUser(false);
        get().speak(parsed.feedbackPrompt || 'Logged out. Returning to role selection screen.');
      } else if (parsed.action === 'closeModal') {
        get().setIsProfileModalOpen(false);
        get().setSosModalOpen(false);
        get().setFamilyCompanionOpen(false);
        get().speak('Closing screen.');
      } else if (parsed.action === 'updateUserName' && parsed.valueString) {
        get().setUserName(parsed.valueString);
        get().speak(`Name updated to ${parsed.valueString}.`);
      } else if (parsed.action === 'updateUserPhone' && parsed.valueString) {
        get().setUserPhone(parsed.valueString);
        get().speak(`Phone number updated to ${parsed.valueString}.`);
      } else if (parsed.action === 'switchLanguage' && parsed.targetLanguage) {
        get().setActiveLanguageCode(parsed.targetLanguage);
        if (parsed.targetLanguageName) {
          get().setUserLanguage(parsed.targetLanguageName);
        }
        const confirmMsg = parsed.feedbackPrompt || `Language changed to ${parsed.targetLanguageName || parsed.targetLanguage}.`;
        get().speak(confirmMsg);
      } else if (parsed.action === 'switchMode' && parsed.targetMode) {
        get().setActiveMode(parsed.targetMode);
      } else if (parsed.action === 'cycleNextMode') {
        const modes: NavMode[] = ['assist', 'read', 'medicine', 'transport', 'navigate', 'family', 'history'];
        const currIdx = modes.indexOf(get().activeMode);
        const nextMode = modes[(currIdx + 1) % modes.length];
        get().setActiveMode(nextMode);
      } else if (parsed.action === 'addMedicine' && parsed.valueString) {
        const newMed = {
          id: `med-${Date.now()}`,
          name: parsed.valueString,
          dosage: '1 Pill',
          instructions: 'Take daily as prescribed',
          remainingPills: 20,
          nextScheduledTime: '8:00 AM Today',
          prescribedFor: 'General Health'
        };
        const currentMeds = get().medicines || [];
        set({ medicines: [newMed, ...currentMeds] });
        get().setActiveMode('medicine');
        get().speak(`Added new medicine: ${parsed.valueString}. Switched to Medicine mode.`);
      } else if (parsed.action === 'confirmMedicine') {
        const meds = get().medicines;
        if (meds && meds.length > 0) {
          get().confirmMedicineTaken(meds[0].id);
        } else {
          get().speak('No scheduled medicines to confirm.');
        }
      } else if (parsed.action === 'updateTheme' && parsed.targetTheme) {
        get().setThemeMode(parsed.targetTheme);
        get().speak(`Theme updated to ${parsed.targetTheme} mode.`);
      } else if (parsed.action === 'updateSpeechRate' && parsed.rateValue) {
        get().setSpeechRate(parsed.rateValue);
        get().speak(`Speech rate updated.`);
      } else if (parsed.action === 'updateFontScale' && parsed.targetFontScale) {
        get().setFontScale(parsed.targetFontScale);
        get().speak(`Text size set to ${parsed.targetFontScale}.`);
      } else if (parsed.action === 'toggleTorch') {
        get().toggleTorch();
      } else if (parsed.action === 'toggleCameraFacing') {
        get().toggleCameraFacing();
      } else if (parsed.action === 'triggerSosAlert') {
        get().triggerSosAlert();
      } else if (parsed.action === 'toggleSpatialAudio') {
        get().toggleSpatialAudio();
      } else if (parsed.action === 'voiceSearch') {
        const results = voiceSearchService.search(parsed.searchQuery || input, get().medicines);
        if (results.length > 0) {
          get().speak(`Voice search result: ${results[0].title}. ${results[0].detail}`);
        } else {
          get().speak(`No search results found for ${parsed.searchQuery || input}.`);
        }
      }
      return;
    }

    // Interactive Real-Time Voice Conversation Q&A & NLP Intent Engine
    try {
      const liveContext = {
        detectedObjects: get().detectedObjects,
        activeMode: get().activeMode,
        torchOn: get().torchOn
      };
      const { answer, intent } = await voiceConversationService.processUserSpeech(input, get().activeLanguageCode, liveContext);

      if (intent) {
        if (intent.action === 'logoutUser') {
          get().setIsProfileModalOpen(false);
          get().setFamilyUser(null);
          get().setFamilyConnectedUserPhone(null);
          get().setFamilyConnectedUserData(null);
          get().setFamilyConnectionStatus('idle');
          get().setUserRole('undecided');
          get().setIsFirstTimeUser(false);
        } else if (intent.action === 'switchLanguage' && intent.targetLanguage) {
          get().setActiveLanguageCode(intent.targetLanguage);
          if (intent.targetLanguageName) get().setUserLanguage(intent.targetLanguageName);
        } else if (intent.action === 'switchMode' && intent.targetMode) {
          get().setActiveMode(intent.targetMode);
        } else if (intent.action === 'cycleNextMode') {
          const modes: NavMode[] = ['assist', 'read', 'medicine', 'transport', 'navigate', 'family', 'history'];
          const currIdx = modes.indexOf(get().activeMode);
          get().setActiveMode(modes[(currIdx + 1) % modes.length]);
        } else if (intent.action === 'updateProfile') {
          if (intent.updateField === 'userName' && intent.updateValue) get().setUserName(intent.updateValue);
          if (intent.updateField === 'userPhone' && intent.updateValue) get().setUserPhone(intent.updateValue);
        } else if (intent.action === 'manageMedication') {
          if (intent.subAction === 'add' && intent.medicationName) {
            const newMed = {
              id: `med-${Date.now()}`,
              name: intent.medicationName,
              dosage: '1 Pill',
              instructions: 'Take daily as prescribed',
              remainingPills: 20,
              nextScheduledTime: '8:00 AM Today',
              prescribedFor: 'General Health'
            };
            set({ medicines: [newMed, ...(get().medicines || [])] });
            get().setActiveMode('medicine');
          } else if (intent.subAction === 'confirm') {
            const meds = get().medicines;
            if (meds && meds.length > 0) get().confirmMedicineTaken(meds[0].id);
          }
        } else if (intent.action === 'updateSettings') {
          if (intent.theme) get().setThemeMode(intent.theme);
          if (intent.speechRate) get().setSpeechRate(intent.speechRate);
          if (intent.fontScale) get().setFontScale(intent.fontScale);
        }
      }

      if (answer) {
        get().speak(answer);
      }
    } catch (err: any) {
      console.error('[NavidoorStore] Voice AI Assistant Error:', err.message || err);
      get().stopVoice();
      get().speak('AI assistant is temporarily unavailable.');
    }
  },

  // User Profile
  userName: 'Aadya',
  setUserName: (name) => set({ userName: name }),
  userPhone: '+91 98123 45678',
  setUserPhone: (phone) => set({ userPhone: phone }),
  userLanguage: 'English (US)',
  activeLanguageCode: 'en',
  setUserLanguage: (lang) => set({ userLanguage: lang }),
  setActiveLanguageCode: (code) => {
    const langNames: Record<string, string> = {
      en: 'English (US)',
      hi: 'Hindi (हिंदी)',
      mr: 'Marathi (मराठी)',
      gu: 'Gujarati (ગુજરાતી)',
      pa: 'Punjabi (ਪੰਜਾਬੀ)',
      bn: 'Bengali (বাংলা)',
      ta: 'Tamil (தமிழ்)',
      te: 'Telugu (తెలుగు)',
      kn: 'Kannada (ಕನ್ನಡ)',
      ml: 'Malayalam (മലയാളം)'
    };
    const displayName = langNames[code] || 'English (US)';
    set({ activeLanguageCode: code, userLanguage: displayName });
    const t = getTranslation(code);
    get().speak(t.languageChanged);
  },
  isFirstTimeUser: true,
  setIsFirstTimeUser: (firstTime) => set({ isFirstTimeUser: firstTime }),

  // Active Mode & Wheel Navigation
  activeMode: 'assist',
  setActiveMode: (mode) => {
    set({ activeMode: mode });
    try {
      Haptics.selectionAsync();
    } catch (e) {}

    const t = getTranslation(get().activeLanguageCode);
    const modeInfo = t.modes[mode] || { name: mode.toUpperCase(), description: `${mode.toUpperCase()} mode selected` };
    const insight: ContextInsight = { id: `c-${mode}`, text: modeInfo.description, type: 'info' };
    set({ currentInsight: insight });
    
    get().speak(`${modeInfo.name}. ${modeInfo.description}`);
  },

  rotateWheelToMode: (mode) => {
    get().setActiveMode(mode);
  },
  cycleNextMode: () => {
    const modes: NavMode[] = ['assist', 'navigate', 'read', 'medicine', 'transport', 'location', 'emergency', 'medical', 'family', 'history', 'languages', 'settings'];
    const currIdx = modes.indexOf(get().activeMode);
    const nextIdx = (currIdx + 1) % modes.length;
    get().rotateWheelToMode(modes[nextIdx]);
  },
  cyclePrevMode: () => {
    const modes: NavMode[] = ['assist', 'navigate', 'read', 'medicine', 'transport', 'location', 'emergency', 'medical', 'family', 'history', 'languages', 'settings'];
    const currIdx = modes.indexOf(get().activeMode);
    const prevIdx = (currIdx - 1 + modes.length) % modes.length;
    get().rotateWheelToMode(modes[prevIdx]);
  },

  spatialAudioEnabled: true,
  toggleSpatialAudio: () => {
    const next = !get().spatialAudioEnabled;
    set({ spatialAudioEnabled: next });
    const t = getTranslation(get().activeLanguageCode);
    get().speak(next ? t.actions.spatialAudioOn : t.actions.spatialAudioOff);
    if (next) playObstacleBeep(880, 150);
  },

  currentInsight: { id: 'c-1', text: '✓ Path ahead is clear.', type: 'success' },
  setCurrentInsight: (insight) => set({ currentInsight: insight }),

  isSimulatedCamera: false,
  setSimulatedCamera: (simulated) => set({ isSimulatedCamera: simulated }),
  cameraFacing: 'back',
  setCameraFacing: (facing) => set({ cameraFacing: facing }),
  toggleCameraFacing: () => {
    const next = get().cameraFacing === 'back' ? 'front' : 'back';
    set({ cameraFacing: next });
    const t = getTranslation(get().activeLanguageCode);
    get().speak(next ? t.actions.frontCamera : t.actions.rearCamera);
  },
  torchOn: false,
  setTorchOn: (on) => set({ torchOn: on }),
  toggleTorch: () => {
    const next = !get().torchOn;
    set({ torchOn: next });
    const t = getTranslation(get().activeLanguageCode);
    get().speak(next ? t.actions.flashlightOn : t.actions.flashlightOff);
  },
  isDetectionActive: true,
  toggleDetection: () => {
    const next = !get().isDetectionActive;
    set({ isDetectionActive: next });
    const t = getTranslation(get().activeLanguageCode);
    get().speak(next ? t.actions.visionActive : t.actions.visionPaused);
  },
  detectedObjects: INITIAL_OBJECTS,
  generateSceneDescription: () => {
    const mode = get().activeMode;
    const t = getTranslation(get().activeLanguageCode);
    let desc = t.sceneDescriptions.assist;

    if (mode === 'read') {
      desc = t.sceneDescriptions.read;
    } else if (mode === 'medicine') {
      desc = t.sceneDescriptions.medicine;
    } else if (mode === 'transport') {
      desc = t.sceneDescriptions.transport;
    } else if (mode === 'navigate') {
      desc = t.sceneDescriptions.navigate;
    }

    set({ 
      lastAnnouncement: desc, 
      currentInsight: { id: `c-${Date.now()}`, text: desc, type: 'info' }
    });
    get().speak(desc);
  },

  capturedPhotoUri: null as string | null,
  isCapturedPhotoModalOpen: false,
  setIsCapturedPhotoModalOpen: (open: boolean) => set({ isCapturedPhotoModalOpen: open }),

  cameraRef: null as any,
  setCameraRef: (ref: any) => set({ cameraRef: ref }),
  capturePhotoAndAnalyze: async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}

    const camera = get().cameraRef;
    let photoUri = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80';

    if (camera && typeof camera.takePictureAsync === 'function') {
      try {
        const photo = await camera.takePictureAsync({ base64: true, quality: 0.8 });
        if (photo?.uri) photoUri = photo.uri;
      } catch (err) {
        console.warn('Native camera photo capture fallback:', err);
      }
    }

    set({ capturedPhotoUri: photoUri, isCapturedPhotoModalOpen: true });
    get().speak('Photo captured! Displaying scanned image and text analysis.', true);
    get().generateSceneDescription();
  },

  themeMode: 'standard',
  setThemeMode: (theme) => {
    set({ themeMode: theme });
    speakAnnouncement(`${theme} theme enabled.`);
  },
  fontScale: 'normal',
  setFontScale: (scale) => {
    set({ fontScale: scale });
    speakAnnouncement(`Font scale set to ${scale}.`);
  },

  destination: 'Metro Pharmacy',
  navSteps: [
    { id: 's-1', instruction: 'Walk straight 45 meters towards MG Road.', distanceText: '45 meters' },
    { id: 's-2', instruction: 'Turn right at the corner.', distanceText: '12 meters' },
  ],
  currentStepIndex: 0,
  nextStep: () => {
    const nextIdx = Math.min(get().currentStepIndex + 1, get().navSteps.length - 1);
    set({ currentStepIndex: nextIdx });
    speakAnnouncement(get().navSteps[nextIdx].instruction);
  },

  activeReadText: 'PHARMACY PRESCRIPTION - DR. SMITH. TAKE 1 TABLET DAILY WITH WATER AFTER MEAL.',
  isReadingAloud: false,
  toggleReadAloud: () => {
    const next = !get().isReadingAloud;
    set({ isReadingAloud: next });
    if (next) speakAnnouncement(get().activeReadText);
    else get().stopVoice();
  },

  medicines: INITIAL_MEDICINES,
  detectedMedicine: INITIAL_MEDICINES[0],
  confirmMedicineTaken: (medicineId) => {
    set((state) => ({
      medicines: state.medicines.map((m) =>
        m.id === medicineId ? { ...m, remainingPills: m.remainingPills - 1 } : m
      ),
    }));
    speakAnnouncement('Dose confirmed and logged into your schedule.');
  },

  isProfileModalOpen: false,
  setIsProfileModalOpen: (open: boolean) => set({ isProfileModalOpen: open }),

  isSosModalOpen: false,
  setSosModalOpen: (open) => set({ isSosModalOpen: open }),
  emergencyContacts: INITIAL_EMERGENCY_CONTACTS,
  triggerSosAlert: () => {
    set({ isSosModalOpen: true });
    speakAnnouncement('Emergency alert activated. Location broadcasting to Sunita Sharma.');
    playObstacleBeep(1200, 400);
  },

  isFamilyCompanionOpen: false,
  setFamilyCompanionOpen: (open) => set({ isFamilyCompanionOpen: open }),

  isDesignSystemOpen: false,
  setDesignSystemOpen: (open) => set({ isDesignSystemOpen: open }),

  // Family Mode implementation
  userRole: 'undecided',
  setUserRole: (role) => set({ userRole: role }),
  familyUser: null,
  setFamilyUser: (user) => set({ familyUser: user }),
  familyConnectedUserPhone: null,
  setFamilyConnectedUserPhone: (phone) => set({ familyConnectedUserPhone: phone }),
  familyConnectionStatus: 'idle',
  setFamilyConnectionStatus: (status) => set({ familyConnectionStatus: status }),
  familyConnectedUserData: null,
  setFamilyConnectedUserData: (data) => set({ familyConnectedUserData: data }),
  familyRequests: [],
  setFamilyRequests: (requests) => set({ familyRequests: requests }),
  activeSosAlert: null,
  setActiveSosAlert: (alert) => set({ activeSosAlert: alert }),
}));
