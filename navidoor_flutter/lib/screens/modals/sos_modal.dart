import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/navidoor_provider.dart';
import '../../theme/design_system.dart';

class SOSModal extends StatefulWidget {
  const SOSModal({super.key});

  @override
  State<SOSModal> createState() => _SOSModalState();
}

class _SOSModalState extends State<SOSModal> {
  int _countdown = 5;
  Timer? _timer;
  bool _alertSent = false;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  void _startCountdown() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdown > 1) {
        setState(() => _countdown--);
      } else {
        setState(() {
          _countdown = 0;
          _alertSent = true;
        });
        _timer?.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NavidoorProvider>();
    if (!provider.isSosModalOpen) return const SizedBox.shrink();

    return Material(
      color: Colors.black87,
      child: Center(
        child: Container(
          width: 360,
          margin: const EdgeInsets.all(24),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.darkGray,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.uberSafetyRed, width: 3),
            boxShadow: [
              BoxShadow(
                color: AppColors.uberSafetyRed.withValues(alpha: 0.5),
                blurRadius: 24,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 76,
                height: 76,
                decoration: const BoxDecoration(
                  color: AppColors.uberSafetyRed,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    _alertSent ? '!' : '$_countdown',
                    style: const TextStyle(
                      color: AppColors.pureWhite,
                      fontSize: 36,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                _alertSent ? 'SOS ALERT BROADCAST ACTIVE' : 'HOLD TO CANCEL SOS ALERT',
                style: const TextStyle(
                  color: AppColors.pureWhite,
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.0,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              Text(
                _alertSent
                    ? 'Live GPS location (Oak Lane, MG Road) and loud siren alert dispatched to primary contacts and registered caregivers.'
                    : 'Dispatching emergency location and loud audible chime in $_countdown seconds.',
                style: const TextStyle(
                  color: AppColors.pureWhite,
                  fontSize: 13,
                  height: 1.4,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.lightGrayCard,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                onPressed: () {
                  _timer?.cancel();
                  provider.setSosModalOpen(false);
                },
                child: const Text(
                  'DISMISS / CANCEL',
                  style: TextStyle(
                    color: AppColors.darkText,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.0,
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
