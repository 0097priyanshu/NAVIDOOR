import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import '../../providers/navidoor_provider.dart';

class CameraHeader extends StatelessWidget {
  const CameraHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NavidoorProvider>();

    if (provider.isFirstTimeUser) {
      return const SizedBox.shrink();
    }

    return Positioned(
      top: 14,
      left: 0,
      right: 0,
      child: SafeArea(
        bottom: false,
        child: Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Top-Left: Sleek Circular Emergency SOS FAB (matching React Native CameraHeader)
                  Semantics(
                    button: true,
                    label: 'Emergency SOS button',
                    hint: 'Tap to broadcast emergency location',
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFFE11D48),
                        boxShadow: [
                          BoxShadow(
                            color: Color(0x99E11D48),
                            offset: Offset(0, 4),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        shape: const CircleBorder(),
                        child: InkWell(
                          customBorder: const CircleBorder(),
                          onTap: () => provider.triggerSosAlert(),
                          child: const Center(
                            child: Icon(
                              LucideIcons.circle_alert,
                              size: 22,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Top-Right: Sleek Circular User Profile & Settings FAB (matching React Native CameraHeader)
                  Semantics(
                    button: true,
                    label: 'User Profile and Settings for ${provider.userName}',
                    hint: 'Tap to view medical ID, language, and user profile details',
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFF0284C7),
                        border: Border.all(color: const Color(0xFF38BDF8), width: 1.5),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x660284C7),
                            offset: Offset(0, 4),
                            blurRadius: 8,
                          ),
                        ],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        shape: const CircleBorder(),
                        child: InkWell(
                          customBorder: const CircleBorder(),
                          onTap: () => provider.setIsProfileModalOpen(true),
                          child: const Center(
                            child: Icon(
                              LucideIcons.user,
                              size: 20,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
