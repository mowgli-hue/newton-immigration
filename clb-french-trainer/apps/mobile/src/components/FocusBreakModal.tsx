import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { CircularSessionTimer } from './CircularSessionTimer';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = {
  visible: boolean;
  phase: 'hidden' | 'prompt' | 'break' | 'complete';
  breakRemainingSeconds: number;
  onStartBreak: () => void;
  onContinueStudying: () => void;
  onCloseBreakComplete: () => void;
};

export function FocusBreakModal({
  visible,
  phase,
  breakRemainingSeconds,
  onStartBreak,
  onContinueStudying,
  onCloseBreakComplete
}: Props) {
  if (!visible || phase === 'hidden') {
    return null;
  }

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.backdrop}>
        <BlurView intensity={35} tint="light" style={styles.blurFill} />

        <Animated.View entering={FadeIn.duration(220)} style={styles.card}>
          <Animated.View entering={ZoomIn.duration(220)}>
          {phase === 'prompt' ? (
            <>
              <Text style={styles.title}>Session Complete</Text>
              <Text style={styles.message}>You&apos;ve completed 25 minutes of focused training.</Text>

              <Pressable style={styles.primaryButton} onPress={onStartBreak}>
                <Text style={styles.primaryButtonText}>Start 5-Minute Break</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={onContinueStudying}>
                <Text style={styles.secondaryButtonText}>Continue Studying</Text>
              </Pressable>
            </>
          ) : null}

          {phase === 'break' ? (
            <>
              <Text style={styles.title}>Break Started</Text>
              <Text style={styles.message}>Take a short reset. We&apos;ll continue in:</Text>
              <View style={styles.timerWrap}>
                <CircularSessionTimer totalSeconds={5 * 60} remainingSeconds={breakRemainingSeconds} label="Break" size={132} />
              </View>
            </>
          ) : null}

          {phase === 'complete' ? (
            <>
              <Text style={styles.title}>Break Complete</Text>
              <Text style={styles.message}>Break Complete — Ready to continue?</Text>
              <Pressable style={styles.primaryButton} onPress={onCloseBreakComplete}>
                <Text style={styles.primaryButtonText}>Continue Learning</Text>
              </Pressable>
            </>
          ) : null}
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  blurFill: {
    ...StyleSheet.absoluteFillObject
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl
  },
  title: {
    ...typography.heading3,
    color: colors.textPrimary,
    textAlign: 'center'
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm
  },
  timerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg
  },
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center'
  },
  primaryButtonText: {
    ...typography.bodyStrong,
    color: colors.white
  },
  secondaryButton: {
    marginTop: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
    paddingVertical: spacing.md,
    alignItems: 'center'
  },
  secondaryButtonText: {
    ...typography.bodyStrong,
    color: colors.textPrimary
  }
});
