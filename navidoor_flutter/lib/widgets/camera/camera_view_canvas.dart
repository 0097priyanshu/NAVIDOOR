import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import '../../providers/navidoor_provider.dart';
import '../../theme/design_system.dart';
import 'ai_vision_overlay.dart';

class CameraViewCanvas extends StatelessWidget {
  const CameraViewCanvas({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NavidoorProvider>();

    return Stack(
      fit: StackFit.expand,
      children: [
        // Camera Canvas Backdrop (Deep Slate Contrast with Subtle HUD Matrix)
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                const Color(0xFF1E293B),
                AppColors.lightGrayBg.withValues(alpha: 0.9),
                const Color(0xFF0F172A),
              ],
            ),
          ),
          child: CustomPaint(
            painter: _HUDGridPainter(),
          ),
        ),

        // YOLOv11 AI Detection Overlay
        AIVisionOverlay(
          detectedObjects: provider.detectedObjects,
          isDetectionActive: provider.isDetectionActive,
        ),

        // Floating Camera Quick Action Toolbar (Right vertical strip)
        Positioned(
          top: 70,
          right: 16,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
            decoration: BoxDecoration(
              color: AppColors.darkGray.withValues(alpha: 0.85),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.lightGrayBorder, width: 1.5),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Torch Toggle
                _buildToolButton(
                  icon: provider.torchOn ? LucideIcons.zap : LucideIcons.zap_off,
                  label: 'Flashlight',
                  isActive: provider.torchOn,
                  onTap: () => provider.toggleTorch(),
                ),
                const SizedBox(height: 8),

                // Camera Facing Flip
                _buildToolButton(
                  icon: LucideIcons.switch_camera,
                  label: 'Flip Camera',
                  isActive: false,
                  onTap: () => provider.toggleCameraFacing(),
                ),
                const SizedBox(height: 8),

                // AI Vision Perception Toggle
                _buildToolButton(
                  icon: provider.isDetectionActive ? LucideIcons.eye : LucideIcons.eye_off,
                  label: 'AI Vision',
                  isActive: provider.isDetectionActive,
                  onTap: () => provider.toggleDetection(),
                ),
                const SizedBox(height: 8),

                // Spatial Audio Toggle
                _buildToolButton(
                  icon: provider.spatialAudioEnabled
                      ? LucideIcons.volume_2
                      : LucideIcons.volume_x,
                  label: 'Spatial Audio',
                  isActive: provider.spatialAudioEnabled,
                  onTap: () => provider.toggleSpatialAudio(),
                ),
                const SizedBox(height: 8),

                // Photo Snapshot & Scene Perception
                _buildToolButton(
                  icon: LucideIcons.camera,
                  label: 'Inspect Scene',
                  isActive: false,
                  isAction: true,
                  onTap: () => provider.capturePhotoAndAnalyze(),
                ),
              ],
            ),
          ),
        ),

        // Bottom Context Insight Floating Card (Above wheel)
        Positioned(
          bottom: 12,
          left: 16,
          right: 16,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.darkGray.withValues(alpha: 0.92),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.cyanLight, width: 1.5),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black38,
                  blurRadius: 10,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.sparkles, size: 20, color: AppColors.cyanLight),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    provider.currentInsight.text,
                    style: const TextStyle(
                      color: AppColors.pureWhite,
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                      height: 1.3,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildToolButton({
    required IconData icon,
    required String label,
    required bool isActive,
    bool isAction = false,
    required VoidCallback onTap,
  }) {
    return Semantics(
      button: true,
      label: label,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: onTap,
          child: Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: isActive
                  ? AppColors.cyanPrimary
                  : isAction
                      ? AppColors.cyanLight.withValues(alpha: 0.25)
                      : Colors.transparent,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Icon(
                icon,
                size: 20,
                color: isActive
                    ? AppColors.pureWhite
                    : isAction
                        ? AppColors.cyanLight
                        : AppColors.pureWhite.withValues(alpha: 0.85),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _HUDGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.cyanLight.withValues(alpha: 0.08)
      ..strokeWidth = 1.0;

    // Subtle center crosshairs
    final cx = size.width / 2;
    final cy = size.height / 2;

    canvas.drawLine(Offset(cx - 30, cy), Offset(cx + 30, cy), paint);
    canvas.drawLine(Offset(cx, cy - 30), Offset(cx, cy + 30), paint);

    final circlePaint = Paint()
      ..color = AppColors.cyanLight.withValues(alpha: 0.05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    canvas.drawCircle(Offset(cx, cy), 60, circlePaint);
    canvas.drawCircle(Offset(cx, cy), 130, circlePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
