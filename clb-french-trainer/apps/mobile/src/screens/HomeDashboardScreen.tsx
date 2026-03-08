import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AIReviewCard } from '../components/AIReviewCard';
import { SubscriptionStatusBadge } from '../components/SubscriptionStatusBadge';
import {
  countCompletedCurriculumLessonsAsSessions,
  getRoadmapProgressFromCalendarDay
} from '../content/program/sessionRoadmap';
import { useAuth } from '../context/AuthContext';
import { useCurriculumProgress } from '../context/CurriculumProgressContext';
import { useSubscription } from '../context/SubscriptionContext';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { isProLessonId, shouldAllowSinglePreview, shouldRouteToUpgrade } from '../services/subscription/subscriptionGate';

type Props = NativeStackScreenProps<MainStackParamList, 'LearningHubScreen'>;
type LessonUiState = ReturnType<typeof useCurriculumProgress>['currentModuleLessons'][number];

function formatLessonTitle(lessonId: string): string {
  const a1 = lessonId.match(/^a1-lesson-(\d+)$/);
  if (a1) return `A1 Lesson ${a1[1]}`;
  const a2 = lessonId.match(/^a2-lesson-(\d+)$/);
  if (a2) return `A2 Lesson ${a2[1]}`;
  const b1 = lessonId.match(/^b1-lesson-(\d+)$/);
  if (b1) return `B1 Lesson ${b1[1]}`;
  const clb5 = lessonId.match(/^clb5-lesson-(\d+)$/);
  if (clb5) return `CLB 5 Lesson ${clb5[1]}`;
  const clb7 = lessonId.match(/^clb7-lesson-(\d+)$/);
  if (clb7) return `CLB 7 Lesson ${clb7[1]}`;
  if (lessonId.startsWith('foundation-lesson-')) return 'Foundation Lesson';
  return lessonId.replace(/-/g, ' ');
}

function mapCefr(levelId: string): string {
  switch (levelId) {
    case 'a1':
      return 'CEFR A1';
    case 'a2':
      return 'CEFR A2';
    case 'b1':
      return 'CEFR B1';
    case 'b2':
      return 'CEFR B2';
    default:
      return 'Foundation';
  }
}

function Skill({ label, percent }: { label: string; percent: string }) {
  return (
    <View style={styles.skillCard}>
      <Text style={styles.skillPercent}>{percent}</Text>
      <Text style={styles.skillLabel}>{label}</Text>
    </View>
  );
}

function formatSkillLabel(skill: 'listening' | 'speaking' | 'writing' | 'reading') {
  switch (skill) {
    case 'listening':
      return 'Listening';
    case 'speaking':
      return 'Speaking';
    case 'writing':
      return 'Writing';
    case 'reading':
      return 'Reading';
  }
}

