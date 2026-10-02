class AppConstants {
  static const String appName = 'Doulos Attendance';
  static const String appVersion = '1.0.0';

  // Base API URLs
  static const String definedApiUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');
  static const String devEmulatorApiUrl = 'http://10.0.2.2:5000/api';
  static const String devDeviceApiUrl = 'http://192.168.0.162:5004/api'; 
  static const String productionApiUrl = 'https://doulos-attendance.vercel.app/api';

  // Default active baseUrl: prioritize dart-define API_BASE_URL if passed
  static String get activeBaseUrl =>
      definedApiUrl.isNotEmpty ? definedApiUrl : devDeviceApiUrl;

  // Preference Keys
  static const String keyHasSeenOnboarding = 'has_seen_onboarding';
  static const String keyAuthToken = 'auth_token';
  static const String keyUserRole = 'user_role';
  static const String keyUsername = 'user_name';
  static const String keyCampus = 'user_campus';
  static const String keyCustomBaseUrl = 'custom_base_url';

  // Student / Recruit Portal Keys
  static const String keyStudentRegNo = 'student_reg_no';
  static const String keyMemberName = 'member_name';
  static const String keyMemberType = 'member_type';
  static const String keyStudentDataJson = 'student_data_json';
}
