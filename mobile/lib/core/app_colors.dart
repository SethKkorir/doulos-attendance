import 'package:flutter/material.dart';

class AppColors {
  // Brand Primary & Accent
  static const Color primary = Color(0xFF1D4ED8); // Blue 700 (Doulos Brand)
  static const Color primaryLight = Color(0xFF3B82F6); // Blue 500
  static const Color primarySoft = Color(0xFFEFF6FF); // Blue 50
  static const Color accent = Color(0xFF0284C7); // Sky 600

  // Backgrounds & Surface (Matching Screenshot)
  static const Color background = Color(0xFFF1F5F9); // Light Slate background
  static const Color surface = Colors.white; // Crisp white cards
  static const Color surfaceSoft = Color(0xFFF8FAFC); // Inner box grey/blue
  static const Color surfaceLight = Color(0xFFE2E8F0); // Subtle surface light
  static const Color border = Color(0xFFE2E8F0); // Subtle card borders
  static const Color divider = Color(0xFFF1F5F9);

  // Text Colors
  static const Color textDark = Color(0xFF0F172A); // Main titles/numbers
  static const Color textPrimary = Color(0xFF0F172A); // Alias for primary dark text
  static const Color textSecondary = Color(0xFF475569); // Labels & descriptions
  static const Color textMuted = Color(0xFF94A3B8); // Muted subtitles/dates

  // Status & Badges
  static const Color success = Color(0xFF16A34A);
  static const Color successBg = Color(0xFFDCFCE7);
  static const Color error = Color(0xFFDC2626);
  static const Color errorBg = Color(0xFFFEE2E2);
  static const Color warning = Color(0xFFB45309);
  static const Color warningBg = Color(0xFFFEF3C7);
  static const Color purple = Color(0xFF7E22CE);
  static const Color purpleBg = Color(0xFFFAF5FF);
}
