import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import '../models/nav_models.dart';
import '../providers/navidoor_provider.dart';
import '../theme/design_system.dart';

class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.read<NavidoorProvider>();
    final isDesktop = ResponsiveHelper.isDesktop(context);

    return Scaffold(
      backgroundColor: AppColors.darkGray,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(
              horizontal: isDesktop ? 48 : 24,
              vertical: 32,
            ),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: isDesktop ? 960 : 440,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Header Logo & Badge
                  Container(
                    width: 72,
                    height: 72,
                    decoration: const BoxDecoration(
                      color: AppColors.cyanPrimary,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.cyanGlow,
                          blurRadius: 20,
                          spreadRadius: 4,
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Icon(LucideIcons.eye, size: 40, color: AppColors.pureWhite),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'NAVIDOOR',
                    style: TextStyle(
                      color: AppColors.pureWhite,
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.0,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'AI ACCESSIBILITY & DUAL-ROLE ECOSYSTEM',
                    style: TextStyle(
                      color: AppColors.cyanLight.withValues(alpha: 0.9),
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 36),

                  // Cards: Side-by-side on desktop, stacked on mobile
                  if (isDesktop)
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: _buildRoleCard(
                            context: context,
                            icon: LucideIcons.user,
                            title: 'I NEED ASSISTANCE',
                            subtitle: 'For blind, visually impaired, or elderly users',
                            features: [
                              'Live Camera Obstacle & Doorway Perception',
                              'Voice-First 10 Regional Indian Languages',
                              'Turn-by-Turn AR Audio Walking Guidance',
                              'Instant 1-Tap Emergency SOS Broadcast',
                            ],
                            buttonText: 'ENTER ASSIST MODE',
                            isPrimary: true,
                            onTap: () => provider.setUserRole(UserRole.navidoorUser),
                          ),
                        ),
                        const SizedBox(width: 24),
                        Expanded(
                          child: _buildRoleCard(
                            context: context,
                            icon: LucideIcons.heart_handshake,
                            title: 'I AM A FAMILY CAREGIVER',
                            subtitle: 'For family members, guardians & caregivers',
                            features: [
                              'Live GPS Location & Walking Route Map',
                              'Real-Time Camera Video Stream Assist',
                              'Emergency SOS Audible Chime Monitor',
                              'Medication & Activity Confirmation Logs',
                            ],
                            buttonText: 'ENTER CAREGIVER PORTAL',
                            isPrimary: false,
                            onTap: () => provider.setUserRole(UserRole.familyMember),
                          ),
                        ),
                      ],
                    )
                  else
                    Column(
                      children: [
                        _buildRoleCard(
                          context: context,
                          icon: LucideIcons.user,
                          title: 'I NEED ASSISTANCE',
                          subtitle: 'For blind, visually impaired, or elderly users',
                          features: [
                            'Live Camera Obstacle & Doorway Perception',
                            'Voice-First 10 Regional Indian Languages',
                            'Turn-by-Turn AR Audio Walking Guidance',
                            'Instant 1-Tap Emergency SOS Broadcast',
                          ],
                          buttonText: 'ENTER ASSIST MODE',
                          isPrimary: true,
                          onTap: () => provider.setUserRole(UserRole.navidoorUser),
                        ),
                        const SizedBox(height: 20),
                        _buildRoleCard(
                          context: context,
                          icon: LucideIcons.heart_handshake,
                          title: 'I AM A FAMILY CAREGIVER',
                          subtitle: 'For family members, guardians & caregivers',
                          features: [
                            'Live GPS Location & Walking Route Map',
                            'Real-Time Camera Video Stream Assist',
                            'Emergency SOS Audible Chime Monitor',
                            'Medication & Activity Confirmation Logs',
                          ],
                          buttonText: 'ENTER CAREGIVER PORTAL',
                          isPrimary: false,
                          onTap: () => provider.setUserRole(UserRole.familyMember),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRoleCard({
    required BuildContext context,
    required IconData icon,
    required String title,
    required String subtitle,
    required List<String> features,
    required String buttonText,
    required bool isPrimary,
    required VoidCallback onTap,
  }) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.lightGrayBg.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isPrimary ? AppColors.cyanLight : AppColors.lightGrayBorder,
          width: 2.0,
        ),
        boxShadow: [
          BoxShadow(
            color: isPrimary ? AppColors.cyanGlow : Colors.black26,
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isPrimary ? AppColors.cyanPrimary : AppColors.lightGrayCard,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Icon(
                    icon,
                    size: 26,
                    color: isPrimary ? AppColors.pureWhite : AppColors.darkText,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: AppColors.pureWhite,
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: AppColors.lightGrayCard,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ...features.map(
            (f) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  const Icon(LucideIcons.circle_check, size: 16, color: AppColors.cyanLight),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      f,
                      style: const TextStyle(
                        color: AppColors.pureWhite,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: isPrimary ? AppColors.cyanPrimary : AppColors.pureWhite,
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 4,
            ),
            onPressed: onTap,
            child: Text(
              buttonText,
              style: TextStyle(
                color: isPrimary ? AppColors.pureWhite : AppColors.darkText,
                fontWeight: FontWeight.w900,
                fontSize: 13,
                letterSpacing: 1.0,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
