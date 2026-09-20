import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import '../../models/nav_models.dart';
import '../../providers/navidoor_provider.dart';
import '../../theme/design_system.dart';

class SectionViewPanel extends StatelessWidget {
  final bool isEmbeddedInSplitView;

  const SectionViewPanel({
    super.key,
    this.isEmbeddedInSplitView = false,
  });

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NavidoorProvider>();
    final mode = provider.activeMode;

    // Modes that don't need a dedicated extra panel over assist camera
    if (mode == NavMode.assist && !isEmbeddedInSplitView) {
      return const SizedBox.shrink();
    }

    Widget content;
    switch (mode) {
      case NavMode.navigate:
        content = _buildNavigatePanel(context, provider);
        break;
      case NavMode.read:
        content = _buildReadPanel(context, provider);
        break;
      case NavMode.medicine:
        content = _buildMedicinePanel(context, provider);
        break;
      case NavMode.location:
        content = _buildLocationPanel(context, provider);
        break;
      case NavMode.emergency:
        content = _buildEmergencyPanel(context, provider);
        break;
      case NavMode.medical:
        content = _buildMedicalPanel(context, provider);
        break;
      case NavMode.languages:
        content = _buildLanguagesPanel(context, provider);
        break;
      case NavMode.settings:
        content = _buildSettingsPanel(context, provider);
        break;
      case NavMode.family:
        content = _buildFamilyPanel(context, provider);
        break;
      case NavMode.transport:
        content = _buildTransportPanel(context, provider);
        break;
      case NavMode.history:
        content = _buildHistoryPanel(context, provider);
        break;
      case NavMode.assist:
        content = _buildAssistSummaryPanel(context, provider);
        break;
    }

    if (isEmbeddedInSplitView) {
      return Container(
        padding: const EdgeInsets.all(20),
        color: AppColors.darkGray,
        child: SingleChildScrollView(child: content),
      );
    }

