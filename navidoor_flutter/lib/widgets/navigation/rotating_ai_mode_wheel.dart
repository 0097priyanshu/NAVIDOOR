import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import '../../models/nav_models.dart';
import '../../providers/navidoor_provider.dart';
import '../../theme/design_system.dart';
import '../../utils/translations.dart';
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

class RotatingAIModeWheel extends StatelessWidget {
  const RotatingAIModeWheel({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NavidoorProvider>();
    final activeMode = provider.activeMode;
    final isDesktop = ResponsiveHelper.isDesktop(context);

    return Container(
      padding: const EdgeInsets.only(top: 12, bottom: 20),
      decoration: BoxDecoration(
        color: AppColors.darkGray.withValues(alpha: 0.95),
        border: const Border(
          top: BorderSide(color: AppColors.lightGrayBorder, width: 2),
        ),
        boxShadow: const [
          BoxShadow(
            color: Colors.black45,
            blurRadius: 16,
            offset: Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Center Floating Mic Button
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: UnifiedMicButton(
              voiceState: provider.voiceState,
              onPress: () {
                if (provider.voiceState == VoiceState.speaking) {
                  provider.stopVoice();
                } else if (provider.voiceState == VoiceState.idle) {
                  provider.setVoiceState(VoiceState.listening);
                  Future.delayed(const Duration(milliseconds: 2200), () {
                    provider.generateSceneDescription();
                  });
                }
              },
            ),
          ),

          // Horizontal Wheel Scrollable Row
          SizedBox(
            height: isDesktop ? 68 : 58,
            child: Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: isDesktop ? 900 : double.infinity,
                ),
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: kWheelItems.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final item = kWheelItems[index];
                    final isActive = item.mode == activeMode;
                    final modeTrans = getModeTranslation(
                      provider.activeLanguageCode,
                      item.mode,
                    );

                    return Semantics(
                      button: true,
                      selected: isActive,
                      label: '${modeTrans.name} mode',
                      hint: 'Tap to switch to ${modeTrans.name} mode',
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: () => provider.setActiveMode(item.mode),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: EdgeInsets.symmetric(
                              horizontal: isActive ? 16 : 12,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: isActive
                                  ? AppColors.cyanPrimary
                                  : AppColors.lightGrayBg.withValues(alpha: 0.35),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isActive
                                    ? AppColors.cyanLight
                                    : AppColors.lightGrayBorder,
                                width: isActive ? 2.5 : 1.0,
                              ),
                              boxShadow: isActive
                                  ? const [
                                      BoxShadow(
                                        color: AppColors.cyanGlow,
                                        blurRadius: 10,
                                        spreadRadius: 1,
                                      ),
                                    ]
                                  : null,
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  item.icon,
                                  size: isActive ? 22 : 18,
                                  color: isActive
                                      ? AppColors.pureWhite
                                      : AppColors.pureWhite.withValues(alpha: 0.75),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  modeTrans.name,
                                  style: TextStyle(
                                    color: isActive
                                        ? AppColors.pureWhite
                                        : AppColors.pureWhite.withValues(alpha: 0.8),
                                    fontSize: isActive ? 13 : 11,
                                    fontWeight: isActive
                                        ? FontWeight.w900
                                        : FontWeight.w600,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
