import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { StructuredLessonScreen } from './StructuredLessonScreen';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useCurriculumProgress } from '../context/CurriculumProgressContext';
import { getStructuredLessonById } from '../content/structuredLessons';
import { useFoundationProgress } from '../context/FoundationProgressContext';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'FoundationLessonScreen'>;

export function FoundationLessonScreen({ navigation, route }: Props) {
  const { lessonId } = route.params;
  const { markLessonComplete } = useFoundationProgress();
  const { completeLesson } = useCurriculumProgress();
  const structuredLesson = getStructuredLessonById(lessonId);
  const [completionResult, setCompletionResult] = useState<
    { passed: boolean; scorePercent: number; minorCorrection?: boolean } | null
  >(null);

  const curriculumLessonMap: Record<string, string> = {
    'alphabet-sounds': 'foundation-lesson-1',
    'basic-greetings': 'foundation-lesson-2',
    'introducing-yourself': 'foundation-lesson-3',
    'numbers-0-20': 'foundation-lesson-4'
  };

  if (completionResult) {
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <Card>
            <Text style={styles.title}>{completionResult.passed ? 'Lesson Complete' : 'Lesson Review Needed'}</Text>
            <Text style={styles.subtitle}>
              {completionResult.passed
                ? 'Hurray! You completed the lesson successfully.'
                : 'You finished the lesson, but the score is below the pass threshold. Review and try again.'}
            </Text>
            {completionResult.passed && completionResult.minorCorrection ? (
              <Text style={styles.minorPassText}>Passed with one minor correction.</Text>
            ) : null}
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>{completionResult.scorePercent}%</Text>
            </View>
            <View style={styles.actions}>
              <Button
                label={completionResult.passed ? 'Back to Foundation' : 'Retry Lesson'}
                onPress={() => {
                  if (completionResult.passed) {
                    navigation.goBack();
                    return;
                  }
                  setCompletionResult(null);
                }}
              />
              <Button label="Foundation Home" variant="outline" onPress={() => (navigation.navigate as any)('A1FoundationScreen')} />
            </View>
          </Card>
        </View>
      </View>
    );
  }

  if (structuredLesson) {
    return (
      <StructuredLessonScreen
        lessonId={lessonId}
        onComplete={({ passed, scorePercent, minorCorrection }) => {
          if (passed) {
            markLessonComplete(lessonId);
            const curriculumLessonId = curriculumLessonMap[lessonId];
            if (curriculumLessonId) {
              const base = Math.max(70, scorePercent);
              completeLesson({
                lessonId: curriculumLessonId,
                masteryScore: scorePercent,
                productionCompleted: true,
                strictModeCompleted: false,
                skillScoreUpdates: {
                  listeningScore: base,
                  speakingScore: base,
                  writingScore: base - 2,
                  readingScore: base - 1
                }
              });
            }
          }
          setCompletionResult({ passed, scorePercent, minorCorrection });
        }}
      />
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <Card>
          <Text style={styles.title}>Foundation Lesson Not Available</Text>
          <Text style={styles.subtitle}>
            This lesson has not been migrated to the structured teaching engine yet.
          </Text>
          <Button label="Back to Foundation" onPress={() => navigation.goBack()} />
        </Card>
      </View>
    </View>
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
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  scoreValue: {
    ...typography.heading2,
    color: colors.primary
  },
  actions: {
    gap: spacing.sm
  }
});
