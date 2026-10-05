import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/app_colors.dart';
import '../../core/api_service.dart';

class FellowshipTab extends StatefulWidget {
  final Map<String, dynamic> studentData;

  const FellowshipTab({super.key, required this.studentData});

  @override
  State<FellowshipTab> createState() => _FellowshipTabState();
}

class _FellowshipTabState extends State<FellowshipTab> {
  Map<String, dynamic>? _fellowship;
  bool _isLoading = true;
  final TextEditingController _reflectionController = TextEditingController();
  bool _reflectionSaved = false;
  bool _prayerAmen = false;

  @override
  void initState() {
    super.initState();
    _loadFellowship();
    _loadSavedReflection();
  }

  @override
  void dispose() {
    _reflectionController.dispose();
    super.dispose();
  }

  Future<void> _loadSavedReflection() async {
    final prefs = await SharedPreferences.getInstance();
    final regNo = widget.studentData['studentRegNo'] ?? '';
    final saved = prefs.getString('reflection_${regNo}_today');
    if (saved != null && saved.isNotEmpty) {
      _reflectionController.text = saved;
      setState(() {
        _reflectionSaved = true;
      });
    }
  }

  Future<void> _saveReflection() async {
    final text = _reflectionController.text.trim();
    if (text.isEmpty) return;

    final prefs = await SharedPreferences.getInstance();
    final regNo = widget.studentData['studentRegNo'] ?? '';
    await prefs.setString('reflection_${regNo}_today', text);

    if (_fellowship?['_id'] != null) {
      ApiService().recordFellowshipInteraction(_fellowship!['_id'], 'reflected');
    }

    setState(() {
      _reflectionSaved = true;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Reflection saved to your private journal 🔒',
            style: GoogleFonts.inter(fontWeight: FontWeight.w600),
          ),
          backgroundColor: const Color(0xFF1E293B),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  Future<void> _togglePrayerAmen() async {
    setState(() {
      _prayerAmen = !_prayerAmen;
    });

    if (_prayerAmen && _fellowship?['_id'] != null) {
      ApiService().recordFellowshipInteraction(_fellowship!['_id'], 'prayer');
    }
  }

  Future<void> _loadFellowship() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final campus = widget.studentData['campus']?.toString() ?? 'Athi River';
      final data = await ApiService().fetchTodayFellowship(campus: campus);
      if (mounted) {
        setState(() {
          _fellowship = data;
          _isLoading = false;
        });

        if (data?['_id'] != null) {
          ApiService().recordFellowshipInteraction(data!['_id'], 'opened');
        }
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
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          strokeWidth: 2.5,
          color: Color(0xFF966C2D),
        ),
      );
    }

