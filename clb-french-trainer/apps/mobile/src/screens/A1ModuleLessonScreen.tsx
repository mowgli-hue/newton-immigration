import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { StructuredLessonScreen } from './StructuredLessonScreen';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { useCurriculumProgress } from '../context/CurriculumProgressContext';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { sendLessonCompletionEmail } from '../services/notifications/notificationEmailService';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'A1ModuleLessonScreen'>;

function parseA1LessonNumber(lessonId: string): number | null {
  const match = lessonId.match(/^a1-lesson-(\d+)$/);
  if (!match) return null;
  const num = Number(match[1]);
  return Number.isFinite(num) ? num : null;
}

export function A1ModuleLessonScreen({ route, navigation }: Props) {
  const lessonId = route.params.lessonId;
  const lessonNumber = parseA1LessonNumber(lessonId);
  const { user } = useAuth();
  const { completeLesson } = useCurriculumProgress();
  const [result, setResult] = useState<
    { passed: boolean; scorePercent: number; minorCorrection?: boolean } | null
  >(null);

  const nextLessonId = useMemo(() => {
    if (!lessonNumber) return null;
    if (lessonNumber >= 40) return null;
    return `a1-lesson-${lessonNumber + 1}`;
  }, [lessonNumber]);

  const openNext = () => {
    if (!lessonNumber) {
      (navigation.navigate as any)('LearningHubScreen');
      return;
    }

    if (lessonNumber >= 40) {
      (navigation.navigate as any)('ModuleReviewScreen');
      return;
    }

    (navigation.navigate as any)('A1ModuleLessonScreen', { lessonId: nextLessonId });
  };

  if (!lessonNumber || lessonNumber < 4 || lessonNumber > 40) {
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <Card>
            <Text style={styles.title}>A1 Lesson Route Error</Text>
            <Text style={styles.subtitle}>This screen is intended for A1 lessons 4 to 40.</Text>
            <Button label="Back to Learning Hub" onPress={() => (navigation.navigate as any)('LearningHubScreen')} />
          </Card>
        </View>
      </View>
    );
  }

  if (result) {
    const isFinal = lessonNumber >= 40;
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <Card>
            <Text style={styles.badge}>A1 Lesson {lessonNumber} Result</Text>
            <Text style={styles.title}>{result.passed ? 'Lesson Complete' : 'Lesson Review Needed'}</Text>
            <Text style={styles.subtitle}>
              {result.passed
                ? isFinal
                  ? 'You completed the final lesson in the A1 program block.'
                  : `You can continue to A1 Lesson ${lessonNumber + 1}.`
                : 'Retry the lesson and use the retry round to correct missed items.'}
            </Text>
            {result.passed && result.minorCorrection ? (
              <Text style={styles.minorPassText}>Passed with one minor correction.</Text>
            ) : null}
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>{result.scorePercent}%</Text>
            </View>
            <View style={styles.actions}>
              {result.passed ? (
                <Button label={isFinal ? 'Open Module Review' : `Continue to A1 Lesson ${lessonNumber + 1}`} onPress={openNext} />
              ) : (
                <Button label="Retry Lesson" onPress={() => setResult(null)} />
              )}
              <Button label="Back to Learning Hub" variant="outline" onPress={() => (navigation.navigate as any)('LearningHubScreen')} />
            </View>
          </Card>
        </View>
      </View>
    );
  }

  return (
    <StructuredLessonScreen
      lessonId={lessonId}
      onComplete={({ passed, scorePercent, minorCorrection }) => {
        if (passed) {
          const base = Math.max(70, scorePercent);
          completeLesson({
            lessonId,
            masteryScore: scorePercent,
            productionCompleted: true,
            strictModeCompleted: false,
            skillScoreUpdates: {
              listeningScore: base - 3,
              speakingScore: base,
              writingScore: base - 1,
              readingScore: base - 2
            }
          });
        }
        if (passed) {
          if (user?.email) {
            void sendLessonCompletionEmail({
              userId: user?.uid ?? 'guest',
              email: user.email,
              displayName: user?.displayName ?? undefined,
              lessonId,
              lessonTitle: `A1 Lesson ${lessonNumber}`,
              scorePercent,
              nextLessonId: nextLessonId ?? undefined,
              minorCorrection
            }).catch(() => undefined);
          }

          (navigation.navigate as any)('PathMapScreen', {
            completionSummary: {
              completedLessonId: lessonId,
              completedLessonScore: scorePercent,
              nextLessonId: nextLessonId ?? undefined,
              minorCorrection
            }
          });
          return;
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
  scoreBox: {
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
