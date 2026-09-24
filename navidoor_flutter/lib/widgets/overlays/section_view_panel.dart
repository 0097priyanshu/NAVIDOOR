import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import '../../models/nav_models.dart';
import '../../providers/navidoor_provider.dart';
import '../../theme/design_system.dart';

class SectionViewPanel extends StatelessWidget {
  const SectionViewPanel({super.key});

  static const List<NavMode> panelModes = [
    NavMode.settings,
    NavMode.emergency,
    NavMode.medical,
    NavMode.languages,
    NavMode.history,
    NavMode.location,
    NavMode.family,
  ];

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NavidoorProvider>();
    final activeMode = provider.activeMode;

    // Only panel modes render this overlay (matching React Native SectionViewPanel)
    if (!panelModes.contains(activeMode)) {
      return const SizedBox.shrink();
    }

    return Positioned(
      top: 70,
      left: 16,
      right: 16,
      bottom: 210,
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Column(
            children: [
              // Centered Top Header Bar
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  '${activeMode.name.toUpperCase()} PANEL',
                  style: const TextStyle(
                    color: Color(0xFF0284C7),
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

              // Scrollable Panel Content
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: _buildPanelContent(context, provider, activeMode),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPanelContent(BuildContext context, NavidoorProvider provider, NavMode mode) {
    switch (mode) {
      case NavMode.settings:
        return _buildSettingsPanel(context, provider);
      case NavMode.emergency:
        return _buildEmergencyPanel(context, provider);
      case NavMode.medical:
        return _buildMedicalPanel(context, provider);
      case NavMode.languages:
        return _buildLanguagesPanel(context, provider);
      case NavMode.history:
        return _buildHistoryPanel(context, provider);
      case NavMode.location:
        return _buildLocationPanel(context, provider);
      case NavMode.family:
        return _buildFamilyPanel(context, provider);
      default:
        return const SizedBox.shrink();
    }
  }

  // 1. SETTINGS PANEL (matching React Native SettingsPanel.tsx)
  Widget _buildSettingsPanel(BuildContext context, NavidoorProvider provider) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFCBD5E1),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF475569), width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Color(0x330284C7),
            offset: Offset(0, 6),
            blurRadius: 16,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section 1: System & Voice Audio
          const Row(
            children: [
              Icon(LucideIcons.sliders_horizontal, size: 18, color: Color(0xFF0284C7)),
              SizedBox(width: 8),
              Text(
                'SYSTEM & VOICE AUDIO',
                style: TextStyle(
                  color: Color(0xFF0284C7),
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'Voice Speech Speed',
            style: TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              for (final item in [
                {'label': '0.85x', 'val': 0.85},
                {'label': '1.0x', 'val': 1.0},
                {'label': '1.25x', 'val': 1.25},
              ])
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: _buildRateButton(
                      label: item['label'] as String,
                      isActive: (provider.speechRate - (item['val'] as double)).abs() < 0.05,
                      onTap: () {
                        provider.setSpeechRate(item['val'] as double);
                        provider.speak('Speech rate ${item['label']}');
                      },
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Spatial Audio Beeps',
                style: TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Switch(
                value: provider.spatialAudioEnabled,
                onChanged: (_) => provider.toggleSpatialAudio(),
                activeThumbColor: const Color(0xFF0284C7),
                activeTrackColor: const Color(0xFF0284C7).withValues(alpha: 0.5),
                inactiveThumbColor: const Color(0xFF94A3B8),
                inactiveTrackColor: const Color(0xFF475569),
              ),
            ],
          ),

          const Divider(color: Color(0xFF94A3B8), height: 28),

          // Section 2: Accessibility Preferences
          const Row(
            children: [
              Icon(LucideIcons.eye, size: 18, color: Color(0xFF0284C7)),
              SizedBox(width: 8),
              Text(
                'ACCESSIBILITY PREFERENCES',
                style: TextStyle(
                  color: Color(0xFF0284C7),
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'Text Font Scaling',
            style: TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              for (final scale in FontScaleOption.values)
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: _buildRateButton(
                      label: scale == FontScaleOption.extraLarge
                          ? 'XL'
                          : scale.name.toUpperCase(),
                      isActive: provider.fontScale == scale,
                      onTap: () {
                        provider.setFontScale(scale);
                        provider.speak('Font size ${scale.name}');
                      },
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'High Contrast Theme',
                style: TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Switch(
                value: provider.themeMode == ThemeModeOption.highContrastAmber,
                onChanged: (val) {
                  provider.setThemeMode(
                    val ? ThemeModeOption.highContrastAmber : ThemeModeOption.standard,
                  );
                },
                activeThumbColor: const Color(0xFF0284C7),
                activeTrackColor: const Color(0xFF0284C7).withValues(alpha: 0.5),
                inactiveThumbColor: const Color(0xFF94A3B8),
                inactiveTrackColor: const Color(0xFF475569),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRateButton({
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return Material(
      color: isActive ? const Color(0xFF0284C7) : const Color(0xFFE2E8F0),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              color: isActive ? Colors.white : const Color(0xFF0F172A),
              fontWeight: isActive ? FontWeight.w900 : FontWeight.w800,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }

  // 2. EMERGENCY PANEL (matching React Native EmergencyPanel.tsx)
  Widget _buildEmergencyPanel(BuildContext context, NavidoorProvider provider) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFCBD5E1),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF475569), width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Color(0x33E11D48),
            offset: Offset(0, 6),
            blurRadius: 16,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.shield_alert, size: 18, color: Color(0xFFE11D48)),
              SizedBox(width: 8),
              Text(
                'EMERGENCY CONTACT CALLING',
                style: TextStyle(
                  color: Color(0xFFE11D48),
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Voice Call Someone button
          Material(
            color: const Color(0xFF0284C7),
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              onTap: () {
                provider.speak('Who do you want to call? Please say their name.');
              },
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                alignment: Alignment.center,
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.mic, size: 20, color: Colors.white),
                    SizedBox(width: 8),
                    Text(
                      'VOICE CALL SOMEONE',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Contacts List
          ...provider.emergencyContacts.map((contact) {
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF94A3B8), width: 1),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${contact.name} (${contact.relation})',
                          style: const TextStyle(
                            color: Color(0xFF0F172A),
                            fontWeight: FontWeight.w900,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          contact.phone,
                          style: const TextStyle(
                            color: Color(0xFF475569),
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 40,
                    height: 40,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Color(0xFFE11D48),
                    ),
                    child: Material(
                      color: Colors.transparent,
                      shape: const CircleBorder(),
                      child: InkWell(
                        customBorder: const CircleBorder(),
                        onTap: () {
                          provider.speak('Calling ${contact.name} now.');
                        },
                        child: const Center(
                          child: Icon(LucideIcons.phone, size: 20, color: Colors.white),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // 3. MEDICAL INFO PANEL (matching React Native MedicalInfoPanel.tsx)
  Widget _buildMedicalPanel(BuildContext context, NavidoorProvider provider) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFCBD5E1),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF475569), width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Color(0x330284C7),
            offset: Offset(0, 6),
            blurRadius: 16,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.activity, size: 18, color: Color(0xFF0284C7)),
              SizedBox(width: 8),
              Text(
                'MEDICAL & PRESCRIPTION INFO',
                style: TextStyle(
                  color: Color(0xFF0284C7),
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Allergy & Blood Type card
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE11D48), width: 1.5),
            ),
            child: const Row(
              children: [
                Icon(LucideIcons.shield_alert, color: Color(0xFFE11D48), size: 24),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'CRITICAL MEDICAL ALERT',
                        style: TextStyle(
                          color: Color(0xFFE11D48),
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.8,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Allergic to Penicillin • Blood Type O+',
                        style: TextStyle(
                          color: Color(0xFF0F172A),
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Prescription Medicines
          const Text(
            'ACTIVE PRESCRIPTION MEDICINES',
            style: TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 12,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 8),
          ...provider.medicines.map((m) {
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF94A3B8), width: 1),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0284C7).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(LucideIcons.pill, color: Color(0xFF0284C7), size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              m.name,
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontWeight: FontWeight.w900,
                                fontSize: 14,
                              ),
                            ),
                            Text(
                              '${m.dosage} • ${m.instructions}',
                              style: const TextStyle(
                                color: Color(0xFF475569),
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${m.remainingPills} pills remaining',
                        style: const TextStyle(
                          color: Color(0xFF0F172A),
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                        ),
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0284C7),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        ),
                        onPressed: () => provider.confirmMedicineTaken(m.id),
                        child: const Text(
                          'TAKE DOSE NOW',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // 4. LANGUAGES PANEL (matching React Native LanguagesPanel.tsx)
  Widget _buildLanguagesPanel(BuildContext context, NavidoorProvider provider) {
    const languages = [
      {'code': 'en', 'name': 'English', 'native': 'English'},
      {'code': 'hi', 'name': 'Hindi', 'native': 'हिन्दी'},
      {'code': 'bn', 'name': 'Bengali', 'native': 'বাংলা'},
      {'code': 'ta', 'name': 'Tamil', 'native': 'தமிழ்'},
      {'code': 'te', 'name': 'Telugu', 'native': 'తెలుగు'},
      {'code': 'mr', 'name': 'Marathi', 'native': 'मराठी'},
      {'code': 'gu', 'name': 'Gujarati', 'native': 'ગુજરાતી'},
      {'code': 'kn', 'name': 'Kannada', 'native': 'ಕನ್ನಡ'},
      {'code': 'ml', 'name': 'Malayalam', 'native': 'മലയാളം'},
      {'code': 'pa', 'name': 'Punjabi', 'native': 'ਪੰਜਾਬੀ'},
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFCBD5E1),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF475569), width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Color(0x330284C7),
            offset: Offset(0, 6),
            blurRadius: 16,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.globe, size: 18, color: Color(0xFF0284C7)),
              SizedBox(width: 8),
              Text(
                'VOICE LANGUAGE SELECT',
                style: TextStyle(
                  color: Color(0xFF0284C7),
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: languages.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 2.2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
            ),
            itemBuilder: (context, index) {
              final lang = languages[index];
              final isActive = provider.activeLanguageCode == lang['code'];

              return Material(
                color: isActive ? const Color(0xFF0284C7) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(14),
                child: InkWell(
                  onTap: () => provider.setActiveLanguageCode(lang['code']!),
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isActive ? const Color(0xFF38BDF8) : const Color(0xFF94A3B8),
                        width: 1.5,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          lang['native']!,
                          style: TextStyle(
                            color: isActive ? Colors.white : const Color(0xFF0F172A),
                            fontWeight: FontWeight.w900,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          lang['name']!,
                          style: TextStyle(
                            color: isActive ? const Color(0xFFE2E8F0) : const Color(0xFF475569),
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // 5. HISTORY PANEL (matching React Native HistoryPanel.tsx)
  Widget _buildHistoryPanel(BuildContext context, NavidoorProvider provider) {
    const historyItems = [
      {'title': 'Prescription Read Aloud', 'time': '10:45 AM Today', 'icon': LucideIcons.book_open},
      {'title': 'Medicine Scanned: Lisinopril 10mg', 'time': '8:15 AM Today', 'icon': LucideIcons.pill},
      {'title': 'Navigated: MG Road Crosswalk', 'time': 'Yesterday', 'icon': LucideIcons.compass},
      {'title': 'Detected Doorway & Corridor', 'time': 'Yesterday', 'icon': LucideIcons.house},
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFCBD5E1),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF475569), width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Color(0x330284C7),
            offset: Offset(0, 6),
            blurRadius: 16,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.clock, size: 18, color: Color(0xFF0284C7)),
              SizedBox(width: 8),
              Text(
                'SCAN HISTORY & LOGS',
                style: TextStyle(
                  color: Color(0xFF0284C7),
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          ...historyItems.map((item) {
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF94A3B8), width: 1),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0284C7).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(item['icon'] as IconData, color: const Color(0xFF0284C7), size: 18),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item['title'] as String,
                          style: const TextStyle(
                            color: Color(0xFF0F172A),
                            fontWeight: FontWeight.w900,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          item['time'] as String,
                          style: const TextStyle(
                            color: Color(0xFF475569),
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // 6. LOCATION PANEL (matching React Native LocationPanel.tsx)
  Widget _buildLocationPanel(BuildContext context, NavidoorProvider provider) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFCBD5E1),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF475569), width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Color(0x330284C7),
            offset: Offset(0, 6),
            blurRadius: 16,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.map_pin, size: 18, color: Color(0xFF0284C7)),
              SizedBox(width: 8),
              Text(
                'LIVE LOCATION & GPS',
                style: TextStyle(
                  color: Color(0xFF0284C7),
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF94A3B8), width: 1),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'CURRENT ADDRESS',
                  style: TextStyle(
                    color: Color(0xFF0284C7),
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.8,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Block B, Connaught Place, New Delhi',
                  style: TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'Coordinates: 28.6315° N, 77.2167° E • Accuracy 2.4m',
                  style: TextStyle(
                    color: Color(0xFF475569),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0284C7),
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            onPressed: () {
              provider.speak('Live location broadcasted to registered emergency contacts.');
            },
            icon: const Icon(LucideIcons.radio, size: 18, color: Colors.white),
            label: const Text(
              'SHARE LIVE LOCATION',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 13,
                letterSpacing: 0.8,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // 7. FAMILY PANEL (matching React Native FamilyPanel.tsx)
  Widget _buildFamilyPanel(BuildContext context, NavidoorProvider provider) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFCBD5E1),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF475569), width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Color(0x330284C7),
            offset: Offset(0, 6),
            blurRadius: 16,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.users, size: 18, color: Color(0xFF0284C7)),
              SizedBox(width: 8),
              Text(
                'FAMILY COMPANION STATUS',
                style: TextStyle(
                  color: Color(0xFF0284C7),
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF94A3B8), width: 1),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(LucideIcons.heart_handshake, color: Color(0xFF10B981), size: 20),
                    SizedBox(width: 8),
                    Text(
                      'CONNECTED & MONITORING',
                      style: TextStyle(
                        color: Color(0xFF10B981),
                        fontWeight: FontWeight.w900,
                        fontSize: 12,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 8),
                Text(
                  'Caregiver: Sunita Sharma (+91 98765 43210)',
                  style: TextStyle(
                    color: Color(0xFF0F172A),
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Live walking location and safety alerts are being mirrored to your caregiver.',
                  style: TextStyle(
                    color: Color(0xFF475569),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0284C7),
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            onPressed: () {
              provider.speak('Calling your family caregiver Sunita Sharma now.');
            },
            icon: const Icon(LucideIcons.phone, size: 18, color: Colors.white),
            label: const Text(
              'CALL CAREGIVER NOW',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 13,
                letterSpacing: 0.8,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