export function HomeDashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { curriculumState, currentLevel, currentModule, currentModuleLessons, todaySessionPlan } = useCurriculumProgress();
  const { subscriptionProfile, markProPreviewUsed } = useSubscription();
  const testerRedirectedRef = useRef(false);

  const navigateToPathTab = (screen: string, params?: Record<string, unknown>) => {
    const tabsNavigation = navigation.getParent?.()?.getParent?.();
    if (!tabsNavigation) return false;
    try {
      (tabsNavigation.navigate as any)('PathTab', { screen, params });
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const email = (user?.email ?? '').trim().toLowerCase();
    if (email !== 'ztalentrecruitmentservices@gmail.com') return;
    if (testerRedirectedRef.current) return;
    testerRedirectedRef.current = true;

    if (!navigateToPathTab('FoundationLessonScreen', { lessonId: 'numbers-0-20' })) {
      (navigation.navigate as any)('LearningHubScreen');
    }
  }, [navigation, user?.email]);

  const levelProgress = curriculumState.levels[curriculumState.currentLevelId];
  const currentLessonUi: LessonUiState | null =
    currentModuleLessons.find((item) => item.isCurrent) ?? currentModuleLessons.find((item) => !item.locked) ?? null;

  const roadmapProgress = useMemo(() => {
    const completedSessions = countCompletedCurriculumLessonsAsSessions(curriculumState.levels as any);
    return getRoadmapProgressFromCalendarDay(curriculumState.journeyStartedAt, completedSessions);
  }, [curriculumState.journeyStartedAt, curriculumState.levels]);

  const completionPercent = Math.max(
    0,
    Math.min(100, Math.round((roadmapProgress.currentDay / roadmapProgress.totalSessions) * 100))
  );

  const passedInModule = currentModuleLessons.filter((item) => item.passed).length;
  const moduleTotal = Math.max(1, currentModuleLessons.length);
  const modulePercent = Math.max(0, Math.min(100, Math.round((passedInModule / moduleTotal) * 100)));
  const coach = curriculumState.performanceCoach;
  const skillEntries = [
    { key: 'listening' as const, value: levelProgress.skillProgress.listeningScore },
    { key: 'speaking' as const, value: levelProgress.skillProgress.speakingScore },
    { key: 'writing' as const, value: levelProgress.skillProgress.writingScore },
    { key: 'reading' as const, value: levelProgress.skillProgress.readingScore }
  ];
  const strongestSkill = skillEntries.reduce((prev, curr) => (curr.value > prev.value ? curr : prev), skillEntries[0]);
  const weakestSkill = skillEntries.reduce((prev, curr) => (curr.value < prev.value ? curr : prev), skillEntries[0]);
  const reviewInsight =
    coach.lastAdvice ??
    (coach.lastEstimatedClb != null
      ? 'Keep building clarity and consistency across speaking and writing tasks.'
      : 'No AI insight yet.');

  const openCurrentLesson = () => {
    if (!currentLessonUi) return;

    const lessonId = currentLessonUi.lesson.id;
    if (isProLessonId(lessonId)) {
      if (shouldRouteToUpgrade(subscriptionProfile)) {
        (navigation.navigate as any)('UpgradeScreen');
        return;
      }
      if (shouldAllowSinglePreview(subscriptionProfile)) {
        void markProPreviewUsed();
      }
    }

    const goPath = (screen: string, params?: Record<string, unknown>) => navigateToPathTab(screen, params);

    if (lessonId.startsWith('foundation-lesson-')) {
      if (!goPath('BeginnerFoundationScreen')) (navigation.navigate as any)('LearningHubScreen');
      return;
    }
    if (lessonId === 'a1-lesson-1') {
      if (!goPath('A1Lesson1Screen')) (navigation.navigate as any)('LearningHubScreen');
      return;
    }
    if (lessonId === 'a1-lesson-2') {
      if (!goPath('A1ModuleLessonScreen', { lessonId })) (navigation.navigate as any)('LearningHubScreen');
      return;
    }
    if (lessonId === 'a1-lesson-3') {
      if (!goPath('A1Lesson3Screen')) (navigation.navigate as any)('LearningHubScreen');
      return;
    }
    if (/^a1-lesson-(?:[4-9]|[12]\d|3\d|40)$/.test(lessonId)) {
      if (!goPath('A1ModuleLessonScreen', { lessonId })) (navigation.navigate as any)('LearningHubScreen');
      return;
    }
    if (/^a2-lesson-(?:[1-9]|[1-3]\d|40)$/.test(lessonId)) {
      if (!goPath('A2ModuleLessonScreen', { lessonId })) (navigation.navigate as any)('LearningHubScreen');
      return;
    }
    if (/^b1-lesson-(?:[1-9]|[1-3]\d|40)$/.test(lessonId)) {
      if (!goPath('B1ModuleLessonScreen', { lessonId })) (navigation.navigate as any)('LearningHubScreen');
      return;
    }
    if (/^(clb5|clb7)-lesson-(?:[1-9]|[1-3]\d|40)$/.test(lessonId)) {
      if (!goPath('CLBModuleLessonScreen', { lessonId })) (navigation.navigate as any)('LearningHubScreen');
      return;
    }

    (navigation.navigate as any)('LearningHubScreen');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topStrip}>
        <View>
          <Text style={styles.level}>{currentLevel.title}</Text>
          <Text style={styles.cefr}>{mapCefr(currentLevel.id)}</Text>
        </View>

        <View style={styles.topRight}>
          <Text style={styles.streak}>🔥 Day {roadmapProgress.currentDay}</Text>
          <Text style={styles.overall}>{completionPercent}% complete</Text>
        </View>
      </View>

      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${completionPercent}%` }]} />
      </View>

      <View style={styles.subscriptionBadgeWrap}>
        <SubscriptionStatusBadge profile={subscriptionProfile} />
      </View>

      <View style={styles.missionCard}>
        <Text style={styles.cardLabel}>TODAY'S SESSION</Text>
        <Text style={styles.lessonTitle}>{currentLessonUi ? formatLessonTitle(currentLessonUi.lesson.id) : 'Continue Learning'}</Text>
        <Text style={styles.duration}>{currentModule?.title ?? 'Structured Lesson'} • {todaySessionPlan?.totalMinutes ?? 25} min</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${modulePercent}%` }]} />
        </View>

        <Pressable onPress={openCurrentLesson} style={styles.primaryButton}>
          <Text style={styles.buttonText}>Continue Lesson</Text>
        </Pressable>
      </View>

      <AIReviewCard
        estimatedClb={coach.lastEstimatedClb}
        targetClb={coach.targetClb}
        strongestSkill={formatSkillLabel(strongestSkill.key)}
        weakestSkill={formatSkillLabel(weakestSkill.key)}
        insight={reviewInsight}
      />

      <View style={styles.goalCard}>
        <Text style={styles.goalTitle}>Road to CLB 5</Text>
        <Text style={styles.goalSub}>Projected: Sept 2026</Text>
      </View>

      <View style={styles.skillsRow}>
        <Skill label="Listening" percent={`${Math.round(levelProgress.skillProgress.listeningScore)}%`} />
        <Skill label="Speaking" percent={`${Math.round(levelProgress.skillProgress.speakingScore)}%`} />
        <Skill label="Writing" percent={`${Math.round(levelProgress.skillProgress.writingScore)}%`} />
      </View>

      <View style={styles.achievement}>
        <Text style={styles.achievementText}>A1 Completion Certificate unlocks at 100%</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  content: {
    padding: 24,
    paddingBottom: 32
  },
  topStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  level: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A'
  },
  cefr: {
    color: '#64748B'
  },
  topRight: {
    alignItems: 'flex-end'
  },
  streak: {
    fontWeight: '600',
    color: '#1E293B'
  },
  overall: {
    fontSize: 13,
    color: '#64748B'
  },
  macroTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    marginBottom: 24,
    overflow: 'hidden'
  },
  macroFill: {
    height: 6,
    backgroundColor: '#2563EB'
  },
  subscriptionBadgeWrap: {
    marginBottom: 16
  },
  missionCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A'
  },
  duration: {
    color: '#64748B',
    marginBottom: 16
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    marginBottom: 20,
    overflow: 'hidden'
  },
  progressFill: {
    height: 8,
    backgroundColor: '#2563EB'
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center'
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16
  },
  goalCard: {
    backgroundColor: '#EFF6FF',
    padding: 20,
    borderRadius: 18,
    marginBottom: 24
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A'
  },
  goalSub: {
    color: '#475569',
    marginTop: 6
  },
  skillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  skillCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    width: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 2
  },
  skillPercent: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB'
  },
  skillLabel: {
    marginTop: 4,
    color: '#475569'
  },
  achievement: {
    padding: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 14
  },
  achievementText: {
    color: '#475569'
  }
});
