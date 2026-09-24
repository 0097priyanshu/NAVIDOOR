import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import '../../models/nav_models.dart';
import '../../providers/navidoor_provider.dart';
import '../common/unified_mic_button.dart';

class WheelItemConfig {
  final NavMode mode;
  final String label;
  final IconData icon;

  const WheelItemConfig({
    required this.mode,
    required this.label,
    required this.icon,
  });
}

const List<WheelItemConfig> kWheelItems = [
  WheelItemConfig(mode: NavMode.assist, label: 'ASSIST', icon: LucideIcons.house),
  WheelItemConfig(mode: NavMode.navigate, label: 'NAVIGATE', icon: LucideIcons.compass),
  WheelItemConfig(mode: NavMode.read, label: 'READ', icon: LucideIcons.book_open),
  WheelItemConfig(mode: NavMode.medicine, label: 'MEDICINE', icon: LucideIcons.pill),
  WheelItemConfig(mode: NavMode.transport, label: 'TRANSIT', icon: LucideIcons.bus),
  WheelItemConfig(mode: NavMode.location, label: 'LIVE LOC', icon: LucideIcons.map_pin),
  WheelItemConfig(mode: NavMode.emergency, label: 'CALL SOS', icon: LucideIcons.phone),
  WheelItemConfig(mode: NavMode.medical, label: 'MEDICAL', icon: LucideIcons.activity),
  WheelItemConfig(mode: NavMode.family, label: 'FAMILY', icon: LucideIcons.users),
  WheelItemConfig(mode: NavMode.history, label: 'HISTORY', icon: LucideIcons.clock),
  WheelItemConfig(mode: NavMode.languages, label: 'LANG', icon: LucideIcons.globe),
  WheelItemConfig(mode: NavMode.settings, label: 'SETTINGS', icon: LucideIcons.settings),
];

class RotatingAIModeWheel extends StatefulWidget {
  const RotatingAIModeWheel({super.key});

  @override
  State<RotatingAIModeWheel> createState() => _RotatingAIModeWheelState();
}

class _RotatingAIModeWheelState extends State<RotatingAIModeWheel> {
  double _lastStepDx = 0;

  static const List<NavMode> visionModes = [
    NavMode.assist,
    NavMode.navigate,
    NavMode.read,
    NavMode.medicine,
    NavMode.transport,
  ];

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NavidoorProvider>();
    if (provider.isFirstTimeUser) return const SizedBox.shrink();

    final activeIndex = math.max(
      0,
      kWheelItems.indexWhere((item) => item.mode == provider.activeMode),
    );
    final isVisionMode = visionModes.contains(provider.activeMode);

    final screenWidth = MediaQuery.of(context).size.width;
    final dockWidth = math.min(screenWidth - 14, 460.0);

