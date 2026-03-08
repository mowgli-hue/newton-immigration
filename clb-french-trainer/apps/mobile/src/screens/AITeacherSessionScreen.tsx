import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useFocusSession } from '../context/FocusSessionContext';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'AITeacherSessionScreen'>;

export function AITeacherSessionScreen({ route, navigation }: Props) {
  const { mode: focusMode, remainingSeconds, startFocusSession, resumeSession, isRunning } = useFocusSession();

  return (
    <View style={styles.root}>
      <View style={styles.headerWrap}>
        <Card>
          <Text style={styles.timerTitle}>AI Teacher Session</Text>
          <Text style={styles.timerSubtitle}>
            {focusMode === 'idle'
              ? 'The app-wide 25-minute timer is not running yet. Start it from the top bar or tap below.'
              : focusMode === 'focus'
                ? `Global focus session running. Remaining: about ${Math.ceil(remainingSeconds / 60)} minute(s).`
                : 'Global break is active. Drink water, walk around, and return after the break.'}
          </Text>
          {focusMode === 'idle' ? (
            <View style={styles.timerAction}>
              <Button label="Start Global 25-Minute Timer" variant="outline" onPress={startFocusSession} />
            </View>
          ) : !isRunning ? (
            <View style={styles.timerAction}>
              <Button label="Resume Timer" variant="outline" onPress={resumeSession} />
            </View>
          ) : null}
        </Card>
      </View>

      <View style={styles.container}>
        <Card>
          <Text style={styles.badge}>Coming Soon</Text>
          <Text style={styles.title}>AI Teacher Video Lessons</Text>
          <Text style={styles.subtitle}>
            We are preparing automatic AI-generated video lessons with step-by-step teaching, interactive checks, and personalized feedback.
          </Text>

          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonLine}>🎥 Auto-generated video teacher sessions</Text>
            <Text style={styles.comingSoonLine}>🧠 Personalized explanation flow</Text>
            <Text style={styles.comingSoonLine}>🗣 Speaking review after each segment</Text>
          </View>

          <View style={styles.actions}>
            <Button label="Coming Soon" disabled onPress={() => undefined} />
            <Button label="Back to Path" variant="outline" onPress={() => (navigation.navigate as any)('PathMapScreen')} />
          </View>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  headerWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center'
  },
  timerTitle: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginBottom: spacing.xs
  },
  timerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary
  },
  timerAction: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start'
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
  comingSoonCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    marginBottom: spacing.lg
  },
  comingSoonLine: {
    ...typography.caption,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  actions: {
    gap: spacing.sm
  }
});
