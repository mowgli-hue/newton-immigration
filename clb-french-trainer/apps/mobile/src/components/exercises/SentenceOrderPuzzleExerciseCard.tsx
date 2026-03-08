import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../Button';
import { Card } from '../Card';
import type { SentenceOrderPuzzleExercise } from '../../types/LessonContentTypes';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = {
  exercise: SentenceOrderPuzzleExercise;
  disabled?: boolean;
  onSubmit: (orderedTokens: string[]) => void;
};

export function SentenceOrderPuzzleExerciseCard({ exercise, disabled, onSubmit }: Props) {
  const [orderedTokens, setOrderedTokens] = useState<string[]>([]);
  const [usedIndexes, setUsedIndexes] = useState<number[]>([]);

  const tokenUsage = useMemo(() => new Set(usedIndexes), [usedIndexes]);

  const addToken = (token: string, index: number) => {
    if (disabled || tokenUsage.has(index)) {
      return;
    }
    setOrderedTokens((prev) => [...prev, token]);
    setUsedIndexes((prev) => [...prev, index]);
  };

  const removeLastToken = () => {
    if (disabled || orderedTokens.length === 0) {
      return;
    }
    setOrderedTokens((prev) => prev.slice(0, -1));
    setUsedIndexes((prev) => prev.slice(0, -1));
  };

  const reset = () => {
    if (disabled) {
      return;
    }
    setOrderedTokens([]);
    setUsedIndexes([]);
  };

  return (
    <Card>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      {exercise.instructions ? <Text style={styles.instructions}>{exercise.instructions}</Text> : null}

      <View style={styles.answerArea}>
        <Text style={styles.answerLabel}>Build the sentence</Text>
        <View style={styles.answerBox}>
          {orderedTokens.length ? (
            orderedTokens.map((token, index) => (
              <View key={`${token}-${index}`} style={styles.answerToken}>
                <Text style={styles.answerTokenText}>{token}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.placeholder}>Tap the word tiles below in the correct order.</Text>
          )}
        </View>
      </View>

      <View style={styles.tokenGrid}>
        {exercise.tokens.map((token, index) => (
          <Pressable
            key={`${exercise.id}-${token}-${index}`}
            onPress={() => addToken(token, index)}
            style={[styles.tokenChip, tokenUsage.has(index) && styles.tokenChipUsed]}
            disabled={disabled || tokenUsage.has(index)}
          >
            <Text style={styles.tokenText}>{token}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actionsRow}>
        <Button label="Undo" variant="outline" onPress={removeLastToken} disabled={disabled || orderedTokens.length === 0} />
        <Button label="Reset" variant="text" onPress={reset} disabled={disabled || orderedTokens.length === 0} />
      </View>

      <Button
        label="Check Order"
        onPress={() => onSubmit(orderedTokens)}
        disabled={disabled || orderedTokens.length !== exercise.correctOrder.length}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  prompt: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  instructions: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  answerArea: {
    marginBottom: spacing.md
  },
  answerLabel: {
    ...typography.caption,
    color: colors.secondary,
    marginBottom: spacing.xs
  },
  answerBox: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    padding: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  placeholder: {
    ...typography.caption,
    color: colors.textSecondary
  },
  answerToken: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 10
  },
  answerTokenText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700'
  },
  tokenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  tokenChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  tokenChipUsed: {
    opacity: 0.45
  },
  tokenText: {
    ...typography.body,
    color: colors.textPrimary
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm
  }
});

