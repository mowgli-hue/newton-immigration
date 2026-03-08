import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type InputFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function InputField({ label, error, style, ...props }: InputFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, !!error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg
  },
  label: {
    ...typography.caption,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontWeight: '600'
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    fontSize: 16
  },
  inputError: {
    borderColor: colors.danger
  },
  error: {
    marginTop: spacing.xs,
    ...typography.caption,
    color: colors.danger
  }
});
