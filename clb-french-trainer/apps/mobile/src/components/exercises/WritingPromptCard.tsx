import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../Button';
import { Card } from '../Card';
import { InputField } from '../InputField';
import type { WritingPromptExercise } from '../../types/LessonContentTypes';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = {
  exercise: WritingPromptExercise;
  value: string;
  disabled?: boolean;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
};

export function WritingPromptCard({ exercise, value, disabled, onChangeText, onSubmit }: Props) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <Card>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      <Text style={styles.meta}>Target: at least {exercise.minWords} words.</Text>
      <InputField
        label="Write your response"
        value={value}
        onChangeText={onChangeText}
        placeholder="Write in French..."
        autoCapitalize="sentences"
        autoCorrect={false}
        multiline
        style={styles.multiline}
      />
      <Text style={styles.counter}>Word count: {wordCount}</Text>
      <View style={styles.row}>
        <Button label="Check Writing" onPress={onSubmit} disabled={disabled || !value.trim()} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  prompt: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md
  },
  multiline: {
    minHeight: 140
  },
  counter: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  row: {
    marginTop: spacing.sm
  }
});
