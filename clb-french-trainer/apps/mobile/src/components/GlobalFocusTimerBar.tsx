import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FocusBreakModal } from './FocusBreakModal';
import { useFocusSession } from '../context/FocusSessionContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

export function GlobalFocusTimerBar() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [open, setOpen] = useState(false);

  const {
    mode,
    completionPhase,
    showCompletionModal,
    isRunning,
    remainingSeconds,
    totalSeconds,
    startFocusSession,
    pauseSession,
    resumeSession,
    skipBreak,
    startBreakFromCompletion,
    continueStudyingAfterFocus,
    closeBreakComplete
  } = useFocusSession();

  const isBreak = mode === 'break';
  const displaySeconds = mode === 'idle' ? 25 * 60 : remainingSeconds;
  const progressPercent = Math.max(0, Math.min(100, ((totalSeconds - remainingSeconds) / totalSeconds) * 100));

  const goToFocusScreen = () => {
    setOpen(false);
    try {
      navigation.navigate('PracticeTab', { screen: 'FocusSessionScreen' });
    } catch {
      try {
        navigation.navigate('FocusSessionScreen');
      } catch {
        // no-op
      }
    }
  };

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setOpen(false), 5000);
    return () => clearTimeout(timer);
  }, [open, mode, isRunning, remainingSeconds]);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.container,
          {
            right: spacing.md,
            top: Math.max(6, insets.top + 4)
          }
        ]}
      >
        {open ? (
          <View style={[styles.panel, isBreak && styles.panelBreak]}>
            <View style={styles.panelHeaderRow}>
              <Pressable onPress={goToFocusScreen} style={styles.panelHeaderTextWrap}>
                <Text style={styles.panelTitle}>{isBreak ? 'Break Timer' : 'Focus Timer'}</Text>
                <Text style={styles.panelTime}>{formatTime(displaySeconds)}</Text>
              </Pressable>
              <Pressable onPress={() => setOpen(false)} style={styles.closeChip}>
                <Text style={styles.closeChipText}>✕</Text>
              </Pressable>
            </View>
            <Pressable onPress={goToFocusScreen}>
              <Text style={styles.panelSubtitle}>
                {mode === 'idle'
                  ? 'Start your 25:5 session for today.'
                  : isBreak
                    ? 'Drink water, walk around, and come back after the break.'
                    : 'Timer continues across the app while you learn.'}
              </Text>
            </Pressable>

            <View style={styles.track}>
              <View style={[styles.fill, isBreak && styles.fillBreak, { width: `${progressPercent}%` }]} />
            </View>

            <View style={styles.actions}>
              <Pressable
                style={styles.actionChip}
                onPress={() => {
                  setOpen(false);
                  if (isRunning) {
                    pauseSession();
                  } else if (mode === 'idle') {
                    startFocusSession();
                  } else {
                    resumeSession();
                  }
                }}
              >
                <Text style={styles.actionChipText}>{isRunning ? 'Pause' : mode === 'idle' ? 'Start' : 'Resume'}</Text>
              </Pressable>
              <Pressable style={[styles.actionChip, styles.actionChipLight]} onPress={goToFocusScreen}>
                <Text style={[styles.actionChipText, styles.actionChipTextLight]}>Open</Text>
              </Pressable>
              {isBreak ? (
                <Pressable style={[styles.actionChip, styles.actionChipLight]} onPress={skipBreak}>
                  <Text style={[styles.actionChipText, styles.actionChipTextLight]}>Skip Break</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}

        <Pressable onPress={() => setOpen((prev) => !prev)} style={[styles.fab, isBreak && styles.fabBreak]}>
          <Text style={styles.fabIcon}>{isBreak ? '🕔' : '⏱️'}</Text>
          <Text style={styles.fabTime}>{formatTime(displaySeconds)}</Text>
          <View style={[styles.statusDot, isBreak && styles.statusDotBreak, mode === 'idle' && styles.statusDotIdle]} />
        </Pressable>
      </View>

      <FocusBreakModal
        visible={showCompletionModal}
        phase={completionPhase}
        breakRemainingSeconds={remainingSeconds}
        onStartBreak={startBreakFromCompletion}
        onContinueStudying={continueStudyingAfterFocus}
        onCloseBreakComplete={closeBreakComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'flex-end',
    gap: spacing.sm,
    zIndex: 40
  },
  panel: {
    width: 250,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6
  },
  panelBreak: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE'
  },
  panelTitle: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700'
  },
  panelTime: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginTop: spacing.xs
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  panelHeaderTextWrap: {
    flex: 1
  },
  closeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700'
  },
  panelSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  track: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: spacing.sm
  },
  fill: {
    height: '100%',
    backgroundColor: colors.secondary
  },
  fillBreak: {
    backgroundColor: '#60A5FA'
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  actionChip: {
    borderRadius: 999,
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  actionChipLight: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border
  },
  actionChipText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700'
  },
  actionChipTextLight: {
    color: colors.textPrimary
  },
  fab: {
    minWidth: 116,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderColor: '#7DD3FC',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  fabBreak: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD'
  },
  fabIcon: {
    fontSize: 13
  },
  fabTime: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A'
  },
  statusDotBreak: {
    backgroundColor: '#3B82F6'
  },
  statusDotIdle: {
    backgroundColor: '#94A3B8'
  }
});
