export const colors = {
  cream: '#F5F0E8',
  creamDark: '#EDE6D6',
  terracotta: '#C4614A',
  terracottaLight: '#E8917A',
  aubergine: '#4A2D3E',
  aubergineMid: '#7A4D68',
  warmGray: '#5C4A42',
  warmGrayLight: '#8C7B74',
  textDark: '#2C1F1A',
  textMid: '#3D2E28',
  white: '#FFFFFF',
  shadow: 'rgba(74, 45, 62, 0.08)',
} as const;

export const fonts = {
  display: 'Fraunces_300Light',
  displayItalic: 'Fraunces_300Light_Italic',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
} as const;

export const fontSize = {
  xs: 13,
  sm: 14,
  base: 16,
  md: 17,
  lg: 19,
  xl: 22,
  xxl: 28,
  display: 34,
  hero: 44,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const theme = { colors, fonts, fontSize, spacing, radius };
