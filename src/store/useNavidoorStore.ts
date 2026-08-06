import { create } from 'zustand';
import { 
  NavMode, 
  VoiceState, 
  ThemeMode, 
  FontScale, 
  DetectedObject, 
  MedicineInfo, 
  EmergencyContact,
  ContextInsight
} from '../types';
import { speakAnnouncement, stopSpeech, playObstacleBeep } from '../utils/speechUtils';
import * as Haptics from 'expo-haptics';

interface NavidoorState {
  // Voice System First
  voiceState: VoiceState;
  setVoiceState: (state: VoiceState) => void;
  lastAnnouncement: string;
  speak: (text: string, interrupt?: boolean) => void;
  stopVoice: () => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;

  // User Profile & Voice Onboarding
  userName: string;
  setUserName: (name: string) => void;
  userPhone: string;
  setUserPhone: (phone: string) => void;
  userLanguage: string;
  setUserLanguage: (lang: string) => void;
  isFirstTimeUser: boolean;
  setIsFirstTimeUser: (firstTime: boolean) => void;

  // Active Mode & Wheel Navigation
  activeMode: NavMode;
  setActiveMode: (mode: NavMode) => void;
  rotateWheelToMode: (mode: NavMode) => void;

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
  { id: 'ec-1', name: 'Sarah Jenkins', relation: 'Daughter', phone: '+1 (555) 234-5678', isPrimary: true },
];

export const useNavidoorStore = create<NavidoorState>((set, get) => ({
  // Voice System
  voiceState: 'idle',
  setVoiceState: (state) => set({ voiceState: state }),
  lastAnnouncement: 'NAVIDOOR AI Vision Assist Ready. Tap mic or rotate wheel.',
  speechRate: 1.0,
  setSpeechRate: (rate) => set({ speechRate: rate }),
  speak: (text, interrupt = true) => {
    set({ lastAnnouncement: text, voiceState: 'speaking' });
    speakAnnouncement(text, { rate: get().speechRate, interrupt });
    setTimeout(() => {
      if (get().voiceState === 'speaking') {
        set({ voiceState: 'idle' });
      }
    }, Math.max(2500, text.length * 60));
  },
  stopVoice: () => {
    stopSpeech();
    set({ voiceState: 'idle' });
  },

  // User Profile
  userName: 'Aadya',
  setUserName: (name) => set({ userName: name }),
  userPhone: '+1 (555) 019-2831',
  setUserPhone: (phone) => set({ userPhone: phone }),
  userLanguage: 'English (US)',
  setUserLanguage: (lang) => set({ userLanguage: lang }),
  isFirstTimeUser: true,
  setIsFirstTimeUser: (firstTime) => set({ isFirstTimeUser: firstTime }),

  // Active Mode & Wheel Navigation
  activeMode: 'assist',
  setActiveMode: (mode) => {
    set({ activeMode: mode });
    try {
      Haptics.selectionAsync();
    } catch (e) {
      // Haptics fallback silent
    }

    const modeInsights: Record<NavMode, ContextInsight> = {
      assist: { id: 'c-1', text: '✓ Path ahead is clear.', type: 'success' },
      navigate: { id: 'c-2', text: 'Walk straight 45m towards Oak Lane.', type: 'info' },
      read: { id: 'c-3', text: 'Prescription text detected in view.', type: 'info' },
      medicine: { id: 'c-4', text: 'Lisinopril bottle scanned. 14 pills left.', type: 'info' },
      transport: { id: 'c-5', text: 'Bus 42 Northbound arriving in 3 mins.', type: 'info' },
      emergency: { id: 'c-6', text: 'Emergency SOS ready. Broadcast standby.', type: 'hazard' },
      family: { id: 'c-7', text: 'Sarah Jenkins ready for remote stream.', type: 'info' },
      history: { id: 'c-8', text: '3 recent text snippets saved in log.', type: 'info' },
      settings: { id: 'c-9', text: 'System settings & contrast options.', type: 'info' },
      languages: { id: 'c-11', text: 'Active language: English (US).', type: 'info' },
      accessibility: { id: 'c-13', text: 'High contrast dark mode active.', type: 'info' },
    };

    const insight = modeInsights[mode] || { id: 'c-0', text: `${mode.toUpperCase()} mode selected`, type: 'info' };
    set({ currentInsight: insight });
    
    const speakFn = get().speak;
    if (typeof speakFn === 'function') {
      speakFn(`${mode.toUpperCase()} mode. ${insight.text}`);
    }
  },

  rotateWheelToMode: (mode) => {
    get().setActiveMode(mode);
  },

  spatialAudioEnabled: true,
  toggleSpatialAudio: () => {
    const next = !get().spatialAudioEnabled;
    set({ spatialAudioEnabled: next });
    speakAnnouncement(next ? 'Spatial audio enabled.' : 'Spatial audio off.');
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
    speakAnnouncement(`Switched to ${next} camera.`);
  },
  torchOn: false,
  setTorchOn: (on) => set({ torchOn: on }),
  toggleTorch: () => {
    const next = !get().torchOn;
    set({ torchOn: next });
    speakAnnouncement(next ? 'Flashlight enabled.' : 'Flashlight off.');
  },
  isDetectionActive: true,
  toggleDetection: () => {
    const next = !get().isDetectionActive;
    set({ isDetectionActive: next });
    speakAnnouncement(next ? 'AI vision enabled.' : 'AI vision paused.');
  },
  detectedObjects: INITIAL_OBJECTS,
  generateSceneDescription: () => {
    const mode = get().activeMode;
    let desc = 'Clear path straight ahead. Chair detected 1.2 meters in front. Door 2.8 meters to your right.';

    if (mode === 'read') {
      desc = 'Reading document text out loud: Prescription Lisinopril 10mg. Take 1 tablet daily with water after meal.';
    } else if (mode === 'medicine') {
      desc = 'Pill bottle scanned in view: Lisinopril 10mg. 14 pills remaining in bottle.';
    } else if (mode === 'transport') {
      desc = 'Bus stop sign detected 3 meters ahead. Bus 42 Northbound arriving in 3 minutes.';
    } else if (mode === 'navigate') {
      desc = 'Navigation guidance: Walk straight 45 meters towards Oak Lane. Doorways on your right.';
    }

    set({ 
      lastAnnouncement: desc, 
      currentInsight: { id: `c-${Date.now()}`, text: desc, type: 'info' }
    });
    const speakFn = get().speak;
    if (typeof speakFn === 'function') {
      speakFn(desc);
    }
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
    { id: 's-1', instruction: 'Walk straight 45 meters towards Oak Lane.', distanceText: '45 meters' },
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
    speakAnnouncement('Emergency alert activated. Location broadcasting to Sarah Jenkins.');
    playObstacleBeep(1200, 400);
  },

  isFamilyCompanionOpen: false,
  setFamilyCompanionOpen: (open) => set({ isFamilyCompanionOpen: open }),

  isDesignSystemOpen: false,
  setDesignSystemOpen: (open) => set({ isDesignSystemOpen: open }),
}));
