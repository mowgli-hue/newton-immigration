import { TextStyle } from 'react-native';

import { colors } from './colors';

export const typography: Record<string, TextStyle> = {
  heading1: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '700',
    color: colors.textPrimary
  },
  heading2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: colors.textPrimary
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: colors.textPrimary
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    color: colors.textSecondary
  },
  bodyStrong: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.textPrimary
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: colors.textSecondary
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600'
  }
};
