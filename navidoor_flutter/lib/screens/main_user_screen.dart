import 'package:flutter/material.dart';
import '../widgets/camera/camera_view_canvas.dart';
import '../widgets/header/camera_header.dart';
import '../widgets/navigation/rotating_ai_mode_wheel.dart';
import '../widgets/overlays/section_toast_notification.dart';
import '../widgets/overlays/section_view_panel.dart';
import 'modals/captured_photo_preview_modal.dart';
import 'modals/sos_modal.dart';
import 'modals/user_profile_modal.dart';

class MainUserScreen extends StatelessWidget {
  const MainUserScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF64748B),
      body: SafeArea(
        child: Stack(
          children: [
            // 1. Continuous Camera Canvas / Solid Slate Gray Utility Backdrop
            const CameraViewCanvas(),

            // 2. Top Status Header (Left Circular Emergency SOS FAB & Right User Profile FAB)
            const CameraHeader(),

            // 3. Dedicated Full Section Panels (Settings, Emergency, Medical, Languages, History, Location, Family)
            const SectionViewPanel(),

            // 4. Signature Rotating AI Mode Wheel & Center Action Mic/Shutter Dock
            const RotatingAIModeWheel(),

            // 5. Section Change Toast Notification Popup
            const SectionToastNotification(),

            // 6. Emergency SOS, Profile, and Captured Photo Preview Modals
            const SOSModal(),
            const UserProfileModal(),
            const CapturedPhotoPreviewModal(),
          ],
        ),
      ),
    );
  }
}
