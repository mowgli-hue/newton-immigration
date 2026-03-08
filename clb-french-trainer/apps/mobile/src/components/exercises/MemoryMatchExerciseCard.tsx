import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../Button';
import { Card } from '../Card';
import type { MemoryMatchExercise } from '../../types/LessonContentTypes';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type MemoryCard = {
  uid: string;
  pairId: string;
  label: string;
};

type Props = {
  exercise: MemoryMatchExercise;
  disabled?: boolean;
  onSubmit: (pairs: Array<{ leftId: string; rightId: string }>) => void;
};

function buildCards(exercise: MemoryMatchExercise): MemoryCard[] {
  return exercise.pairs.flatMap((pair) => [
    { uid: `${pair.id}-l`, pairId: pair.id, label: pair.left },
    { uid: `${pair.id}-r`, pairId: pair.id, label: pair.right }
  ]);
}

export function MemoryMatchExerciseCard({ exercise, disabled, onSubmit }: Props) {
  const cards = useMemo(() => buildCards(exercise), [exercise]);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [completedPairs, setCompletedPairs] = useState<Array<{ leftId: string; rightId: string }>>([]);
  const [attemptMessage, setAttemptMessage] = useState<string>('');

  const isMatched = (card: MemoryCard) => matchedPairIds.includes(card.pairId);
  const isRevealed = (card: MemoryCard) => isMatched(card) || revealedIds.includes(card.uid);

  const handleCardPress = (card: MemoryCard) => {
    if (disabled || isMatched(card) || revealedIds.includes(card.uid)) {
      return;
    }

    const nextRevealed = [...revealedIds, card.uid];
    setRevealedIds(nextRevealed);

    if (nextRevealed.length < 2) {
      return;
    }

    const selectedCards = nextRevealed
      .map((id) => cards.find((c) => c.uid === id))
      .filter(Boolean) as MemoryCard[];

    const [first, second] = selectedCards;
    if (!first || !second) {
      setRevealedIds([]);
      return;
    }

    if (first.pairId === second.pairId && first.uid !== second.uid) {
      setMatchedPairIds((prev) => [...prev, first.pairId]);
      setCompletedPairs((prev) => [...prev, { leftId: first.pairId, rightId: second.pairId }]);
      setAttemptMessage('Match found.');
      setTimeout(() => setRevealedIds([]), 300);
      return;
    }

    setAttemptMessage('Not a match. Try again.');
    setTimeout(() => setRevealedIds([]), 700);
  };

  return (
    <Card>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      {exercise.instructions ? <Text style={styles.instructions}>{exercise.instructions}</Text> : null}

      <View style={styles.grid}>
        {cards.map((card) => (
          <Pressable
            key={card.uid}
            disabled={disabled}
            onPress={() => handleCardPress(card)}
            style={[styles.cardTile, isRevealed(card) && styles.cardTileRevealed, isMatched(card) && styles.cardTileMatched]}
          >
            <Text style={[styles.cardTileText, !isRevealed(card) && styles.cardTileTextHidden]}>
              {isRevealed(card) ? card.label : '?'}
            </Text>
          </Pressable>
        ))}
      </View>

      {attemptMessage ? <Text style={styles.feedback}>{attemptMessage}</Text> : null}
      <Text style={styles.progressText}>Matches: {matchedPairIds.length} / {exercise.pairs.length}</Text>

      <Button
        label="Submit Matches"
        variant="outline"
        onPress={() => onSubmit(completedPairs)}
        disabled={disabled || matchedPairIds.length !== exercise.pairs.length}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  cardTile: {
    width: '47%',
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm
  },
  cardTileRevealed: {
    borderColor: colors.secondary,
    backgroundColor: colors.backgroundLight
  },
  cardTileMatched: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4'
  },
  cardTileText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center'
  },
  cardTileTextHidden: {
    color: colors.textSecondary
  },
  feedback: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.xs
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm
  }
});

