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
  final String? accessibilityLabel;
  final String? accessibilityHint;

  const UnifiedMicButton({
    super.key,
    required this.voiceState,
    required this.onPress,
    this.showLabel = true,
    this.size = 68,
    this.labelOverride,
    this.accessibilityLabel,
    this.accessibilityHint,
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

    _pulseScale = Tween<double>(begin: 1.0, end: 1.25).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeOut),
    );

    _pulseOpacity = TweenSequence<double>([
      TweenSequenceItem(tween: Tween<double>(begin: 0.55, end: 0.2), weight: 70),
      TweenSequenceItem(tween: Tween<double>(begin: 0.2, end: 0.0), weight: 30),
    ]).animate(CurvedAnimation(parent: _pulseController, curve: Curves.easeOut));

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
      if (!_spinController.isAnimating) {
        _spinController.repeat();
      }
    } else {
      _spinController.stop();
      _spinController.reset();
    }

    final isMicActive = widget.voiceState == VoiceState.listening ||
        widget.voiceState == VoiceState.thinking;

    if (isMicActive) {
      if (!_pulseController.isAnimating) {
        _pulseController.repeat();
      }
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
    final iconSize = (baseSize * 0.41).roundToDouble();

    return Semantics(
      button: true,
      label: widget.accessibilityLabel ?? 'Voice Assistant Microphone',
      hint: widget.accessibilityHint ?? 'Tap once to activate listening',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          SizedBox(
            width: baseSize,
            height: baseSize,
            child: Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.center,
              children: [
                // Expanding Animated Cyan Halo Pulse
                if (isMicActive)
                  AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, child) {
                      return Positioned(
                        top: -8,
                        bottom: -8,
                        left: -8,
                        right: -8,
                        child: Transform.scale(
                          scale: _pulseScale.value,
                          child: Opacity(
                            opacity: _pulseOpacity.value,
                            child: Container(
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Color(0x590284C7),
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),

                // Main FAB Mic Button
                Container(
                  width: baseSize,
                  height: baseSize,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isMicActive ? const Color(0xFF38BDF8) : const Color(0xFF0284C7),
                    boxShadow: const [
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
                      onTap: widget.onPress,
                      child: Center(
                        child: widget.voiceState == VoiceState.thinking
                            ? AnimatedBuilder(
                                animation: _spinController,
                                builder: (context, child) {
                                  return Transform.rotate(
                                    angle: _spinController.value * 2 * math.pi,
                                    child: Icon(
                                      LucideIcons.loader_circle,
                                      size: iconSize,
                                      color: AppColors.pureWhite,
                                    ),
                                  );
                                },
                              )
                            : Icon(
                                LucideIcons.mic,
                                size: iconSize,
                                color: AppColors.pureWhite,
                              ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Clean Pure White Text Label Below Button (matching React Native UnifiedMicButton)
          if (widget.showLabel) ...[
            const SizedBox(height: 8),
            Text(
              _getLabelText(),
              style: const TextStyle(
                color: AppColors.pureWhite,
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
        ],
      ),
    );
  }
}
