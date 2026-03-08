import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AnimatedButton } from '../components/AnimatedButton';
import { AnimatedLessonCard } from '../components/AnimatedLessonCard';
import { AnimatedProgressBar } from '../components/AnimatedProgressBar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CompanionFeedback } from '../components/CompanionFeedback';
import {
  countCompletedCurriculumLessonsAsSessions,
  getRoadmapProgressFromCalendarDay
} from '../content/program/sessionRoadmap';
import { useCurriculumProgress } from '../context/CurriculumProgressContext';
import { useSubscription } from '../context/SubscriptionContext';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { isProLessonId, shouldAllowSinglePreview, shouldRouteToUpgrade } from '../services/subscription/subscriptionGate';
import type { LevelId, SkillFocus } from '../types/CurriculumTypes';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'LearningHubScreen'>;

const START_LEVEL_OPTIONS: Array<{ id: LevelId; label: string }> = [
  { id: 'foundation', label: 'Foundation' },
  { id: 'a1', label: 'A1' },
  { id: 'a2', label: 'A2' },
  { id: 'b1', label: 'B1' }
];

function formatSkillFocus(skillFocus: SkillFocus): string {
  switch (skillFocus) {
    case 'listening':
      return 'Listening';
    case 'speaking':
      return 'Speaking';
    case 'reading':
      return 'Reading';
    case 'writing':
      return 'Writing';
    case 'integrated':
      return 'Integrated';
  }
}

