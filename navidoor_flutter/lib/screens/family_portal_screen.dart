import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import '../models/nav_models.dart';
import '../providers/navidoor_provider.dart';
import '../theme/design_system.dart';
import 'modals/sos_modal.dart';

class FamilyPortalScreen extends StatefulWidget {
  const FamilyPortalScreen({super.key});

  @override
  State<FamilyPortalScreen> createState() => _FamilyPortalScreenState();
}

class _FamilyPortalScreenState extends State<FamilyPortalScreen> {
  int _selectedTabIndex = 0;

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NavidoorProvider>();
    final isDesktop = ResponsiveHelper.isDesktop(context);

    // If caregiver not logged in, show simple pairing auth card
    if (provider.familyUser == null) {
      return _buildCaregiverAuth(context, provider);
    }

    return Scaffold(
      backgroundColor: AppColors.darkGray,
      appBar: AppBar(
        backgroundColor: AppColors.lightGrayBg,
        elevation: 2,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: AppColors.cyanPrimary,
                shape: BoxShape.circle,
              ),
              child: const Icon(LucideIcons.heart_handshake, color: AppColors.pureWhite, size: 18),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'FAMILY COMPANION PORTAL',
                  style: TextStyle(
                    color: AppColors.pureWhite,
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                    letterSpacing: 1.0,
                  ),
                ),
                Text(
                  'Monitoring: ${provider.userName} (${provider.userPhone})',
                  style: const TextStyle(
                    color: AppColors.cyanLight,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.log_out, color: AppColors.pureWhite),
            tooltip: 'Switch Role',
            onPressed: () => provider.setUserRole(UserRole.undecided),
          ),
        ],
      ),
      body: Stack(
        children: [
          isDesktop
              ? Row(
                  children: [
                    // Desktop Navigation Rail
                    NavigationRail(
                      backgroundColor: AppColors.lightGrayBg.withValues(alpha: 0.35),
                      selectedIndex: _selectedTabIndex,
                      onDestinationSelected: (idx) => setState(() => _selectedTabIndex = idx),
                      labelType: NavigationRailLabelType.all,
                      selectedLabelTextStyle: const TextStyle(
                        color: AppColors.cyanLight,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                      unselectedLabelTextStyle: const TextStyle(
                        color: AppColors.pureWhite,
                        fontSize: 11,
                      ),
                      destinations: const [
                        NavigationRailDestination(
                          icon: Icon(LucideIcons.house, color: AppColors.pureWhite),
                          selectedIcon: Icon(LucideIcons.house, color: AppColors.cyanLight),
                          label: Text('HOME'),
                        ),
                        NavigationRailDestination(
                          icon: Icon(LucideIcons.map_pin, color: AppColors.pureWhite),
                          selectedIcon: Icon(LucideIcons.map_pin, color: AppColors.cyanLight),
                          label: Text('LOCATION'),
                        ),
                        NavigationRailDestination(
                          icon: Icon(LucideIcons.activity, color: AppColors.pureWhite),
                          selectedIcon: Icon(LucideIcons.activity, color: AppColors.cyanLight),
                          label: Text('ACTIVITY'),
                        ),
                        NavigationRailDestination(
                          icon: Icon(LucideIcons.triangle_alert, color: AppColors.pureWhite),
                          selectedIcon: Icon(LucideIcons.triangle_alert, color: AppColors.uberSafetyRed),
                          label: Text('ALERTS'),
                        ),
                        NavigationRailDestination(
                          icon: Icon(LucideIcons.user, color: AppColors.pureWhite),
                          selectedIcon: Icon(LucideIcons.user, color: AppColors.cyanLight),
                          label: Text('PROFILE'),
                        ),
                      ],
                    ),
                    const VerticalDivider(color: AppColors.lightGrayBorder, width: 1),
                    // Desktop Content Dashboard
                    Expanded(
                      child: _buildDesktopDashboard(context, provider),
                    ),
                  ],
                )
              : _buildTabBody(context, provider),
          const SOSModal(),
        ],
      ),
      bottomNavigationBar: isDesktop
          ? null
          : BottomNavigationBar(
              currentIndex: _selectedTabIndex,
              onTap: (idx) => setState(() => _selectedTabIndex = idx),
              backgroundColor: AppColors.darkGray,
              selectedItemColor: AppColors.cyanLight,
              unselectedItemColor: AppColors.lightGrayCard,
              type: BottomNavigationBarType.fixed,
              selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
              unselectedLabelStyle: const TextStyle(fontSize: 10),
              items: const [
                BottomNavigationBarItem(icon: Icon(LucideIcons.house, size: 20), label: 'HOME'),
                BottomNavigationBarItem(icon: Icon(LucideIcons.map_pin, size: 20), label: 'LOCATION'),
                BottomNavigationBarItem(icon: Icon(LucideIcons.activity, size: 20), label: 'ACTIVITY'),
                BottomNavigationBarItem(icon: Icon(LucideIcons.triangle_alert, size: 20), label: 'ALERTS'),
                BottomNavigationBarItem(icon: Icon(LucideIcons.user, size: 20), label: 'PROFILE'),
              ],
            ),
    );
  }

  // Caregiver Authentication / Pairing Card
  Widget _buildCaregiverAuth(BuildContext context, NavidoorProvider provider) {
    final nameCtrl = TextEditingController(text: 'Sunita Sharma');
    final phoneCtrl = TextEditingController(text: '+91 98765 43210');

    return Scaffold(
      backgroundColor: AppColors.darkGray,
      body: Center(
        child: Container(
          width: 420,
          margin: const EdgeInsets.all(24),
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            color: AppColors.lightGrayBg.withValues(alpha: 0.35),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.cyanLight, width: 2),
            boxShadow: const [
              BoxShadow(color: AppColors.cyanGlow, blurRadius: 20, spreadRadius: 2),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: const BoxDecoration(
                  color: AppColors.cyanPrimary,
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Icon(LucideIcons.heart_handshake, color: AppColors.pureWhite, size: 32),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'CAREGIVER SETUP',
                style: TextStyle(
                  color: AppColors.pureWhite,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.0,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Enter caregiver details to link with NAVIDOOR user',
                style: TextStyle(color: AppColors.lightGrayCard, fontSize: 12),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              TextField(
                controller: nameCtrl,
                style: const TextStyle(color: AppColors.pureWhite),
                decoration: InputDecoration(
                  labelText: 'Caregiver Full Name',
                  labelStyle: const TextStyle(color: AppColors.cyanLight),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.lightGrayBorder),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: phoneCtrl,
                style: const TextStyle(color: AppColors.pureWhite),
                decoration: InputDecoration(
                  labelText: 'Phone Number',
                  labelStyle: const TextStyle(color: AppColors.cyanLight),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.lightGrayBorder),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.cyanPrimary,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () {
                  provider.setFamilyUser(
                    FamilyUser(
                      name: nameCtrl.text.trim(),
                      phone: phoneCtrl.text.trim(),
                      relationship: 'Daughter',
                    ),
                  );
                },
                child: const Text(
                  'CONNECT & OPEN PORTAL',
                  style: TextStyle(color: AppColors.pureWhite, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Desktop Responsive Dashboard View
  Widget _buildDesktopDashboard(BuildContext context, NavidoorProvider provider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left Column (60%): Live Stream Canvas & GPS Map Card
          Expanded(
            flex: 6,
            child: Column(
              children: [
                _buildLiveStreamCard(context, provider),
                const SizedBox(height: 20),
                _buildGpsMapCard(context, provider),
              ],
            ),
          ),
          const SizedBox(width: 24),
          // Right Column (40%): Telemetry, Activity & Alerts
          Expanded(
            flex: 4,
            child: Column(
              children: [
                _buildTelemetryCards(context, provider),
                const SizedBox(height: 20),
                _buildActivityListCard(context, provider),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Mobile Tab View Switcher
  Widget _buildTabBody(BuildContext context, NavidoorProvider provider) {
    switch (_selectedTabIndex) {
      case 1:
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: _buildGpsMapCard(context, provider),
        );
      case 2:
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: _buildActivityListCard(context, provider),
        );
      case 3:
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: _buildAlertsListCard(context, provider),
        );
      case 4:
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: _buildProfileTab(context, provider),
        );
      case 0:
      default:
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              _buildLiveStreamCard(context, provider),
              const SizedBox(height: 16),
              _buildTelemetryCards(context, provider),
              const SizedBox(height: 16),
              _buildActivityListCard(context, provider),
            ],
          ),
        );
    }
  }

  // Sub-Cards
  Widget _buildLiveStreamCard(BuildContext context, NavidoorProvider provider) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.lightGrayBg.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cyanLight, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              color: AppColors.lightGrayBg,
              borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
            ),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(color: Colors.greenAccent, shape: BoxShape.circle),
                ),
                const SizedBox(width: 8),
                const Text(
                  'LIVE USER CAMERA STREAM',
                  style: TextStyle(color: AppColors.pureWhite, fontWeight: FontWeight.w900, fontSize: 12),
                ),
                const Spacer(),
                const Text(
                  '1080p • 30 FPS • 42ms LATENCY',
                  style: TextStyle(color: AppColors.cyanLight, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
          Container(
            height: 240,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  const Color(0xFF1E293B),
                  AppColors.lightGrayBg.withValues(alpha: 0.8),
                ],
              ),
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.video, size: 48, color: AppColors.cyanLight),
                  const SizedBox(height: 10),
                  Text(
                    'Active Assist Mode: ${provider.activeMode.name.toUpperCase()}',
                    style: const TextStyle(color: AppColors.pureWhite, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Obstacle: Chair detected 1.2m center • Door 2.8m right',
                    style: TextStyle(color: AppColors.cyanLight, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGpsMapCard(BuildContext context, NavidoorProvider provider) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.lightGrayBg.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.lightGrayBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.map_pin, color: AppColors.cyanLight, size: 20),
              const SizedBox(width: 8),
              const Text('LIVE GPS LOCATION', style: TextStyle(color: AppColors.pureWhite, fontWeight: FontWeight.bold)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(6)),
                child: const Text('SAFE ZONE', style: TextStyle(color: Colors.greenAccent, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text('Oak Lane, Near City Hospital, MG Road', style: TextStyle(color: AppColors.pureWhite, fontSize: 15, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          const Text('19.0760° N, 72.8777° E • Speed: 1.1 m/s • Accuracy: ±2m', style: TextStyle(color: AppColors.cyanLight, fontSize: 12)),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.cyanPrimary),
                  icon: const Icon(LucideIcons.phone, size: 16, color: AppColors.pureWhite),
                  label: const Text('Call User', style: TextStyle(color: AppColors.pureWhite)),
                  onPressed: () {},
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.uberSafetyRed),
                  icon: const Icon(LucideIcons.bell, size: 16, color: AppColors.pureWhite),
                  label: const Text('Ring Chime', style: TextStyle(color: AppColors.pureWhite)),
                  onPressed: () {
                    provider.speak('Caregiver Sunita triggered spatial alert chime.');
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTelemetryCards(BuildContext context, NavidoorProvider provider) {
    return Row(
      children: [
        Expanded(child: _buildMetricTile('BATTERY', '84%', LucideIcons.battery_charging, Colors.greenAccent)),
        const SizedBox(width: 12),
        Expanded(child: _buildMetricTile('DAILY STEPS', '2,480', LucideIcons.footprints, AppColors.cyanLight)),
        const SizedBox(width: 12),
        Expanded(child: _buildMetricTile('MEDICINE', 'Taken', LucideIcons.circle_check, Colors.greenAccent)),
      ],
    );
  }

  Widget _buildMetricTile(String label, String val, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.lightGrayBg.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.lightGrayBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 8),
          Text(val, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.w900)),
          Text(label, style: const TextStyle(color: AppColors.lightGrayCard, fontSize: 10, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildActivityListCard(BuildContext context, NavidoorProvider provider) {
    final activities = [
      {'time': '8:12 AM', 'title': 'Morning Lisinopril 10mg taken', 'icon': LucideIcons.pill},
      {'time': '8:45 AM', 'title': 'Navigated 45m towards MG Road', 'icon': LucideIcons.compass},
      {'time': '9:10 AM', 'title': 'Avoided chair obstacle (1.2m front)', 'icon': LucideIcons.shield_check},
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.lightGrayBg.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.lightGrayBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('RECENT USER ACTIVITY', style: TextStyle(color: AppColors.pureWhite, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          ...activities.map((a) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Icon(a['icon'] as IconData, size: 18, color: AppColors.cyanLight),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(a['title'] as String, style: const TextStyle(color: AppColors.pureWhite, fontSize: 13)),
                    ),
                    Text(a['time'] as String, style: const TextStyle(color: AppColors.lightGrayCard, fontSize: 11)),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildAlertsListCard(BuildContext context, NavidoorProvider provider) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.lightGrayBg.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Text('No critical alerts in the last 24 hours. User is safe.', style: TextStyle(color: AppColors.pureWhite)),
    );
  }

  Widget _buildProfileTab(BuildContext context, NavidoorProvider provider) {
    return Column(
      children: [
        Text('Caregiver: ${provider.familyUser?.name ?? "Sunita Sharma"}', style: const TextStyle(color: AppColors.pureWhite)),
        const SizedBox(height: 16),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.uberSafetyRed),
          onPressed: () => provider.setUserRole(UserRole.undecided),
          child: const Text('Unpair / Exit Caregiver Mode', style: TextStyle(color: AppColors.pureWhite)),
        ),
      ],
    );
  }
}
