enum NavMode {
  assist,
  navigate,
  read,
  medicine,
  transport,
  location,
  emergency,
  medical,
  family,
  history,
  languages,
  settings,
}

enum VoiceState {
  idle,
  listening,
  thinking,
  speaking,
}

enum UserRole {
  undecided,
  navidoorUser,
  familyMember,
}

enum FamilyConnectionStatus {
  idle,
  pending,
  connected,
  rejected,
}

class DetectedObject {
  final String id;
  final String label;
  final String emojiIcon;
  final String category;
  final double confidence;
  final double distanceMeters;
  final String direction; // 'left' | 'center' | 'right'
  final double xRatio;
  final double yRatio;
  final bool isHazard;

  const DetectedObject({
    required this.id,
    required this.label,
    required this.emojiIcon,
    required this.category,
    required this.confidence,
    required this.distanceMeters,
    required this.direction,
    required this.xRatio,
    required this.yRatio,
    this.isHazard = false,
  });

  factory DetectedObject.fromJson(Map<String, dynamic> json) {
    return DetectedObject(
      id: json['id'] ?? '',
      label: json['label'] ?? '',
      emojiIcon: json['emojiIcon'] ?? '📍',
      category: json['category'] ?? 'obstacle',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.9,
      distanceMeters: (json['distanceMeters'] as num?)?.toDouble() ?? 2.0,
      direction: json['direction'] ?? 'center',
      xRatio: (json['xRatio'] as num?)?.toDouble() ?? 0.5,
      yRatio: (json['yRatio'] as num?)?.toDouble() ?? 0.5,
      isHazard: json['isHazard'] ?? false,
    );
  }
}

class MedicineInfo {
  final String id;
  final String name;
  final String dosage;
  final String instructions;
  int remainingPills;
  final String nextScheduledTime;
  final String prescribedFor;

  MedicineInfo({
    required this.id,
    required this.name,
    required this.dosage,
    required this.instructions,
    required this.remainingPills,
    required this.nextScheduledTime,
    required this.prescribedFor,
  });
}

class EmergencyContact {
  final String id;
  final String name;
  final String relation;
  final String phone;
  final bool isPrimary;

  const EmergencyContact({
    required this.id,
    required this.name,
    required this.relation,
    required this.phone,
    this.isPrimary = false,
  });
}

class LanguageMeta {
  final String code;
  final String name;
  final String nativeName;
  final String flag;
  final String whisperLang;

  const LanguageMeta({
    required this.code,
    required this.name,
    required this.nativeName,
    required this.flag,
    required this.whisperLang,
  });
}

class ContextInsight {
  final String id;
  final String text;
  final String type; // 'info' | 'warning' | 'hazard' | 'success'

  const ContextInsight({
    required this.id,
    required this.text,
    required this.type,
  });
}

class NavStep {
  final String id;
  final String instruction;
  final String distanceText;

  const NavStep({
    required this.id,
    required this.instruction,
    required this.distanceText,
  });
}

class FamilyUser {
  final String name;
  final String phone;
  final String? email;
  final String? relationship;

  const FamilyUser({
    required this.name,
    required this.phone,
    this.email,
    this.relationship,
  });
}

const List<LanguageMeta> kSupportedLanguages = [
  LanguageMeta(code: 'en', name: 'English', nativeName: 'English (US)', flag: '🇬🇧', whisperLang: 'en'),
  LanguageMeta(code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳', whisperLang: 'hi'),
  LanguageMeta(code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', whisperLang: 'mr'),
  LanguageMeta(code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', whisperLang: 'gu'),
  LanguageMeta(code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', whisperLang: 'pa'),
  LanguageMeta(code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', whisperLang: 'bn'),
  LanguageMeta(code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', whisperLang: 'ta'),
  LanguageMeta(code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', whisperLang: 'te'),
  LanguageMeta(code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', whisperLang: 'kn'),
  LanguageMeta(code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', whisperLang: 'ml'),
];
