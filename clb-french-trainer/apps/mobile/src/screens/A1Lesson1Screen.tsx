import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { StructuredLessonScreen } from './StructuredLessonScreen';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useCurriculumProgress } from '../context/CurriculumProgressContext';
import { useFoundationProgress } from '../context/FoundationProgressContext';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'A1Lesson1Screen'>;

export function A1Lesson1Screen({ navigation }: Props) {
  const { completeLesson } = useCurriculumProgress();
  const { completedLessonIds, totalLessons } = useFoundationProgress();
  const [result, setResult] = useState<
    { passed: boolean; scorePercent: number; minorCorrection?: boolean } | null
  >(null);
  const [foundationIntroSeen, setFoundationIntroSeen] = useState(false);
  const foundationCompleted = completedLessonIds.length === totalLessons;

  const goToLesson2 = () => {
    const parent = navigation.getParent?.();
    if (parent) {
      try {
        (parent.navigate as any)('PathTab', {
          screen: 'A1ModuleLessonScreen',
          params: { lessonId: 'a1-lesson-2' }
        });
        return;
      } catch {
        // onboarding stack fallback
      }
    }
    (navigation.navigate as any)('A1ModuleLessonScreen', { lessonId: 'a1-lesson-2' });
  };

  if (result) {
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <Card>
            <Text style={styles.badge}>A1 Lesson 1 Result</Text>
            <Text style={styles.title}>{result.passed ? 'Hurray! Lesson 1 Complete' : 'Lesson 1 Review Needed'}</Text>
            <Text style={styles.subtitle}>
              {result.passed
                ? 'You completed the structured lesson and can continue to A1 Lesson 2.'
                : 'You finished the lesson but did not reach the mastery threshold yet. Retry and review the weak items.'}
            </Text>
            {result.passed && result.minorCorrection ? (
              <Text style={styles.minorPassText}>Passed with one minor correction.</Text>
            ) : null}
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>{result.scorePercent}%</Text>
            </View>
            <View style={styles.actions}>
              {result.passed ? (
                <Button label="Continue to A1 Lesson 2" onPress={goToLesson2} />
              ) : (
                <Button label="Retry Lesson 1" onPress={() => setResult(null)} />
              )}
              <Button label="Back to Learning Hub" variant="outline" onPress={() => (navigation.navigate as any)('LearningHubScreen')} />
            </View>
          </Card>
        </View>
      </View>
    );
  }

  if (foundationCompleted && !foundationIntroSeen) {
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <Card>
            <Text style={styles.badge}>Milestone</Text>
            <Text style={styles.title}>Congrats! You completed Foundation Level.</Text>
            <Text style={styles.subtitle}>
              You are now ready to begin A1 Lesson 1. Keep the same daily rhythm and focus on clear speaking and writing.
            </Text>
            <View style={styles.actions}>
              <Button label="Start A1 Lesson 1" onPress={() => setFoundationIntroSeen(true)} />
            </View>
          </Card>
        </View>
      </View>
    );
  }

  return (
    <StructuredLessonScreen
      lessonId="a1-lesson-1"
      onComplete={({ passed, scorePercent, minorCorrection }) => {
        if (passed) {
          completeLesson({
            lessonId: 'a1-lesson-1',
            masteryScore: scorePercent,
            productionCompleted: true,
            strictModeCompleted: false,
            skillScoreUpdates: {
              listeningScore: Math.max(75, scorePercent - 2),
              speakingScore: Math.max(75, scorePercent),
              readingScore: Math.max(72, scorePercent - 5)
            }
          });
        }

        setResult({ passed, scorePercent, minorCorrection });
      }}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.xl
  },
  container: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center'
  },
  badge: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '700',
    marginBottom: spacing.xs
  },
  title: {
    ...typography.heading2,
    marginBottom: spacing.sm
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg
  },
  minorPassText: {
    ...typography.caption,
    color: colors.secondary,
    marginBottom: spacing.md
  },
  scoreCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.textSecondary
  },
  scoreValue: {
    ...typography.heading2,
    color: colors.primary
  },
  actions: {
    gap: spacing.sm
  }
});
