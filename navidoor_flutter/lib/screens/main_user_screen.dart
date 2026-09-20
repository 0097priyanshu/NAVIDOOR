import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/nav_models.dart';
import '../providers/navidoor_provider.dart';
import '../theme/design_system.dart';
import '../widgets/camera/camera_view_canvas.dart';
import '../widgets/header/camera_header.dart';
import '../widgets/navigation/rotating_ai_mode_wheel.dart';
import '../widgets/overlays/section_view_panel.dart';
import 'modals/sos_modal.dart';
import 'modals/user_profile_modal.dart';

class MainUserScreen extends StatelessWidget {
  const MainUserScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NavidoorProvider>();
    final isDesktop = ResponsiveHelper.isDesktop(context);

    return Scaffold(
      backgroundColor: AppColors.darkGray,
      body: Stack(
        children: [
          // Main Body Layout
          Column(
            children: [
              // 1. Top Status Header
              const CameraHeader(),

              // 2. Responsive Content Canvas
              Expanded(
                child: isDesktop
                    ? Row(
                        children: [
                          // Left 60%: Live Camera Canvas
                          const Expanded(
                            flex: 6,
                            child: CameraViewCanvas(),
                          ),
                          // Vertical Divider
                          Container(
                            width: 2,
                            color: AppColors.lightGrayBorder,
                          ),
                          // Right 40%: Active Mode Details & Companion Panel
                          Expanded(
                            flex: 4,
                            child: SectionViewPanel(
                              isEmbeddedInSplitView: true,
                            ),
                          ),
                        ],
                      )
                    : Stack(
                        children: [
                          // Full-screen camera canvas on mobile
                          const CameraViewCanvas(),
                          // Floating overlay panel when not in base assist mode
                          if (provider.activeMode != NavMode.assist)
                            const SectionViewPanel(),
                        ],
                      ),
              ),

              // 3. Bottom Signature Rotating Mode Wheel & Mic
              const RotatingAIModeWheel(),
            ],
          ),

          // Modals
          const SOSModal(),
          const UserProfileModal(),
        ],
      ),
    );
  }
}
