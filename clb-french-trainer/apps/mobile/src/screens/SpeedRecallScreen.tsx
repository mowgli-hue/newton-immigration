import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AnimatedButton } from '../components/AnimatedButton';
import { Card } from '../components/Card';
import { speedRecallPrompts } from '../data/practiceLabDrills';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'SpeedRecallScreen'>;

const SESSION_SECONDS = 60;
const PROMPT_SECONDS = 6;

export function SpeedRecallScreen({ navigation }: Props) {
  const [started, setStarted] = useState(false);
  const [sessionLeft, setSessionLeft] = useState(SESSION_SECONDS);
  const [promptLeft, setPromptLeft] = useState(PROMPT_SECONDS);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const current = speedRecallPrompts[index % speedRecallPrompts.length];

  const finished = started && sessionLeft <= 0;
  const accuracy = useMemo(() => {
    const attempts = index;
    if (!attempts) return 0;
    return Math.round((correctCount / attempts) * 100);
  }, [correctCount, index]);

  useEffect(() => {
    if (!started || finished) {
      return;
    }

    const sessionTimer = setInterval(() => {
      setSessionLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(sessionTimer);
  }, [started, finished]);

  useEffect(() => {
    if (!started || finished || answered) {
      return;
    }

    const promptTimer = setInterval(() => {
      setPromptLeft((prev) => {
        if (prev <= 1) {
          setAnswered(true);
          setSelectedIndex(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(promptTimer);
  }, [started, finished, answered, index]);

  useEffect(() => {
    if (!answered || finished) {
      return;
    }

    const next = setTimeout(() => {
      setIndex((prev) => prev + 1);
      setAnswered(false);
      setSelectedIndex(null);
      setPromptLeft(PROMPT_SECONDS);
    }, 700);

    return () => clearTimeout(next);
  }, [answered, finished]);

  const handleSelect = (optionIndex: number) => {
    if (!started || answered || finished) {
      return;
    }

    setSelectedIndex(optionIndex);
    setAnswered(true);
    if (optionIndex === current.correctIndex) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const restart = () => {
    setStarted(true);
    setSessionLeft(SESSION_SECONDS);
    setPromptLeft(PROMPT_SECONDS);
    setIndex(0);
    setAnswered(false);
    setSelectedIndex(null);
    setCorrectCount(0);
  };

  if (!started) {
    return (
      <View style={styles.root}>
        <Card>
          <Text style={styles.title}>Speed Recall</Text>
          <Text style={styles.subtitle}>60-second pressure drill. Build fast recall for TEF/CLB performance.</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>- 1 minute total</Text>
            <Text style={styles.infoText}>- 6 seconds per prompt</Text>
            <Text style={styles.infoText}>- No hints</Text>
          </View>
          <AnimatedButton label="Start 60s Drill" onPress={() => setStarted(true)} />
        </Card>
      </View>
    );
  }

  if (finished) {
    return (
      <View style={styles.root}>
        <Card>
          <Text style={styles.title}>Session Complete</Text>
          <Text style={styles.resultLine}>Attempts: {index}</Text>
          <Text style={styles.resultLine}>Correct: {correctCount}</Text>
          <Text style={styles.resultLine}>Accuracy: {accuracy}%</Text>
          <View style={styles.actions}>
            <AnimatedButton label="Run Again" onPress={restart} />
            <AnimatedButton label="Back to Practice" variant="outline" onPress={() => navigation.goBack()} />
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.header}>Speed Recall</Text>
      <View style={styles.timerRow}>
        <Text style={styles.timer}>Session {sessionLeft}s</Text>
        <Text style={styles.timer}>Prompt {promptLeft}s</Text>
      </View>

      <Card>
        <Text style={styles.promptCount}>Question {index + 1}</Text>
        <Text style={styles.prompt}>{current.prompt}</Text>

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
                  answered && isCorrect && styles.optionCorrect,
                  answered && isChosen && !isCorrect && styles.optionWrong
                ]}
                onPress={() => handleSelect(optionIndex)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Text style={styles.caption}>Fast mode: answer before the prompt timer ends.</Text>
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
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.md
  },
  infoBox: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md
  },
  infoText: {
    ...typography.caption,
    color: colors.textPrimary
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  timer: {
    ...typography.bodyStrong,
    color: colors.primary
  },
  promptCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  prompt: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.md
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
    ...typography.bodyStrong,
    color: colors.textPrimary
  },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md
  },
  resultLine: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.sm
  }
});
