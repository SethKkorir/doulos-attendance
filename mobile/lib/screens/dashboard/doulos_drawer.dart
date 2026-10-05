import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/app_colors.dart';

class DoulosDrawer extends StatelessWidget {
  final Map<String, dynamic> studentData;
  final String? remoteLogoUrl;
  final int selectedIndex;
  final Function(int) onSelectTab;
  final VoidCallback onLogout;

  const DoulosDrawer({
    super.key,
    required this.studentData,
    this.remoteLogoUrl,
    required this.selectedIndex,
    required this.onSelectTab,
    required this.onLogout,
  });

  void _showComingSoon(BuildContext context, String title) {
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          '$title is coming soon in the next release!',
          style: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
        backgroundColor: AppColors.primary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final name = studentData['memberName']?.toString() ?? 'Seth Korir';
    final regNo = studentData['studentRegNo']?.toString() ?? '22-0990';
    final email = studentData['email']?.toString() ?? '${regNo.toLowerCase()}@daystar.ac.ke';
    final initial = name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'S';

    return Drawer(
      backgroundColor: const Color(0xFF0F172A), // Dark Navy (Screen 9)
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),
            // Header Lockup: Logo + Brand
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                      border: Border.all(color: Colors.white24),
                    ),
                    child: ClipOval(
                      child: Padding(
                        padding: const EdgeInsets.all(6.0),
                        child: remoteLogoUrl != null && remoteLogoUrl!.isNotEmpty
                            ? Image.network(
                                remoteLogoUrl!,
                                fit: BoxFit.contain,
                                errorBuilder: (_, _, _) => Image.asset(
                                  'assets/logo.png',
                                  fit: BoxFit.contain,
                                ),
                              )
                            : Image.asset('assets/logo.png', fit: BoxFit.contain),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'DOULOS',
                        style: GoogleFonts.inter(
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.2,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // User Info Block
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white10),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFF3B82F6),
                      ),
                      child: Center(
                        child: Text(
                          initial,
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
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
                            name,
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            email,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: const Color(0xFF94A3B8),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Navigation Links
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _buildDrawerItem(
                    index: 0,
                    icon: Icons.home_rounded,
                    label: 'Home',
                    isSelected: selectedIndex == 0,
                    onTap: () {
                      Navigator.pop(context);
                      onSelectTab(0);
                    },
                  ),
                  _buildDrawerItem(
                    index: 1,
                    icon: Icons.auto_stories_rounded,
                    label: 'Fellowship',
                    isSelected: selectedIndex == 1,
                    onTap: () {
                      Navigator.pop(context);
                      onSelectTab(1);
                    },
                  ),
                  _buildDrawerItem(
                    index: 2,
                    icon: Icons.access_time_rounded,
                    label: 'Attendance History',
                    isSelected: selectedIndex == 2,
                    onTap: () {
                      Navigator.pop(context);
                      onSelectTab(2);
                    },
                  ),
                  _buildDrawerItem(
                    index: 3,
                    icon: Icons.calendar_today_rounded,
                    label: 'Events & Meetings',
                    isSelected: selectedIndex == 3,
                    onTap: () {
                      Navigator.pop(context);
                      onSelectTab(3);
                    },
                  ),
                  _buildDrawerItem(
                    index: 4,
                    icon: Icons.person_outline_rounded,
                    label: 'Profile',
                    isSelected: selectedIndex == 4,
                    onTap: () {
                      Navigator.pop(context);
                      onSelectTab(4);
                    },
                  ),
                  const Divider(color: Colors.white12, height: 24),
                  _buildDrawerItem(
                    index: -1,
                    icon: Icons.settings_outlined,
                    label: 'Settings',
                    isSelected: false,
                    onTap: () => _showComingSoon(context, 'Settings'),
                  ),
                  _buildDrawerItem(
                    index: -2,
                    icon: Icons.help_outline_rounded,
                    label: 'Help & Support',
                    isSelected: false,
                    onTap: () => _showComingSoon(context, 'Help & Support'),
                  ),
                  const SizedBox(height: 12),
                  _buildDrawerItem(
                    index: -3,
                    icon: Icons.logout_rounded,
                    label: 'Log Out',
                    isSelected: false,
                    color: const Color(0xFFEF4444),
                    onTap: () {
                      Navigator.pop(context);
                      onLogout();
                    },
                  ),
                ],
              ),
            ),

            // Footer
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Doulos',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.white54,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Serve · Grow · Together',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      color: Colors.white38,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerItem({
    required int index,
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    Color? color,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: isSelected ? const Color(0xFF2563EB) : Colors.transparent,
        borderRadius: BorderRadius.circular(14),
      ),
      child: ListTile(
        onTap: onTap,
        dense: true,
        leading: Icon(
          icon,
          size: 20,
          color: color ?? (isSelected ? Colors.white : const Color(0xFF94A3B8)),
        ),
        title: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13.5,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: color ?? (isSelected ? Colors.white : const Color(0xFFE2E8F0)),
          ),
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }
}
