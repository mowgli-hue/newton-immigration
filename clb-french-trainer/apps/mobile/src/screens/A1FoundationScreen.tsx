import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useFoundationProgress } from '../context/FoundationProgressContext';
import { foundationLessons } from '../data/foundationLessons';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'A1FoundationScreen'>;

export function A1FoundationScreen({ navigation }: Props) {
  const { completedLessonIds, totalLessons, resetFoundationProgress } = useFoundationProgress();

  const completedCount = completedLessonIds.length;
  const progressRatio = Math.min(1, completedCount / totalLessons);
  const allComplete = completedCount === totalLessons;

  const lessonRows = useMemo(
    () =>
      foundationLessons.map((lesson, index) => {
        const completed = completedLessonIds.includes(lesson.id);
        const unlocked = index === 0 || completedLessonIds.includes(foundationLessons[index - 1].id);

        return {
          ...lesson,
          completed,
          unlocked
        };
      }),
    [completedLessonIds]
  );

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <Card>
          <Text style={styles.title}>Module 0: A1 Foundation</Text>
          <Text style={styles.subtitle}>Build your first French fundamentals before full A1 practice.</Text>

          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(8, progressRatio * 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {completedCount}/{totalLessons} lessons complete
            </Text>
          </View>

          <View style={styles.lessonList}>
            {lessonRows.map((lesson) => (
              <Pressable
                key={lesson.id}
                disabled={!lesson.unlocked}
                onPress={() => navigation.navigate('FoundationLessonScreen', { lessonId: lesson.id })}
                style={({ pressed }) => [
                  styles.lessonItem,
                  lesson.completed && styles.lessonCompleted,
                  !lesson.unlocked && styles.lessonLocked,
                  pressed && lesson.unlocked ? styles.lessonPressed : undefined
                ]}
              >
                <Text style={styles.lessonOrder}>Lesson {lesson.order}</Text>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonStatus}>
                  {lesson.completed ? 'Completed' : lesson.unlocked ? 'Ready to start' : 'Locked'}
                </Text>
              </Pressable>
            ))}
          </View>

          {allComplete ? (
            <View style={styles.completeWrap}>
              <Text style={styles.completeMessage}>Foundation complete. You are ready for A1 Level.</Text>
              <Button label="Begin A1" onPress={() => navigation.navigate('A1Lesson1Screen')} />
              <Button label="Reset Foundation" variant="outline" onPress={resetFoundationProgress} />
            </View>
          ) : null}
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
  title: {
    ...typography.heading2,
    marginBottom: spacing.sm
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.lg
  },
  progressWrap: {
    marginBottom: spacing.lg
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.xs
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary
  },
  lessonList: {
    gap: spacing.sm
  },
  lessonItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white
  },
  lessonCompleted: {
    borderColor: colors.secondary,
    backgroundColor: colors.backgroundLight
  },
  lessonLocked: {
    opacity: 0.5
  },
  lessonPressed: {
    transform: [{ scale: 0.99 }]
  },
  lessonOrder: {
    ...typography.caption,
    color: colors.textSecondary
  },
  lessonTitle: {
    ...typography.bodyStrong,
    marginTop: spacing.xs
  },
  lessonStatus: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textSecondary
  },
  completeWrap: {
    marginTop: spacing.xl,
    gap: spacing.sm
  },
  completeMessage: {
    ...typography.bodyStrong,
    color: colors.primary
  }
});
