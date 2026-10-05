import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../core/app_colors.dart';
import '../../core/api_service.dart';

class PortalQrScannerSheet extends StatefulWidget {
  final String studentRegNo;
  final String memberName;
  final VoidCallback onCheckInSuccess;
  final VoidCallback? onNavigateToFellowship;

  const PortalQrScannerSheet({
    super.key,
    required this.studentRegNo,
    required this.memberName,
    required this.onCheckInSuccess,
    this.onNavigateToFellowship,
  });

  @override
  State<PortalQrScannerSheet> createState() => _PortalQrScannerSheetState();
}

enum ScannerStatus {
  scanning,
  processing,
  question,
  submitting,
  success,
  error,
}

class _PortalQrScannerSheetState extends State<PortalQrScannerSheet> {
  late final MobileScannerController _scannerController;
  ScannerStatus _status = ScannerStatus.scanning;
  String _statusMessage = 'Point camera at the venue QR code';
  String? _errorMessage;

  String? _pendingMeetingCode;
  Map<String, dynamic>? _pendingMeeting;
  Map<String, dynamic>? _activeQuestion;
  String? _selectedOption;
  bool _requestCheckIn = false;
  final TextEditingController _questionAnswerController = TextEditingController();
  final TextEditingController _checkInReasonController = TextEditingController();
  final TextEditingController _manualCodeController = TextEditingController();
  String? _questionError;
  Map<String, dynamic>? _checkInResult;
  Map<String, dynamic>? _skillsFeedback;
  bool _isTorchOn = false;
  Position? _currentPosition;
  bool _isProcessingScan = false;

  @override
  void initState() {
    super.initState();
    _scannerController = MobileScannerController(
      detectionSpeed: DetectionSpeed.noDuplicates,
      facing: CameraFacing.back,
      torchEnabled: false,
    );
    _preWarmLocation();
  }

