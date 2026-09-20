import 'dart:async';
import 'dart:io' show Platform;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/nav_models.dart';
import '../theme/design_system.dart';
import '../utils/translations.dart';
import '../services/api_service.dart';
import '../services/audio_service.dart';
import '../services/socket_service.dart';

class NavidoorProvider extends ChangeNotifier {
  // Voice System
  VoiceState _voiceState = VoiceState.idle;
  VoiceState get voiceState => _voiceState;

  String _lastAnnouncement = 'NAVIDOOR AI Vision Assist Ready. Tap mic or rotate wheel.';
  String get lastAnnouncement => _lastAnnouncement;

  double _speechRate = 1.0;
  double get speechRate => _speechRate;

  // User Profile
  String _userName = 'Rajesh Kumar';
  String get userName => _userName;

  String _userPhone = '+91 98765 12340';
  String get userPhone => _userPhone;

  String _activeLanguageCode = 'en';
  String get activeLanguageCode => _activeLanguageCode;

  bool _isFirstTimeUser = false;
  bool get isFirstTimeUser => _isFirstTimeUser;

  // Active Mode & Wheel Navigation
  NavMode _activeMode = NavMode.assist;
  NavMode get activeMode => _activeMode;

  final List<NavMode> _wheelOrder = const [
    NavMode.assist,
    NavMode.navigate,
    NavMode.read,
    NavMode.medicine,
    NavMode.transport,
    NavMode.location,
    NavMode.emergency,
    NavMode.medical,
    NavMode.family,
    NavMode.history,
    NavMode.languages,
    NavMode.settings,
  ];
  List<NavMode> get wheelOrder => _wheelOrder;

  // Camera & Detection Canvas
  bool _cameraFacingBack = true;
  bool get cameraFacingBack => _cameraFacingBack;

  bool _torchOn = false;
  bool get torchOn => _torchOn;

  bool _isDetectionActive = true;
  bool get isDetectionActive => _isDetectionActive;

  bool _spatialAudioEnabled = true;
  bool get spatialAudioEnabled => _spatialAudioEnabled;

  String? _capturedPhotoUri;
  String? get capturedPhotoUri => _capturedPhotoUri;

  bool _isCapturedPhotoModalOpen = false;
  bool get isCapturedPhotoModalOpen => _isCapturedPhotoModalOpen;

  final List<DetectedObject> _detectedObjects = const [
    DetectedObject(
      id: 'obj-1',
      label: 'Chair',
      emojiIcon: '🪑',
      category: 'furniture',
      confidence: 0.95,
      distanceMeters: 1.2,
      direction: 'center',
      xRatio: 0.32,
      yRatio: 0.42,
    ),
    DetectedObject(
      id: 'obj-2',
      label: 'Door',
      emojiIcon: '🚪',
      category: 'door',
      confidence: 0.98,
      distanceMeters: 2.8,
      direction: 'right',
      xRatio: 0.65,
      yRatio: 0.28,
    ),
    DetectedObject(
      id: 'obj-3',
      label: 'Person',
      emojiIcon: '🚶',
      category: 'person',
      confidence: 0.92,
      distanceMeters: 5.4,
      direction: 'left',
      xRatio: 0.12,
      yRatio: 0.35,
    ),
  ];
  List<DetectedObject> get detectedObjects => _detectedObjects;

  final ContextInsight _currentInsight = const ContextInsight(
    id: 'in-1',
    text: 'Safe walking vector straight ahead. Clear doorway detected 2.8m to your right.',
    type: 'info',
  );
  ContextInsight get currentInsight => _currentInsight;

  // Theme & Accessibility
  ThemeModeOption _themeMode = ThemeModeOption.standard;
  ThemeModeOption get themeMode => _themeMode;

  FontScaleOption _fontScale = FontScaleOption.normal;
  FontScaleOption get fontScale => _fontScale;

  // Navigation Steps
  final String _destination = 'Dr. Sharma Clinic, Oak Lane';
  String get destination => _destination;

  final List<NavStep> _navSteps = const [
    NavStep(id: 's-1', instruction: 'Walk straight 45 meters towards MG Road', distanceText: '45m'),
    NavStep(id: 's-2', instruction: 'Turn right at the pharmacy entrance doorway', distanceText: '15m'),
    NavStep(id: 's-3', instruction: 'Destination is on your left on 1st Floor', distanceText: '0m'),
  ];
  List<NavStep> get navSteps => _navSteps;

