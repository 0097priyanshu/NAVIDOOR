import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'models/nav_models.dart';
import 'providers/navidoor_provider.dart';
import 'screens/family_portal_screen.dart';
import 'screens/main_user_screen.dart';
import 'screens/role_selection_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const NavidoorApp());
}

class NavidoorApp extends StatelessWidget {
  const NavidoorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => NavidoorProvider()),
      ],
      child: MaterialApp(
        title: 'NAVIDOOR',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          brightness: Brightness.dark,
          scaffoldBackgroundColor: const Color(0xFF64748B),
          primaryColor: const Color(0xFF0284C7),
          textTheme: GoogleFonts.interTextTheme(
            ThemeData(brightness: Brightness.dark).textTheme,
          ),
        ),
        home: const AppRootNavigator(),
      ),
    );
  }
}

class AppRootNavigator extends StatelessWidget {
  const AppRootNavigator({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NavidoorProvider>();

    // 1. Role Selection Screen (Launch)
    if (provider.userRole == UserRole.undecided) {
      return const RoleSelectionScreen();
    }

    // 2. Family Caregiver Mode Experience (matching React Native FamilyAuthScreen & FamilyModeContainer)
    if (provider.userRole == UserRole.familyMember) {
      return const FamilyPortalScreen();
    }

    // 3. NAVIDOOR Visually Impaired User Experience (Full Screen Horizontal Swipe)
    return GestureDetector(
      behavior: HitTestBehavior.translucent,
      onHorizontalDragEnd: (details) {
        final velocity = details.primaryVelocity ?? 0;
        if (velocity < -200) {
          // Swiped LEFT -> Move to next mode (matching React Native cycleNextMode)
          provider.cycleNextMode();
        } else if (velocity > 200) {
          // Swiped RIGHT -> Move to previous mode
          provider.cyclePrevMode();
        }
      },
      child: const MainUserScreen(),
    );
  }
}
