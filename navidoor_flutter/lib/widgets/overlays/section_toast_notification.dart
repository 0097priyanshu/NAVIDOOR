import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import '../../models/nav_models.dart';
import '../../providers/navidoor_provider.dart';

class SectionMeta {
  final String title;
  final IconData icon;

  const SectionMeta({required this.title, required this.icon});
}

const Map<NavMode, SectionMeta> kSectionDetails = {
  NavMode.assist: SectionMeta(title: 'AI VISION ASSIST', icon: LucideIcons.house),
  NavMode.navigate: SectionMeta(title: 'SPATIAL NAVIGATION', icon: LucideIcons.compass),
  NavMode.read: SectionMeta(title: 'READ & OCR SCANNER', icon: LucideIcons.book_open),
  NavMode.medicine: SectionMeta(title: 'MEDICINE DOSAGE SCAN', icon: LucideIcons.pill),
  NavMode.transport: SectionMeta(title: 'PUBLIC TRANSIT ASSIST', icon: LucideIcons.bus),
  NavMode.emergency: SectionMeta(title: 'EMERGENCY SOS', icon: LucideIcons.shield_alert),
  NavMode.family: SectionMeta(title: 'FAMILY REMOTE ASSIST', icon: LucideIcons.users),
  NavMode.history: SectionMeta(title: 'SCAN HISTORY & LOGS', icon: LucideIcons.clock),
  NavMode.languages: SectionMeta(title: 'VOICE LANGUAGE SELECT', icon: LucideIcons.globe),
  NavMode.settings: SectionMeta(title: 'SYSTEM SETTINGS', icon: LucideIcons.settings),
  NavMode.location: SectionMeta(title: 'LIVE LOCATION & GPS', icon: LucideIcons.map_pin),
  NavMode.medical: SectionMeta(title: 'MEDICAL & PRESCRIPTION', icon: LucideIcons.activity),
};

class SectionToastNotification extends StatefulWidget {
  const SectionToastNotification({super.key});

  @override
  State<SectionToastNotification> createState() => _SectionToastNotificationState();
}

class _SectionToastNotificationState extends State<SectionToastNotification>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _opacityAnim;
  late Animation<double> _scaleAnim;

  NavMode? _lastMode;
  Timer? _dismissTimer;
  bool _isVisible = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );

    _opacityAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );

    _scaleAnim = Tween<double>(begin: 0.75, end: 1.05).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final provider = context.watch<NavidoorProvider>();

    if (provider.isFirstTimeUser) return;

    if (_lastMode == null) {
      _lastMode = provider.activeMode;
      return;
    }

    if (_lastMode != provider.activeMode) {
      _lastMode = provider.activeMode;
      _triggerToast();
    }
  }

  void _triggerToast() {
    _dismissTimer?.cancel();
    setState(() => _isVisible = true);
    _controller.forward(from: 0.0);

    _dismissTimer = Timer(const Duration(milliseconds: 1800), () {
      if (mounted) {
        _controller.reverse().then((_) {
          if (mounted) {
            setState(() => _isVisible = false);
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _dismissTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isVisible || _lastMode == null) return const SizedBox.shrink();

    final meta = kSectionDetails[_lastMode!] ?? kSectionDetails[NavMode.assist]!;

    return IgnorePointer(
      child: FadeTransition(
        opacity: _opacityAnim,
        child: Container(
          color: const Color(0xF20F172A),
          alignment: Alignment.center,
          child: ScaleTransition(
            scale: _scaleAnim,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Center Circular Icon Button Badge (96x96 matching React Native)
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF0284C7),
                    border: Border.all(color: Colors.white, width: 3),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x730284C7),
                        offset: Offset(0, 10),
                        blurRadius: 18,
                      ),
                    ],
                  ),
                  child: Center(
                    child: Icon(meta.icon, size: 44, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 14),

                // Section Title Tag Below Circular Icon
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFF64748B), width: 1.5),
                    boxShadow: const [
                      BoxShadow(
                        color: Colors.black26,
                        offset: Offset(0, 4),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  child: Text(
                    meta.title,
                    style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
