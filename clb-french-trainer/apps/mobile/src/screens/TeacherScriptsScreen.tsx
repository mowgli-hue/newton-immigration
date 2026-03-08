import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../components/Card';
import { getTeacherScriptsByLevel } from '../content/scripts/teacherScripts';
import type { MainStackParamList } from '../navigation/AppNavigator';
import type { LevelId } from '../types/CurriculumTypes';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'TeacherScriptsScreen'>;

const LEVEL_OPTIONS: Array<{ id: LevelId; label: string }> = [
  { id: 'a1', label: 'A1' },
  { id: 'a2', label: 'A2' },
  { id: 'b1', label: 'B1' },
  { id: 'clb5', label: 'CLB 5' },
  { id: 'clb7', label: 'CLB 7' }
];

export function TeacherScriptsScreen(_props: Props) {
  const [selectedLevel, setSelectedLevel] = useState<LevelId>('a1');
  const scripts = useMemo(() => getTeacherScriptsByLevel(selectedLevel), [selectedLevel]);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Teacher Scripts</Text>
        <Text style={styles.subtitle}>Lesson-by-lesson recording scripts with flow, answer keys, and timing.</Text>

        <View style={styles.levelRow}>
          {LEVEL_OPTIONS.map((option) => {
            const active = selectedLevel === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setSelectedLevel(option.id)}
                style={[styles.levelPill, active && styles.levelPillActive]}
              >
                <Text style={[styles.levelPillText, active && styles.levelPillTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Card>
          <Text style={styles.sectionTitle}>
            {LEVEL_OPTIONS.find((l) => l.id === selectedLevel)?.label} Scripts ({scripts.length})
          </Text>
          <Text style={styles.sectionMeta}>
            Use each lesson card for YouTube planning: intro, teach, practice, production, mini-test, wrap-up.
          </Text>
        </Card>

        {scripts.slice(0, 40).map((script) => (
          <Card key={script.lessonId}>
            <Text style={styles.lessonTitle}>{script.lessonTitle}</Text>
            <Text style={styles.lessonMeta}>
              Threshold {script.masteryThresholdPercent}% • {script.targetMinutes} min • {script.scriptSteps.length} steps
            </Text>
            <Text style={styles.objectiveLabel}>Objective</Text>
            <Text style={styles.objectiveText}>{script.teachingObjective}</Text>

            <Text style={styles.objectiveLabel}>First 3 Recording Segments</Text>
            {script.youtubeRecordingOutline.slice(0, 3).map((segment, index) => (
              <Text key={`${script.lessonId}-${segment.title}-${index}`} style={styles.segmentText}>
                {segment.timestampStart} - {segment.timestampEnd} {segment.title}
              </Text>
            ))}

            <Text style={styles.objectiveLabel}>Retry Policy</Text>
            <Text style={styles.objectiveText}>{script.retryPolicy}</Text>

            <Text style={styles.objectiveLabel}>Exact Questions + Model Answers</Text>
            {script.scriptSteps
              .flatMap((step) => step.exercises ?? [])
              .slice(0, 10)
              .map((exercise, index) => (
                <View key={`${script.lessonId}-${exercise.id}`} style={styles.qaItem}>
                  <Text style={styles.qaQuestion}>{index + 1}. Q: {exercise.prompt}</Text>
                  <Text style={styles.qaAnswer}>A: {exercise.expectedAnswer}</Text>
                </View>
              ))}
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FBFF'
  },
  content: {
    padding: spacing.xl,
    gap: spacing.md
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary
  },
  levelRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap'
  },
  levelPill: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  levelPillActive: {
    borderColor: colors.secondary,
    backgroundColor: '#DBEAFE'
  },
  levelPillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  levelPillTextActive: {
    color: colors.primary
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.primary
  },
  sectionMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  lessonTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary
  },
  lessonMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  objectiveLabel: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '700',
    marginTop: spacing.sm
  },
  objectiveText: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: 2
  },
  segmentText: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: 2
  },
  qaItem: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#F8FAFF'
  },
  qaQuestion: {
    ...typography.caption,
    color: '#1E3A8A',
    fontWeight: '700'
  },
  qaAnswer: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: 2
  }
});
