import 'package:flutter/material.dart';
import '../../models/nav_models.dart';
import '../../theme/design_system.dart';

class AIVisionOverlay extends StatelessWidget {
  final List<DetectedObject> detectedObjects;
  final bool isDetectionActive;

  const AIVisionOverlay({
    super.key,
    required this.detectedObjects,
    required this.isDetectionActive,
  });

  @override
  Widget build(BuildContext context) {
    if (!isDetectionActive) return const SizedBox.shrink();

    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final h = constraints.maxHeight;

        return Stack(
          children: detectedObjects.map((obj) {
            final left = obj.xRatio * w;
            final top = obj.yRatio * h;

            final isHazard = obj.isHazard || obj.distanceMeters < 1.5;
            final boxColor = isHazard ? AppColors.uberSafetyRed : AppColors.cyanLight;

            return Positioned(
              left: left.clamp(16.0, w - 160.0),
              top: top.clamp(16.0, h - 80.0),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.darkGray.withValues(alpha: 0.85),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: boxColor, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: boxColor.withValues(alpha: 0.35),
                      blurRadius: 8,
                      spreadRadius: 1,
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      obj.emojiIcon,
                      style: const TextStyle(fontSize: 18),
                    ),
                    const SizedBox(width: 6),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${obj.label.toUpperCase()} (${(obj.confidence * 100).toInt()}%)',
                          style: TextStyle(
                            color: isHazard ? AppColors.uberSafetyRed : AppColors.pureWhite,
                            fontWeight: FontWeight.w900,
                            fontSize: 11,
                            letterSpacing: 0.5,
                          ),
                        ),
                        Text(
                          '${obj.distanceMeters.toStringAsFixed(1)}m • ${obj.direction.toUpperCase()}',
                          style: const TextStyle(
                            color: AppColors.cyanLight,
                            fontWeight: FontWeight.w700,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        );
      },
    );
  }
}
