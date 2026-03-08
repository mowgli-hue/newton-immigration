import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { useCurriculumProgress } from '../context/CurriculumProgressContext';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { saveUserOnboardingProfile, type OnboardingSelfLevel } from '../navigation/routePersistence';
import type { LevelId } from '../types/CurriculumTypes';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'DiagnosticResultScreen'>;

const reminderTimes = ['07:00', '08:00', '12:00', '18:00', '20:00'];

type StartingRoute = { name: keyof MainStackParamList; params?: Record<string, unknown> };

function determineStartingRoute(
  level: OnboardingSelfLevel,
  goalType: Props['route']['params']['goalType'],
  userEmail?: string | null
): StartingRoute {
  // Temporary QA shortcut: route this tester account directly to Foundation Lesson 4.
  if ((userEmail ?? '').trim().toLowerCase() === 'ztalentrecruitmentservices@gmail.com') {
    return { name: 'FoundationLessonScreen', params: { lessonId: 'numbers-0-20' } };
  }

  if (level === 'none') return { name: 'BeginnerFoundationScreen' };
  if (level === 'basic') return { name: 'A1FoundationScreen' };
  if (level === 'simple') return { name: 'A1Lesson1Screen' };
  if (level === 'conversation') return { name: 'DiagnosticFlowScreen', params: { goalType, initialDifficulty: 'A2' } };
  return { name: 'DiagnosticFlowScreen', params: { goalType, initialDifficulty: 'B1' } };
}

function mapSelfLevelToCurriculum(level: OnboardingSelfLevel): LevelId {
  if (level === 'none') return 'foundation';
  return 'a1';
}

function deriveTargetClb(goalType: Props['route']['params']['goalType']): 5 | 7 {
  if (goalType === 'tef_canada' || goalType === 'express_entry_points') {
    return 7;
  }
  return 5;
}

function estimateDaysToGoal(selfLevel: OnboardingSelfLevel, targetClb: 5 | 7): number {
  const baseByLevel: Record<OnboardingSelfLevel, number> = {
    none: 230,
    basic: 200,
    simple: 170,
    conversation: 130,
    comfortable: 100
  };

  const base = baseByLevel[selfLevel];
  return targetClb === 7 ? base : Math.max(70, base - 40);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function DiagnosticResultScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { canChooseStartingLevel, setStartingLevel } = useCurriculumProgress();
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [selectedTime, setSelectedTime] = useState('18:00');
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState<'preparing' | 'ready'>('preparing');
  const isWeb = Platform.OS === 'web';

  const progressAnim = useRef(new Animated.Value(0)).current;
  const targetClb = deriveTargetClb(route.params.goalType);
  const daysToGoal = useMemo(
    () => estimateDaysToGoal(route.params.selfLevel, targetClb),
    [route.params.selfLevel, targetClb]
  );
  const projectedDate = useMemo(() => addDays(new Date(), daysToGoal), [daysToGoal]);

  useEffect(() => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1400,
      useNativeDriver: false
    }).start();

    const timer = setTimeout(() => setStage('ready'), 1450);
    return () => clearTimeout(timer);
  }, [progressAnim]);

  const handleStartTraining = async () => {
    const nextRoute = determineStartingRoute(route.params.selfLevel, route.params.goalType, user?.email);
    try {
      setSaving(true);
      if (user?.uid) {
        await saveUserOnboardingProfile(user.uid, {
          goalType: route.params.goalType,
          selfLevel: route.params.selfLevel,
          targetClb,
          reminderEnabled,
          reminderTime: reminderEnabled ? selectedTime : undefined,
          hasCompletedOnboarding: true,
          completedAt: Date.now()
        });
      }

      if (canChooseStartingLevel) {
        setStartingLevel(mapSelfLevelToCurriculum(route.params.selfLevel));
      }

      navigation.navigate('PathPreparationScreen', {
        nextRoute: nextRoute.name,
        nextParams: nextRoute.params as Record<string, unknown> | undefined
      });
    } finally {
      setSaving(false);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  const calendarDays = Array.from({ length: 7 }, (_, i) => i + 1);

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <Card>
          {stage === 'preparing' ? (
            <>
              <Text style={styles.step}>Step 5 of 5</Text>
              <Text style={styles.title}>Preparing your journey...</Text>
              <Text style={styles.subtitle}>
                Building your personalized roadmap based on your current level and goal.
              </Text>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
            </>
          ) : null}

          {stage === 'ready' ? (
            <>
              <Text style={styles.step}>Step 5 of 5</Text>
              <Text style={styles.title}>Your plan is ready</Text>
              <Text style={styles.subtitle}>
                Complete {daysToGoal} focused days to target CLB {targetClb}. Projected finish: {formatDate(projectedDate)}.
              </Text>

              <View style={styles.calendarCard}>
                <Text style={styles.calendarTitle}>Week 1 roadmap</Text>
                <View style={styles.calendarRow}>
                  {calendarDays.map((day) => (
                    <View key={day} style={styles.dayChip}>
                      <Text style={styles.dayText}>D{day}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.calendarHint}>1 structured session (25 min) per day.</Text>
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>Enable daily reminder</Text>
                  <Text style={styles.toggleHint}>Stay consistent with one structured session daily.</Text>
                </View>
                <Switch
                  value={reminderEnabled}
                  onValueChange={setReminderEnabled}
                  thumbColor={reminderEnabled ? colors.white : '#F1F5F9'}
                  trackColor={{ false: colors.border, true: colors.secondary }}
                />
              </View>

              {isWeb ? (
                <View style={styles.webInfoCard}>
                  <Text style={styles.webInfoTitle}>Web reminder setup</Text>
                  <Text style={styles.webInfoText}>
                    Browser push reminders are not enabled yet. You can still pick a preferred study time and we will apply it on mobile.
                  </Text>
                </View>
              ) : null}

              {reminderEnabled ? (
                <View style={styles.timeSection}>
                  <Text style={styles.timeTitle}>Reminder time</Text>
                  <View style={styles.timeGrid}>
                    {reminderTimes.map((time) => {
                      const selected = selectedTime === time;
                      return (
                        <Pressable
                          key={time}
                          onPress={() => setSelectedTime(time)}
                          style={[styles.timeChip, selected && styles.timeChipSelected]}
                        >
                          <Text style={[styles.timeText, selected && styles.timeTextSelected]}>{time}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              <Button label="Let's Start" onPress={handleStartTraining} loading={saving} />
            </>
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
  step: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.lg
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary
  },
  calendarCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: '#F8FBFF',
    padding: spacing.md,
    marginBottom: spacing.lg
  },
  calendarTitle: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginBottom: spacing.sm
  },
  calendarRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm
  },
  dayChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dayText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700'
  },
  calendarHint: {
    ...typography.caption,
    color: colors.textSecondary
  },
  toggleRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  toggleCopy: {
    flex: 1
  },
  toggleTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  toggleHint: {
    ...typography.caption,
    color: colors.textSecondary
  },
  timeSection: {
    marginBottom: spacing.xl
  },
  timeTitle: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginBottom: spacing.sm
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  timeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    minWidth: 72,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center'
  },
  timeChipSelected: {
    borderColor: colors.secondary,
    backgroundColor: '#EEF4FF'
  },
  timeText: {
    ...typography.body,
    color: colors.textPrimary
  },
  timeTextSelected: {
    color: colors.primary,
    fontWeight: '600'
  },
  webInfoCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    marginBottom: spacing.lg
  },
  webInfoTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  webInfoText: {
    ...typography.caption,
    color: colors.textSecondary
  }
});
