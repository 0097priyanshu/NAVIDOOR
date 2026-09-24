import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:provider/provider.dart';
import '../models/nav_models.dart';
import '../providers/navidoor_provider.dart';

enum FamilyTab { home, location, activity, alerts, profile }

class FamilyTabItem {
  final FamilyTab id;
  final String label;
  final IconData icon;
  final bool isAlert;

  const FamilyTabItem({
    required this.id,
    required this.label,
    required this.icon,
    this.isAlert = false,
  });
}

const List<FamilyTabItem> kFamilyTabs = [
  FamilyTabItem(id: FamilyTab.home, label: 'HOME', icon: LucideIcons.house),
  FamilyTabItem(id: FamilyTab.location, label: 'LOCATION', icon: LucideIcons.map_pin),
  FamilyTabItem(id: FamilyTab.activity, label: 'ACTIVITY', icon: LucideIcons.activity),
  FamilyTabItem(id: FamilyTab.alerts, label: 'ALERTS', icon: LucideIcons.triangle_alert, isAlert: true),
  FamilyTabItem(id: FamilyTab.profile, label: 'PROFILE', icon: LucideIcons.user),
];

class FamilyPortalScreen extends StatefulWidget {
  const FamilyPortalScreen({super.key});

  @override
  State<FamilyPortalScreen> createState() => _FamilyPortalScreenState();
}

class _FamilyPortalScreenState extends State<FamilyPortalScreen> {
  FamilyTab _activeTab = FamilyTab.home;
  double _lastStepDx = 0;

  void _cycleNextTab() {
    final idx = kFamilyTabs.indexWhere((t) => t.id == _activeTab);
    final nextIdx = (idx + 1) % kFamilyTabs.length;
    setState(() => _activeTab = kFamilyTabs[nextIdx].id);
  }

