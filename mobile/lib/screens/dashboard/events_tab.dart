import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../core/app_colors.dart';
import '../../core/api_service.dart';

class EventsTab extends StatefulWidget {
  final Map<String, dynamic> studentData;

  const EventsTab({super.key, required this.studentData});

  @override
  State<EventsTab> createState() => _EventsTabState();
}

class _EventsTabState extends State<EventsTab> {
  String _selectedTab = 'Upcoming'; // 'Upcoming' | 'Past'
  List<dynamic> _events = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadEvents();
  }

  Future<void> _loadEvents() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final campus = widget.studentData['campus']?.toString() ?? 'Athi River';
      final list = await ApiService().fetchTrainings(campus: campus);
      if (mounted) {
        setState(() {
          _events = list;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final historyMeetings = (widget.studentData['history'] as List<dynamic>?) ?? [];
    
    // Combine live backend trainings and meetings
    final allEvents = <Map<String, dynamic>>[];

    for (final tr in _events) {
      if (tr is Map<String, dynamic>) {
        allEvents.add({
          'title': tr['title'] ?? tr['name'] ?? 'Fellowship Training',
          'date': tr['date'] ?? tr['startDate'] ?? DateTime.now().toIso8601String(),
          'venue': tr['location'] ?? tr['venue'] ?? 'Freedom Base',
          'type': 'Training',
        });
      }
    }

    for (final m in historyMeetings) {
      if (m is Map<String, dynamic>) {
        allEvents.add({
          'title': m['name'] ?? 'Doulos Fellowship',
          'date': m['date'] ?? DateTime.now().toIso8601String(),
          'venue': m['campus'] ?? 'Campus Meeting',
          'type': 'Meeting',
        });
      }
    }

    final now = DateTime.now();
    final displayedEvents = allEvents.where((e) {
      try {
        final d = DateTime.parse(e['date'].toString());
        if (_selectedTab == 'Upcoming') {
          return d.isAfter(now.subtract(const Duration(days: 1)));
        } else {
          return d.isBefore(now);
        }
      } catch (_) {
        return true;
      }
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Text(
          'Events & Meetings',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: AppColors.textDark,
          ),
        ),
      ),
      body: Column(
        children: [
          // Segment Switch (Screen 8: Upcoming | Past)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _buildSegmentButton('Upcoming'),
                  ),
                  Expanded(
                    child: _buildSegmentButton('Past'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),

          // Events Feed
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : displayedEvents.isEmpty
                    ? Center(
                        child: Text(
                          'No $_selectedTab events scheduled',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(20, 6, 20, 24),
                        itemCount: displayedEvents.length,
                        itemBuilder: (context, index) {
                          final event = displayedEvents[index];
                          final title = event['title'] ?? 'Event';
                          final venue = event['venue'] ?? 'Athi River';
                          DateTime date = DateTime.now();
                          try {
                            date = DateTime.parse(event['date'].toString());
                          } catch (_) {}

                          final monthStr = DateFormat('MMM').format(date).toUpperCase();
                          final dayStr = DateFormat('d').format(date);
                          final fullDateStr = DateFormat('EEE, d MMM yyyy · 4:00 PM').format(date);

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
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
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Row(
                                children: [
                                  // Left Date Badge (Screen 8)
                                  Container(
                                    width: 50,
                                    height: 54,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEFF6FF),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: const Color(0xFFBFDBFE)),
                                    ),
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          monthStr,
                                          style: GoogleFonts.inter(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w800,
                                            letterSpacing: 0.8,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                        Text(
                                          dayStr,
                                          style: GoogleFonts.inter(
                                            fontSize: 18,
                                            fontWeight: FontWeight.w900,
                                            color: AppColors.textDark,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 14),

                                  // Event Details
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          title,
                                          style: GoogleFonts.inter(
                                            fontSize: 14.5,
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.textDark,
                                          ),
                                        ),
                                        const SizedBox(height: 3),
                                        Text(
                                          fullDateStr,
                                          style: GoogleFonts.inter(
                                            fontSize: 11.5,
                                            color: AppColors.textSecondary,
                                          ),
                                        ),
                                        const SizedBox(height: 5),
                                        Row(
                                          children: [
                                            const Icon(
                                              Icons.location_on_outlined,
                                              size: 13,
                                              color: AppColors.textMuted,
                                            ),
                                            const SizedBox(width: 4),
                                            Expanded(
                                              child: Text(
                                                venue,
                                                style: GoogleFonts.inter(
                                                  fontSize: 11.5,
                                                  color: AppColors.textSecondary,
                                                ),
                                              ),
                                            ),
                                          ],
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
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildSegmentButton(String tab) {
    final isSelected = _selectedTab == tab;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedTab = tab;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          tab,
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}