  int _currentStepIndex = 0;
  int get currentStepIndex => _currentStepIndex;

  // Read Mode Text
  final String _activeReadText =
      'Prescription Lisinopril 10mg. Take 1 tablet daily with water after meal. Prescribed by Dr. R. Sharma.';
  String get activeReadText => _activeReadText;

  bool _isReadingAloud = false;
  bool get isReadingAloud => _isReadingAloud;

  // Medicines
  final List<MedicineInfo> _medicines = [
    MedicineInfo(
      id: 'med-1',
      name: 'Lisinopril 10mg',
      dosage: '1 Pill',
      instructions: 'Take daily after breakfast',
      remainingPills: 14,
      nextScheduledTime: '8:00 AM Today',
      prescribedFor: 'Blood Pressure',
    ),
  ];
  List<MedicineInfo> get medicines => _medicines;

  MedicineInfo? _detectedMedicine;
  MedicineInfo? get detectedMedicine => _detectedMedicine;

  // Emergency Contacts & SOS
  final List<EmergencyContact> _emergencyContacts = const [
    EmergencyContact(
      id: 'ec-1',
      name: 'Sunita Sharma',
      relation: 'Daughter',
      phone: '+91 98765 43210',
      isPrimary: true,
    ),
  ];
  List<EmergencyContact> get emergencyContacts => _emergencyContacts;

  bool _isSosModalOpen = false;
  bool get isSosModalOpen => _isSosModalOpen;

  bool _isProfileModalOpen = false;
  bool get isProfileModalOpen => _isProfileModalOpen;

  bool _isFamilyCompanionOpen = false;
  bool get isFamilyCompanionOpen => _isFamilyCompanionOpen;

  bool _isDesignSystemOpen = false;
  bool get isDesignSystemOpen => _isDesignSystemOpen;

  // Family Role & Caregiver Portal
  UserRole _userRole = UserRole.undecided;
  UserRole get userRole => _userRole;

  FamilyUser? _familyUser;
  FamilyUser? get familyUser => _familyUser;

  String? _familyConnectedUserPhone;
  String? get familyConnectedUserPhone => _familyConnectedUserPhone;

  FamilyConnectionStatus _familyConnectionStatus = FamilyConnectionStatus.idle;
  FamilyConnectionStatus get familyConnectionStatus => _familyConnectionStatus;

  Map<String, dynamic>? _familyConnectedUserData;
  Map<String, dynamic>? get familyConnectedUserData => _familyConnectedUserData;

  final List<dynamic> _familyRequests = [];
  List<dynamic> get familyRequests => _familyRequests;

  Map<String, dynamic>? _activeSosAlert;
  Map<String, dynamic>? get activeSosAlert => _activeSosAlert;

  // Constructor
  NavidoorProvider() {
    _initServices();
    _loadPreferences();
  }

  void _initServices() {
    try {
      if (Platform.environment.containsKey('FLUTTER_TEST')) return;
    } catch (_) {}
    ApiService.discoverBackendUrl();
    SocketService().connect();

    SocketService().onSosAlertReceived = (alert) {
      _activeSosAlert = alert;
      _isSosModalOpen = true;
      notifyListeners();
    };

    SocketService().onFamilyRequestReceived = (req) {
      _familyRequests.add(req);
      notifyListeners();
    };
  }

