import { FontScale, ThemeMode } from '../types';

// Uber Premium Palette (Monochrome White & Emerald Accent)
export const COLORS = {
  // Primary Uber Palette
  uberBlack: '#000000',
  uberDarkCard: 'rgba(18, 18, 18, 0.95)',
  uberDarkHeader: 'rgba(0, 0, 0, 0.88)',
  
  // Uber Accents
  uberWhite: '#FFFFFF',
  uberAccent: '#FFFFFF',
  uberGlow: 'rgba(255, 255, 255, 0.35)',

  // Status & Safety
  uberSafetyRed: '#E11D48',
  uberSafetyGreen: '#05A357',
  uberWarningAmber: '#F59E0B',

  // Legacy Aliases
  primaryBlue: '#FFFFFF',
  softGreen: '#05A357',
  safetyCoral: '#E11D48',
  highContrastYellow: '#FACC15',

  // High Contrast & Neutrals
  offWhite: '#F3F4F6',
  mutedGray: '#A0A0A0',
  darkGray: '#1F2937',
};

export const getThemeColors = (mode: ThemeMode) => {
  switch (mode) {
    case 'highContrastDark':
      return {
        bgCard: '#000000',
        bgHeader: '#000000',
        textPrimary: '#FFFFFF',
        textSecondary: '#FACC15',
        accent: '#FFFFFF',
        border: 'transparent',
        buttonPrimary: '#FFFFFF',
        buttonText: '#000000',
        activeTab: '#FFFFFF',
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
        bgCard: 'rgba(18, 18, 18, 0.95)',
        bgHeader: 'rgba(0, 0, 0, 0.90)',
        textPrimary: '#FFFFFF',
        textSecondary: '#A0A0A0',
        accent: '#FFFFFF',
        border: 'transparent',
        buttonPrimary: '#FFFFFF',
        buttonText: '#000000',
        activeTab: '#FFFFFF',
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
  fabMicSize: 72,
  borderRadiusCard: 22,
  borderRadiusButton: 16,
  borderRadiusChip: 999,
};
