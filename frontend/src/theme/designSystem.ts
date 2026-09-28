import { FontScale, ThemeMode } from '../types';

// Prominent Slate Light Gray + Electric Cyan Palette
export const COLORS = {
  // Electric Cyan Core Palette
  cyanPrimary: '#0284C7',
  cyanLight: '#38BDF8',
  cyanDark: '#0369A1',
  cyanGlow: 'rgba(2, 132, 199, 0.25)',

  // Unmistakable Prominent Slate Gray Backgrounds & Cards
  lightGrayBg: '#64748B',      // Distinct Slate Gray Background
  lightGrayCard: '#94A3B8',    // Prominent Slate Gray Card
  lightGrayBorder: '#475569',  // Darker Slate Border
  pureWhite: '#FFFFFF',
  
  // High-Contrast Typography
  darkText: '#0F172A',
  mutedText: '#334155',
  darkGray: '#1E293B',

  // Status & Safety
  uberSafetyRed: '#E11D48',
  uberSafetyGreen: '#0284C7',
  uberWarningAmber: '#F59E0B',

  // Mic Button Accents (Cyan Buttons)
  micIdleBg: '#0284C7',
  micActiveBg: '#38BDF8',
  micActiveBorder: '#0284C7',
  micActiveGlow: 'rgba(56, 189, 248, 0.45)',

  // Legacy Aliases
  primaryBlue: '#0284C7',
  softGreen: '#38BDF8',
  safetyCoral: '#E11D48',
  highContrastYellow: '#FACC15',
  mutedGray: '#475569',
  uberBlack: '#0F172A',
  uberWhite: '#FFFFFF',
  uberDarkCard: '#94A3B8',
  uberDarkHeader: '#64748B',
};

export const getThemeColors = (mode: ThemeMode) => {
  switch (mode) {
    case 'highContrastDark':
      return {
        bgCard: '#000000',
        bgHeader: '#000000',
        textPrimary: '#FFFFFF',
        textSecondary: '#FACC15',
        accent: '#38BDF8',
        border: 'transparent',
        buttonPrimary: '#0284C7',
        buttonText: '#FFFFFF',
        activeTab: '#38BDF8',
        hazardBg: '#FF0000',
        hazardText: '#FFFFFF',
      };
    case 'highContrastAmber':
      return {
        bgCard: '#181100',
        bgHeader: '#0A0700',
        textPrimary: '#FFD700',
        textSecondary: '#FFA500',
        accent: '#FFD700',
        border: 'transparent',
        buttonPrimary: '#FFD700',
        buttonText: '#000000',
        activeTab: '#FFD700',
        hazardBg: '#FF4500',
        hazardText: '#FFFFFF',
      };
    case 'standard':
    default:
      return {
        bgCard: '#64748B',
        bgHeader: '#64748B',
        textPrimary: '#0F172A',
        textSecondary: '#334155',
        accent: '#0284C7',
        border: '#475569',
        buttonPrimary: '#0284C7',
        buttonText: '#FFFFFF',
        activeTab: '#0284C7',
        hazardBg: '#E11D48',
        hazardText: '#FFFFFF',
      };
  }
};

export const getFontSizes = (scale: FontScale) => {
  const multiplier = scale === 'extraLarge' ? 1.3 : scale === 'large' ? 1.15 : 1.0;
  return {
    xs: Math.round(13 * multiplier),
    sm: Math.round(15 * multiplier),
    base: Math.round(17 * multiplier),
    lg: Math.round(20 * multiplier),
    xl: Math.round(24 * multiplier),
    xxl: Math.round(30 * multiplier),
    hero: Math.round(38 * multiplier),
  };
};

export const ACCESSIBILITY = {
  minTouchTargetSize: 52,
  largeTouchTargetSize: 64,
  fabMicSize: 68,
  borderRadiusCard: 22,
  borderRadiusButton: 16,
  borderRadiusChip: 999,
};
