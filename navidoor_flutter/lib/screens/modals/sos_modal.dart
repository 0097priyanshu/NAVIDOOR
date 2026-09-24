import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import '../../providers/navidoor_provider.dart';

class SOSModal extends StatefulWidget {
  const SOSModal({super.key});

  @override
  State<SOSModal> createState() => _SOSModalState();
}

class _SOSModalState extends State<SOSModal> {
  int _countdown = 5;
  bool _isBroadcastSent = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  void _startCountdown() {
    _countdown = 5;
    _isBroadcastSent = false;
    _timer?.cancel();

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_countdown > 1) {
        setState(() => _countdown--);
      } else {
        setState(() {
          _countdown = 0;
          _isBroadcastSent = true;
        });
        timer.cancel();
      }
    });
  }

  void _handleCancel() {
    _timer?.cancel();
    final provider = context.read<NavidoorProvider>();
    provider.setSosModalOpen(false);
    provider.speak('Emergency alert cancelled.');
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NavidoorProvider>();

    if (!provider.isSosModalOpen) {
      return const SizedBox.shrink();
    }

    return Material(
      color: Colors.transparent,
      child: Stack(
        children: [
          // Dark Dim Backdrop
          Positioned.fill(
            child: GestureDetector(
              onTap: _handleCancel,
              child: Container(
                color: const Color(0xCC0F172A),
              ),
            ),
          ),

          // Center Card (matching React Native SOSModal.tsx)
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFF475569), width: 1.5),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x66E11D48),
                        offset: Offset(0, 8),
                        blurRadius: 24,
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
                              Icon(LucideIcons.circle_alert, size: 26, color: Color(0xFFE11D48)),
                              SizedBox(width: 10),
                              Text(
                                'EMERGENCY SOS ALERT',
                                style: TextStyle(
                                  color: Color(0xFF0F172A),
                                  fontSize: 15,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.0,
                                ),
                              ),
                            ],
                          ),
                          IconButton(
                            icon: const Icon(LucideIcons.x, size: 22, color: Color(0xFF0F172A)),
                            onPressed: _handleCancel,
                          ),
                        ],
                      ),
                      const Divider(color: Color(0xFF94A3B8), height: 20),

                      // Countdown or Broadcast state
                      if (!_isBroadcastSent) ...[
                        const Text(
                          'Broadcasting live GPS location & audio stream in:',
                          style: TextStyle(
                            color: Color(0xFF334155),
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),

                        // Countdown Circle
                        Container(
                          width: 88,
                          height: 88,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFFE11D48),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x80E11D48),
                                offset: Offset(0, 4),
                                blurRadius: 12,
                              ),
                            ],
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                '$_countdown',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 34,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const Text(
                                'SECONDS',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.0,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 18),

                        const Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'NOTIFYING PRIMARY CONTACTS:',
                            style: TextStyle(
                              color: Color(0xFF0284C7),
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),

                        ...provider.emergencyContacts.map((c) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 6),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                const Icon(LucideIcons.phone, size: 16, color: Color(0xFFE11D48)),
                                const SizedBox(width: 8),
                                Text(
                                  '${c.name} (${c.relation})',
                                  style: const TextStyle(
                                    color: Color(0xFF0F172A),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                        const SizedBox(height: 20),

                        // Cancel Button
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFE11D48),
                            minimumSize: const Size(double.infinity, 50),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          onPressed: _handleCancel,
                          child: const Text(
                            'CANCEL SOS (FALSE ALARM)',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 13,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                      ] else ...[
                        // Broadcast Active
                        Container(
                          width: 64,
                          height: 64,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Color(0xFF10B981),
                          ),
                          child: const Center(
                            child: Icon(LucideIcons.check, size: 36, color: Colors.white),
                          ),
                        ),
                        const SizedBox(height: 14),
                        const Text(
                          'EMERGENCY DISTRESS BROADCAST ACTIVE',
                          style: TextStyle(
                            color: Color(0xFF0F172A),
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Live video feed & GPS coordinates are being transmitted to primary contacts and emergency dispatch.',
                          style: TextStyle(
                            color: Color(0xFF475569),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 14),

                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(LucideIcons.radio, size: 16, color: Color(0xFF0284C7)),
                              SizedBox(width: 8),
                              Text(
                                'GPS Broadcast: 28.6315° N, 77.2167° E',
                                style: TextStyle(
                                  color: Color(0xFF0F172A),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),

                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFE11D48),
                            minimumSize: const Size(double.infinity, 50),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          onPressed: _handleCancel,
                          child: const Text(
                            'END EMERGENCY SESSION',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 13,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                      ],
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
