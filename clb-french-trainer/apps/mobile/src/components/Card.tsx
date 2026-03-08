import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type CardProps = PropsWithChildren<{
  padded?: boolean;
}>;

export function Card({ children, padded = true }: CardProps) {
  return <View style={[styles.card, padded ? styles.padded : undefined]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2
  },
  padded: {
    padding: spacing.lg
  }
});
