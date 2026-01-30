import { Platform } from 'react-native';

export type AppColorScheme = 'light' | 'dark';

export type AppColors = {
  backgroundPrimary: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  backgroundGrouped: string;
  surfacePrimary: string;
  surfaceSecondary: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverted: string;
  borderPrimary: string;
  borderSecondary: string;
  accent: string;
  accentHover: string;
  aiAccent: string;
  aiAccentLight: string;
  success: string;
  warning: string;
  error: string;
  tagBg: string;
  tagText: string;
};

export const colorTokens: Record<AppColorScheme, AppColors> = {
  light: {
    backgroundPrimary: '#F2F2F7',
    backgroundSecondary: '#FFFFFF',
    backgroundTertiary: '#F2F2F7',
    backgroundGrouped: '#F2F2F7',
    surfacePrimary: 'rgba(255, 255, 255, 0.7)',
    surfaceSecondary: 'rgba(242, 242, 247, 0.6)',
    surfaceElevated: 'rgba(255, 255, 255, 0.8)',
    textPrimary: '#000000',
    textSecondary: 'rgba(60, 60, 67, 0.6)',
    textTertiary: 'rgba(60, 60, 67, 0.3)',
    textInverted: '#FFFFFF',
    borderPrimary: 'rgba(255, 255, 255, 0.5)',
    borderSecondary: 'rgba(60, 60, 67, 0.12)',
    accent: '#2D2D30',
    accentHover: '#3C3C3F',
    aiAccent: '#5A5A5D',
    aiAccentLight: '#8C8C8F',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    tagBg: 'rgba(142, 142, 147, 0.12)',
    tagText: '#3C3C43',
  },
  dark: {
    backgroundPrimary: '#000000',
    backgroundSecondary: '#1C1C1E',
    backgroundTertiary: '#2C2C2E',
    backgroundGrouped: '#000000',
    surfacePrimary: 'rgba(28, 28, 30, 0.7)',
    surfaceSecondary: 'rgba(44, 44, 46, 0.6)',
    surfaceElevated: 'rgba(54, 54, 56, 0.8)',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(235, 235, 245, 0.6)',
    textTertiary: 'rgba(235, 235, 245, 0.3)',
    textInverted: '#000000',
    borderPrimary: 'rgba(255, 255, 255, 0.2)',
    borderSecondary: 'rgba(255, 255, 255, 0.12)',
    accent: '#DCDCDD',
    accentHover: '#C8C8CA',
    aiAccent: '#A0A0A3',
    aiAccentLight: '#B4B4B7',
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    tagBg: 'rgba(142, 142, 147, 0.24)',
    tagText: '#EBEBF5',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const typography = {
  title: { fontSize: 34, lineHeight: 41, fontWeight: '700' as const, letterSpacing: 0.37 },
  heading: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, letterSpacing: 0.36 },
  subheading: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const, letterSpacing: 0.35 },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600' as const, letterSpacing: 0.38 },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' as const, letterSpacing: -0.41 },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' as const, letterSpacing: -0.32 },
  subheadline: { fontSize: 15, lineHeight: 20, fontWeight: '400' as const, letterSpacing: -0.24 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const, letterSpacing: -0.08 },
};

export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
    },
    android: { elevation: 8 },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
  }),
  glass: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 32,
    },
    android: { elevation: 6 },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 32 },
  }),
};
