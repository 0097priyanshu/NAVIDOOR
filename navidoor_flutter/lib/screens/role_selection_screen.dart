import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import '../models/nav_models.dart';
import '../providers/navidoor_provider.dart';

class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({super.key});

  void _handleSelectRole(BuildContext context, UserRole role) {
    final provider = context.read<NavidoorProvider>();
    provider.setUserRole(role);

    if (role == UserRole.navidoorUser) {
      provider.setIsFirstTimeUser(true);
      provider.speak('Selected Navidoor User mode. Loading setup onboarding.');
    } else {
      provider.setIsFirstTimeUser(false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF64748B),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            physics: const ClampingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Top-Left Brand Header (exact 1-to-1 match with React Native)
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: const Color(0xFF0284C7),
                                shape: BoxShape.circle,
                                boxShadow: const [
                                  BoxShadow(
                                    color: Colors.black26,
                                    offset: Offset(0, 3),
                                    blurRadius: 6,
                                  ),
                                ],
                              ),
                              child: const Center(
                                child: Icon(
                                  LucideIcons.sparkles,
                                  size: 24,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Text(
                              'NAVIDOOR',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 26,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 2.5,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        const Padding(
                          padding: EdgeInsets.only(left: 2),
                          child: Text(
                            'AI MOBILITY & SAFETY',
                            style: TextStyle(
                              color: Color(0xFFE2E8F0),
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Welcome Section
                  const Column(
                    children: [
                      Text(
                        'Welcome',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Select your role to proceed:',
                        style: TextStyle(
                          color: Color(0xFFF1F5F9),
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Role Cards Container
                  Column(
                    children: [
                      // Card 1: NAVIDOOR USER
                      _buildRoleCard(
                        context: context,
                        title: 'NAVIDOOR USER',
                        subtitle: 'Voice navigation & camera vision',
                        accentColor: const Color(0xFF0284C7),
                        icon: LucideIcons.eye,
                        onTap: () => _handleSelectRole(context, UserRole.navidoorUser),
                      ),
                      const SizedBox(height: 14),

                      // Card 2: FAMILY MEMBER
                      _buildRoleCard(
                        context: context,
                        title: 'FAMILY MEMBER',
                        subtitle: 'Live tracking & emergency alerts',
                        accentColor: const Color(0xFF4F46E5),
                        icon: LucideIcons.heart,
                        onTap: () => _handleSelectRole(context, UserRole.familyMember),
                      ),
                    ],
                  ),

                  const SizedBox(height: 36),

                  // Bottom Footer Note
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        LucideIcons.shield_check,
                        size: 16,
                        color: Color(0xFFE2E8F0),
                      ),
                      SizedBox(width: 6),
                      Text(
                        'Secure Encrypted Link',
                        style: TextStyle(
                          color: Color(0xFFE2E8F0),
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
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
    required String title,
    required String subtitle,
    required Color accentColor,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Material(
      color: const Color(0xFFF8FAFC),
      borderRadius: BorderRadius.circular(18),
      elevation: 4,
      shadowColor: const Color(0x1A0F172A),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: accentColor, width: 2),
          ),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: accentColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Icon(icon, size: 24, color: Colors.white),
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
                        color: Color(0xFF0F172A),
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: Color(0xFF475569),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                LucideIcons.chevron_right,
                size: 22,
                color: accentColor,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
