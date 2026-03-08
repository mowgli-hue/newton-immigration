import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FocusTimer } from '../components/FocusTimer';
import { useLearningProgress } from '../context/LearningProgressContext';
import {
  areAllBlocksCompleted,
  canSelectBlock,
  canSkipCurrentBlock,
  completeCurrentBlock,
  createFocusSession,
  getCompanionHint,
  restartSession,
  selectBlock,
  shouldLockBreak,
  skipCurrentBlock,
  startBreak,
  startOrPauseSession,
  tickSession,
  toSessionBlocks,
  withStrictMode
} from '../learning';
import { getLessonById } from '../learning/repositories/lessonRepository';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'FocusSessionScreen'>;

export function FocusSessionScreen({ route }: Props) {
  const lessonId = route.params?.lessonId ?? 'a1-1';
  const lesson = getLessonById(lessonId) ?? getLessonById('a1-1');

  const [session, setSession] = useState(() => createFocusSession(lessonId, route.params?.strictMode ?? false));
  const [showNotebookReminder, setShowNotebookReminder] = useState(true);
  const { trackSessionComplete } = useLearningProgress();

  useEffect(() => {
    if (!lesson) {
      return;
    }

    setSession((prev) => ({
      ...createFocusSession(lesson.id, prev.strictMode),
      blocks: toSessionBlocks(lesson)
    }));
  }, [lesson]);

  useEffect(() => {
    if (!session.isRunning || session.phase === 'done') {
      return;
    }

    const timer = setInterval(() => {
      setSession((prev) => tickSession(prev));
    }, 1000);

    return () => clearInterval(timer);
  }, [session.isRunning, session.phase]);

  useEffect(() => {
    if (session.currentBlockIndex !== 2) {
      setShowNotebookReminder(true);
    }
  }, [session.currentBlockIndex]);

  useEffect(() => {
    if (session.phase !== 'done') {
      return;
    }

    void trackSessionComplete(session.strictMode);
  }, [session.phase, session.strictMode, trackSessionComplete]);

  const phaseLabel =
    session.phase === 'focus' ? 'Focus Session' : session.phase === 'break' ? 'Break Session' : 'Session Complete';

  const remainingSeconds = session.phase === 'focus' ? session.focusSecondsRemaining : session.breakSecondsRemaining;
  const totalSeconds = session.phase === 'focus' ? 25 * 60 : 5 * 60;
  const allCompleted = areAllBlocksCompleted(session);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Card>
            <Text style={styles.title}>25:5 Focus Session</Text>
            <Text style={styles.subtitle}>Teach to Practice to Produce to Test in one disciplined cycle.</Text>

            <View style={styles.lessonMeta}>
              <Text style={styles.lessonMetaLabel}>Lesson</Text>
              <Text style={styles.lessonMetaValue}>{lesson?.module ?? 'A1 Core Lesson'}</Text>
            </View>

            <View style={styles.strictRow}>
              <View>
                <Text style={styles.strictTitle}>Strict Mode</Text>
                <Text style={styles.strictDesc}>No skipping. Full block completion required.</Text>
              </View>
              <Switch
                value={session.strictMode}
                onValueChange={(enabled) => setSession((prev) => withStrictMode(prev, enabled))}
                thumbColor={session.strictMode ? colors.white : '#f4f3f4'}
                trackColor={{ false: colors.border, true: colors.secondary }}
              />
            </View>

            <FocusTimer totalSeconds={totalSeconds} remainingSeconds={remainingSeconds} phaseLabel={phaseLabel} />

            <Text style={styles.blockProgress}>Block {session.currentBlockIndex + 1} of {session.blocks.length}</Text>

            <View style={styles.blockList}>
              {session.blocks.map((block, index) => {
                const active = index === session.currentBlockIndex;
                const allowed = canSelectBlock(session, index);

                return (
                  <Pressable
                    key={block.id}
                    disabled={!allowed}
                    onPress={() => setSession((prev) => selectBlock(prev, index))}
                    style={({ pressed }) => [
                      styles.blockItem,
                      active && styles.blockActive,
                      block.completed && styles.blockCompleted,
                      !allowed && styles.blockLocked,
                      pressed && allowed ? styles.blockPressed : undefined
                    ]}
                  >
                    <Text style={styles.blockName}>{block.title}</Text>
                    <Text style={styles.blockDescription}>{block.description}</Text>
                    <Text style={styles.blockState}>
                      {block.completed ? 'Completed' : active ? 'In progress' : allowed ? 'Ready' : 'Locked'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {session.currentBlockIndex === 2 && showNotebookReminder ? (
              <View style={styles.reminderCard}>
                <Text style={styles.reminderTitle}>Notebook Reminder</Text>
                <Text style={styles.reminderText}>Open your French notebook before starting the Production block.</Text>
                <Button label="Notebook Ready" variant="outline" onPress={() => setShowNotebookReminder(false)} />
              </View>
            ) : null}

            <View style={styles.hintCard}>
              <Text style={styles.hintTitle}>Companion Tip</Text>
              <Text style={styles.hintText}>{getCompanionHint('analytical', session.blocks[session.currentBlockIndex].title)}</Text>
            </View>

            {session.phase !== 'done' ? (
              <View style={styles.actions}>
                <Button
                  label={session.isRunning ? 'Pause Timer' : 'Start Timer'}
                  onPress={() => setSession((prev) => startOrPauseSession(prev))}
                />
                <Button
                  label="Complete Current Block"
                  variant="outline"
                  onPress={() => setSession((prev) => completeCurrentBlock(prev))}
                  disabled={session.blocks[session.currentBlockIndex].completed}
                />
                <Button
                  label="Skip to Next Block"
                  variant="text"
                  onPress={() => setSession((prev) => skipCurrentBlock(prev))}
                  disabled={!canSkipCurrentBlock(session)}
                />
                <Button
                  label="Start Break Now"
                  variant="text"
                  onPress={() => setSession((prev) => startBreak(prev))}
                  disabled={session.phase !== 'focus' || shouldLockBreak(session) || !allCompleted}
                />
              </View>
            ) : (
              <View style={styles.doneWrap}>
                <Text style={styles.doneTitle}>Session complete. Strong discipline.</Text>
                <Button label="Start New Focus Session" onPress={() => setSession((prev) => restartSession(prev))} />
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: spacing.xs
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.md
  },
  lessonMeta: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.backgroundLight
  },
  lessonMetaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  lessonMetaValue: {
    ...typography.bodyStrong,
    color: colors.primary
  },
  strictRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.backgroundLight
  },
  strictTitle: {
    ...typography.bodyStrong
  },
  strictDesc: {
    ...typography.caption,
    marginTop: spacing.xs
  },
  blockProgress: {
    ...typography.bodyStrong,
    marginBottom: spacing.sm
  },
  blockList: {
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  blockItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white
  },
  blockActive: {
    borderColor: colors.secondary,
    backgroundColor: colors.backgroundLight
  },
  blockCompleted: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4'
  },
  blockLocked: {
    opacity: 0.5
  },
  blockPressed: {
    transform: [{ scale: 0.99 }]
  },
  blockName: {
    ...typography.bodyStrong
  },
  blockDescription: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textSecondary
  },
  blockState: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textSecondary
  },
  reminderCard: {
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm
  },
  reminderTitle: {
    ...typography.bodyStrong,
    color: colors.primary
  },
  reminderText: {
    ...typography.body,
    color: colors.textPrimary
  },
  hintCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: '#F8FAFC'
  },
  hintTitle: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginBottom: spacing.xs
  },
  hintText: {
    ...typography.body,
    color: colors.textPrimary
  },
  actions: {
    gap: spacing.sm
  },
  doneWrap: {
    gap: spacing.sm
  },
  doneTitle: {
    ...typography.bodyStrong,
    color: colors.primary
  }
});
