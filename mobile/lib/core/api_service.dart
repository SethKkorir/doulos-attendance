import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'constants.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late final Dio dio;
  final FlutterSecureStorage secureStorage = const FlutterSecureStorage();

  ApiService._internal() {
    dio = Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 12),
        receiveTimeout: const Duration(seconds: 12),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Attach Bearer token if present
          try {
            final token = await secureStorage.read(key: AppConstants.keyAuthToken);
            if (token != null && token.isNotEmpty) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          } catch (_) {}
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          // Automatic cross-network retry on Android between Wi-Fi and ADB reverse
          if (Platform.isAndroid &&
              (error.type == DioExceptionType.connectionError ||
               error.type == DioExceptionType.connectionTimeout)) {
            final uri = error.requestOptions.uri.toString();
            String? fallbackUri;

            if (uri.contains('localhost:5001') || uri.contains('127.0.0.1:5001')) {
              fallbackUri = uri.replaceAll('localhost:5001', '192.168.0.162:5001')
                               .replaceAll('127.0.0.1:5001', '192.168.0.162:5001');
            } else if (uri.contains('192.168.0.162:5001')) {
              fallbackUri = uri.replaceAll('192.168.0.162:5001', 'localhost:5001');
            } else if (uri.contains('10.0.2.2:5001')) {
              fallbackUri = uri.replaceAll('10.0.2.2:5001', '192.168.0.162:5001');
            }

            if (fallbackUri != null && error.requestOptions.extra['retried_fallback'] != true) {
              try {
                final options = Options(
                  method: error.requestOptions.method,
                  headers: error.requestOptions.headers,
                  extra: {...error.requestOptions.extra, 'retried_fallback': true},
                );
                final res = await dio.request(
                  fallbackUri,
                  data: error.requestOptions.data,
                  queryParameters: error.requestOptions.queryParameters,
                  options: options,
                );
                return handler.resolve(res);
              } catch (_) {}
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  /// Automatically resolves the correct API base URL
  static Future<String> getBaseUrl() async {
    // 1. Check dart-define first (--dart-define=API_BASE_URL=...)
    const defined = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (defined.isNotEmpty) {
      final clean = defined.endsWith('/') ? defined.substring(0, defined.length - 1) : defined;
      // On real Android physical devices, localhost will fail unless adb reverse is run.
      // Automatically map localhost/127.0.0.1 to LAN IP 192.168.0.162 for physical devices:
      if (Platform.isAndroid && (clean.contains('localhost') || clean.contains('127.0.0.1'))) {
        return clean.replaceAll('localhost', '192.168.0.162').replaceAll('127.0.0.1', '192.168.0.162');
      }
      return clean;
    }

    // 2. Check user-configured override in preferences
    final prefs = await SharedPreferences.getInstance();
    final customUrl = prefs.getString(AppConstants.keyCustomBaseUrl);
    if (customUrl != null && customUrl.trim().isNotEmpty) {
      final trimmed = customUrl.trim();
      final clean = trimmed.endsWith('/') ? trimmed.substring(0, trimmed.length - 1) : trimmed;
      if (Platform.isAndroid && (clean.contains('localhost') || clean.contains('127.0.0.1'))) {
        return clean.replaceAll('localhost', '192.168.0.162').replaceAll('127.0.0.1', '192.168.0.162');
      }
      return clean;
    }

    // 3. Platform-specific automatic IP resolution
    if (kIsWeb) {
      return 'http://localhost:5001/api';
    } else if (Platform.isAndroid) {
      // Default to host machine LAN IP on port 5001
      return 'http://192.168.0.162:5001/api';
    } else if (Platform.isIOS || Platform.isMacOS) {
      return 'http://127.0.0.1:5001/api';
    }

    return 'http://192.168.0.162:5001/api';
  }

  /// Resolve full URL preventing any double slashes or missing /api
  static Future<String> resolveEndpoint(String endpoint) async {
    final base = await getBaseUrl();
    final cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    return '$base$cleanEndpoint';
  }

  /// Resolve media URL (e.g. /logo.png -> http://192.168.0.162:5001/logo.png)
  static Future<String> resolveMediaUrl(String? relativePath) async {
    if (relativePath == null || relativePath.isEmpty) return '';
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    final base = await getBaseUrl();
    // Strip trailing /api to point to server root
    final serverRoot = base.replaceAll(RegExp(r'/api/?$'), '');
    final cleanPath = relativePath.startsWith('/') ? relativePath : '/$relativePath';
    return '$serverRoot$cleanPath';
  }

  /// Safe error message extraction
  static String extractErrorMessage(dynamic error) {
    if (error is DioException) {
      if (error.response?.data != null && error.response?.data is Map) {
        final map = error.response!.data as Map;
        if (map['message'] != null) return map['message'].toString();
      }
      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.connectionError) {
        return 'Cannot connect to backend server. Ensure backend is running on port 5001 and Wi-Fi IP matches.';
      }
      return error.message ?? 'Network connection error';
    }
    return error.toString();
  }

  /// Fetch live system branding & logo from backend
  Future<Map<String, dynamic>> fetchBranding() async {
    try {
      final url = await resolveEndpoint('/system/branding');
      final response = await dio.get(url);
      if (response.statusCode == 200 && response.data is Map) {
        return Map<String, dynamic>.from(response.data);
      }
    } catch (_) {}
    return {
      'appName': 'Doulos Fellowship',
      'organization': 'Doulos',
      'subTitle': 'Member Portal',
      'logoUrl': '/logo.png',
      'semesterTheme': 'True Friendship',
      'semesterVerse': 'John 15:12-15',
      'currentSemester': 'SEP-DEC 2026',
      'campuses': ['Athi River', 'Valley Road']
    };
  }

  /// Fetch live member portal data for a student
  Future<Map<String, dynamic>> fetchStudentData(String regNo, {String? semester}) async {
    final cleanReg = regNo.trim().toUpperCase();
    String endpoint = '/attendance/student/$cleanReg';
    if (semester != null && semester.isNotEmpty) {
      endpoint += '?semester=${Uri.encodeComponent(semester)}';
    }
    final url = await resolveEndpoint(endpoint);
    final response = await dio.get(url);
    if (response.statusCode == 200 && response.data != null) {
      return Map<String, dynamic>.from(response.data);
    }
    throw Exception('Failed to load student data');
  }

  /// Fetch live fellowship meetings (supports optional campus filter)
  Future<List<dynamic>> fetchMeetings({String? campus}) async {
    try {
      String endpoint = '/meetings';
      if (campus != null && campus.isNotEmpty) {
        endpoint += '?campus=${Uri.encodeComponent(campus)}';
      }
      final url = await resolveEndpoint(endpoint);
      final response = await dio.get(url);
      if (response.statusCode == 200 && response.data is List) {
        return response.data as List<dynamic>;
      }
    } catch (_) {}
    return [];
  }

  /// Fetch live camps and trainings (supports optional campus filter)
  Future<List<dynamic>> fetchTrainings({String? campus}) async {
    try {
      String endpoint = '/trainings';
      if (campus != null && campus.isNotEmpty) {
        endpoint += '?campus=${Uri.encodeComponent(campus)}';
      }
      final url = await resolveEndpoint(endpoint);
      final response = await dio.get(url);
      if (response.statusCode == 200 && response.data is List) {
        return response.data as List<dynamic>;
      }
    } catch (_) {}
    return [];
  }

  /// Get or create persistent device ID (matching web logic)
  static Future<String> getPersistentDeviceId() async {
    final prefs = await SharedPreferences.getInstance();
    String? deviceId = prefs.getString('doulos_device_id');
    if (deviceId != null && deviceId.isNotEmpty) {
      return deviceId;
    }
    final rand = Random();
    final part1 = rand.nextInt(1000000000).toRadixString(36);
    final part2 = rand.nextInt(1000000000).toRadixString(36);
    deviceId = 'DL-$part1$part2';
    await prefs.setString('doulos_device_id', deviceId);
    return deviceId;
  }

  /// Parse meeting code from scanned QR string (supports URLs, query params, JSON, or raw codes)
  static String extractMeetingCode(String decodedText) {
    if (decodedText.isEmpty) return '';
    final trimmed = decodedText.trim();

    // 1. JSON payload e.g. {"meetingCode": "athi-river"}
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        final parsed = jsonDecode(trimmed);
        if (parsed is Map) {
          if (parsed['meetingCode'] != null) {
            return parsed['meetingCode'].toString().trim().toLowerCase();
          }
          if (parsed['code'] != null) {
            return parsed['code'].toString().trim().toLowerCase();
          }
        }
      } catch (_) {}
    }

    // 2. Master Semester QR Token e.g. DOULOS-MASTER-SEP-DEC-2026-XXXX
    if (trimmed.toUpperCase().startsWith('DOULOS-MASTER-')) {
      return 'semester';
    }

    // 3. Standard Doulos Check-in URL e.g. /check-in/athi-river, /check-in/semester
    final urlRegex = RegExp(r'(?:check-in|meetings|attendance)/([a-zA-Z0-9_-]+)', caseSensitive: false);
    final match = urlRegex.firstMatch(trimmed);
    if (match != null && match.group(1) != null) {
      return match.group(1)!.toLowerCase();
    }

    // 4. Portal URL fallback
    if (trimmed.toLowerCase().contains('/portal')) {
      return 'semester';
    }

    // 5. Any HTTP URL where code is query param or last segment
    try {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        final uri = Uri.parse(trimmed);
        final codeParam = uri.queryParameters['code'] ?? uri.queryParameters['meetingCode'];
        if (codeParam != null && codeParam.trim().isNotEmpty) {
          return codeParam.trim().toLowerCase();
        }
        final segments = uri.pathSegments.where((s) => s.isNotEmpty).toList();
        if (segments.isNotEmpty) {
          final last = segments.last;
          if (last.length >= 2) return last.toLowerCase();
        }
      }
    } catch (_) {}

    // 6. Raw alphanumeric meeting code (e.g. "athi-river", "valley-road", "semester")
    return trimmed.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '').toLowerCase();
  }

  /// Pre-validate attendance before showing question or submitting
  Future<Map<String, dynamic>> preValidateAttendance({
    required String meetingCode,
    required String studentRegNo,
    String? deviceId,
    double? userLat,
    double? userLong,
    double? accuracy,
  }) async {
    final cleanReg = studentRegNo.trim().toUpperCase();
    final cleanCode = meetingCode.trim();
    final devId = deviceId ?? await getPersistentDeviceId();

    final url = await resolveEndpoint('/attendance/pre-validate');
    final response = await dio.post(
      url,
      data: {
        'meetingCode': cleanCode,
        'studentRegNo': cleanReg,
        'deviceId': devId,
        'userLat': userLat,
        'userLong': userLong,
        'accuracy': accuracy,
      },
    );

    if ((response.statusCode == 200 || response.statusCode == 201) && response.data is Map) {
      return Map<String, dynamic>.from(response.data);
    }
    throw Exception('Failed to pre-validate attendance');
  }

  /// Issue single-use check-in token
  Future<String> issueToken(String meetingCode) async {
    try {
      final url = await resolveEndpoint('/tokens/issue');
      final response = await dio.post(url, data: {'meetingCode': meetingCode.trim()});
      if ((response.statusCode == 200 || response.statusCode == 201) && response.data is Map) {
        return response.data['token']?.toString() ?? '';
      }
    } on DioException {
      rethrow;
    } catch (_) {}
    return '';
  }

  /// Submit final attendance
  Future<Map<String, dynamic>> submitAttendance({
    required String meetingCode,
    required String studentRegNo,
    required String studentName,
    String? dailyQuestionAnswer,
    String? token,
    String? deviceId,
    double? userLat,
    double? userLong,
    double? accuracy,
  }) async {
    final cleanReg = studentRegNo.trim().toUpperCase();
    final cleanCode = meetingCode.trim();
    final devId = deviceId ?? await getPersistentDeviceId();

    String authToken = token ?? '';
    if (authToken.isEmpty) {
      authToken = await issueToken(cleanCode);
    }

    final url = await resolveEndpoint('/attendance/submit');
    final response = await dio.post(
      url,
      data: {
        'meetingCode': cleanCode,
        'token': authToken,
        'deviceId': devId,
        'userLat': userLat,
        'userLong': userLong,
        'accuracy': accuracy,
        'studentRegNo': cleanReg,
        'questionOfDay': dailyQuestionAnswer?.trim() ?? '',
        'dailyQuestionAnswer': dailyQuestionAnswer?.trim() ?? '',
        'responses': {
          'studentRegNo': cleanReg,
          'studentName': studentName,
          'dailyQuestionAnswer': dailyQuestionAnswer?.trim() ?? '',
          'questionOfDay': dailyQuestionAnswer?.trim() ?? '',
          'answer': dailyQuestionAnswer?.trim() ?? '',
        },
      },
    );

    if ((response.statusCode == 200 || response.statusCode == 201) && response.data is Map) {
      return Map<String, dynamic>.from(response.data);
    }
    throw Exception('Failed to submit attendance');
  }

  // Safe parsing helper utilities
  static String safeString(dynamic val, [String fallback = '']) =>
      val != null ? val.toString() : fallback;

  static int safeInt(dynamic val, [int fallback = 0]) {
    if (val is int) return val;
    if (val is num) return val.toInt();
    if (val is String) return int.tryParse(val) ?? fallback;
    return fallback;
  }

  static double safeDouble(dynamic val, [double fallback = 0.0]) {
    if (val is double) return val;
    if (val is num) return val.toDouble();
    if (val is String) return double.tryParse(val) ?? fallback;
    return fallback;
  }

  static List<dynamic> safeList(dynamic val) => val is List ? val : [];

  static Map<String, dynamic> safeMap(dynamic val) =>
      val is Map ? Map<String, dynamic>.from(val) : {};
}
