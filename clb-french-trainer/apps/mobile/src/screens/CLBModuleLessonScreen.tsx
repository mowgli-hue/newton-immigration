import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { useCurriculumProgress } from '../context/CurriculumProgressContext';
import { useSubscription } from '../context/SubscriptionContext';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { sendLessonCompletionEmail } from '../services/notifications/notificationEmailService';
import { shouldAllowSinglePreview, shouldRouteToUpgrade } from '../services/subscription/subscriptionGate';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { StructuredLessonScreen } from './StructuredLessonScreen';

type Props = NativeStackScreenProps<MainStackParamList, 'CLBModuleLessonScreen'>;

function parseCLBLessonInfo(lessonId: string): { track: 'clb5' | 'clb7'; lessonNumber: number } | null {
  const match = lessonId.match(/^(clb5|clb7)-lesson-(\d+)$/);
  if (!match) return null;
  const lessonNumber = Number(match[2]);
  if (!Number.isFinite(lessonNumber)) return null;
  return { track: match[1] as 'clb5' | 'clb7', lessonNumber };
}

export function CLBModuleLessonScreen({ route, navigation }: Props) {
  const lessonId = route.params.lessonId;
  const parsed = parseCLBLessonInfo(lessonId);
  const { user } = useAuth();
  const { completeLesson } = useCurriculumProgress();
  const { subscriptionProfile, markProPreviewUsed } = useSubscription();
  const [result, setResult] = useState<
    { passed: boolean; scorePercent: number; minorCorrection?: boolean } | null
  >(null);

  useEffect(() => {
    if (shouldRouteToUpgrade(subscriptionProfile)) {
      (navigation.navigate as any)('UpgradeScreen');
      return;
    }
    if (shouldAllowSinglePreview(subscriptionProfile)) {
      void markProPreviewUsed();
    }
  }, [markProPreviewUsed, navigation, subscriptionProfile]);

  const nextLessonId = useMemo(() => {
    if (!parsed || parsed.lessonNumber >= 40) return null;
    return `${parsed.track}-lesson-${parsed.lessonNumber + 1}`;
  }, [parsed]);

  const titlePrefix = parsed?.track === 'clb7' ? 'CLB 7' : 'CLB 5';
  const minScore = parsed?.track === 'clb7' ? 85 : 82;

  const openNext = () => {
    if (!parsed) {
      (navigation.navigate as any)('LearningHubScreen');
      return;
    }
    if (parsed.lessonNumber >= 40) {
      (navigation.navigate as any)('ModuleReviewScreen');
      return;
    }
    (navigation.navigate as any)('CLBModuleLessonScreen', { lessonId: nextLessonId });
  };

  if (!parsed || parsed.lessonNumber < 1 || parsed.lessonNumber > 40) {
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <Card>
            <Text style={styles.title}>CLB Lesson Route Error</Text>
            <Text style={styles.subtitle}>This screen supports CLB5 and CLB7 lessons 1 to 40.</Text>
            <Button label="Back to Home" onPress={() => (navigation.navigate as any)('LearningHubScreen')} />
          </Card>
        </View>
      </View>
    );
  }

  if (result) {
    const isFinal = parsed.lessonNumber >= 40;
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <Card>
            <Text style={styles.badge}>
              {titlePrefix} Lesson {parsed.lessonNumber} Result
            </Text>
            <Text style={styles.title}>{result.passed ? 'Benchmark Lesson Complete' : 'Benchmark Review Needed'}</Text>
            <Text style={styles.subtitle}>
              {result.passed
                ? isFinal
                  ? `You completed the ${titlePrefix} module.`
                  : `Continue to ${titlePrefix} Lesson ${parsed.lessonNumber + 1}.`
                : 'Retry this lesson to meet benchmark quality before unlocking the next task.'}
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
                <Button
                  label={isFinal ? 'Open Module Review' : `Continue to ${titlePrefix} Lesson ${parsed.lessonNumber + 1}`}
                  onPress={openNext}
                />
              ) : (
                <Button label="Retry Lesson" onPress={() => setResult(null)} />
              )}
              <Button label="Back to Path" variant="outline" onPress={() => (navigation.navigate as any)('PathMapScreen')} />
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
          const base = Math.max(minScore, scorePercent);
          completeLesson({
            lessonId,
            masteryScore: scorePercent,
            productionCompleted: true,
            strictModeCompleted: false,
            skillScoreUpdates: {
              listeningScore: base - 1,
              speakingScore: base,
              writingScore: base,
              readingScore: base - 1
            },
            timedPerformanceScore: base - 2
          });
        }
        if (passed) {
          if (user?.email) {
            void sendLessonCompletionEmail({
              userId: user?.uid ?? 'guest',
              email: user.email,
              displayName: user?.displayName ?? undefined,
              lessonId,
              lessonTitle: `${titlePrefix} Lesson ${parsed.lessonNumber}`,
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
    color: colors.textPrimary,
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