  Future<void> _loadPreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedRole = prefs.getString('userRole');
      if (savedRole == 'navidoor_user') {
        _userRole = UserRole.navidoorUser;
      } else if (savedRole == 'family_member') {
        _userRole = UserRole.familyMember;
        final familyName = prefs.getString('familyName') ?? 'Caregiver';
        final familyPhone = prefs.getString('familyPhone') ?? '';
        _familyUser = FamilyUser(name: familyName, phone: familyPhone);
      }
      _activeLanguageCode = prefs.getString('activeLanguage') ?? 'en';
      notifyListeners();
    } catch (_) {}
  }

  Future<void> _saveRole(String role) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('userRole', role);
    } catch (_) {}
  }

  // State Mutators
  void setVoiceState(VoiceState state) {
    _voiceState = state;
    notifyListeners();
  }

  void setSpeechRate(double rate) {
    _speechRate = rate;
    notifyListeners();
  }

  void setUserName(String name) {
    _userName = name;
    notifyListeners();
  }

  void setUserPhone(String phone) {
    _userPhone = phone;
    notifyListeners();
  }

  void setActiveLanguageCode(String code) {
    _activeLanguageCode = code;
    final dict = getTranslations(code);
    speak(dict.languageChanged);
    SharedPreferences.getInstance().then((p) => p.setString('activeLanguage', code));
    notifyListeners();
  }

  void setIsFirstTimeUser(bool firstTime) {
    _isFirstTimeUser = firstTime;
    notifyListeners();
  }

  void setUserRole(UserRole role) {
    _userRole = role;
    if (role == UserRole.navidoorUser) {
      _saveRole('navidoor_user');
      SocketService().registerPhone(_userPhone, 'user');
    } else if (role == UserRole.familyMember) {
      _saveRole('family_member');
    }
    notifyListeners();
  }

  void setFamilyUser(FamilyUser? user) {
    _familyUser = user;
    if (user != null) {
      SharedPreferences.getInstance().then((p) {
        p.setString('familyName', user.name);
        p.setString('familyPhone', user.phone);
      });
      SocketService().registerPhone(user.phone, 'caregiver');
    }
    notifyListeners();
  }

  void setFamilyConnectedUserPhone(String? phone) {
    _familyConnectedUserPhone = phone;
    notifyListeners();
  }

  void setFamilyConnectionStatus(FamilyConnectionStatus status) {
    _familyConnectionStatus = status;
    notifyListeners();
  }

  void setFamilyConnectedUserData(Map<String, dynamic>? data) {
    _familyConnectedUserData = data;
    notifyListeners();
  }

  void setActiveSosAlert(Map<String, dynamic>? alert) {
    _activeSosAlert = alert;
    notifyListeners();
  }

  // Wheel & Mode Switching
  void setActiveMode(NavMode mode) {
    _activeMode = mode;
    HapticFeedback.mediumImpact();
    final dict = getTranslations(_activeLanguageCode);
    final modeData = dict.modes[mode];
    if (modeData != null) {
      speak('${modeData.name}. ${modeData.description}');
    }
    notifyListeners();
  }

  void cycleNextMode() {
    final currentIndex = _wheelOrder.indexOf(_activeMode);
    final nextIndex = (currentIndex + 1) % _wheelOrder.length;
    setActiveMode(_wheelOrder[nextIndex]);
  }

  void cyclePrevMode() {
    final currentIndex = _wheelOrder.indexOf(_activeMode);
    final prevIndex = (currentIndex - 1 + _wheelOrder.length) % _wheelOrder.length;
    setActiveMode(_wheelOrder[prevIndex]);
  }

  // Camera & Detection Controls
  void toggleCameraFacing() {
    _cameraFacingBack = !_cameraFacingBack;
    final dict = getTranslations(_activeLanguageCode);
    speak(_cameraFacingBack ? dict.actions['rearCamera']! : dict.actions['frontCamera']!);
    notifyListeners();
  }

  void toggleTorch() {
    _torchOn = !_torchOn;
    final dict = getTranslations(_activeLanguageCode);
    speak(_torchOn ? dict.actions['flashlightOn']! : dict.actions['flashlightOff']!);
    notifyListeners();
  }

  void toggleDetection() {
    _isDetectionActive = !_isDetectionActive;
    final dict = getTranslations(_activeLanguageCode);
    speak(_isDetectionActive ? dict.actions['visionActive']! : dict.actions['visionPaused']!);
    notifyListeners();
  }

  void toggleSpatialAudio() {
    _spatialAudioEnabled = !_spatialAudioEnabled;
    final dict = getTranslations(_activeLanguageCode);
    speak(_spatialAudioEnabled ? dict.actions['spatialAudioOn']! : dict.actions['spatialAudioOff']!);
    notifyListeners();
  }

  void generateSceneDescription() {
    final dict = getTranslations(_activeLanguageCode);
    final desc = dict.sceneDescriptions[_activeMode.name] ?? dict.readyAnnouncement;
    speak(desc);
  }

  Future<void> capturePhotoAndAnalyze() async {
    _voiceState = VoiceState.thinking;
    notifyListeners();
    await Future.delayed(const Duration(milliseconds: 1200));
    _voiceState = VoiceState.idle;
    generateSceneDescription();
  }

  void setIsCapturedPhotoModalOpen(bool open) {
    _isCapturedPhotoModalOpen = open;
    notifyListeners();
  }

  // Theme & Font Scale
  void setThemeMode(ThemeModeOption mode) {
    _themeMode = mode;
    notifyListeners();
  }

  void setFontScale(FontScaleOption scale) {
    _fontScale = scale;
    notifyListeners();
  }

  // Navigation Steps
  void nextStep() {
    if (_currentStepIndex < _navSteps.length - 1) {
      _currentStepIndex++;
      speak(_navSteps[_currentStepIndex].instruction);
      notifyListeners();
    } else {
      speak('You have arrived at your destination.');
    }
  }

  // Reading Aloud
  void toggleReadAloud() {
    _isReadingAloud = !_isReadingAloud;
    if (_isReadingAloud) {
      speak(_activeReadText);
    } else {
      stopVoice();
    }
    notifyListeners();
  }

  // Medicine Confirmation
  void confirmMedicineTaken(String medicineId) {
    final idx = _medicines.indexWhere((m) => m.id == medicineId);
    if (idx != -1) {
      if (_medicines[idx].remainingPills > 0) {
        _medicines[idx].remainingPills -= 1;
      }
      speak('Logged dose confirmed. ${_medicines[idx].remainingPills} pills remaining.');
      notifyListeners();
    }
  }

  // Modals
  void setIsProfileModalOpen(bool open) {
    _isProfileModalOpen = open;
    notifyListeners();
  }

  void setSosModalOpen(bool open) {
    _isSosModalOpen = open;
    notifyListeners();
  }

  void setFamilyCompanionOpen(bool open) {
    _isFamilyCompanionOpen = open;
    notifyListeners();
  }

  void setDesignSystemOpen(bool open) {
    _isDesignSystemOpen = open;
    notifyListeners();
  }

  void triggerSosAlert() {
    _isSosModalOpen = true;
    SocketService().emitEmergencySOS(
      location: 'Oak Lane, MG Road',
      reason: 'User activated emergency SOS button',
    );
    speak('Emergency SOS initiated. Alert sent to primary contacts and caregivers.');
    notifyListeners();
  }

  // Speech & Voice Execution
  Future<void> speak(String text, {bool interrupt = true}) async {
    _lastAnnouncement = text;
    _voiceState = VoiceState.speaking;
    notifyListeners();

    // Try IndicF5 Neural TTS from backend
    final wavBytes = await ApiService.synthesizeSpeechIndicF5(text, language: _activeLanguageCode);
    if (wavBytes != null && wavBytes.isNotEmpty) {
      await AudioService().playAudioBytes(wavBytes);
    } else {
      // Offline fallback
      await AudioService().speakFallback(text, languageCode: _activeLanguageCode, rate: _speechRate);
    }

    // Auto-return to idle after audio completes
    Future.delayed(Duration(milliseconds: (text.length * 65).clamp(2500, 10000)), () {
      if (_voiceState == VoiceState.speaking) {
        _voiceState = VoiceState.idle;
        notifyListeners();
      }
    });
  }

  void stopVoice() {
    AudioService().stopAllAudio();
    _voiceState = VoiceState.idle;
    notifyListeners();
  }

  Future<void> processVoiceInput(String input) async {
    if (input.trim().isEmpty) return;
    _voiceState = VoiceState.thinking;
    notifyListeners();

    final lower = input.toLowerCase();

    if (lower.contains('profile') || lower.contains('setting')) {
      setIsProfileModalOpen(true);
      speak('Opening profile and settings.');
    } else if (lower.contains('sos') || lower.contains('help') || lower.contains('emergency')) {
      triggerSosAlert();
    } else if (lower.contains('navigate') || lower.contains('walk')) {
      setActiveMode(NavMode.navigate);
    } else if (lower.contains('read') || lower.contains('text')) {
      setActiveMode(NavMode.read);
    } else if (lower.contains('medicine') || lower.contains('pill')) {
      setActiveMode(NavMode.medicine);
    } else if (lower.contains('assist')) {
      setActiveMode(NavMode.assist);
    } else {
      // Query local Ollama LLM via backend
      final answer = await ApiService.queryChatAssistant(input, language: _activeLanguageCode);
      speak(answer ?? 'I heard you. How can I assist your navigation?');
    }
  }
}
