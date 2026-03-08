import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AnimatedButton } from '../components/AnimatedButton';
import { Card } from '../components/Card';
import { errorHunterPrompts } from '../data/practiceLabDrills';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'ErrorHunterScreen'>;
type DrillMode = 'all' | 'wrongOnly';
type ResultMap = Record<string, { correct: boolean; selectedIndex: number }>;

export function ErrorHunterScreen({ navigation }: Props) {
  const [drillMode, setDrillMode] = useState<DrillMode>('all');
  const [queue, setQueue] = useState(errorHunterPrompts.map((p) => p.id));
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [resultsById, setResultsById] = useState<ResultMap>({});

  const promptsById = useMemo(() => {
    const map: Record<string, (typeof errorHunterPrompts)[number]> = {};
    errorHunterPrompts.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, []);

  const currentPromptId = queue[index];
  const current = currentPromptId ? promptsById[currentPromptId] : undefined;
  const finished = index >= queue.length || !current;
  const accuracy = useMemo(() => {
    if (!queue.length) return 0;
    return Math.round((correctCount / queue.length) * 100);
  }, [correctCount, queue.length]);

  const wrongIds = useMemo(
    () => Object.entries(resultsById).filter(([, result]) => !result.correct).map(([id]) => id),
    [resultsById]
  );

  const handleCheck = () => {
    if (selectedIndex === null || submitted || !current) {
      return;
    }
    const isCorrect = selectedIndex === current.correctIndex;
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }
    setResultsById((prev) => ({
      ...prev,
      [current.id]: { correct: isCorrect, selectedIndex }
    }));
    setSubmitted(true);
  };

  const handleNext = () => {
    setSelectedIndex(null);
    setSubmitted(false);
    setIndex((prev) => prev + 1);
  };

  const restart = () => {
    setDrillMode('all');
    setQueue(errorHunterPrompts.map((p) => p.id));
    setIndex(0);
    setSelectedIndex(null);
    setSubmitted(false);
    setCorrectCount(0);
    setResultsById({});
  };

  const retryCurrent = () => {
    if (!current) return;
    const wasCorrect = resultsById[current.id]?.correct === true;
    if (wasCorrect) {
      setCorrectCount((prev) => Math.max(0, prev - 1));
    }
    setResultsById((prev) => {
      const next = { ...prev };
      delete next[current.id];
      return next;
    });
    setSelectedIndex(null);
    setSubmitted(false);
  };

  const startWrongOnlyRound = () => {
    if (!wrongIds.length) return;
    setDrillMode('wrongOnly');
    setQueue(wrongIds);
    setIndex(0);
    setSelectedIndex(null);
    setSubmitted(false);
    setCorrectCount(0);
    setResultsById({});
  };

  if (finished) {
    return (
      <View style={styles.root}>
        <Card>
          <Text style={styles.title}>Error Hunter Complete</Text>
          <Text style={styles.summary}>Mode: {drillMode === 'all' ? 'All Sentences' : 'Wrong-Only Retry'}</Text>
          <Text style={styles.summary}>Score: {correctCount} / {queue.length}</Text>
          <Text style={styles.summary}>Accuracy: {accuracy}%</Text>
          {Object.keys(resultsById).length ? (
            <View style={styles.resultList}>
              {Object.entries(resultsById).map(([id, result], idx) => {
                const prompt = promptsById[id];
                if (!prompt) return null;
                return (
                  <View key={id} style={styles.resultRow}>
                    <Text style={styles.resultIndex}>{idx + 1}.</Text>
                    <Text style={styles.resultText}>{prompt.incorrectSentence}</Text>
                    <Text style={[styles.resultStatus, result.correct ? styles.resultGood : styles.resultBad]}>
                      {result.correct ? 'Correct' : 'Wrong'}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}
          <View style={styles.actions}>
            {drillMode === 'all' && wrongIds.length ? (
              <AnimatedButton label="Retry Wrong Only" onPress={startWrongOnlyRound} />
            ) : null}
            <AnimatedButton label="Try Again" onPress={restart} />
            <AnimatedButton label="Back to Practice" variant="outline" onPress={() => navigation.goBack()} />
          </View>
        </Card>
      </View>
    );
  }

  const canCheck = selectedIndex !== null && !submitted;
  const ctaLabel = submitted ? (index === queue.length - 1 ? 'Finish Drill' : 'Next Sentence') : 'Check Answer';

  return (
    <View style={styles.root}>
      <Text style={styles.header}>Error Hunter</Text>
      <Text style={styles.progress}>Sentence {index + 1} / {queue.length}</Text>
      <Text style={styles.progress}>{drillMode === 'all' ? 'All Sentences' : 'Wrong-Only Retry'}</Text>

      <Card>
        <Text style={styles.blockLabel}>Incorrect sentence</Text>
        <Text style={styles.incorrect}>{current.incorrectSentence}</Text>

        <Text style={styles.blockLabel}>Pick the corrected version</Text>
        <View style={styles.optionsWrap}>
          {current.options.map((option, optionIndex) => {
            const isChosen = selectedIndex === optionIndex;
            const isCorrect = current.correctIndex === optionIndex;
            return (
              <Pressable
                key={option}
                style={[
                  styles.option,
                  isChosen && styles.optionChosen,
                  submitted && isCorrect && styles.optionCorrect,
                  submitted && isChosen && !isCorrect && styles.optionWrong
                ]}
                onPress={() => {
                  if (!submitted) setSelectedIndex(optionIndex);
                }}
              >
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        {submitted ? (
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackTitle}>{selectedIndex === current.correctIndex ? 'Correct' : 'Needs review'}</Text>
            <Text style={styles.feedbackText}>{current.explanation}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {submitted ? (
            <>
              {selectedIndex !== current.correctIndex ? (
                <AnimatedButton label="Retry This Sentence" variant="outline" onPress={retryCurrent} />
              ) : null}
              <AnimatedButton label={ctaLabel} onPress={handleNext} />
            </>
          ) : (
            <AnimatedButton label={ctaLabel} onPress={handleCheck} disabled={!canCheck} />
          )}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    padding: spacing.xl,
    gap: spacing.md
  },
  header: {
    ...typography.heading2,
    color: colors.textPrimary
  },
  progress: {
    ...typography.body,
    color: colors.textSecondary
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  summary: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.xs
  },
  blockLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  incorrect: {
    ...typography.title,
    color: colors.danger,
    marginBottom: spacing.lg
  },
  optionsWrap: {
    gap: spacing.sm
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg
  },
  optionChosen: {
    borderColor: colors.secondary
  },
  optionCorrect: {
    borderColor: '#16A34A',
    backgroundColor: '#ECFDF5'
  },
  optionWrong: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2'
  },
  optionText: {
    ...typography.body,
    color: colors.textPrimary
  },
  feedbackBox: {
    marginTop: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    padding: spacing.md,
    gap: spacing.xs
  },
  feedbackTitle: {
    ...typography.bodyStrong,
    color: colors.primary
  },
  feedbackText: {
    ...typography.caption,
    color: colors.textPrimary
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm
  },
  resultList: {
    marginTop: spacing.md,
    gap: spacing.xs
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  resultIndex: {
    ...typography.caption,
    color: colors.textSecondary,
    width: 20
  },
  resultText: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm
  },
  resultStatus: {
    ...typography.caption,
    fontWeight: '700'
  },
  resultGood: {
    color: '#047857'
  },
  resultBad: {
    color: colors.danger
  }
});