    // Floating overlay on mobile
    return Positioned(
      top: 70,
      left: 16,
      right: 16,
      bottom: 155,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.darkGray.withValues(alpha: 0.94),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.lightGrayBorder, width: 2),
          boxShadow: const [
            BoxShadow(
              color: Colors.black54,
              blurRadius: 20,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: Column(
            children: [
              // Header strip
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: AppColors.lightGrayBg.withValues(alpha: 0.4),
                child: Row(
                  children: [
                    _getModeIcon(mode),
                    const SizedBox(width: 8),
                    Text(
                      mode.name.toUpperCase(),
                      style: const TextStyle(
                        color: AppColors.pureWhite,
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.0,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(LucideIcons.x, size: 20, color: AppColors.pureWhite),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () => provider.setActiveMode(NavMode.assist),
                    ),
                  ],
                ),
              ),

              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: content,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _getModeIcon(NavMode mode) {
    switch (mode) {
      case NavMode.navigate:
        return const Icon(LucideIcons.compass, color: AppColors.cyanLight, size: 20);
      case NavMode.read:
        return const Icon(LucideIcons.book_open, color: AppColors.cyanLight, size: 20);
      case NavMode.medicine:
        return const Icon(LucideIcons.pill, color: AppColors.cyanLight, size: 20);
      case NavMode.location:
        return const Icon(LucideIcons.map_pin, color: AppColors.cyanLight, size: 20);
      case NavMode.emergency:
        return const Icon(LucideIcons.phone, color: AppColors.uberSafetyRed, size: 20);
      case NavMode.medical:
        return const Icon(LucideIcons.activity, color: AppColors.cyanLight, size: 20);
      case NavMode.languages:
        return const Icon(LucideIcons.globe, color: AppColors.cyanLight, size: 20);
      case NavMode.settings:
        return const Icon(LucideIcons.settings, color: AppColors.cyanLight, size: 20);
      case NavMode.family:
        return const Icon(LucideIcons.users, color: AppColors.cyanLight, size: 20);
      case NavMode.transport:
        return const Icon(LucideIcons.bus, color: AppColors.cyanLight, size: 20);
      case NavMode.history:
        return const Icon(LucideIcons.clock, color: AppColors.cyanLight, size: 20);
      case NavMode.assist:
        return const Icon(LucideIcons.house, color: AppColors.cyanLight, size: 20);
    }
  }

  // 1. Navigation Panel
  Widget _buildNavigatePanel(BuildContext context, NavidoorProvider provider) {
    final step = provider.navSteps[provider.currentStepIndex];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.cyanPrimary.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.cyanLight, width: 1.5),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'DESTINATION',
                style: TextStyle(color: AppColors.cyanLight, fontSize: 11, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                provider.destination,
                style: const TextStyle(color: AppColors.pureWhite, fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'STEP ${provider.currentStepIndex + 1} OF ${provider.navSteps.length}',
          style: const TextStyle(color: AppColors.cyanLight, fontSize: 12, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 6),
        Text(
          step.instruction,
          style: const TextStyle(color: AppColors.pureWhite, fontSize: 18, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 20),
        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.cyanPrimary,
            minimumSize: const Size(double.infinity, 48),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          icon: const Icon(LucideIcons.arrow_right, color: AppColors.pureWhite),
          label: const Text('Next Walking Step', style: TextStyle(color: AppColors.pureWhite, fontWeight: FontWeight.bold)),
          onPressed: () => provider.nextStep(),
        ),
      ],
    );
  }

  // 2. Read Panel
  Widget _buildReadPanel(BuildContext context, NavidoorProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.lightGrayCard.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.lightGrayBorder),
          ),
          child: Text(
            provider.activeReadText,
            style: const TextStyle(color: AppColors.pureWhite, fontSize: 16, height: 1.5),
          ),
        ),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.cyanPrimary,
            minimumSize: const Size(double.infinity, 48),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          icon: Icon(provider.isReadingAloud ? LucideIcons.volume_x : LucideIcons.volume_2, color: AppColors.pureWhite),
          label: Text(
            provider.isReadingAloud ? 'Stop Reading' : 'Read Aloud (TTS)',
            style: const TextStyle(color: AppColors.pureWhite, fontWeight: FontWeight.bold),
          ),
          onPressed: () => provider.toggleReadAloud(),
        ),
      ],
    );
  }

  // 3. Medicine Panel
  Widget _buildMedicinePanel(BuildContext context, NavidoorProvider provider) {
    final med = provider.medicines.first;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.cyanPrimary.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.cyanLight),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(med.name, style: const TextStyle(color: AppColors.pureWhite, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('Dosage: ${med.dosage}', style: const TextStyle(color: AppColors.cyanLight, fontSize: 14)),
              Text('Instructions: ${med.instructions}', style: const TextStyle(color: AppColors.pureWhite, fontSize: 13)),
              const Divider(color: AppColors.lightGrayBorder, height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Remaining: ${med.remainingPills} pills', style: const TextStyle(color: AppColors.pureWhite, fontWeight: FontWeight.bold)),
                  Text(med.nextScheduledTime, style: const TextStyle(color: AppColors.uberWarningAmber, fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.cyanPrimary,
            minimumSize: const Size(double.infinity, 48),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          icon: const Icon(LucideIcons.circle_check, color: AppColors.pureWhite),
          label: const Text('Confirm Dose Taken', style: TextStyle(color: AppColors.pureWhite, fontWeight: FontWeight.bold)),
          onPressed: () => provider.confirmMedicineTaken(med.id),
        ),
      ],
    );
  }

  // 4. Location Panel
  Widget _buildLocationPanel(BuildContext context, NavidoorProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInfoRow('CURRENT ADDRESS', 'Oak Lane, Near City Central Hospital, MG Road'),
        const SizedBox(height: 12),
        _buildInfoRow('GPS COORDINATES', '19.0760° N, 72.8777° E (Accuracy: ±2m)'),
        const SizedBox(height: 12),
        _buildInfoRow('WALKING SPEED & HEADING', '1.1 m/s • Heading North (012°)'),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.cyanPrimary,
            minimumSize: const Size(double.infinity, 48),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          icon: const Icon(LucideIcons.share_2, color: AppColors.pureWhite),
          label: const Text('Broadcast Location to Caregivers', style: TextStyle(color: AppColors.pureWhite, fontWeight: FontWeight.bold)),
          onPressed: () {
            provider.speak('Location broadcast sent to registered caregiver contacts.');
          },
        ),
      ],
    );
  }

  // 5. Emergency Panel
  Widget _buildEmergencyPanel(BuildContext context, NavidoorProvider provider) {
    final contact = provider.emergencyContacts.first;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.uberSafetyRed.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.uberSafetyRed),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('PRIMARY EMERGENCY CONTACT', style: TextStyle(color: AppColors.uberSafetyRed, fontSize: 11, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(contact.name, style: const TextStyle(color: AppColors.pureWhite, fontSize: 16, fontWeight: FontWeight.bold)),
              Text('${contact.relation} • ${contact.phone}', style: const TextStyle(color: AppColors.pureWhite, fontSize: 14)),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.uberSafetyRed,
            minimumSize: const Size(double.infinity, 50),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          icon: const Icon(LucideIcons.shield_alert, color: AppColors.pureWhite),
          label: const Text('TRIGGER EMERGENCY SOS', style: TextStyle(color: AppColors.pureWhite, fontWeight: FontWeight.w900, fontSize: 14)),
          onPressed: () => provider.triggerSosAlert(),
        ),
      ],
    );
  }

  // 6. Medical Panel
  Widget _buildMedicalPanel(BuildContext context, NavidoorProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInfoRow('BLOOD GROUP', 'O+ Positive'),
        const SizedBox(height: 10),
        _buildInfoRow('ALLERGIES', 'Penicillin (Severe), Peanuts (Mild)'),
        const SizedBox(height: 10),
        _buildInfoRow('CHRONIC CONDITIONS', 'Hypertension, Mild Glaucoma'),
        const SizedBox(height: 10),
        _buildInfoRow('PRIMARY PHYSICIAN', 'Dr. Ramesh Sharma (+91 98220 11223)'),
      ],
    );
  }

  // 7. Languages Panel
  Widget _buildLanguagesPanel(BuildContext context, NavidoorProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: kSupportedLanguages.map((lang) {
        final isSelected = provider.activeLanguageCode == lang.code;
        return Material(
          color: Colors.transparent,
          child: ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Text(lang.flag, style: const TextStyle(fontSize: 24)),
            title: Text(
              '${lang.name} (${lang.nativeName})',
              style: TextStyle(
                color: isSelected ? AppColors.cyanLight : AppColors.pureWhite,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            trailing: isSelected
                ? const Icon(LucideIcons.check, color: AppColors.cyanLight)
                : null,
            onTap: () => provider.setActiveLanguageCode(lang.code),
          ),
        );
      }).toList(),
    );
  }

  // 8. Settings Panel
  Widget _buildSettingsPanel(BuildContext context, NavidoorProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('CONTRAST THEMES', style: TextStyle(color: AppColors.cyanLight, fontSize: 12, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        _buildThemeOption(context, provider, ThemeModeOption.standard, 'Standard Slate Gray'),
        _buildThemeOption(context, provider, ThemeModeOption.highContrastDark, 'High-Contrast Dark'),
        _buildThemeOption(context, provider, ThemeModeOption.highContrastAmber, 'High-Contrast Amber'),
      ],
    );
  }

  Widget _buildThemeOption(BuildContext context, NavidoorProvider provider, ThemeModeOption mode, String label) {
    final isSelected = provider.themeMode == mode;
    return Material(
      color: Colors.transparent,
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        title: Text(label, style: TextStyle(color: isSelected ? AppColors.cyanLight : AppColors.pureWhite, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
        trailing: isSelected ? const Icon(LucideIcons.check, color: AppColors.cyanLight) : null,
        onTap: () => provider.setThemeMode(mode),
      ),
    );
  }

  // 9. Family & Transport & History
  Widget _buildFamilyPanel(BuildContext context, NavidoorProvider provider) {
    return Column(
      children: [
        const Text('Caregiver stream ready: Sunita Sharma (+91 98765 43210)', style: TextStyle(color: AppColors.pureWhite)),
        const SizedBox(height: 12),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.cyanPrimary),
          onPressed: () => provider.speak('Live camera feed shared with Sunita.'),
          child: const Text('Connect Live Video Stream', style: TextStyle(color: AppColors.pureWhite)),
        ),
      ],
    );
  }

  Widget _buildTransportPanel(BuildContext context, NavidoorProvider provider) {
    return _buildInfoRow('TRANSIT ARRIVAL', 'Bus 42 Northbound arriving at stop in 3 minutes.');
  }

  Widget _buildHistoryPanel(BuildContext context, NavidoorProvider provider) {
    return _buildInfoRow('ACTIVITY HISTORY', '3 text snippets and 2 navigation journeys saved today.');
  }

  Widget _buildAssistSummaryPanel(BuildContext context, NavidoorProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('SCENE DETECTION SUMMARY', style: TextStyle(color: AppColors.cyanLight, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text(provider.lastAnnouncement, style: const TextStyle(color: AppColors.pureWhite, fontSize: 14)),
      ],
    );
  }

  Widget _buildInfoRow(String title, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.lightGrayCard.withValues(alpha: 0.25),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.lightGrayBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: AppColors.cyanLight, fontSize: 10, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(color: AppColors.pureWhite, fontSize: 14, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
