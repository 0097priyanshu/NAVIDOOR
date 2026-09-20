import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../models/nav_models.dart';
import '../../theme/design_system.dart';

class UnifiedMicButton extends StatefulWidget {
  final VoiceState voiceState;
  final VoidCallback onPress;
  final bool showLabel;
  final double size;
  final String? labelOverride;

  const UnifiedMicButton({
    super.key,
    required this.voiceState,
    required this.onPress,
    this.showLabel = true,
    this.size = 68,
    this.labelOverride,
  });

  @override
  State<UnifiedMicButton> createState() => _UnifiedMicButtonState();
}

class _UnifiedMicButtonState extends State<UnifiedMicButton>
    with TickerProviderStateMixin {
  late AnimationController _spinController;
  late AnimationController _pulseController;
  late Animation<double> _pulseScale;
  late Animation<double> _pulseOpacity;

  @override
  void initState() {
    super.initState();

    _spinController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );

    _pulseScale = Tween<double>(begin: 1.0, end: 1.28).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeOut),
    );

    _pulseOpacity = Tween<double>(begin: 0.6, end: 0.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeOut),
    );

    _updateAnimations();
  }

  @override
  void didUpdateWidget(UnifiedMicButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.voiceState != widget.voiceState) {
      _updateAnimations();
    }
  }

  void _updateAnimations() {
    if (widget.voiceState == VoiceState.thinking) {
      _spinController.repeat();
    } else {
      _spinController.stop();
      _spinController.reset();
    }

    if (widget.voiceState == VoiceState.listening ||
        widget.voiceState == VoiceState.thinking) {
      _pulseController.repeat();
    } else {
      _pulseController.stop();
      _pulseController.reset();
    }
  }

  @override
  void dispose() {
    _spinController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  String _getLabelText() {
    if (widget.labelOverride != null) return widget.labelOverride!;
    switch (widget.voiceState) {
      case VoiceState.listening:
        return 'LISTENING...';
      case VoiceState.thinking:
        return 'PROCESSING...';
      case VoiceState.speaking:
        return 'SPEAKING...';
      case VoiceState.idle:
        return 'TALK';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isMicActive = widget.voiceState == VoiceState.listening ||
        widget.voiceState == VoiceState.thinking;

    final baseSize = widget.size;

    return Semantics(
      button: true,
      label: 'Voice Assistant Microphone',
      hint: 'Tap once to activate listening',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: baseSize + 24,
            height: baseSize + 24,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Expanding Cyan Pulse Halo
                if (isMicActive)
                  AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _pulseScale.value,
                        child: Opacity(
                          opacity: _pulseOpacity.value,
                          child: Container(
                            width: baseSize + 16,
                            height: baseSize + 16,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColors.cyanLight.withValues(alpha: 0.5),
                              border: Border.all(
                                color: AppColors.cyanPrimary,
                                width: 2,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),

                // Button Circle
                Material(
                  color: Colors.transparent,
                  shape: const CircleBorder(),
                  child: InkWell(
                    customBorder: const CircleBorder(),
                    onTap: widget.onPress,
                    child: Container(
                      width: baseSize,
                      height: baseSize,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isMicActive
                            ? AppColors.micActiveBg
                            : AppColors.micIdleBg,
                        border: Border.all(
                          color: isMicActive
                              ? AppColors.micActiveBorder
                              : AppColors.pureWhite,
                          width: 3.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: isMicActive
                                ? AppColors.micActiveGlow
                                : AppColors.cyanGlow,
                            blurRadius: isMicActive ? 18 : 8,
                            spreadRadius: isMicActive ? 4 : 1,
                          ),
                        ],
                      ),
                      child: Center(
                        child: widget.voiceState == VoiceState.thinking
                            ? AnimatedBuilder(
                                animation: _spinController,
                                builder: (context, child) {
                                  return Transform.rotate(
                                    angle: _spinController.value * 2 * math.pi,
                                    child: const Icon(
                                      LucideIcons.loader_circle,
                                      size: 30,
                                      color: AppColors.pureWhite,
                                    ),
                                  );
                                },
                              )
                            : const Icon(
                                LucideIcons.mic,
                                size: 30,
                                color: AppColors.pureWhite,
                              ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (widget.showLabel) ...[
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.darkGray.withValues(alpha: 0.85),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isMicActive ? AppColors.cyanLight : AppColors.lightGrayBorder,
                  width: 1,
                ),
              ),
              child: Text(
                _getLabelText(),
                style: const TextStyle(
                  color: AppColors.pureWhite,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