    // Continuous 5-item visible arc indices
    final List<int> visibleIndices = [];
    final total = kWheelItems.length;
    for (int offset = -2; offset <= 2; offset++) {
      int idx = (activeIndex + offset) % total;
      if (idx < 0) idx += total;
      visibleIndices.add(idx);
    }

    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      height: 230,
      child: Stack(
        alignment: Alignment.bottomCenter,
        clipBehavior: Clip.none,
        children: [
          // 1. DUAL / SINGLE PRIMARY ACTION DOCK (at bottom: 112 matching React Native)
          if (!provider.isProfileModalOpen)
            Positioned(
              bottom: 112,
              child: SizedBox(
                width: math.min(screenWidth - 72, 380.0),
                child: Row(
                  mainAxisAlignment: isVisionMode
                      ? MainAxisAlignment.spaceBetween
                      : MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Voice Assistant Mic FAB
                    UnifiedMicButton(
                      voiceState: provider.voiceState,
                      onPress: () {
                        if (provider.voiceState == VoiceState.speaking) {
                          provider.stopVoice();
                        } else if (provider.voiceState == VoiceState.listening) {
                          provider.setVoiceState(VoiceState.thinking);
                          Future.delayed(const Duration(milliseconds: 1000), () {
                            provider.generateSceneDescription();
                          });
                        } else {
                          provider.stopVoice();
                          provider.setVoiceState(VoiceState.listening);
                        }
                      },
                      showLabel: true,
                      size: 68,
                    ),

                    // Click Picture Shutter FAB (Only in Vision Modes)
                    if (isVisionMode)
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 68,
                            height: 68,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Color(0xFF0284C7),
                              boxShadow: [
                                BoxShadow(
                                  color: Color(0x730284C7),
                                  blurRadius: 10,
                                  offset: Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Material(
                              color: Colors.transparent,
                              shape: const CircleBorder(),
                              child: InkWell(
                                customBorder: const CircleBorder(),
                                onTap: () => provider.capturePhotoAndAnalyze(),
                                child: const Center(
                                  child: Icon(
                                    LucideIcons.camera,
                                    size: 28,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'SNAP PHOTO',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.0,
                              shadows: [
                                Shadow(
                                  color: Color(0x99000000),
                                  offset: Offset(0, 1),
                                  blurRadius: 3,
                                ),
                              ],
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ),

          // 2. SIGNATURE HIGH-CLARITY GRAY AI MODE WHEEL NAVBAR DOCK (at bottom: 0)
          GestureDetector(
            onHorizontalDragStart: (details) {
              _lastStepDx = details.localPosition.dx;
            },
            onHorizontalDragUpdate: (details) {
              final currentX = details.localPosition.dx;
              final diff = currentX - _lastStepDx;
              if (diff.abs() > 28) {
                if (diff < 0) {
                  provider.cycleNextMode();
                } else {
                  provider.cyclePrevMode();
                }
                _lastStepDx = currentX;
              }
            },
            onHorizontalDragEnd: (details) {
              final velocity = details.primaryVelocity ?? 0;
              if (velocity < -200) {
                provider.cycleNextMode();
              } else if (velocity > 200) {
                provider.cyclePrevMode();
              }
            },
            child: Container(
              width: dockWidth,
              height: 92,
              decoration: const BoxDecoration(
                color: Color(0xFFCBD5E1),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(38),
                  topRight: Radius.circular(38),
                ),
                border: Border(
                  top: BorderSide(color: Color(0xFF64748B), width: 1.5),
                  left: BorderSide(color: Color(0xFF64748B), width: 1.5),
                  right: BorderSide(color: Color(0xFF64748B), width: 1.5),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Color(0x260284C7),
                    offset: Offset(0, -8),
                    blurRadius: 16,
                  ),
                ],
              ),
              child: Stack(
                alignment: Alignment.center,
                clipBehavior: Clip.none,
                children: visibleIndices.asMap().entries.map((entry) {
                  final posIndex = entry.key;
                  final idx = entry.value;
                  final item = kWheelItems[idx];
                  final offset = posIndex - 2;
                  final isActive = idx == activeIndex;

                  // Continuous Semi-Circle Arc Geometry (Matching React Native RotatingAIModeWheel)
                  final angle = (offset * math.pi) / 6.2;
                  final posX = math.sin(angle) * (dockWidth > 400 ? 140 : (dockWidth * 0.35));
                  final posY = (1 - math.cos(angle)) * 16;

                  final scale = isActive ? 1.25 : (offset.abs() == 1 ? 0.95 : 0.78);
                  final opacity = isActive ? 1.0 : (offset.abs() == 1 ? 0.88 : 0.55);

                  return Positioned(
                    bottom: 12 - posY,
                    child: Transform.translate(
                      offset: Offset(posX, 0),
                      child: Transform.scale(
                        scale: scale,
                        child: Opacity(
                          opacity: opacity,
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 52,
                                height: 52,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: isActive
                                      ? const Color(0xFF0284C7)
                                      : const Color(0xFF94A3B8),
                                ),
                                child: Material(
                                  color: Colors.transparent,
                                  shape: const CircleBorder(),
                                  child: InkWell(
                                    customBorder: const CircleBorder(),
                                    onTap: () => provider.setActiveMode(item.mode),
                                    child: Center(
                                      child: Icon(
                                        item.icon,
                                        size: 22,
                                        color: isActive
                                            ? Colors.white
                                            : const Color(0xFF0F172A),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                item.label,
                                style: TextStyle(
                                  color: isActive
                                      ? const Color(0xFF0284C7)
                                      : const Color(0xFF0F172A),
                                  fontSize: 11.5,
                                  fontWeight: isActive
                                      ? FontWeight.w900
                                      : FontWeight.w700,
                                  letterSpacing: 0.6,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
