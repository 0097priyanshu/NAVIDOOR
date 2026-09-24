import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import '../../models/nav_models.dart';
import '../../providers/navidoor_provider.dart';
import '../../widgets/common/unified_mic_button.dart';

class UserProfileModal extends StatefulWidget {
  const UserProfileModal({super.key});

  @override
  State<UserProfileModal> createState() => _UserProfileModalState();
}

class _UserProfileModalState extends State<UserProfileModal> {
  bool _isLocationSharing = false;

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NavidoorProvider>();

    if (!provider.isProfileModalOpen) {
      return const SizedBox.shrink();
    }

    return Material(
      color: Colors.transparent,
      child: Stack(
        children: [
          // Semi-transparent Slate Backdrop (matching React Native UserProfileModal)
          Positioned.fill(
            child: GestureDetector(
              onTap: () => provider.setIsProfileModalOpen(false),
              child: Container(
                color: const Color(0xCC64748B),
              ),
            ),
          ),

          // Modal Card at Bottom Center
          Align(
            alignment: Alignment.bottomCenter,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Top Floating Mic Anchor (matching React Native)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: UnifiedMicButton(
                      voiceState: provider.voiceState,
                      onPress: () {
                        provider.speak('Profile details active for ${provider.userName}');
                      },
                      showLabel: true,
                      size: 68,
                      labelOverride: 'SPEAK PROFILE EDIT',
                    ),
                  ),

                  // Bottom Profile Sheet Card
                  Container(
                    width: double.infinity,
                    constraints: BoxConstraints(
                      maxHeight: MediaQuery.of(context).size.height * 0.74,
                    ),
                    decoration: const BoxDecoration(
                      color: Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(28),
                        topRight: Radius.circular(28),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Color(0x400284C7),
                          offset: Offset(0, -8),
                          blurRadius: 16,
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Row(
                              children: [
                                Icon(LucideIcons.user, size: 22, color: Color(0xFF0284C7)),
                                SizedBox(width: 8),
                                Text(
                                  'USER PROFILE & MEDICAL ID',
                                  style: TextStyle(
                                    color: Color(0xFF0F172A),
                                    fontSize: 14,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                              ],
                            ),
                            IconButton(
                              icon: const Icon(LucideIcons.x, size: 22, color: Color(0xFF0F172A)),
                              onPressed: () => provider.setIsProfileModalOpen(false),
                            ),
                          ],
                        ),
                        const Divider(color: Color(0xFF94A3B8), height: 16),

                        // Scrollable Profile Sections
                        Flexible(
                          child: SingleChildScrollView(
                            physics: const BouncingScrollPhysics(),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // User Avatar Row
                                Container(
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF94A3B8),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 52,
                                        height: 52,
                                        decoration: const BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: Color(0xFF0284C7),
                                        ),
                                        child: Center(
                                          child: Text(
                                            provider.userName.isNotEmpty
                                                ? provider.userName[0].toUpperCase()
                                                : 'U',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 22,
                                              fontWeight: FontWeight.w900,
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              provider.userName,
                                              style: const TextStyle(
                                                color: Color(0xFF0F172A),
                                                fontSize: 16,
                                                fontWeight: FontWeight.w900,
                                              ),
                                            ),
                                            Text(
                                              'Voice Language: ${provider.activeLanguageCode.toUpperCase()}',
                                              style: const TextStyle(
                                                color: Color(0xFF334155),
                                                fontSize: 12,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 14),

                                // Personal Details
                                _buildSectionBox(
                                  title: 'PERSONAL DETAILS',
                                  child: Row(
                                    children: [
                                      const Icon(LucideIcons.phone, size: 16, color: Color(0xFF0284C7)),
                                      const SizedBox(width: 10),
                                      Text(
                                        provider.userPhone,
                                        style: const TextStyle(
                                          color: Color(0xFF0F172A),
                                          fontSize: 14,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 12),

                                // Emergency Medical ID
                                _buildSectionBox(
                                  title: 'EMERGENCY MEDICAL ID',
                                  child: Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF8FAFC),
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(color: const Color(0xFFE11D48), width: 1.5),
                                    ),
                                    child: const Row(
                                      children: [
                                        Icon(LucideIcons.shield_alert, size: 18, color: Color(0xFFE11D48)),
                                        SizedBox(width: 10),
                                        Expanded(
                                          child: Text(
                                            'Allergic to Penicillin • Blood Type O+',
                                            style: TextStyle(
                                              color: Color(0xFF0F172A),
                                              fontSize: 13,
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 12),

                                // Primary SOS Contact
                                _buildSectionBox(
                                  title: 'PRIMARY EMERGENCY CONTACT',
                                  child: Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF8FAFC),
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(color: const Color(0xFF94A3B8), width: 1),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(LucideIcons.phone, size: 18, color: Color(0xFF0284C7)),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                '${provider.emergencyContacts.firstOrNull?.name ?? "Sunita Sharma"} (${provider.emergencyContacts.firstOrNull?.relation ?? "Daughter"})',
                                                style: const TextStyle(
                                                  color: Color(0xFF0F172A),
                                                  fontWeight: FontWeight.w900,
                                                  fontSize: 13,
                                                ),
                                              ),
                                              Text(
                                                provider.emergencyContacts.firstOrNull?.phone ?? '+91 98765 43210',
                                                style: const TextStyle(
                                                  color: Color(0xFF475569),
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 12),

                                // Loaded Medicines
                                _buildSectionBox(
                                  title: 'LOADED PRESCRIPTION MEDICINES',
                                  child: Column(
                                    children: provider.medicines.map((m) {
                                      return Container(
                                        margin: const EdgeInsets.only(bottom: 8),
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF8FAFC),
                                          borderRadius: BorderRadius.circular(14),
                                          border: Border.all(color: const Color(0xFF94A3B8), width: 1),
                                        ),
                                        child: Row(
                                          children: [
                                            const Icon(LucideIcons.pill, size: 18, color: Color(0xFF0284C7)),
                                            const SizedBox(width: 10),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    m.name,
                                                    style: const TextStyle(
                                                      color: Color(0xFF0F172A),
                                                      fontWeight: FontWeight.w900,
                                                      fontSize: 13,
                                                    ),
                                                  ),
                                                  Text(
                                                    '${m.dosage} • ${m.instructions}',
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
                                    }).toList(),
                                  ),
                                ),
                                const SizedBox(height: 12),

                                // Live Location Sharing
                                _buildSectionBox(
                                  title: 'EMERGENCY LOCATION SHARING',
                                  child: InkWell(
                                    onTap: () {
                                      setState(() => _isLocationSharing = !_isLocationSharing);
                                      provider.speak(
                                        _isLocationSharing
                                            ? 'Live location sharing activated.'
                                            : 'Live location sharing deactivated.',
                                      );
                                    },
                                    borderRadius: BorderRadius.circular(14),
                                    child: Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: _isLocationSharing
                                            ? const Color(0xFF0284C7)
                                            : const Color(0xFFF8FAFC),
                                        borderRadius: BorderRadius.circular(14),
                                        border: Border.all(
                                          color: _isLocationSharing
                                              ? const Color(0xFF38BDF8)
                                              : const Color(0xFF94A3B8),
                                          width: 1.5,
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          Icon(
                                            LucideIcons.map_pin,
                                            size: 18,
                                            color: _isLocationSharing ? Colors.white : const Color(0xFF0284C7),
                                          ),
                                          const SizedBox(width: 10),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  _isLocationSharing ? 'Live Tracking Active' : 'Share Live Location',
                                                  style: TextStyle(
                                                    color: _isLocationSharing ? Colors.white : const Color(0xFF0F172A),
                                                    fontWeight: FontWeight.w900,
                                                    fontSize: 13,
                                                  ),
                                                ),
                                                Text(
                                                  _isLocationSharing
                                                      ? 'Broadcasting: 28.6315° N, 77.2167° E'
                                                      : 'Tap to enable continuous tracking',
                                                  style: TextStyle(
                                                    color: _isLocationSharing
                                                        ? const Color(0xFFE2E8F0)
                                                        : const Color(0xFF475569),
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 20),

                                // Logout & Reset Profile Setup Button (matching React Native)
                                ElevatedButton.icon(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFFF8FAFC),
                                    foregroundColor: const Color(0xFFE11D48),
                                    side: const BorderSide(color: Color(0xFFE11D48), width: 1.5),
                                    minimumSize: const Size(double.infinity, 48),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                    elevation: 0,
                                  ),
                                  onPressed: () {
                                    provider.setIsProfileModalOpen(false);
                                    provider.setUserRole(UserRole.undecided);
                                  },
                                  icon: const Icon(LucideIcons.log_out, size: 18, color: Color(0xFFE11D48)),
                                  label: const Text(
                                    'LOGOUT & RESET PROFILE SETUP',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w900,
                                      fontSize: 12.5,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 12),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionBox({required String title, required Widget child}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: Color(0xFF0284C7),
            fontSize: 11,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(height: 6),
        child,
      ],
    );
  }
}
