import { Platform } from 'react-native';

export const colors = {
  gold: '#D4AF37',
  goldLight: '#F0D060',
  goldDark: '#B8960F',
  cream: '#FAF9F6',
  creamDark: '#F5F0E8',
  bg: '#FAF9F6',
  bgCard: '#FFFFFF',
  textPrimary: '#1A1006',
  textSecondary: '#5C4A32',
  textMuted: '#8B7E6A',
  mystic: '#6B46C1',
  saffron: '#E8860C',
  success: '#2D6A4F',
  error: '#9B1C1C',
  online: '#34A853',
  border: '#E8E0D0',
};

export type FontFamily = {
  heading: string;
  body: string;
};

export const fonts: FontFamily = Platform.OS === 'web'
  ? { heading: "'Playfair Display', serif", body: 'Manrope, sans-serif' }
  : { heading: 'PlayfairDisplay_700Bold', body: 'Manrope_400Regular' };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 9999,
};
