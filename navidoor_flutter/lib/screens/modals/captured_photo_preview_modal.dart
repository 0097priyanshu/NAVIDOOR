import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import '../../models/nav_models.dart';
import '../../providers/navidoor_provider.dart';

class CapturedPhotoPreviewModal extends StatelessWidget {
  const CapturedPhotoPreviewModal({super.key});

  String _getAnalysisResultText(NavMode mode) {
    switch (mode) {
      case NavMode.read:
        return 'SCANNED DOCUMENT TEXT:\n"PHARMACY PRESCRIPTION - DR. SMITH.\nTAKE 1 TABLET DAILY WITH WATER AFTER MEAL.\nREFILLS: 3 • EXPIRY: 12/2027."';
      case NavMode.medicine:
        return 'MEDICINE BOTTLE SCANNED:\n"LISINOPRIL 10MG TABLETS.\nDOSAGE: 1 PILL AT 8:00 AM.\nWARNING: TAKE WITH FOOD."';
      case NavMode.transport:
        return 'BUS STOP SIGNBOARD SCANNED:\n"BUS ROUTE 102 - OAK RIDGE EXPRESS.\nARRIVING IN 4 MINUTES."';
      case NavMode.navigate:
        return 'NAVIGATION SCENE SCANNED:\n"Clear hallway ahead. Exit door located 3 meters straight. Crosswalk signal green."';
      default:
        return 'AI VISION SCENE SCAN:\n"Surroundings captured clearly. Clear path ahead with no immediate hazards."';
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NavidoorProvider>();

    if (!provider.isCapturedPhotoModalOpen) {
      return const SizedBox.shrink();
    }

    final analysisText = _getAnalysisResultText(provider.activeMode);

    return Material(
      color: Colors.transparent,
      child: Stack(
        children: [
          // Dark Dim Backdrop
          Positioned.fill(
            child: GestureDetector(
              onTap: () => provider.setIsCapturedPhotoModalOpen(false),
              child: Container(color: const Color(0xCC0F172A)),
            ),
          ),

          // Center Card
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFF475569), width: 1.5),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x400284C7),
                        offset: Offset(0, 8),
                        blurRadius: 20,
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Header
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(
                            children: [
                              Icon(LucideIcons.sparkles, size: 20, color: Color(0xFF0284C7)),
                              SizedBox(width: 8),
                              Text(
                                'CAPTURED PHOTO SCAN',
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
                            icon: const Icon(LucideIcons.x, size: 20, color: Color(0xFF0F172A)),
                            onPressed: () => provider.setIsCapturedPhotoModalOpen(false),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Simulated Photo View Box
                      Container(
                        height: 160,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F172A),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            const Icon(LucideIcons.camera, size: 48, color: Color(0x4D0284C7)),
                            Positioned(
                              bottom: 10,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0284C7),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(LucideIcons.circle_check, size: 14, color: Colors.white),
                                    SizedBox(width: 6),
                                    Text(
                                      'PHOTO CAPTURED & ANALYZED',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      // OCR & AI Vision Analysis Output Box
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFF94A3B8), width: 1),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(LucideIcons.file_text, size: 16, color: Color(0xFF0284C7)),
                                SizedBox(width: 6),
                                Text(
                                  'EXTRACTED TEXT & SCENE ANALYSIS',
                                  style: TextStyle(
                                    color: Color(0xFF0284C7),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 0.6,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              analysisText,
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Action Buttons
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF0284C7),
                                minimumSize: const Size(double.infinity, 48),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              onPressed: () {
                                provider.speak('Photo Scan Results: $analysisText');
                              },
                              icon: const Icon(LucideIcons.volume_2, size: 18, color: Colors.white),
                              label: const Text(
                                'READ OUT LOUD',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF64748B),
                              minimumSize: const Size(80, 48),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            onPressed: () => provider.setIsCapturedPhotoModalOpen(false),
                            child: const Text(
                              'CLOSE',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
