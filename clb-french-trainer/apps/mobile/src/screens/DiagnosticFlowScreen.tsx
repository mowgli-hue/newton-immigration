import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { diagnosticQuestionsByDifficulty, difficultyOrder } from '../data/diagnosticQuestions';
import {
  finalizeDiagnostic,
  initializeAdaptiveDiagnostic,
  isDiagnosticComplete,
  pickNextQuestion,
  submitAdaptiveAnswer
} from '../learning/engines';
import type { MainStackParamList } from '../navigation/AppNavigator';
import type { OnboardingSelfLevel } from '../navigation/routePersistence';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'DiagnosticFlowScreen'>;

type LevelOption = {
  id: OnboardingSelfLevel;
  label: string;
  hint: string;
};

const levelOptions: LevelOption[] = [
  { id: 'none', label: 'No knowledge', hint: 'Approx. pre-CLB 1' },
  { id: 'basic', label: 'Basic words and phrases', hint: 'Approx. CLB 1-2' },
  { id: 'simple', label: 'Can form simple sentences', hint: 'Approx. CLB 2-3' },
  { id: 'conversation', label: 'Can hold conversation', hint: 'Approx. CLB 4-5' },
  { id: 'comfortable', label: 'Comfortable discussing topics', hint: 'Approx. CLB 5+' }
];

const MAX_DIAGNOSTIC_QUESTIONS = 15;

function totalQuestionsForInitialTier(initialTier: 'A1' | 'A2' | 'B1' | 'B2'): number {
  const maxTierIndex = difficultyOrder.indexOf(initialTier);
  const available = difficultyOrder
    .slice(0, maxTierIndex + 1)
    .reduce((count, tier) => count + (diagnosticQuestionsByDifficulty[tier]?.length ?? 0), 0);
  return Math.max(5, Math.min(MAX_DIAGNOSTIC_QUESTIONS, available));
}

export function DiagnosticFlowScreen({ navigation, route }: Props) {
  const assessmentMode = !!route.params.initialDifficulty;

  const [selectedLevel, setSelectedLevel] = useState<OnboardingSelfLevel | null>(null);
  const totalQuestions = useMemo(
    () => totalQuestionsForInitialTier(route.params.initialDifficulty ?? 'A1'),
    [route.params.initialDifficulty]
  );

  const [diagnosticState, setDiagnosticState] = useState(() =>
    initializeAdaptiveDiagnostic(route.params.initialDifficulty ?? 'A1', totalQuestions)
  );
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const questionNumber = diagnosticState.attempts.length + 1;
  const progressAnim = useRef(new Animated.Value(questionNumber / totalQuestions)).current;
  const currentQuestion = useMemo(() => pickNextQuestion(diagnosticState, diagnosticQuestionsByDifficulty), [diagnosticState]);
  const isLastQuestion = questionNumber === totalQuestions;

  useEffect(() => {
    if (!assessmentMode) return;
    const target = questionNumber / totalQuestions;
    Animated.timing(progressAnim, {
      toValue: target,
      duration: 250,
      useNativeDriver: false
    }).start();
  }, [assessmentMode, progressAnim, questionNumber, totalQuestions]);

  if (!assessmentMode) {
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <Card>
            <Text style={styles.step}>Step 3 of 5</Text>
            <Text style={styles.title}>How would you describe your current French level?</Text>
            <Text style={styles.subtitle}>Select one level to calibrate your starting path.</Text>

            <View style={styles.optionList}>
              {levelOptions.map((option) => {
                const selected = selectedLevel === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setSelectedLevel(option.id)}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                  >
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{option.label}</Text>
                    <Text style={[styles.optionHint, selected && styles.optionHintSelected]}>{option.hint}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Button
              label="Continue"
              disabled={!selectedLevel}
              onPress={() => {
                if (!selectedLevel) return;
                navigation.navigate('StudyPlanIntroScreen', {
                  goalType: route.params.goalType,
                  selfLevel: selectedLevel
                });
              }}
            />
          </Card>
        </View>
      </View>
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  const handleNextAssessment = () => {
    if (selectedOption === null) return;
    const nextState = submitAdaptiveAnswer(diagnosticState, currentQuestion, selectedOption);
    setSelectedOption(null);

    if (isDiagnosticComplete(nextState)) {
      finalizeDiagnostic(nextState);
      navigation.replace('PathMapScreen');
      return;
    }

    setDiagnosticState(nextState);
  };

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.progressText}>
            {questionNumber} / {totalQuestions}
          </Text>
        </View>

        <Card>
          <Text style={styles.metaRow}>
            {currentQuestion.domain.toUpperCase()} • {currentQuestion.tier}
          </Text>
          {currentQuestion.passage ? <Text style={styles.passage}>{currentQuestion.passage}</Text> : null}
          <Text style={styles.question}>{currentQuestion.prompt}</Text>

          <View style={styles.optionList}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === index;
              return (
                <Pressable
                  key={`${currentQuestion.id}-${index}`}
                  onPress={() => setSelectedOption(index)}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                >
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>

          <Button label={isLastQuestion ? 'Submit Assessment' : 'Next'} onPress={handleNextAssessment} disabled={selectedOption === null} />
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'center'
  },
  container: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center'
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center'
  },
  step: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg
  },
  progressContainer: {
    marginBottom: spacing.lg
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right'
  },
  metaRow: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '700',
    marginBottom: spacing.sm
  },
  passage: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    backgroundColor: colors.backgroundLight,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md
  },
  question: {
    ...typography.title,
    marginBottom: spacing.lg
  },
  optionList: {
    gap: spacing.sm,
    marginBottom: spacing.xl
  },
  optionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
    minHeight: 64,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  optionCardSelected: {
    borderColor: colors.secondary,
    backgroundColor: '#EEF4FF'
  },
  optionLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary
  },
  optionLabelSelected: {
    color: colors.primary
  },
  optionHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  optionHintSelected: {
    color: colors.secondary
  }
});
