import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../Button';
import { Card } from '../Card';
import type { MatchingPairExercise } from '../../types/LessonContentTypes';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type PairMap = Record<string, string>;

type Props = {
  exercise: MatchingPairExercise;
  disabled?: boolean;
  onSubmit: (pairs: Array<{ leftId: string; rightId: string }>) => void;
};

export function MatchingPairsExerciseCard({ exercise, disabled, onSubmit }: Props) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [pairMap, setPairMap] = useState<PairMap>({});

  const rightUsage = useMemo(() => new Set(Object.values(pairMap)), [pairMap]);

  const handleRightSelect = (rightId: string) => {
    if (!selectedLeft || disabled) {
      return;
    }
    setPairMap((prev) => ({ ...prev, [selectedLeft]: rightId }));
    setSelectedLeft(null);
  };

  const pairs = Object.entries(pairMap).map(([leftId, rightId]) => ({ leftId, rightId }));

  return (
    <Card>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      {exercise.instructions ? <Text style={styles.instructions}>{exercise.instructions}</Text> : null}

      <View style={styles.columns}>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Left</Text>
          {exercise.leftItems.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => !disabled && setSelectedLeft(item.id)}
              style={[styles.chip, selectedLeft === item.id && styles.chipSelected]}
            >
              <Text style={styles.chipText}>{item.label}</Text>
              {pairMap[item.id] ? <Text style={styles.matchTag}>Matched</Text> : null}
            </Pressable>
          ))}
        </View>

        <View style={styles.column}>
          <Text style={styles.columnTitle}>Right</Text>
          {exercise.rightItems.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleRightSelect(item.id)}
              style={[styles.chip, rightUsage.has(item.id) && styles.chipUsed]}
            >
              <Text style={styles.chipText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Button
        label="Submit Matches"
        variant="outline"
        onPress={() => onSubmit(pairs)}
        disabled={disabled || pairs.length !== exercise.correctPairs.length}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  prompt: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
    color: colors.textPrimary
  },
  instructions: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md
  },
  columns: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md
  },
  column: {
    flex: 1,
    gap: spacing.sm
  },
  columnTitle: {
    ...typography.caption,
    color: colors.secondary
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.sm,
    backgroundColor: colors.white
  },
  chipSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.backgroundLight
  },
  chipUsed: {
    opacity: 0.7
  },
  chipText: {
    ...typography.body,
    color: colors.textPrimary
  },
  matchTag: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.primary
  }
});