    if (_fellowship == null) {
      return RefreshIndicator(
        onRefresh: _loadFellowship,
        color: const Color(0xFF966C2D),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFBF9F5),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.auto_stories_outlined,
                    size: 32,
                    color: Color(0xFF966C2D),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'No Fellowship Published Yet',
                  style: GoogleFonts.merriweather(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1C1917),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Today\'s scripture and devotional word will appear here once published by your Spiritual Coordinator.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: const Color(0xFF57534E),
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final title = _fellowship!['title']?.toString() ?? 'Fellowship';
    final theme = _fellowship!['theme']?.toString() ?? 'Daily Devotional';
    final ref = _fellowship!['scriptureReference']?.toString() ?? '';
    final verse = _fellowship!['scriptureText']?.toString() ?? '';
    final devotional = _fellowship!['devotional']?.toString() ?? '';
    final reflectionQ = _fellowship!['reflectionQuestion']?.toString() ?? '';
    final prayer = _fellowship!['prayer']?.toString() ?? '';
    final communityPrompt = _fellowship!['communityPrompt']?.toString() ?? '';

    return Scaffold(
      backgroundColor: const Color(0xFFFBF9F5), // Warm neutral editorial paper tone
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Text(
          'Fellowship',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: const Color(0xFF1C1917),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF57534E)),
            onPressed: _loadFellowship,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadFellowship,
        color: const Color(0xFF966C2D),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Theme Tag + Today's date
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF966C2D).withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: const Color(0xFF966C2D).withValues(alpha: 0.2),
                      ),
                    ),
                    child: Text(
                      theme.toUpperCase(),
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF966C2D),
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  Text(
                    'Today\'s Word',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF8C827A),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Title in Serif Editorial Font
              Text(
                title,
                style: GoogleFonts.merriweather(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF1C1917),
                  height: 1.25,
                ),
              ),
              const SizedBox(height: 16),

              // Scripture Highlight Card
              if (ref.isNotEmpty || verse.isNotEmpty) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF5EFEB),
                    borderRadius: BorderRadius.circular(18),
                    border: const Border(
                      left: BorderSide(color: Color(0xFF966C2D), width: 3.5),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (ref.isNotEmpty)
                        Text(
                          ref,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF966C2D),
                          ),
                        ),
                      if (ref.isNotEmpty && verse.isNotEmpty)
                        const SizedBox(height: 6),
                      if (verse.isNotEmpty)
                        Text(
                          '"$verse"',
                          style: GoogleFonts.merriweather(
                            fontSize: 14.5,
                            fontStyle: FontStyle.italic,
                            color: const Color(0xFF292524),
                            height: 1.5,
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 22),
              ],

              // Devotional Body
              Text(
                devotional,
                style: GoogleFonts.inter(
                  fontSize: 15,
                  color: const Color(0xFF44403C),
                  height: 1.65,
                ),
              ),
              const SizedBox(height: 28),

              // Reflection Section
              if (reflectionQ.isNotEmpty) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE7DFD5)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(
                            Icons.psychology_alt_outlined,
                            size: 18,
                            color: Color(0xFF966C2D),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'MY REFLECTION',
                            style: GoogleFonts.inter(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF966C2D),
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        reflectionQ,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF1C1917),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _reflectionController,
                        maxLines: 4,
                        style: GoogleFonts.inter(fontSize: 13.5, color: const Color(0xFF1C1917)),
                        decoration: InputDecoration(
                          hintText: 'Take a quiet moment to write your reflection...',
                          hintStyle: GoogleFonts.inter(
                            fontSize: 13,
                            color: const Color(0xFF8C827A),
                          ),
                          filled: true,
                          fillColor: const Color(0xFFFBF9F5),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: Color(0xFFE7DFD5)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: Color(0xFF966C2D)),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.lock_outline_rounded, size: 13, color: Color(0xFF8C827A)),
                              const SizedBox(width: 4),
                              Text(
                                'Only you can see this',
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  color: const Color(0xFF8C827A),
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ],
                          ),
                          ElevatedButton.icon(
                            onPressed: _saveReflection,
                            icon: Icon(
                              _reflectionSaved ? Icons.check_circle_rounded : Icons.save_outlined,
                              size: 14,
                              color: Colors.white,
                            ),
                            label: Text(
                              _reflectionSaved ? 'Saved' : 'Save Note',
                              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _reflectionSaved ? const Color(0xFF4E6E5D) : const Color(0xFF966C2D),
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Closing Prayer Card
              if (prayer.isNotEmpty) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFFEF3C7)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.favorite_outline_rounded, size: 16, color: Color(0xFFB45309)),
                          const SizedBox(width: 8),
                          Text(
                            'CLOSING PRAYER',
                            style: GoogleFonts.inter(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFFB45309),
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '"$prayer"',
                        style: GoogleFonts.merriweather(
                          fontSize: 13.5,
                          fontStyle: FontStyle.italic,
                          color: const Color(0xFF78350F),
                          height: 1.55,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Align(
                        alignment: Alignment.centerRight,
                        child: OutlinedButton.icon(
                          onPressed: _togglePrayerAmen,
                          icon: Icon(
                            _prayerAmen ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                            size: 15,
                            color: const Color(0xFFB45309),
                          ),
                          label: Text(
                            _prayerAmen ? 'Amen (Prayed)' : 'Say Amen',
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              color: const Color(0xFFB45309),
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFFFCD34D)),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Community Prompt Card (if any)
              if (communityPrompt.isNotEmpty) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.groups_outlined, color: AppColors.primary, size: 24),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Community Prompt',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primary,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              communityPrompt,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: const Color(0xFF334155),
                                height: 1.35,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