  Future<void> _preWarmLocation() async {
    try {
      final enabled = await Geolocator.isLocationServiceEnabled();
      if (!enabled) return;
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.whileInUse ||
          perm == LocationPermission.always) {
        final pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.medium,
            timeLimit: Duration(seconds: 4),
          ),
        ).catchError((_) async {
          return (await Geolocator.getLastKnownPosition())!;
        });
        if (mounted) {
          setState(() {
            _currentPosition = pos;
          });
        }
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _scannerController.dispose();
    _questionAnswerController.dispose();
    _checkInReasonController.dispose();
    _manualCodeController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_isProcessingScan || _status != ScannerStatus.scanning) return;
    final barcodes = capture.barcodes;
    for (final barcode in barcodes) {
      final raw = barcode.rawValue;
      if (raw != null && raw.trim().isNotEmpty) {
        _isProcessingScan = true;
        _handleCodeScanned(raw.trim());
        break;
      }
    }
  }

  Future<void> _handleCodeScanned(String rawText) async {
    final code = ApiService.extractMeetingCode(rawText);
    if (code.isEmpty) {
      _isProcessingScan = false;
      return;
    }

    setState(() {
      _status = ScannerStatus.processing;
      _statusMessage = 'Acquiring GPS location & verifying session...';
      _errorMessage = null;
      _pendingMeetingCode = code;
    });

    // Acquire GPS position for venue geofencing validation
    Position? position = _currentPosition;
    try {
      final bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _status = ScannerStatus.error;
          _errorMessage =
              'GPS is turned off. Location is required for this venue. Please enable Location Services on your device.';
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        setState(() {
          _status = ScannerStatus.error;
          _errorMessage =
              'GPS location permission was denied. Please enable location permissions in your device settings to check in.';
        });
        return;
      }

      position ??= await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 8),
        ),
      ).catchError((_) async {
        return (await Geolocator.getLastKnownPosition())!;
      });
    } catch (_) {
      try {
        position ??= await Geolocator.getLastKnownPosition();
      } catch (_) {}
    }

    _currentPosition = position;

    try {
      final preValRes = await ApiService().preValidateAttendance(
        meetingCode: code,
        studentRegNo: widget.studentRegNo,
        userLat: _currentPosition?.latitude,
        userLong: _currentPosition?.longitude,
        accuracy: _currentPosition?.accuracy,
      );

      final meeting = preValRes['meeting'] as Map<String, dynamic>?;
      final bool hasQuestion = preValRes['hasQuestion'] == true;
      final questionText = meeting?['questionOfDay']?.toString() ?? '';

      setState(() {
        _pendingMeeting = meeting;
      });

      if (hasQuestion && questionText.trim().isNotEmpty) {
        // Fetch full question metadata (category, options, skills feedback)
        Map<String, dynamic>? enrichedQuestion;
        try {
          enrichedQuestion = await ApiService().fetchActiveQuestion(meetingCode: code);
        } catch (_) {}

        setState(() {
          _activeQuestion = enrichedQuestion;
          _status = ScannerStatus.question;
          _questionError = null;
          _selectedOption = null;
          _requestCheckIn = false;
          _questionAnswerController.clear();
          _checkInReasonController.clear();
        });
      } else {
        await _submitCheckIn('');
      }
    } catch (e) {
      final msg = ApiService.extractErrorMessage(e);
      setState(() {
        _status = ScannerStatus.error;
        _errorMessage = msg.isNotEmpty ? msg : 'Check-in pre-validation failed. Please verify meeting status and try again.';
      });
    }
  }

  Future<void> _submitCheckIn(String answer) async {
    final code = _pendingMeetingCode;
    if (code == null || code.isEmpty) return;

    setState(() {
      _status = ScannerStatus.submitting;
      _statusMessage = 'Recording attendance & awarding points...';
      _errorMessage = null;
    });

    try {
      final token = await ApiService().issueToken(code);
      final res = await ApiService().submitAttendance(
        meetingCode: code,
        studentRegNo: widget.studentRegNo,
        studentName: widget.memberName,
        dailyQuestionAnswer: answer,
        token: token,
        userLat: _currentPosition?.latitude,
        userLong: _currentPosition?.longitude,
        accuracy: _currentPosition?.accuracy,
      );

      // Decoupled Question Response submission
      Map<String, dynamic>? questionRes;
      if (_activeQuestion != null && _activeQuestion!['_id'] != null) {
        try {
          questionRes = await ApiService().submitQuestionResponse(
            questionId: _activeQuestion!['_id'].toString(),
            memberId: widget.studentRegNo,
            memberName: widget.memberName,
            meetingId: _pendingMeeting?['_id']?.toString(),
            attendanceId: res['attendanceId']?.toString(),
            response: answer,
            requestCheckIn: _requestCheckIn,
            checkInReason: _checkInReasonController.text.trim(),
          );
        } catch (_) {}
      }

      widget.onCheckInSuccess();

      setState(() {
        _status = ScannerStatus.success;
        _skillsFeedback = questionRes;
        _checkInResult = {
          'meetingName': res['meetingName'] ?? _pendingMeeting?['name'] ?? code.toUpperCase(),
          'pointsAwarded': res['pointsAwarded'] ?? 10,
          'message': res['message'] ?? 'Attendance recorded successfully!',
        };
      });
    } catch (e) {
      final msg = ApiService.extractErrorMessage(e);
      setState(() {
        _status = ScannerStatus.error;
        _errorMessage = msg.isNotEmpty ? msg : 'Submission failed. Please try again.';
      });
    }
  }

  void _resetScanner() {
    setState(() {
      _isProcessingScan = false;
      _status = ScannerStatus.scanning;
      _statusMessage = 'Point camera at the venue QR code';
      _errorMessage = null;
      _pendingMeetingCode = null;
      _pendingMeeting = null;
      _checkInResult = null;
    });
  }

  void _showManualCodeDialog() {
    _manualCodeController.clear();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          'Enter Meeting Code',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 17),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Enter the session code (e.g. athi-river, semester) or paste the QR URL:',
              style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _manualCodeController,
              autofocus: true,
              textCapitalization: TextCapitalization.none,
              decoration: InputDecoration(
                hintText: 'e.g. athi-river',
                hintStyle: GoogleFonts.inter(color: AppColors.textSecondary),
                filled: true,
                fillColor: AppColors.surfaceSoft,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () {
              final code = _manualCodeController.text.trim();
              if (code.isNotEmpty) {
                Navigator.pop(ctx);
                _handleCodeScanned(code);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Check In', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Drag handle
          const SizedBox(height: 12),
          Container(
            width: 44,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 12),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.qr_code_scanner_rounded,
                    color: AppColors.primary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _status == ScannerStatus.question ? 'Meeting Check-In' : 'Venue Scanner',
                        style: GoogleFonts.inter(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textDark,
                        ),
                      ),
                      Text(
                        'Live Attendance System',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                if (_status == ScannerStatus.scanning) ...[
                  IconButton(
                    onPressed: () async {
                      await _scannerController.toggleTorch();
                      setState(() {
                        _isTorchOn = !_isTorchOn;
                      });
                    },
                    icon: Icon(
                      _isTorchOn ? Icons.flash_on_rounded : Icons.flash_off_rounded,
                      color: _isTorchOn ? Colors.amber : AppColors.textSecondary,
                    ),
                    tooltip: 'Toggle Flashlight',
                  ),
                  IconButton(
                    onPressed: () => _scannerController.switchCamera(),
                    icon: const Icon(Icons.flip_camera_ios_rounded, color: AppColors.textSecondary),
                    tooltip: 'Switch Camera',
                  ),
                ],
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close_rounded, color: AppColors.textSecondary),
                  tooltip: 'Close',
                ),
              ],
            ),
          ),
          const Divider(height: 16),

          // Body Content Based on State
          Expanded(
            child: _buildBody(),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    return Stack(
      children: [
        // Camera View permanently mounted so Android CameraX texture never drops
        _buildScannerView(),

        // Overlays when processing, answering, or showing results/errors
        if (_status != ScannerStatus.scanning)
          Positioned.fill(
            child: Container(
              color: Colors.white,
              child: _buildOverlayContent(),
            ),
          ),
      ],
    );
  }

  Widget _buildOverlayContent() {
    switch (_status) {
      case ScannerStatus.processing:
      case ScannerStatus.submitting:
        return _buildLoadingView();
      case ScannerStatus.question:
        return _buildQuestionView();
      case ScannerStatus.success:
        return _buildSuccessView();
      case ScannerStatus.error:
        return _buildErrorView();
      case ScannerStatus.scanning:
        return const SizedBox.shrink();
    }
  }

  Widget _buildScannerView() {
    return Column(
      children: [
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  MobileScanner(
                    controller: _scannerController,
                    onDetect: _onDetect,
                    errorBuilder: (context, error) {
                      return Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.videocam_off_rounded,
                                size: 48,
                                color: AppColors.error,
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'Camera Unavailable',
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  color: AppColors.textDark,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Camera permission is required to scan QR codes. Please allow camera permissions in Settings.',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: () => Geolocator.openAppSettings(),
                                child: const Text('Open Settings'),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                  // Reticle overlay
                  Center(
                    child: Container(
                      width: 240,
                      height: 240,
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.primary, width: 2.5),
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                  ),
                  // Instruction banner
                  Positioned(
                    bottom: 16,
                    left: 20,
                    right: 20,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.65),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _statusMessage,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _showManualCodeDialog,
                  icon: const Icon(Icons.keyboard_rounded, size: 18),
                  label: Text(
                    'Enter Code Manually',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLoadingView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(
              strokeWidth: 3,
              color: AppColors.primary,
            ),
            const SizedBox(height: 24),
            Text(
              _statusMessage,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.textDark,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuestionView() {
    final meetingName = _pendingMeeting?['name']?.toString() ?? 'Fellowship Meeting';
    final questionText = _activeQuestion?['text']?.toString() ??
        _pendingMeeting?['questionOfDay']?.toString() ??
        '';
    final category = (_activeQuestion?['category'] ?? 'BANTER').toString().toUpperCase();
    final options = _activeQuestion?['options'] is List ? (_activeQuestion!['options'] as List) : [];
    final skill = _activeQuestion?['skill']?.toString();
    final difficulty = _activeQuestion?['difficulty']?.toString();

    // Category styling metadata
    Color catColor;
    Color catBg;
    IconData catIcon;
    String catLabel;

    switch (category) {
      case 'SKILLS':
        catColor = const Color(0xFF059669);
        catBg = const Color(0xFFECFDF5);
        catIcon = Icons.military_tech_rounded;
        catLabel = 'Field & Safety Skills';
        break;
      case 'LIFE':
        catColor = const Color(0xFF7C3AED);
        catBg = const Color(0xFFF5F3FF);
        catIcon = Icons.favorite_rounded;
        catLabel = 'Life & Personal Check-In';
        break;
      case 'BANTER':
      default:
        catColor = const Color(0xFFD97706);
        catBg = const Color(0xFFFFFBEB);
        catIcon = Icons.sentiment_satisfied_alt_rounded;
        catLabel = 'Banter & Community';
        break;
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.event_available_rounded, size: 14, color: AppColors.primary),
                    const SizedBox(width: 5),
                    Text(
                      meetingName,
                      style: GoogleFonts.inter(
                        fontSize: 11.5,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: catBg,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: catColor.withValues(alpha: 0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(catIcon, size: 14, color: catColor),
                    const SizedBox(width: 5),
                    Text(
                      catLabel,
                      style: GoogleFonts.inter(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: catColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.auto_awesome_rounded, color: AppColors.purple, size: 20),
              const SizedBox(width: 8),
              Text(
                'Question of the Day',
                style: GoogleFonts.inter(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textDark,
                ),
              ),
            ],
          ),
          if (skill != null && skill.isNotEmpty) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                Text(
                  'Skill: $skill',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
                if (difficulty != null && difficulty.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceSoft,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      difficulty.toUpperCase(),
                      style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textDark),
                    ),
                  ),
                ],
              ],
            ),
          ],
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: catBg.withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: catColor.withValues(alpha: 0.25)),
            ),
            child: Text(
              questionText,
              style: GoogleFonts.inter(
                fontSize: 14.5,
                fontWeight: FontWeight.w600,
                color: AppColors.textDark,
                height: 1.45,
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Your Response',
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 8),

          // Render options tiles if available, else text input
          if (options.isNotEmpty)
            ...options.map((opt) {
              final optText = opt.toString();
              final isSelected = _selectedOption == optText;
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedOption = optText;
                    _questionError = null;
                  });
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary.withValues(alpha: 0.08) : AppColors.surfaceSoft,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected ? AppColors.primary : AppColors.border,
                      width: isSelected ? 1.5 : 1.0,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        isSelected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                        color: isSelected ? AppColors.primary : AppColors.textSecondary,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          optText,
                          style: GoogleFonts.inter(
                            fontSize: 13.5,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                            color: isSelected ? AppColors.primary : AppColors.textDark,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            })
          else
            TextField(
              controller: _questionAnswerController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Type your reflection or response...',
                hintStyle: GoogleFonts.inter(color: AppColors.textSecondary, fontSize: 13),
                filled: true,
                fillColor: AppColors.surfaceSoft,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                ),
              ),
            ),

          // Pastoral Care request checkbox for LIFE questions
          if (category == 'LIFE') ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFFBF8FF),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE9D5FF)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Checkbox(
                        value: _requestCheckIn,
                        activeColor: const Color(0xFF7C3AED),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                        onChanged: (val) {
                          setState(() {
                            _requestCheckIn = val ?? false;
                          });
                        },
                      ),
                      Expanded(
                        child: Text(
                          'Request someone from Doulos to check in with me',
                          style: GoogleFonts.inter(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF581C87),
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (_requestCheckIn) ...[
                    const SizedBox(height: 6),
                    TextField(
                      controller: _checkInReasonController,
                      decoration: InputDecoration(
                        hintText: 'Optional: Brief note or how we can pray for you...',
                        hintStyle: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary),
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: Color(0xFFDDD6FE)),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],

          if (_questionError != null) ...[
            const SizedBox(height: 8),
            Text(
              _questionError!,
              style: GoogleFonts.inter(fontSize: 12, color: AppColors.error, fontWeight: FontWeight.w500),
            ),
          ],
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: () {
                final ans = options.isNotEmpty
                    ? (_selectedOption ?? '')
                    : _questionAnswerController.text.trim();
                if (ans.isEmpty) {
                  setState(() {
                    _questionError = options.isNotEmpty
                        ? 'Please select an option before submitting.'
                        : 'Please provide an answer before submitting.';
                  });
                  return;
                }
                _submitCheckIn(ans);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: Text(
                'Submit & Complete Check-In',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessView() {
    final meetingName = _checkInResult?['meetingName'] ?? 'Meeting';
    final points = _checkInResult?['pointsAwarded'] ?? 10;
    final isSkills = _skillsFeedback?['category'] == 'SKILLS';
    final isCorrect = _skillsFeedback?['isCorrect'] == true;
    final explanation = _skillsFeedback?['explanation']?.toString();
    final requestedCare = _skillsFeedback?['requestCheckIn'] == true || _requestCheckIn;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 76,
            height: 76,
            decoration: BoxDecoration(
              color: AppColors.successBg,
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.success.withValues(alpha: 0.3), width: 2),
            ),
            child: const Icon(
              Icons.check_circle_rounded,
              color: AppColors.success,
              size: 46,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Check-In Confirmed!',
            style: GoogleFonts.inter(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Your attendance has been recorded in the live registry.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.surfaceSoft,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                Text(
                  meetingName,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textDark,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.stars_rounded, color: Colors.amber, size: 18),
                    const SizedBox(width: 4),
                    Text(
                      '+$points Points Awarded',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.success,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Skills feedback banner
          if (isSkills && _skillsFeedback != null) ...[
            const SizedBox(height: 14),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isCorrect ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isCorrect ? const Color(0xFFA7F3D0) : const Color(0xFFFECACA),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        isCorrect ? Icons.check_circle_rounded : Icons.info_outline_rounded,
                        color: isCorrect ? const Color(0xFF059669) : const Color(0xFFDC2626),
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        isCorrect ? 'Correct Field Response! 🎯' : 'Field Learning Point 📌',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: isCorrect ? const Color(0xFF059669) : const Color(0xFFDC2626),
                        ),
                      ),
                    ],
                  ),
                  if (!isCorrect && _skillsFeedback?['correctAnswer'] != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Expected: ${_skillsFeedback!['correctAnswer']}',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textDark,
                      ),
                    ),
                  ],
                  if (explanation != null && explanation.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      explanation,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                        height: 1.35,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],

          // Pastoral Care request acknowledgment
          if (requestedCare) ...[
            const SizedBox(height: 14),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFAF5FF),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE9D5FF)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.favorite_rounded, color: Color(0xFF7C3AED), size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Pastoral check-in requested 🤍 Our spiritual coordinators will reach out with care and discretion.',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF581C87),
                        height: 1.35,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 24),

          // Continue to Today's Fellowship button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(context);
                widget.onNavigateToFellowship?.call();
              },
              icon: const Icon(Icons.auto_stories_rounded, size: 18, color: Colors.white),
              label: Text(
                'Continue Today\'s Fellowship',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF966C2D),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                'Done',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.errorBg,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.error.withValues(alpha: 0.3), width: 2),
              ),
              child: const Icon(
                Icons.error_outline_rounded,
                color: AppColors.error,
                size: 40,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Check-In Failed',
              style: GoogleFonts.inter(
                fontSize: 19,
                fontWeight: FontWeight.w900,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.errorBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _errorMessage ?? 'Unable to record attendance.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AppColors.error,
                  height: 1.4,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const SizedBox(height: 24),
            if ((_errorMessage?.toLowerCase().contains('location') == true ||
                _errorMessage?.toLowerCase().contains('gps') == true)) ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    await Geolocator.openAppSettings();
                  },
                  icon: const Icon(Icons.settings_rounded, size: 18, color: Colors.white),
                  label: Text(
                    'Open Settings to Allow Location',
                    style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text('Close', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _resetScanner,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text('Try Again', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
