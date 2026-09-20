import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import '../../models/nav_models.dart';
import '../../providers/navidoor_provider.dart';
import '../../theme/design_system.dart';

class UserProfileModal extends StatelessWidget {
  const UserProfileModal({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NavidoorProvider>();
    if (!provider.isProfileModalOpen) return const SizedBox.shrink();

    final isDesktop = ResponsiveHelper.isDesktop(context);

    return Material(
      color: const Color(0xBF000000),
      child: Center(
        child: Container(
          width: isDesktop ? 520 : double.infinity,
          margin: EdgeInsets.all(isDesktop ? 32 : 16),
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.85,
          ),
          decoration: BoxDecoration(
            color: AppColors.darkGray,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.lightGrayBorder, width: 2),
            boxShadow: const [
              BoxShadow(
                color: Colors.black54,
                blurRadius: 24,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                decoration: const BoxDecoration(
                  color: AppColors.lightGrayBg,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.user, color: AppColors.pureWhite, size: 22),
                    const SizedBox(width: 10),
                    const Text(
                      'USER PROFILE & MEDICAL ID',
                      style: TextStyle(
                        color: AppColors.pureWhite,
                        fontWeight: FontWeight.w900,
                        fontSize: 15,
                        letterSpacing: 1.0,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(LucideIcons.x, color: AppColors.pureWhite),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () => provider.setIsProfileModalOpen(false),
                    ),
                  ],
                ),
              ),

              // Body
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // User Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.lightGrayCard.withValues(alpha: 0.25),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.cyanLight),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 50,
                              height: 50,
                              decoration: const BoxDecoration(
                                color: AppColors.cyanPrimary,
                                shape: BoxShape.circle,
                              ),
                              child: const Center(
                                child: Icon(LucideIcons.user, color: AppColors.pureWhite, size: 28),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  provider.userName,
                                  style: const TextStyle(
                                    color: AppColors.pureWhite,
                                    fontSize: 17,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  provider.userPhone,
                                  style: const TextStyle(
                                    color: AppColors.cyanLight,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),
                      const Text(
                        'MEDICAL SUMMARY',
                        style: TextStyle(color: AppColors.cyanLight, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      _buildProfileItem('Blood Group', 'O+ Positive'),
                      _buildProfileItem('Allergies', 'Penicillin (Severe)'),
                      _buildProfileItem('Emergency Contact', 'Sunita Sharma (Daughter, +91 98765 43210)'),

                      const SizedBox(height: 20),
                      const Text(
                        'VOICE SPEECH RATE',
                        style: TextStyle(color: AppColors.cyanLight, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                      Row(
                        children: [
                          const Text('0.8x', style: TextStyle(color: AppColors.pureWhite)),
                          Expanded(
                            child: Slider(
                              value: provider.speechRate,
                              min: 0.8,
                              max: 1.5,
                              divisions: 7,
                              activeColor: AppColors.cyanLight,
                              inactiveColor: AppColors.lightGrayBorder,
                              label: '${provider.speechRate.toStringAsFixed(1)}x',
                              onChanged: (val) => provider.setSpeechRate(val),
                            ),
                          ),
                          const Text('1.5x', style: TextStyle(color: AppColors.pureWhite)),
                        ],
                      ),

                      const SizedBox(height: 20),
                      const Text(
                        'PRIMARY REGIONAL INDIAN LANGUAGE',
                        style: TextStyle(color: AppColors.cyanLight, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: kSupportedLanguages.map((lang) {
                          final isSelected = provider.activeLanguageCode == lang.code;
                          return ChoiceChip(
                            selected: isSelected,
                            selectedColor: AppColors.cyanPrimary,
                            backgroundColor: AppColors.lightGrayCard.withValues(alpha: 0.2),
                            label: Text(
                              '${lang.flag} ${lang.name}',
                              style: TextStyle(
                                color: isSelected ? AppColors.pureWhite : AppColors.pureWhite.withValues(alpha: 0.8),
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              ),
                            ),
                            onSelected: (_) => provider.setActiveLanguageCode(lang.code),
                          );
                        }).toList(),
                      ),

                      const SizedBox(height: 24),
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.uberSafetyRed,
                          side: const BorderSide(color: AppColors.uberSafetyRed),
                          minimumSize: const Size(double.infinity, 46),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        icon: const Icon(LucideIcons.log_out, size: 18),
                        label: const Text('Switch / Change App Role', style: TextStyle(fontWeight: FontWeight.bold)),
                        onPressed: () {
                          provider.setUserRole(UserRole.undecided);
                          provider.setIsProfileModalOpen(false);
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 140,
            child: Text(
              label,
              style: const TextStyle(color: AppColors.lightGrayCard, fontSize: 13, fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(color: AppColors.pureWhite, fontSize: 13, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
