import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/app_colors.dart';
import '../../core/api_service.dart';
import '../../core/constants.dart';
import '../auth/login_screen.dart';
import '../scanner/portal_qr_scanner_sheet.dart';
import 'attendance_screen.dart';
import 'profile_tab.dart';
import 'history_tab.dart';
import 'events_tab.dart';
import 'doulos_drawer.dart';

class MemberDashboardScreen extends StatefulWidget {
  final Map<String, dynamic> initialData;

  const MemberDashboardScreen({super.key, required this.initialData});

  @override
  State<MemberDashboardScreen> createState() => _MemberDashboardScreenState();
}

class _MemberDashboardScreenState extends State<MemberDashboardScreen>
    with WidgetsBindingObserver {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  late Map<String, dynamic> _data;
  int _currentNavIndex = 0; // 0: Home, 1: History, 2: Events, 3: Profile
  String? _remoteLogoUrl;
  List<dynamic> _upcomingEvents = [];
  List<dynamic> _campusMeetings = [];
  bool _isLoadingEvents = false;

  // Inactivity & Session Idle Management
  Timer? _idleTimer;
  Timer? _countdownTimer;
  bool _isShowingCountdown = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _data = widget.initialData;
    _loadBranding();
    _loadUpcomingEvents();
    _startInactivityMonitoring();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _cancelTimers();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.detached) {
      // Clear persistent session credentials when app process is closed/killed
      SharedPreferences.getInstance().then((prefs) {
        prefs.remove(AppConstants.keyStudentRegNo);
        prefs.remove(AppConstants.keyStudentDataJson);
        prefs.remove(AppConstants.keyMemberName);
        prefs.remove(AppConstants.keyMemberType);
      });
    }
  }

  void _startInactivityMonitoring() {
    _resetIdleTimer();
  }

  void _cancelTimers() {
    _idleTimer?.cancel();
    _countdownTimer?.cancel();
    _idleTimer = null;
    _countdownTimer = null;
  }

  void _resetIdleTimer() {
    if (_isShowingCountdown) return;
    _idleTimer?.cancel();
    // 2 minutes of idle threshold before triggering the 15-second countdown
    _idleTimer = Timer(const Duration(minutes: 2), _showInactivityCountdown);
  }

  void _showInactivityCountdown() {
    if (!mounted || _isShowingCountdown) return;
    _isShowingCountdown = true;
    int remaining = 15;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            _countdownTimer?.cancel();
            _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
              if (remaining <= 1) {
                timer.cancel();
                _countdownTimer = null;
                _isShowingCountdown = false;
                if (Navigator.canPop(dialogContext)) {
                  Navigator.pop(dialogContext);
                }
                _logout(true);
              } else {
                setDialogState(() {
                  remaining--;
                });
              }
            });

            return AlertDialog(
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
              contentPadding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: const BoxDecoration(
                      color: Color(0xFFFEF3C7),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.hourglass_top_rounded,
                      color: Color(0xFFD97706),
                      size: 32,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Session Inactive',
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'You have been inactive. For your security, this session will automatically close in:',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 13.5,
                      color: const Color(0xFF64748B),
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 18),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: const Color(0xFFBFDBFE)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.alarm, size: 18, color: Color(0xFF2563EB)),
                        const SizedBox(width: 8),
                        Text(
                          '$remaining seconds',
                          style: GoogleFonts.inter(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF1E40AF),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () {
                        _countdownTimer?.cancel();
                        _countdownTimer = null;
                        _isShowingCountdown = false;
                        Navigator.pop(dialogContext);
                        _resetIdleTimer();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        'Click to Continue',
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () {
                      _countdownTimer?.cancel();
                      _countdownTimer = null;
                      _isShowingCountdown = false;
                      Navigator.pop(dialogContext);
                      _logout(true);
                    },
                    child: Text(
                      'Sign Out Now',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF94A3B8),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _loadBranding() async {
    try {
      final branding = await ApiService().fetchBranding();
      final logoRelative = branding['logoUrl'] as String?;
      if (logoRelative != null && logoRelative.isNotEmpty) {
        final resolvedLogo = await ApiService.resolveMediaUrl(logoRelative);
        if (mounted) {
          setState(() {
            _remoteLogoUrl = resolvedLogo;
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _loadUpcomingEvents() async {
    setState(() {
      _isLoadingEvents = true;
    });
    try {
      final campus = _data['campus']?.toString() ?? 'Athi River';
      final results = await Future.wait([
        ApiService().fetchTrainings(campus: campus),
        ApiService().fetchMeetings(campus: campus),
      ]);
      if (mounted) {
        setState(() {
          _upcomingEvents = results[0];
          _campusMeetings = results[1];
          _isLoadingEvents = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoadingEvents = false;
        });
      }
    }
  }

  bool _matchesCampus(dynamic itemCampus, String memberCampus) {
    if (itemCampus == null) return true;
    final ic = itemCampus.toString().toLowerCase().trim();
    final mc = memberCampus.toLowerCase().trim();
    if (ic == 'both' || ic == 'all' || ic.isEmpty) {
      return true;
    }
    if (mc.contains('athi') && ic.contains('athi')) {
      return true;
    }
    if ((mc.contains('valley') || mc.contains('nairobi')) &&
        (ic.contains('valley') || ic.contains('nairobi'))) {
      return true;
    }
    return ic == mc;
  }

  Map<String, dynamic>? _getNextMeeting() {
    final memberCampus = _data['campus']?.toString() ?? 'Athi River';

    // 1. Live meetings from backend matching student's campus
    final matchingMeetings = _campusMeetings.where((m) {
      if (m is! Map) return false;
      return _matchesCampus(m['campus'], memberCampus);
    }).toList();

    // Check if active right now
    for (final m in matchingMeetings) {
      if ((m as Map)['isActive'] == true) {
        return Map<String, dynamic>.from(m);
      }
    }

    // Check upcoming by date (must be today or in the future)
    final now = DateTime.now();
    for (final m in matchingMeetings) {
      if (m is Map && m['date'] != null) {
        final d = DateTime.tryParse(m['date'].toString());
        if (d != null && d.isAfter(now.subtract(const Duration(hours: 4)))) {
          return Map<String, dynamic>.from(m);
        }
      }
    }

    // Strictly return null if no meeting is active or in the future
    return null;
  }

  String _formatDateString(dynamic rawDate) {
    if (rawDate == null) return '';
    try {
      final dt = DateTime.tryParse(rawDate.toString());
      if (dt != null) {
        const months = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        final dayName = days[(dt.weekday - 1) % 7];
        final monthName = months[(dt.month - 1) % 12];
        final hour = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
        final ampm = dt.hour >= 12 ? 'PM' : 'AM';
        final minute = dt.minute.toString().padLeft(2, '0');
        return '$dayName, ${dt.day} $monthName ${dt.year} · $hour:$minute $ampm';
      }
    } catch (_) {}
    return rawDate.toString();
  }

  String _getTimeGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  Future<void> _refreshData() async {
    final regNo = _data['studentRegNo'] as String?;
    if (regNo == null || regNo.isEmpty) return;

    try {
      final refreshed = await ApiService().fetchStudentData(regNo);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        AppConstants.keyStudentDataJson,
        jsonEncode(refreshed),
      );

      if (mounted) {
        setState(() {
          _data = refreshed;
        });
      }
    } catch (e) {
      if (mounted) {
        final err = ApiService.extractErrorMessage(e);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(err),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _logout([bool force = false]) async {
    _cancelTimers();
    if (!force) {
      final confirm = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            'Sign Out',
            style: GoogleFonts.inter(
              color: AppColors.textDark,
              fontWeight: FontWeight.bold,
            ),
          ),
          content: Text(
            'Are you sure you want to sign out from the member portal?',
            style: GoogleFonts.inter(color: AppColors.textSecondary),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text(
                'Cancel',
                style: GoogleFonts.inter(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: Text(
                'Sign Out',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      );

      if (confirm != true) {
        _resetIdleTimer();
        return;
      }
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.keyStudentRegNo);
    await prefs.remove(AppConstants.keyStudentDataJson);
    await prefs.remove(AppConstants.keyMemberName);
    await prefs.remove(AppConstants.keyMemberType);

    try {
      await ApiService().secureStorage.delete(key: AppConstants.keyAuthToken);
    } catch (_) {}

    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => const LoginScreen()),
    );
  }

  void _openAttendancePass() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AttendanceScreen(
          studentData: _data,
          onCheckInSuccess: () {
            _refreshData();
          },
        ),
      ),
    );
  }

  void _openCameraScanner() {
    final regNo = _data['studentRegNo']?.toString() ?? '22-0990';
    final name = _data['memberName']?.toString() ?? 'Seth Korir';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => PortalQrScannerSheet(
        studentRegNo: regNo,
        memberName: name,
        onCheckInSuccess: () {
          _refreshData();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      behavior: HitTestBehavior.translucent,
      onPointerDown: (_) => _resetIdleTimer(),
      onPointerMove: (_) => _resetIdleTimer(),
      child: Scaffold(
      key: _scaffoldKey,
      backgroundColor: AppColors.background,
      drawer: DoulosDrawer(
        studentData: _data,
        remoteLogoUrl: _remoteLogoUrl,
        selectedIndex: _currentNavIndex,
        onSelectTab: (index) {
          if (index >= 0 && index < 4) {
            setState(() {
              _currentNavIndex = index;
            });
          }
        },
        onLogout: _logout,
      ),
      bottomNavigationBar: _buildBottomNavBar(),
      body: SafeArea(
        bottom: false,
        child: IndexedStack(
          index: _currentNavIndex,
          children: [
            _buildHomeTab(),
            HistoryTab(studentData: _data),
            EventsTab(studentData: _data),
            ProfileTab(
              studentData: _data,
              onLogout: _logout,
            ),
          ],
        ),
      ),
    ),
  );
}

  // ==========================================
  // TAB 0: HOME SCREEN (Screen 3 in user image)
  // ==========================================
  Widget _buildHomeTab() {
    final name = _data['memberName']?.toString() ?? 'Seth Korir';
    final memberType = _data['memberType']?.toString() ?? 'Doulos Member';
    final douloidRank = _data['douloidRank']?.toString() ?? 'Shadow Douloid';

    // Stats calculation from backend
    final stats = (_data['stats'] as Map<String, dynamic>?) ?? {};
    final totalMeetings = ApiService.safeInt(stats['totalMeetings'], 12);
    final attendedMeetings = ApiService.safeInt(stats['physicalAttended'], 10);
    final missedMeetings = (totalMeetings - attendedMeetings).clamp(0, 99);

    // Dynamic next meeting resolution for member's campus
    final memberCampus = _data['campus']?.toString() ?? 'Athi River';
    final nextMeeting = _getNextMeeting();
    final nextMeetingTitle = nextMeeting != null
        ? (nextMeeting['name']?.toString() ?? 'Doulos Fellowship')
        : 'No Upcoming Meeting Scheduled';
    final nextMeetingCampus = nextMeeting?['campus']?.toString() ?? memberCampus;
    final nextMeetingSubtitle = nextMeeting != null && nextMeeting['date'] != null
        ? '${_formatDateString(nextMeeting['date'])} • $nextMeetingCampus'
        : 'Campus: $memberCampus';

    return RefreshIndicator(
      onRefresh: _refreshData,
      color: AppColors.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Bar: Avatar + Greeting + Name + Subtitle + Notification Bell
            Row(
              children: [
                GestureDetector(
                  onTap: () => _scaffoldKey.currentState?.openDrawer(),
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                      border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.08),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: ClipOval(
                      child: Padding(
                        padding: const EdgeInsets.all(4.0),
                        child: _remoteLogoUrl != null && _remoteLogoUrl!.isNotEmpty
                            ? Image.network(
                                _remoteLogoUrl!,
                                fit: BoxFit.contain,
                                errorBuilder: (_, _, _) => Image.asset(
                                  'assets/logo.png',
                                  fit: BoxFit.contain,
                                ),
                              )
                            : Image.asset(
                                'assets/logo.png',
                                fit: BoxFit.contain,
                              ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _getTimeGreeting(),
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        name,
                        style: GoogleFonts.inter(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textDark,
                        ),
                      ),
                      Text(
                        memberType == 'Douloid' ? douloidRank : memberType,
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
                // Notification Bell / Menu trigger
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.border),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 6,
                      ),
                    ],
                  ),
                  child: IconButton(
                    icon: const Icon(
                      Icons.notifications_none_rounded,
                      color: AppColors.textDark,
                      size: 20,
                    ),
                    onPressed: () => _scaffoldKey.currentState?.openDrawer(),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Next Meeting Section
            if (nextMeeting != null)
              GestureDetector(
                onTap: _openAttendancePass,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE9D5FF), width: 1.2),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF7E22CE).withValues(alpha: 0.04),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 42,
                        height: 42,
                        decoration: const BoxDecoration(
                          color: Color(0xFFF3E8FF),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.star_rounded,
                          color: Color(0xFF7E22CE),
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Next Meeting',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF7E22CE),
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              nextMeetingTitle,
                              style: GoogleFonts.inter(
                                fontSize: 14.5,
                                fontWeight: FontWeight.w800,
                                color: AppColors.textDark,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              nextMeetingSubtitle,
                              style: GoogleFonts.inter(
                                fontSize: 11.5,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right_rounded,
                        color: Color(0xFF7E22CE),
                        size: 22,
                      ),
                    ],
                  ),
                ),
              )
            else
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.event_busy_rounded,
                        color: Color(0xFF64748B),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'No Upcoming Meeting Scheduled',
                            style: GoogleFonts.inter(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textDark,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Campus: $memberCampus • Check back later',
                            style: GoogleFonts.inter(
                              fontSize: 11.5,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 16),

            // Check In for Attendance Card (Screen 3)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 12,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Check In for Attendance',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textDark,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Scan the QR code at the venue',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Solid Blue "Scan QR" Button (Screen 3)
                  InkWell(
                    onTap: _openCameraScanner,
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      width: 58,
                      height: 58,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.28),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.qr_code_2_rounded,
                            color: Colors.white,
                            size: 24,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Scan QR',
                            style: GoogleFonts.inter(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Stats Row (Screen 3: 3 Cards: Total Sessions, Attended, Missed)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _buildStatItem(
                      icon: Icons.check_circle_outline_rounded,
                      iconColor: AppColors.success,
                      iconBg: AppColors.successBg,
                      value: totalMeetings.toString(),
                      label: 'Total Sessions',
                    ),
                  ),
                  Container(
                    width: 1,
                    height: 48,
                    color: AppColors.border,
                  ),
                  Expanded(
                    child: _buildStatItem(
                      icon: Icons.calendar_today_rounded,
                      iconColor: AppColors.primary,
                      iconBg: const Color(0xFFEFF6FF),
                      value: attendedMeetings.toString(),
                      label: 'Attended',
                    ),
                  ),
                  Container(
                    width: 1,
                    height: 48,
                    color: AppColors.border,
                  ),
                  Expanded(
                    child: _buildStatItem(
                      icon: Icons.cancel_outlined,
                      iconColor: AppColors.error,
                      iconBg: AppColors.errorBg,
                      value: missedMeetings.toString(),
                      label: 'Missed',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Upcoming Events Section Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Upcoming Events',
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textDark,
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    setState(() {
                      _currentNavIndex = 2; // Jump to Events tab
                    });
                  },
                  child: Row(
                    children: [
                      Text(
                        'View All',
                        style: GoogleFonts.inter(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(
                        Icons.arrow_forward_rounded,
                        size: 14,
                        color: AppColors.primary,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Upcoming Events Section (Campus-specific, strictly upcoming or active, zero mockups)
            Builder(
              builder: (context) {
                final now = DateTime.now();
                final campusEvents = _upcomingEvents.where((e) {
                  if (e is! Map) return false;
                  if (!_matchesCampus(e['campus'], memberCampus)) return false;

                  if (e['isActive'] == true) return true;

                  final dateRaw = e['date'] ?? e['startDate'];
                  if (dateRaw == null) return false;
                  final d = DateTime.tryParse(dateRaw.toString());
                  if (d == null) return false;
                  return d.isAfter(now.subtract(const Duration(hours: 12)));
                }).toList();

                if (_isLoadingEvents) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.primary,
                      ),
                    ),
                  );
                }

                if (campusEvents.isNotEmpty) {
                  return Column(
                    children: campusEvents.take(3).map((e) {
                      final m = e as Map;
                      final title = (m['title'] ?? m['name'] ?? 'Fellowship Training').toString();
                      final dateRaw = m['date'] ?? m['startDate'] ?? '';
                      final formattedDate = _formatDateString(dateRaw);
                      final eventCampus = m['campus'] != null ? ' • ${m['campus']}' : '';
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _buildUpcomingEventCard(
                          title: title,
                          date: '$formattedDate$eventCampus',
                          onTap: _openAttendancePass,
                        ),
                      );
                    }).toList(),
                  );
                }

                return Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        Icons.event_available_rounded,
                        size: 32,
                        color: AppColors.textMuted.withValues(alpha: 0.6),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'No upcoming events scheduled',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                          color: AppColors.textDark,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Scheduled trainings and camps for $memberCampus will appear here.',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 11.5,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String value,
    required String label,
  }) {
    return Column(
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: iconBg,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: iconColor, size: 18),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 19,
            fontWeight: FontWeight.w900,
            color: AppColors.textDark,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(
            fontSize: 11,
            color: AppColors.textSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildUpcomingEventCard({
    required String title,
    required String date,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.calendar_today_rounded,
                    color: AppColors.primary,
                    size: 18,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textDark,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        date,
                        style: GoogleFonts.inter(
                          fontSize: 11.5,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: AppColors.textMuted,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ==========================================
  // BOTTOM NAVIGATION BAR (Exact 4 Tabs)
  // ==========================================
  Widget _buildBottomNavBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(
          top: BorderSide(color: AppColors.border, width: 1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Container(
          height: 60,
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
          child: Row(
            children: [
              _buildNavItem(
                index: 0,
                icon: Icons.home_rounded,
                label: 'Home',
              ),
              _buildNavItem(
                index: 1,
                icon: Icons.access_time_rounded,
                label: 'History',
              ),
              _buildNavItem(
                index: 2,
                icon: Icons.calendar_today_rounded,
                label: 'Events',
              ),
              _buildNavItem(
                index: 3,
                icon: Icons.person_outline_rounded,
                label: 'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required int index,
    required IconData icon,
    required String label,
  }) {
    final bool isSelected = _currentNavIndex == index;
    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            _currentNavIndex = index;
          });
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 3),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFFEFF6FF) : Colors.transparent,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  icon,
                  size: 20,
                  color: isSelected ? AppColors.primary : AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 10.5,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                  color: isSelected ? AppColors.primary : AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
