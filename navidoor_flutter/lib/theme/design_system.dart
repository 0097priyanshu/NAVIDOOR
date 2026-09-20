import 'package:flutter/material.dart';

enum ThemeModeOption {
  standard,
  highContrastDark,
  highContrastAmber,
}

enum FontScaleOption {
  normal,
  large,
  extraLarge,
}

class AppColors {
  // Electric Cyan Core Palette
  static const Color cyanPrimary = Color(0xFF0284C7);
  static const Color cyanLight = Color(0xFF38BDF8);
  static const Color cyanDark = Color(0xFF0369A1);
  static const Color cyanGlow = Color(0x400284C7);

  // Unmistakable Prominent Slate Gray Backgrounds & Cards
  static const Color lightGrayBg = Color(0xFF64748B);     // Distinct Slate Gray Background
  static const Color lightGrayCard = Color(0xFF94A3B8);   // Prominent Slate Gray Card
  static const Color lightGrayBorder = Color(0xFF475569); // Darker Slate Border
  static const Color pureWhite = Color(0xFFFFFFFF);
  
  // High-Contrast Typography
  static const Color darkText = Color(0xFF0F172A);
  static const Color mutedText = Color(0xFF334155);
  static const Color darkGray = Color(0xFF1E293B);

  // Status & Safety
  static const Color uberSafetyRed = Color(0xFFE11D48);
  static const Color uberSafetyGreen = Color(0xFF0284C7);
  static const Color uberWarningAmber = Color(0xFFF59E0B);

  // Mic Button Accents (Cyan Buttons)
  static const Color micIdleBg = Color(0xFF0284C7);
  static const Color micActiveBg = Color(0xFF38BDF8);
  static const Color micActiveBorder = Color(0xFF0284C7);
  static const Color micActiveGlow = Color(0x7338BDF8);

  // Aliases
  static const Color primaryBlue = Color(0xFF0284C7);
  static const Color softGreen = Color(0xFF38BDF8);
  static const Color safetyCoral = Color(0xFFE11D48);
  static const Color highContrastYellow = Color(0xFFFACC15);
  static const Color mutedGray = Color(0xFF475569);
  static const Color uberBlack = Color(0xFF0F172A);
  static const Color uberWhite = Color(0xFFFFFFFF);
  static const Color uberDarkCard = Color(0xFF94A3B8);
  static const Color uberDarkHeader = Color(0xFF64748B);
}

class ThemeColors {
  final Color bgCard;
  final Color bgHeader;
  final Color textPrimary;
  final Color textSecondary;
  final Color accent;
  final Color border;
  final Color buttonPrimary;
  final Color buttonText;
  final Color activeTab;
  final Color hazardBg;
  final Color hazardText;

  const ThemeColors({
    required this.bgCard,
    required this.bgHeader,
    required this.textPrimary,
    required this.textSecondary,
    required this.accent,
    required this.border,
    required this.buttonPrimary,
    required this.buttonText,
    required this.activeTab,
    required this.hazardBg,
    required this.hazardText,
  });

  static ThemeColors getThemeColors(ThemeModeOption mode) {
    switch (mode) {
      case ThemeModeOption.highContrastDark:
        return const ThemeColors(
          bgCard: Color(0xFF000000),
          bgHeader: Color(0xFF000000),
          textPrimary: Color(0xFFFFFFFF),
          textSecondary: Color(0xFFFACC15),
          accent: Color(0xFF38BDF8),
          border: Colors.transparent,
          buttonPrimary: Color(0xFF0284C7),
          buttonText: Color(0xFFFFFFFF),
          activeTab: Color(0xFF38BDF8),
          hazardBg: Color(0xFFFF0000),
          hazardText: Color(0xFFFFFFFF),
        );
      case ThemeModeOption.highContrastAmber:
        return const ThemeColors(
          bgCard: Color(0xFF181100),
          bgHeader: Color(0xFF0A0700),
          textPrimary: Color(0xFFFFD700),
          textSecondary: Color(0xFFFFA500),
          accent: Color(0xFFFFD700),
          border: Colors.transparent,
          buttonPrimary: Color(0xFFFFD700),
          buttonText: Color(0xFF000000),
          activeTab: Color(0xFFFFD700),
          hazardBg: Color(0xFFFF4500),
          hazardText: Color(0xFFFFFFFF),
        );
      case ThemeModeOption.standard:
        return const ThemeColors(
          bgCard: Color(0xFF64748B),
          bgHeader: Color(0xFF64748B),
          textPrimary: Color(0xFF0F172A),
          textSecondary: Color(0xFF334155),
          accent: Color(0xFF0284C7),
          border: Color(0xFF475569),
          buttonPrimary: Color(0xFF0284C7),
          buttonText: Color(0xFFFFFFFF),
          activeTab: Color(0xFF0284C7),
          hazardBg: Color(0xFFE11D48),
          hazardText: Color(0xFFFFFFFF),
        );
    }
  }
}

class FontSizes {
  final double xs;
  final double sm;
  final double base;
  final double lg;
  final double xl;
  final double xxl;

  const FontSizes({
    required this.xs,
    required this.sm,
    required this.base,
    required this.lg,
    required this.xl,
    required this.xxl,
  });

  static FontSizes getFontSizes(FontScaleOption scale) {
    final multiplier = scale == FontScaleOption.extraLarge
        ? 1.3
        : scale == FontScaleOption.large
            ? 1.15
            : 1.0;
    return FontSizes(
      xs: 13 * multiplier,
      sm: 15 * multiplier,
      base: 17 * multiplier,
      lg: 20 * multiplier,
      xl: 24 * multiplier,
      xxl: 28 * multiplier,
    );
  }
}

class ResponsiveHelper {
  static bool isMobile(BuildContext context) =>
      MediaQuery.of(context).size.width < 768;

  static bool isTablet(BuildContext context) =>
      MediaQuery.of(context).size.width >= 768 &&
      MediaQuery.of(context).size.width < 1024;

  static bool isDesktop(BuildContext context) =>
      MediaQuery.of(context).size.width >= 1024;

  static double screenWidth(BuildContext context) =>
      MediaQuery.of(context).size.width;

  static double screenHeight(BuildContext context) =>
      MediaQuery.of(context).size.height;
}
