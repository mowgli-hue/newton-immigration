import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../Card';
import type { MultipleChoiceExercise } from '../../types/LessonContentTypes';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = {
  exercise: MultipleChoiceExercise;
  selectedIndex?: number;
  disabled?: boolean;
  showCorrectness?: boolean;
  onSelect: (index: number) => void;
  onOptionPress?: (option: string) => void;
};

export function MultipleChoiceExerciseCard({ exercise, selectedIndex, disabled, showCorrectness, onSelect, onOptionPress }: Props) {
  return (
    <Card>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      {exercise.readingPassage ? <Text style={styles.passage}>{exercise.readingPassage}</Text> : null}
      <View style={styles.optionList}>
        {exercise.options.map((option, index) => {
          const selected = selectedIndex === index;
          const isCorrect = index === exercise.correctOptionIndex;

          return (
            <Pressable
              key={`${exercise.id}-${index}`}
              onPress={() => {
                if (disabled) return;
                onOptionPress?.(option);
                onSelect(index);
              }}
              style={[
                styles.option,
                selected && styles.optionSelected,
                showCorrectness && isCorrect && styles.optionCorrect,
                showCorrectness && selected && !isCorrect && styles.optionWrong
              ]}
            >
              <Text style={styles.optionText}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  prompt: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  passage: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  optionList: {
    gap: spacing.sm
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.white
  },
  optionSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.backgroundLight
  },
  optionCorrect: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4'
  },
  optionWrong: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2'
  },
  optionText: {
    ...typography.body,
    color: colors.textPrimary
  }
});
