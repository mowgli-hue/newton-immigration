import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../Button';
import { Card } from '../Card';
import { InputField } from '../InputField';
import type { ShortAnswerExercise } from '../../types/LessonContentTypes';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = {
  exercise: ShortAnswerExercise;
  value: string;
  disabled?: boolean;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
};

export function ShortAnswerExerciseCard({ exercise, value, disabled, onChangeText, onSubmit }: Props) {
  const examples = exercise.acceptedAnswers.slice(0, 3).join('  •  ');

  return (
    <Card>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      <InputField
        label="Your Answer"
        value={value}
        onChangeText={onChangeText}
        placeholder="Type your answer"
        autoCapitalize="sentences"
        autoCorrect={false}
      />
      {examples ? <Text style={styles.examples}>Accepted examples: {examples}</Text> : null}
      <View style={styles.actions}>
        <Button label="Check Answer" onPress={onSubmit} disabled={disabled || !value.trim()} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  prompt: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  actions: {
    marginTop: spacing.sm
  },
  examples: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs
  }
});
