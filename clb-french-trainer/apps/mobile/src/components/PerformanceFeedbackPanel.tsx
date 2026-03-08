import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = {
  estimatedClb: number;
  targetClb: 5 | 7;
  gapMessage: string;
  taskCompletionScore: number;
  grammarAccuracyScore: number;
  vocabularyRangeScore: number;
  coherenceScore: number;
  correctedSentence: string;
  improvedVersion: string;
};

function ScoreRow({ label, value }: { label: string; value: number }) {
  const width = useSharedValue(0);

  React.useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(100, value)), { duration: 450 });
  }, [value, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`
  }));

  return (
    <View style={styles.scoreRowWrap}>
      <View style={styles.scoreRow}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <Text style={styles.scoreValue}>{Math.round(value)}</Text>
      </View>
      <View style={styles.scoreTrack}>
        <Animated.View style={[styles.scoreFill, fillStyle]} />
      </View>
    </View>
  );
}

export function PerformanceFeedbackPanel({
  estimatedClb,
  targetClb,
  gapMessage,
  taskCompletionScore,
  grammarAccuracyScore,
  vocabularyRangeScore,
  coherenceScore,
  correctedSentence,
  improvedVersion
}: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(240)} style={styles.panel}>
      <Text style={styles.title}>CLB Performance Feedback</Text>
      <Text style={styles.meta}>Estimated CLB {estimatedClb} • Target CLB {targetClb}</Text>
      <Text style={styles.gap}>{gapMessage}</Text>

      <View style={styles.scoresCard}>
        <ScoreRow label="Task completion" value={taskCompletionScore} />
        <ScoreRow label="Grammar accuracy" value={grammarAccuracyScore} />
        <ScoreRow label="Vocabulary range" value={vocabularyRangeScore} />
        <ScoreRow label="Coherence" value={coherenceScore} />
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Corrected Version</Text>
        <Text style={styles.blockText}>{correctedSentence}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Improved Higher-Level Version</Text>
        <Text style={styles.blockText}>{improvedVersion}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.sm
  },
  title: {
    ...typography.bodyStrong,
    color: colors.primary
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary
  },
  gap: {
    ...typography.body,
    color: colors.textPrimary
  },
  scoresCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: spacing.sm,
    gap: spacing.xs
  },
  scoreRowWrap: {
    gap: 4
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  scoreTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden'
  },
  scoreFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.secondary
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.textSecondary
  },
  scoreValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700'
  },
  block: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    padding: spacing.sm
  },
  blockTitle: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '700',
    marginBottom: spacing.xs
  },
  blockText: {
    ...typography.body,
    color: colors.textPrimary
  }
});