export function LearningHubScreen({ navigation }: Props) {
  const {
    curriculumState,
    currentLevel,
    currentModule,
    currentModuleLessons,
    todaySessionPlan,
    canChooseStartingLevel,
    canUnlockNextLevel,
    generateTodaySession,
    setStartingLevel
  } = useCurriculumProgress();
  const { subscriptionProfile, markProPreviewUsed } = useSubscription();

  const currentLevelProgress = curriculumState.levels[curriculumState.currentLevelId];
  const progressionDecision = canUnlockNextLevel();
  const lessonsPassed = currentModuleLessons.filter((item) => item.passed).length;
  const lessonTotal = Math.max(currentModuleLessons.length, 1);
  const moduleProgressPercent = Math.round((lessonsPassed / lessonTotal) * 100);
  const sessionReadiness = currentLevelProgress.currentLessonId ? 'Ready to continue' : 'Awaiting promotion/review';

  const companionMessage = useMemo(() => {
    if (progressionDecision.canAdvanceLevel) {
      return 'Your current level meets progression thresholds. Review your results and continue to the next level when ready.';
    }

    return `Focus on ${progressionDecision.weakestSkill} next. This is currently your lowest scoring skill.`;
  }, [progressionDecision]);

  const roadmapProgress = useMemo(() => {
    const completedSessions = countCompletedCurriculumLessonsAsSessions(curriculumState.levels as any);
    return getRoadmapProgressFromCalendarDay(curriculumState.journeyStartedAt, completedSessions);
  }, [curriculumState.journeyStartedAt, curriculumState.levels]);

  const todayFocusSkill = todaySessionPlan?.skillFocus ?? progressionDecision.weakestSkill;

  const handleLessonPress = (lessonId: string) => {
    if (isProLessonId(lessonId)) {
      if (shouldRouteToUpgrade(subscriptionProfile)) {
        (navigation.navigate as any)('UpgradeScreen');
        return;
      }
      if (shouldAllowSinglePreview(subscriptionProfile)) {
        void markProPreviewUsed();
      }
    }

    const parent = navigation.getParent?.();
    const openInPathTab = (screen: string, params?: Record<string, unknown>) => {
      if (parent) {
        try {
          (parent.navigate as any)('PathTab', {
            screen,
            params
          });
          return true;
        } catch {
          return false;
        }
      }

      return false;
    };

    if (lessonId === 'a1-lesson-1') {
      if (!openInPathTab('A1Lesson1Screen')) {
        (navigation.navigate as any)('A1Lesson1Screen');
      }
      return;
    }

    if (lessonId === 'a1-lesson-2') {
      if (!openInPathTab('A1ModuleLessonScreen', { lessonId })) {
        (navigation.navigate as any)('A1ModuleLessonScreen', { lessonId });
      }
      return;
    }

    if (lessonId === 'a1-lesson-3') {
      if (!openInPathTab('A1Lesson3Screen')) {
        (navigation.navigate as any)('A1Lesson3Screen');
      }
      return;
    }

    if (/^a1-lesson-(?:[4-9]|[12]\d|3\d|40)$/.test(lessonId)) {
      if (!openInPathTab('A1ModuleLessonScreen', { lessonId })) {
        (navigation.navigate as any)('A1ModuleLessonScreen', { lessonId });
      }
      return;
    }

    if (/^a2-lesson-(?:[1-9]|[1-3]\d|40)$/.test(lessonId)) {
      if (!openInPathTab('A2ModuleLessonScreen', { lessonId })) {
        (navigation.navigate as any)('A2ModuleLessonScreen', { lessonId });
      }
      return;
    }

    if (/^b1-lesson-(?:[1-9]|[1-3]\d|40)$/.test(lessonId)) {
      if (!openInPathTab('B1ModuleLessonScreen', { lessonId })) {
        (navigation.navigate as any)('B1ModuleLessonScreen', { lessonId });
      }
      return;
    }

    if (/^(clb5|clb7)-lesson-(?:[1-9]|[1-3]\d|40)$/.test(lessonId)) {
      if (!openInPathTab('CLBModuleLessonScreen', { lessonId })) {
        (navigation.navigate as any)('CLBModuleLessonScreen', { lessonId });
      }
      return;
    }

    if (lessonId.startsWith('foundation-lesson-')) {
      if (!openInPathTab('BeginnerFoundationScreen')) {
        (navigation.navigate as any)('BeginnerFoundationScreen');
      }
      return;
    }

    // Generic fallback while more lesson screens are being built.
    if (!openInPathTab('LearningHubScreen')) {
      (navigation.navigate as any)('LearningHubScreen');
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Learning Hub</Text>
        <Text style={styles.subtitle}>Engine-driven curriculum progression and session planning.</Text>

        <Card>
          <View style={styles.focusHeaderRow}>
            <View style={styles.focusTextWrap}>
              <Text style={styles.sectionTitle}>Today&apos;s Focus</Text>
              <Text style={styles.focusLevel}>{currentLevel.title}</Text>
              <Text style={styles.focusModule}>{currentModule?.title ?? 'No module selected'}</Text>
              <Text style={styles.focusMeta}>
                Roadmap Day {roadmapProgress.currentDay} / {roadmapProgress.totalSessions} • {roadmapProgress.today.title}
              </Text>
              <Text style={styles.focusMeta}>Roadmap Focus: {roadmapProgress.today.focusSummary}</Text>
              <Text style={styles.focusMeta}>Session readiness: {sessionReadiness}</Text>
              <Text style={styles.focusMeta}>Recommended skill: {formatSkillFocus(todayFocusSkill)}</Text>
            </View>
          </View>
          <Text style={styles.timerNotice}>Your timer for today starts when you begin a lesson.</Text>

          {canChooseStartingLevel ? (
            <View style={styles.startLevelWrap}>
              <Text style={styles.startLevelLabel}>Choose your starting level (one-time setup)</Text>
              <View style={styles.startLevelButtons}>
                {START_LEVEL_OPTIONS.map((option) => (
                  <AnimatedButton key={option.id} label={option.label} variant="outline" onPress={() => setStartingLevel(option.id)} />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.sessionActionRow}>
            <Button label="Generate Strict Session" onPress={() => generateTodaySession({ strictMode: true })} />
            <Button label="Generate Flexible Session" variant="outline" onPress={() => generateTodaySession({ strictMode: false })} />
          </View>

          {todaySessionPlan ? (
            <View style={styles.sessionGeneratedBanner}>
              <Text style={styles.sessionGeneratedTitle}>Session Generated</Text>
              <Text style={styles.sessionGeneratedText}>
                {todaySessionPlan.strictMode ? 'Strict Mode' : 'Flexible Mode'} • {formatSkillFocus(todaySessionPlan.skillFocus)} • {todaySessionPlan.totalMinutes} minutes
              </Text>
              <Text style={styles.sessionGeneratedText}>
                Roadmap Session Type: {roadmapProgress.today.title}
              </Text>
              <Text style={styles.sessionGeneratedHint}>
                Scroll down to view the full 25-minute plan blocks.
              </Text>
            </View>
          ) : null}

          <CompanionFeedback
            message={companionMessage}
            tone={progressionDecision.canAdvanceLevel ? 'success' : 'neutral'}
          />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>8-Month Session Roadmap</Text>
          <Text style={styles.roadmapHeadline}>
            Day {roadmapProgress.currentDay} of {roadmapProgress.totalSessions}: {roadmapProgress.today.title}
          </Text>
          <Text style={styles.roadmapSubline}>
            {roadmapProgress.today.levelTitle} • {roadmapProgress.today.moduleTitle}
          </Text>
          <Text style={styles.roadmapFocus}>Focus: {roadmapProgress.today.focusSummary}</Text>
          <View style={styles.roadmapTagRow}>
            {roadmapProgress.today.includesReviewCycle ? <Text style={styles.roadmapTag}>Review Cycle</Text> : null}
            {roadmapProgress.today.isBenchmark ? <Text style={[styles.roadmapTag, styles.roadmapTagBenchmark]}>Benchmark</Text> : null}
            {roadmapProgress.today.includesProductionTask ? <Text style={styles.roadmapTag}>Production Task</Text> : null}
            {roadmapProgress.today.includesListening ? <Text style={styles.roadmapTag}>Listening</Text> : null}
            {roadmapProgress.today.includesSpeaking ? <Text style={styles.roadmapTag}>Speaking</Text> : null}
            {roadmapProgress.today.includesWriting ? <Text style={styles.roadmapTag}>Writing</Text> : null}
          </View>
          {roadmapProgress.next.length ? (
            <View style={styles.roadmapNextList}>
              <Text style={styles.roadmapNextTitle}>Next Sessions</Text>
              {roadmapProgress.next.map((item) => (
                <Text key={item.id} style={styles.roadmapNextItem}>
                  • Day {item.globalDay}: {item.title} ({item.levelTitle}) - {item.focusSummary}
                </Text>
              ))}
            </View>
          ) : null}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Module Progress</Text>
          <AnimatedProgressBar label="Current Module Completion" value={moduleProgressPercent} />
          <Text style={styles.progressCaption}>{lessonsPassed} of {currentModuleLessons.length} lessons passed</Text>

          <View style={styles.lessonList}>
            {currentModuleLessons.map((item) => (
              <AnimatedLessonCard
                key={item.lesson.id}
                title={item.lesson.id}
                subtitle={item.lesson.objectives[0] ?? 'Lesson objective'}
                statusText={item.locked ? 'Locked' : item.passed ? 'Passed' : item.isCurrent ? 'Current lesson' : 'Unlocked'}
                locked={item.locked}
                current={item.isCurrent}
                onPress={item.locked ? undefined : () => handleLessonPress(item.lesson.id)}
              />
            ))}
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Skill Progress</Text>
          <View style={styles.skillBars}>
            <AnimatedProgressBar label="Listening" value={currentLevelProgress.skillProgress.listeningScore} color={colors.secondary} />
            <AnimatedProgressBar label="Speaking" value={currentLevelProgress.skillProgress.speakingScore} color={colors.primary} />
            <AnimatedProgressBar label="Writing" value={currentLevelProgress.skillProgress.writingScore} color={colors.accent} />
          </View>
          <Text style={styles.skillFootnote}>
            Reading: {currentLevelProgress.skillProgress.readingScore}% • Timed: {currentLevelProgress.skillProgress.timedPerformanceScore}%
          </Text>
        </Card>

        {todaySessionPlan ? (
          <Card>
            <Text style={styles.sectionTitle}>Today&apos;s Generated Session</Text>
            <Text style={styles.planSummary}>
              {formatSkillFocus(todaySessionPlan.skillFocus)} • {todaySessionPlan.strictMode ? 'Strict Mode' : 'Flexible Mode'} • {todaySessionPlan.totalMinutes} min
            </Text>
            <View style={styles.planBlocks}>
              {todaySessionPlan.blocks.map((block) => (
                <View key={block.type} style={styles.planBlock}>
                  <Text style={styles.planBlockTitle}>{block.title} ({block.minutes}m)</Text>
                  <Text style={styles.planBlockMeta}>Focus: {formatSkillFocus(block.skillFocus)}</Text>
                  <Text style={styles.planBlockGoal}>{block.goals[0]}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
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
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginBottom: spacing.sm
  },
  focusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm
  },
  focusTextWrap: {
    flex: 1
  },
  focusLevel: {
    ...typography.title,
    marginBottom: spacing.xs
  },
  focusModule: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  focusMeta: {
    ...typography.caption,
    color: colors.textSecondary
  },
  timerNotice: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.md
  },
  startLevelWrap: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.backgroundLight
  },
  startLevelLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  startLevelButtons: {
    gap: spacing.sm
  },
  sessionActionRow: {
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  sessionGeneratedBanner: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  sessionGeneratedTitle: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginBottom: spacing.xs
  },
  sessionGeneratedText: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  sessionGeneratedHint: {
    ...typography.caption,
    color: colors.textSecondary
  },
  progressCaption: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm
  },
  roadmapHeadline: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  roadmapSubline: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  roadmapFocus: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  roadmapTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm
  },
  roadmapTag: {
    ...typography.caption,
    color: colors.primary,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999
  },
  roadmapTagBenchmark: {
    borderColor: colors.secondary,
    color: colors.secondary
  },
  roadmapNextList: {
    marginTop: spacing.xs
  },
  roadmapNextTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  roadmapNextItem: {
    ...typography.caption,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  lessonList: {
    gap: spacing.sm
  },
  skillBars: {
    gap: spacing.md
  },
  skillFootnote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm
  },
  planSummary: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  planBlocks: {
    gap: spacing.sm
  },
  planBlock: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.sm,
    backgroundColor: colors.backgroundLight
  },
  planBlockTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary
  },
  planBlockMeta: {
    ...typography.caption,
    color: colors.secondary,
    marginTop: spacing.xs
  },
  planBlockGoal: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs
  }
});
