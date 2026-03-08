import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedButton } from '../components/AnimatedButton';
import { Card } from '../components/Card';
import { useLessonNotes } from '../context/LessonNotesContext';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'PracticeHubScreen'>;

export function PracticeHubScreen({ navigation }: Props) {
  const { getRecentNotes } = useLessonNotes();
  const recentNotes = getRecentNotes().slice(0, 3);

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.bgOrbTop} />
      <View pointerEvents="none" style={styles.bgOrbBottom} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(260)}>
          <Text style={styles.title}>Practice</Text>
          <Text style={styles.subtitle}>Daily tools for speaking and review.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(260)}>
          <Card>
            <Text style={styles.sectionTitle}>Session Tools</Text>
            <View style={styles.quickButtons}>
              <AnimatedButton label="Open AI Teacher" variant="primary" onPress={() => navigation.navigate('AITeacherSessionScreen')} />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(260)}>
          <Card>
            <Text style={styles.sectionTitle}>Practice Lab</Text>
            <Text style={styles.sectionSubtitle}>Optional performance drills. Core lesson progression remains unchanged.</Text>
            <View style={styles.quickButtons}>
              <AnimatedButton label="Speed Recall (60s)" onPress={() => navigation.navigate('SpeedRecallScreen')} />
              <AnimatedButton label="Error Hunter" variant="outline" onPress={() => navigation.navigate('ErrorHunterScreen')} />
              <AnimatedButton label="French Reflex Run" variant="outline" onPress={() => navigation.navigate('FrenchReflexRunScreen')} />
              <AnimatedButton label="A1 Scripts" variant="outline" onPress={() => navigation.navigate('TeacherScriptsScreen')} />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(260)}>
          <Card>
            <Text style={styles.sectionTitle}>Today Review</Text>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewLine}>📘 Lesson notes</Text>
              <Text style={styles.reviewLine}>🧠 Mistakes to fix</Text>
              <Text style={styles.reviewLine}>🗣 Speaking cues</Text>
              <Text style={styles.reviewLine}>✍ Writing corrections</Text>
            </View>

            {recentNotes.length ? (
              <View style={styles.recentNotesWrap}>
                {recentNotes.map((note) => {
                  const vocabulary = Array.isArray((note as any).vocabulary) ? (note as any).vocabulary : [];
                  const errors = Array.isArray((note as any).errors) ? (note as any).errors : [];
                  return (
                    <View key={note.lessonId} style={styles.recentNoteItem}>
                      <Text style={styles.recentNoteLesson}>{note.lessonTitle ?? note.lessonId}</Text>
                      <Text style={styles.recentNoteMeta}>{vocabulary.length} vocab • {errors.length} errors to review</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyState}>No notes yet. Complete a lesson to build your notebook.</Text>
            )}
          </Card>
        </Animated.View>
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
  bgOrbTop: {
    position: 'absolute',
    top: -36,
    right: -14,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#DBEAFE',
    opacity: 0.5
  },
  bgOrbBottom: {
    position: 'absolute',
    bottom: 120,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0F2FE',
    opacity: 0.5
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginBottom: spacing.sm
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md
  },
  quickButtons: {
    gap: spacing.sm
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.xs
  },
  reviewLine: {
    ...typography.body,
    color: colors.textPrimary
  },
  recentNotesWrap: {
    marginTop: spacing.md,
    gap: spacing.sm
  },
  recentNoteItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: spacing.sm
  },
  recentNoteLesson: {
    ...typography.bodyStrong,
    color: colors.textPrimary
  },
  recentNoteMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  emptyState: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md
  }
});
