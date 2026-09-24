import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import '../../models/nav_models.dart';
import '../../providers/navidoor_provider.dart';

class CameraViewCanvas extends StatelessWidget {
  const CameraViewCanvas({super.key});

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
    final isVisionMode = visionModes.contains(provider.activeMode);

    return Container(
      width: double.infinity,
      height: double.infinity,
      color: const Color(0xFFCBD5E1),
      child: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Room Background / Depth Rings (when in vision mode)
          if (isVisionMode)
            _buildSimulatedRoom(context, provider)
          else
            // Solid Light Gray Utility Canvas
            Container(color: const Color(0xFFCBD5E1)),

          // 2. Camera Controls Overlay (Top Utility Pills at top: 72)
          if (isVisionMode)
            Positioned(
              top: 72,
              left: 0,
              right: 0,
              child: Align(
                alignment: Alignment.topCenter,
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 480),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: _buildControlsOverlay(context, provider),
                  ),
                ),
              ),
            ),

          // 3. AI Vision HUD Announcement Overlay (at top: 132)
          if (isVisionMode)
            Positioned(
              top: 132,
              left: 0,
              right: 0,
              child: Align(
                alignment: Alignment.topCenter,
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 480),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: _buildVoiceHudOverlay(context, provider),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSimulatedRoom(BuildContext context, NavidoorProvider provider) {
    return Stack(
      children: [
        // Grid lines (perspective grid matching React Native)
        Positioned.fill(
          child: CustomPaint(
            painter: _GridPainter(),
          ),
        ),

        // Depth concentric rings in center
        Center(
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 220,
                height: 220,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: const Color(0x330284C7),
                    width: 2,
                  ),
                ),
              ),
              Container(
                width: 140,
                height: 140,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: const Color(0x550284C7),
                    width: 2,
                  ),
                ),
              ),
              Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0x220284C7),
                  border: Border.all(
                    color: const Color(0xFF0284C7),
                    width: 2,
                  ),
                ),
                child: const Center(
                  child: Icon(
                    LucideIcons.scan,
                    color: Color(0xFF0284C7),
                    size: 28,
                  ),
                ),
              ),
            ],
          ),
        ),

        // Detected Objects Overlays
        ...provider.detectedObjects.map((obj) {
          final size = MediaQuery.of(context).size;
          final top = obj.yRatio * size.height * 0.7;
          final left = obj.xRatio * size.width * 0.85;

          return Positioned(
            top: top.clamp(190, size.height - 300),
            left: left.clamp(16, size.width - 160),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xCC0F172A),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF0284C7), width: 1.5),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x400284C7),
                    blurRadius: 8,
                    offset: Offset(0, 3),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(obj.emojiIcon, style: const TextStyle(fontSize: 16)),
                  const SizedBox(width: 6),
                  Text(
                    '${obj.label} ${obj.distanceMeters.toStringAsFixed(1)}m',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildControlsOverlay(BuildContext context, NavidoorProvider provider) {
    return Row(
      children: [
        // 1. Flashlight Light Mode Toggle
        Expanded(
          child: _buildUtilityPill(
            icon: provider.torchOn ? LucideIcons.zap : LucideIcons.zap_off,
            label: provider.torchOn ? 'LIGHT ON' : 'LIGHT OFF',
            isActive: provider.torchOn,
            activeColor: const Color(0xFFF59E0B),
            onTap: () => provider.toggleTorch(),
          ),
        ),
        const SizedBox(width: 8),

        // 2. Rear / Front Camera Facing Toggle
        Expanded(
          child: _buildUtilityPill(
            icon: LucideIcons.refresh_cw,
            label: provider.cameraFacingBack ? 'REAR CAM' : 'FRONT CAM',
            isActive: false,
            onTap: () => provider.toggleCameraFacing(),
          ),
        ),
        const SizedBox(width: 8),

        // 3. Repeat Speech / Read Out Loud
        Expanded(
          child: _buildUtilityPill(
            icon: LucideIcons.volume_2,
            label: 'REPEAT',
            isActive: false,
            onTap: () => provider.speak(provider.lastAnnouncement, interrupt: true),
          ),
        ),
      ],
    );
  }

  Widget _buildUtilityPill({
    required IconData icon,
    required String label,
    required bool isActive,
    Color activeColor = const Color(0xFF0284C7),
    required VoidCallback onTap,
  }) {
    final bgColor = isActive ? activeColor : const Color(0xFF0284C7);

    return Material(
      color: bgColor,
      borderRadius: BorderRadius.circular(24),
      elevation: 6,
      shadowColor: const Color(0x590284C7),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Container(
          height: 48,
          padding: const EdgeInsets.symmetric(horizontal: 8),
          alignment: Alignment.center,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: Colors.white),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildVoiceHudOverlay(BuildContext context, NavidoorProvider provider) {
    return Material(
      color: const Color(0xFFCBD5E1),
      borderRadius: BorderRadius.circular(20),
      elevation: 8,
      shadowColor: const Color(0x400284C7),
      child: InkWell(
        onTap: () => provider.speak(provider.lastAnnouncement, interrupt: true),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF64748B), width: 1.5),
          ),
          child: Row(
            children: [
              // Sparkles badge
              Container(
                width: 32,
                height: 32,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0x2E0284C7),
                ),
                child: const Center(
                  child: Icon(
                    LucideIcons.sparkles,
                    size: 18,
                    color: Color(0xFF0284C7),
                  ),
                ),
              ),
              const SizedBox(width: 10),

              // Last announcement text
              Expanded(
                child: Text(
                  provider.lastAnnouncement.isNotEmpty
                      ? provider.lastAnnouncement
                      : 'AI Vision active. Scanning surroundings...',
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    height: 1.35,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 10),

              // Replay volume badge
              Container(
                width: 28,
                height: 28,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFF0284C7),
                ),
                child: const Center(
                  child: Icon(
                    LucideIcons.volume_2,
                    size: 16,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0x1F475569)
      ..strokeWidth = 1.0;

    // Horizontal lines
    final numH = 10;
    for (int i = 1; i < numH; i++) {
      final y = size.height * (i / numH);
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }

    // Vertical lines
    final numV = 6;
    for (int i = 1; i < numV; i++) {
      final x = size.width * (i / numV);
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