  void _cyclePrevTab() {
    final idx = kFamilyTabs.indexWhere((t) => t.id == _activeTab);
    final prevIdx = (idx - 1 + kFamilyTabs.length) % kFamilyTabs.length;
    setState(() => _activeTab = kFamilyTabs[prevIdx].id);
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NavidoorProvider>();

    // 1. If caregiver is not logged in, render FamilyAuthScreen (matching React Native FamilyAuthScreen.tsx)
    if (provider.familyUser == null) {
      return const _FamilyAuthView();
    }

    // 2. Family Mode Container Experience (matching React Native FamilyModeContainer.tsx)
    final activeIndex = math.max(0, kFamilyTabs.indexWhere((t) => t.id == _activeTab));
    final screenWidth = MediaQuery.of(context).size.width;
    final dockWidth = math.min(screenWidth - 14, 460.0);

    return Scaffold(
      backgroundColor: const Color(0xFF64748B),
      body: GestureDetector(
        behavior: HitTestBehavior.translucent,
        onHorizontalDragEnd: (details) {
          final velocity = details.primaryVelocity ?? 0;
          if (velocity < -200) {
            _cycleNextTab();
          } else if (velocity > 200) {
            _cyclePrevTab();
          }
        },
        child: SafeArea(
          child: Stack(
            children: [
              // Screen Tab Content Area
              Positioned.fill(
                bottom: 95,
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 480),
                    child: _buildActiveTab(context, provider),
                  ),
                ),
              ),

              // Continuous Semi-Circle Arc Wheel Navbar (identical to React Native FamilyModeContainer.tsx)
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                height: 100,
                child: Align(
                  alignment: Alignment.bottomCenter,
                  child: GestureDetector(
                    onHorizontalDragStart: (details) => _lastStepDx = details.localPosition.dx,
                    onHorizontalDragUpdate: (details) {
                      final currentX = details.localPosition.dx;
                      final diff = currentX - _lastStepDx;
                      if (diff.abs() > 28) {
                        if (diff < 0) {
                          _cycleNextTab();
                        } else {
                          _cyclePrevTab();
                        }
                        _lastStepDx = currentX;
                      }
                    },
                    child: Container(
                      width: dockWidth,
                      height: 92,
                      decoration: const BoxDecoration(
                        color: Color(0xFFCBD5E1),
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(38),
                          topRight: Radius.circular(38),
                        ),
                        border: Border(
                          top: BorderSide(color: Color(0xFF64748B), width: 1.5),
                          left: BorderSide(color: Color(0xFF64748B), width: 1.5),
                          right: BorderSide(color: Color(0xFF64748B), width: 1.5),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Color(0x260284C7),
                            offset: Offset(0, -8),
                            blurRadius: 16,
                          ),
                        ],
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        clipBehavior: Clip.none,
                        children: kFamilyTabs.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final item = entry.value;
                          final offset = idx - activeIndex;
                          final isActive = idx == activeIndex;

                          // Arc offset
                          final angle = (offset * math.pi) / 6.2;
                          final posX = math.sin(angle) * (dockWidth > 400 ? 135 : (dockWidth * 0.35));
                          final posY = (1 - math.cos(angle)) * 16;

                          final scale = isActive ? 1.25 : (offset.abs() == 1 ? 0.95 : 0.78);
                          final opacity = isActive ? 1.0 : (offset.abs() == 1 ? 0.88 : 0.58);

                          final badgeBg = isActive
                              ? (item.isAlert ? const Color(0xFFE11D48) : const Color(0xFF0284C7))
                              : const Color(0xFF94A3B8);

                          final labelColor = isActive
                              ? (item.isAlert ? const Color(0xFFE11D48) : const Color(0xFF0284C7))
                              : const Color(0xFF0F172A);

                          return Positioned(
                            bottom: 12 - posY,
                            child: Transform.translate(
                              offset: Offset(posX, 0),
                              child: Transform.scale(
                                scale: scale,
                                child: Opacity(
                                  opacity: opacity,
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(
                                        width: 52,
                                        height: 52,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: badgeBg,
                                        ),
                                        child: Material(
                                          color: Colors.transparent,
                                          shape: const CircleBorder(),
                                          child: InkWell(
                                            customBorder: const CircleBorder(),
                                            onTap: () => setState(() => _activeTab = item.id),
                                            child: Center(
                                              child: Icon(
                                                item.icon,
                                                size: 22,
                                                color: isActive ? Colors.white : const Color(0xFF0F172A),
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        item.label,
                                        style: TextStyle(
                                          color: labelColor,
                                          fontSize: 11.5,
                                          fontWeight: isActive ? FontWeight.w900 : FontWeight.w700,
                                          letterSpacing: 0.6,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActiveTab(BuildContext context, NavidoorProvider provider) {
    switch (_activeTab) {
      case FamilyTab.home:
        return _buildHomeTab(context, provider);
      case FamilyTab.location:
        return _buildLocationTab(context, provider);
      case FamilyTab.activity:
        return _buildActivityTab(context, provider);
      case FamilyTab.alerts:
        return _buildAlertsTab(context, provider);
      case FamilyTab.profile:
        return _buildProfileTab(context, provider);
    }
  }

  // 1. HOME TAB (matching React Native FamilyHomeTab.tsx)
  Widget _buildHomeTab(BuildContext context, NavidoorProvider provider) {
    final caregiverName = provider.familyUser?.name ?? 'Priya Sharma';

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Greeting Banner
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFF0284C7),
                ),
                child: const Center(
                  child: Icon(LucideIcons.users, size: 22, color: Colors.white),
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Good day,',
                    style: TextStyle(
                      color: Color(0xFFE2E8F0),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    caregiverName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Connected Navidoor User Status Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFFCBD5E1),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF475569), width: 1.5),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x260284C7),
                  offset: Offset(0, 6),
                  blurRadius: 16,
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(LucideIcons.circle_dot, color: Color(0xFF10B981), size: 14),
                        SizedBox(width: 6),
                        Text(
                          'MONITORING ACTIVE',
                          style: TextStyle(
                            color: Color(0xFF10B981),
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        '85% Battery',
                        style: TextStyle(
                          color: Color(0xFF0F172A),
                          fontWeight: FontWeight.w800,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Aarav Sharma (${provider.familyConnectedUserPhone ?? "+91 98123 45678"})',
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Walking safely with AI voice assist • 1.2 m/s',
                  style: TextStyle(
                    color: Color(0xFF475569),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Divider(color: Color(0xFF94A3B8), height: 24),
                const Row(
                  children: [
                    Icon(LucideIcons.map_pin, size: 16, color: Color(0xFF0284C7)),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Block B, Connaught Place, New Delhi',
                        style: TextStyle(
                          color: Color(0xFF0F172A),
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Journey In-Progress Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFFCBD5E1),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF475569), width: 1.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(LucideIcons.play, size: 18, color: Color(0xFF0284C7)),
                    SizedBox(width: 8),
                    Text(
                      'ACTIVE WALKING JOURNEY',
                      style: TextStyle(
                        color: Color(0xFF0284C7),
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Text(
                  'From: Connaught Place',
                  style: TextStyle(
                    color: Color(0xFF475569),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                const Text(
                  'To: AIIMS Hospital',
                  style: TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Started 10:15 AM • Estimated ETA: 10:45 AM',
                  style: TextStyle(
                    color: Color(0xFF10B981),
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 2. LOCATION TAB (matching React Native FamilyLocationTab.tsx)
  Widget _buildLocationTab(BuildContext context, NavidoorProvider provider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        children: [
          // Simulated Map Canvas
          Container(
            height: 260,
            decoration: BoxDecoration(
              color: const Color(0xFFCBD5E1),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF475569), width: 1.5),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Simulated grid & streets
                Positioned.fill(
                  child: CustomPaint(
                    painter: _MapGridPainter(),
                  ),
                ),
                // Connaught Place street label
                Positioned(
                  top: 70,
                  left: 20,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'Connaught Place',
                      style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                // Janpath Road street label
                Positioned(
                  bottom: 70,
                  right: 20,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'Janpath Road',
                      style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                // Pulsing Center Marker
                Container(
                  width: 54,
                  height: 54,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF0284C7).withValues(alpha: 0.25),
                  ),
                  child: Center(
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFF0284C7),
                      ),
                      child: const Center(
                        child: Icon(LucideIcons.navigation, size: 16, color: Colors.white),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Address Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFFCBD5E1),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF475569), width: 1.5),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(LucideIcons.map_pin, size: 18, color: Color(0xFF0284C7)),
                    SizedBox(width: 8),
                    Text(
                      'CURRENT ADDRESS',
                      style: TextStyle(
                        color: Color(0xFF0284C7),
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 6),
                Text(
                  'Block B, Connaught Place, New Delhi',
                  style: TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Coordinates: 28.6315° N, 77.2167° E • GPS Signal Strong',
                  style: TextStyle(
                    color: Color(0xFF475569),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 3. ACTIVITY TAB (matching React Native FamilyActivityTab.tsx)
  Widget _buildActivityTab(BuildContext context, NavidoorProvider provider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFFCBD5E1),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF475569), width: 1.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(LucideIcons.activity, size: 18, color: Color(0xFF0284C7)),
                    SizedBox(width: 8),
                    Text(
                      'ACTIVITY TIMELINE',
                      style: TextStyle(
                        color: Color(0xFF0284C7),
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildTimelineItem('10:15 AM', 'Journey started from Connaught Place', isFirst: true),
                _buildTimelineItem('10:22 AM', 'Crossed Janpath traffic intersection safely'),
                _buildTimelineItem('10:30 AM', 'Scanned pharmacy storefront via AI vision'),
                _buildTimelineItem('10:40 AM', 'Arrived at AIIMS Hospital entrance doorway', isLast: true),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineItem(String time, String text, {bool isFirst = false, bool isLast = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 12,
              height: 12,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFF0284C7),
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 38,
                color: const Color(0xFF94A3B8),
              ),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                time,
                style: const TextStyle(
                  color: Color(0xFF0284C7),
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                text,
                style: const TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 14),
            ],
          ),
        ),
      ],
    );
  }

  // 4. ALERTS TAB (matching React Native FamilyAlertsTab.tsx)
  Widget _buildAlertsTab(BuildContext context, NavidoorProvider provider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFFCBD5E1),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF475569), width: 1.5),
            ),
            child: Column(
              children: [
                Container(
                  width: 68,
                  height: 68,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Color(0xFF10B981),
                  ),
                  child: const Center(
                    child: Icon(LucideIcons.shield_check, size: 38, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'No Active Alerts',
                  style: TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'All connected family members are safe. Emergency channels are monitored in real time.',
                  style: TextStyle(
                    color: Color(0xFF475569),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
                const Divider(color: Color(0xFF94A3B8), height: 32),
                _buildSecurityCheck('Real-Time SOS trigger channel active'),
                const SizedBox(height: 8),
                _buildSecurityCheck('GPS position heartbeats active'),
                const SizedBox(height: 8),
                _buildSecurityCheck('Consent and security tokens valid'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSecurityCheck(String text) {
    return Row(
      children: [
        const Icon(LucideIcons.circle_check, size: 16, color: Color(0xFF10B981)),
        const SizedBox(width: 8),
        Text(
          text,
          style: const TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 12.5,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  // 5. PROFILE TAB (matching React Native FamilyProfileTab.tsx)
  Widget _buildProfileTab(BuildContext context, NavidoorProvider provider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFFCBD5E1),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF475569), width: 1.5),
            ),
            child: Column(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Color(0xFF0284C7),
                  ),
                  child: const Center(
                    child: Icon(LucideIcons.user, size: 30, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  provider.familyUser?.name ?? 'Caregiver',
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  provider.familyUser?.phone ?? '+91 98765 43210',
                  style: const TextStyle(
                    color: Color(0xFF475569),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Divider(color: Color(0xFF94A3B8), height: 32),

                // Logout & Reset Button
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE11D48),
                    minimumSize: const Size(double.infinity, 48),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  onPressed: () {
                    provider.setFamilyUser(null);
                    provider.setUserRole(UserRole.undecided);
                  },
                  icon: const Icon(LucideIcons.log_out, size: 18, color: Colors.white),
                  label: const Text(
                    'LOGOUT & SWITCH ROLE',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// CAREGIVER AUTH SCREEN (matching React Native FamilyAuthScreen.tsx)
class _FamilyAuthView extends StatefulWidget {
  const _FamilyAuthView();

  @override
  State<_FamilyAuthView> createState() => _FamilyAuthViewState();
}

class _FamilyAuthViewState extends State<_FamilyAuthView> {
  bool _isLogin = true;
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController(text: '+91 98765 43210');
  final _passwordController = TextEditingController(text: '••••••••');

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleSubmit() {
    final provider = context.read<NavidoorProvider>();
    final name = _nameController.text.trim().isNotEmpty ? _nameController.text.trim() : 'Priya Sharma';
    final phone = _phoneController.text.trim().isNotEmpty ? _phoneController.text.trim() : '+91 98765 43210';

    provider.setFamilyUser(FamilyUser(name: name, phone: phone));
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.read<NavidoorProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFF64748B),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 30),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Column(
                children: [
                  // Brand Header
                  Container(
                    width: 60,
                    height: 60,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Color(0xFF10B981),
                      boxShadow: [
                        BoxShadow(
                          color: Color(0x4D10B981),
                          offset: Offset(0, 4),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Icon(LucideIcons.heart, size: 30, color: Colors.white),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'NAVIDOOR FAMILY',
                    style: TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.0,
                    ),
                  ),
                  const Text(
                    'Caregiver Companion Portal',
                    style: TextStyle(
                      color: Color(0xFFE2E8F0),
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Main Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: const Color(0xFF475569), width: 1.5),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _isLogin ? 'Login to Portal' : 'Create Caregiver Account',
                          style: const TextStyle(
                            color: Color(0xFF0F172A),
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 16),

                        if (!_isLogin) ...[
                          const Text(
                            'FULL NAME',
                            style: TextStyle(color: Color(0xFF0F172A), fontSize: 11, fontWeight: FontWeight.w900),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: _nameController,
                            decoration: InputDecoration(
                              prefixIcon: const Icon(LucideIcons.user, color: Color(0xFF0284C7), size: 18),
                              hintText: 'Priya Sharma',
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                            ),
                          ),
                          const SizedBox(height: 14),
                        ],

                        const Text(
                          'MOBILE NUMBER',
                          style: TextStyle(color: Color(0xFF0F172A), fontSize: 11, fontWeight: FontWeight.w900),
                        ),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          decoration: InputDecoration(
                            prefixIcon: const Icon(LucideIcons.phone, color: Color(0xFF0284C7), size: 18),
                            hintText: '+91 98765 43210',
                            filled: true,
                            fillColor: const Color(0xFFF8FAFC),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                        const SizedBox(height: 14),

                        const Text(
                          'PASSWORD',
                          style: TextStyle(color: Color(0xFF0F172A), fontSize: 11, fontWeight: FontWeight.w900),
                        ),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _passwordController,
                          obscureText: true,
                          decoration: InputDecoration(
                            prefixIcon: const Icon(LucideIcons.lock, color: Color(0xFF0284C7), size: 18),
                            hintText: '••••••••',
                            filled: true,
                            fillColor: const Color(0xFFF8FAFC),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                        const SizedBox(height: 20),

                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0284C7),
                            minimumSize: const Size(double.infinity, 48),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          onPressed: _handleSubmit,
                          child: Text(
                            _isLogin ? 'LOG IN' : 'REGISTER',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
                          ),
                        ),
                        const SizedBox(height: 10),

                        Center(
                          child: TextButton(
                            onPressed: () => setState(() => _isLogin = !_isLogin),
                            child: Text(
                              _isLogin ? "Don't have an account? Create one" : 'Already have an account? Log in',
                              style: const TextStyle(color: Color(0xFF0284C7), fontWeight: FontWeight.w800),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Back to Role Selection
                  TextButton(
                    onPressed: () => provider.setUserRole(UserRole.undecided),
                    child: const Text(
                      '← Change App Role',
                      style: TextStyle(color: Color(0xFFE2E8F0), fontWeight: FontWeight.w800),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0x33475569)
      ..strokeWidth = 1.0;

    canvas.drawLine(Offset(0, size.height * 0.35), Offset(size.width, size.height * 0.35), paint);
    canvas.drawLine(Offset(0, size.height * 0.7), Offset(size.width, size.height * 0.7), paint);
    canvas.drawLine(Offset(size.width * 0.4, 0), Offset(size.width * 0.4, size.height), paint);
    canvas.drawLine(Offset(size.width * 0.75, 0), Offset(size.width * 0.75, size.height), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
