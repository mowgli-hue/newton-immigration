import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../components/Card';
import { AnimatedProgressBar } from '../components/AnimatedProgressBar';
import { useCurriculumProgress } from '../context/CurriculumProgressContext';
import { useSubscription } from '../context/SubscriptionContext';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { isProLessonId, shouldAllowSinglePreview, shouldRouteToUpgrade } from '../services/subscription/subscriptionGate';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'PathMapScreen'>;
type LessonNodeStatus = 'completed' | 'current' | 'locked' | 'open';

type LessonNodeProps = {
  lessonId: string;
  title: string;
  status: LessonNodeStatus;
  isFirst: boolean;
  isLast: boolean;
  highlightComplete?: boolean;
  highlightUnlocked?: boolean;
  onPress?: () => void;
};

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

function lessonStatusLabel(status: LessonNodeStatus): string {
  if (status === 'completed') return 'Completed';
  if (status === 'current') return 'Current Lesson';
  if (status === 'locked') return 'Locked';
  return 'Unlocked';
}

function LessonNode({
  lessonId,
  title,
  status,
  isFirst,
  isLast,
  highlightComplete = false,
  highlightUnlocked = false,
  onPress
}: LessonNodeProps) {
  const locked = status === 'locked';
  const pulse = useRef(new Animated.Value(highlightComplete || highlightUnlocked ? 0.96 : 1)).current;

  useEffect(() => {
    if (!highlightComplete && !highlightUnlocked) return;
    Animated.sequence([
      Animated.spring(pulse, { toValue: 1.06, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, useNativeDriver: true })
    ]).start();
  }, [highlightComplete, highlightUnlocked, pulse, lessonId]);

  return (
    <Animated.View style={[styles.nodeContainer, { transform: [{ scale: pulse }] }]}>
      {!isFirst ? (
        <View style={[styles.verticalLine, styles.verticalLineTop, status === 'completed' && styles.verticalLineDone]} />
      ) : null}
      {!isLast ? (
        <View style={[styles.verticalLine, styles.verticalLineBottom, status === 'completed' && styles.verticalLineDone]} />
      ) : null}

      <Pressable
        onPress={onPress}
        disabled={locked}
        style={({ pressed }) => [
          styles.node,
          status === 'completed' && styles.completedNode,
          status === 'current' && styles.currentNode,
          status === 'locked' && styles.lockedNode,
          status === 'open' && styles.openNode,
          highlightComplete && styles.nodeJustCompleted,
          highlightUnlocked && styles.nodeJustUnlocked,
          pressed && !locked && styles.nodePressed
        ]}
      >
        {status === 'completed' ? <Text style={styles.check}>✓</Text> : null}
      </Pressable>

      <View style={styles.nodeTextWrap}>
        <Text style={styles.nodeTitle}>{title}</Text>
        <Text style={[styles.nodeStatus, status === 'current' && styles.nodeStatusCurrent]}>{lessonStatusLabel(status)}</Text>
        {highlightComplete ? <Text style={styles.justDoneText}>Completed now</Text> : null}
        {highlightUnlocked ? <Text style={styles.justUnlockedText}>Unlocked now</Text> : null}
      </View>
    </Animated.View>
  );
}

export function PathMapScreen({ navigation, route }: Props) {
  const { currentLevel, currentModule, currentModuleLessons } = useCurriculumProgress();
  const { subscriptionProfile, markProPreviewUsed } = useSubscription();
  const [completionSummary, setCompletionSummary] = useState(route.params?.completionSummary);
  const passedCount = currentModuleLessons.filter((l) => l.passed).length;
  const totalCount = Math.max(1, currentModuleLessons.length);
  const progressPercent = Math.round((passedCount / totalCount) * 100);
  const moduleComplete = currentModuleLessons.length > 0 && passedCount === currentModuleLessons.length;
  const showA1MysteryBox = currentLevel.id === 'a1';

  useEffect(() => {
    if (route.params?.completionSummary) {
      setCompletionSummary(route.params.completionSummary);
      navigation.setParams({ completionSummary: undefined });
    }
  }, [navigation, route.params]);

  const completedLessonTitle = useMemo(
    () => (completionSummary?.completedLessonId ? formatLessonTitle(completionSummary.completedLessonId) : null),
    [completionSummary?.completedLessonId]
  );
  const unlockedLessonTitle = useMemo(
    () => (completionSummary?.nextLessonId ? formatLessonTitle(completionSummary.nextLessonId) : null),
    [completionSummary?.nextLessonId]
  );

  const handleLessonPress = (lessonId: string) => {
    if (isProLessonId(lessonId)) {
      if (shouldRouteToUpgrade(subscriptionProfile)) {
        navigation.navigate('UpgradeScreen');
        return;
      }
      if (shouldAllowSinglePreview(subscriptionProfile)) {
        void markProPreviewUsed();
      }
    }

    if (lessonId === 'a1-lesson-1') {
      navigation.navigate('A1Lesson1Screen');
      return;
    }
    if (lessonId === 'a1-lesson-2') {
      navigation.navigate('A1ModuleLessonScreen', { lessonId });
      return;
    }
    if (lessonId === 'a1-lesson-3') {
      navigation.navigate('A1Lesson3Screen');
      return;
    }
    if (/^a1-lesson-(?:[4-9]|[12]\d|3\d|40)$/.test(lessonId)) {
      navigation.navigate('A1ModuleLessonScreen', { lessonId });
      return;
    }
    if (/^a2-lesson-(?:[1-9]|[1-3]\d|40)$/.test(lessonId)) {
      navigation.navigate('A2ModuleLessonScreen', { lessonId });
      return;
    }
    if (/^b1-lesson-(?:[1-9]|[1-3]\d|40)$/.test(lessonId)) {
      navigation.navigate('B1ModuleLessonScreen', { lessonId });
      return;
    }
    if (/^(clb5|clb7)-lesson-(?:[1-9]|[1-3]\d|40)$/.test(lessonId)) {
      navigation.navigate('CLBModuleLessonScreen', { lessonId });
      return;
    }
    if (lessonId.startsWith('foundation-lesson-')) {
      const foundationMap: Record<string, string> = {
        'foundation-lesson-1': 'alphabet-sounds',
        'foundation-lesson-2': 'basic-greetings',
        'foundation-lesson-3': 'introducing-yourself',
        'foundation-lesson-4': 'numbers-0-20'
      };
      const foundationLessonId = foundationMap[lessonId];
      if (foundationLessonId) {
        navigation.navigate('FoundationLessonScreen', { lessonId: foundationLessonId });
      } else {
        navigation.navigate('BeginnerFoundationScreen');
      }
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.pathContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.moduleTitle}>{currentModule?.title ?? 'Path Module'}</Text>

      {completionSummary ? (
        <Card>
          <Text style={styles.summaryTitle}>Lesson Completed</Text>
          <Text style={styles.summaryLine}>
            {completedLessonTitle ?? 'Lesson'} completed with {Math.round(completionSummary.completedLessonScore)}%.
          </Text>
          {completionSummary.minorCorrection ? (
            <Text style={styles.summarySubline}>Passed with one minor correction.</Text>
          ) : null}
          <Text style={styles.summaryLine}>
            {unlockedLessonTitle ? `${unlockedLessonTitle} is now unlocked.` : 'Module progress updated.'}
          </Text>
        </Card>
      ) : null}

      <Card>
        <View style={styles.metaHeader}>
          <Text style={styles.metaLabel}>{String(currentLevel.title).toUpperCase()}</Text>
          <Text style={styles.metaValue}>{passedCount}/{currentModuleLessons.length} completed</Text>
        </View>
        <AnimatedProgressBar value={progressPercent} color={colors.secondary} showValue label="Progress" />
      </Card>

      <Card>
        {currentModuleLessons.map((item, index) => {
          const status: LessonNodeStatus = item.locked ? 'locked' : item.passed ? 'completed' : item.isCurrent ? 'current' : 'open';
          return (
            <LessonNode
              key={item.lesson.id}
              lessonId={item.lesson.id}
              title={formatLessonTitle(item.lesson.id)}
              status={status}
              isFirst={index === 0}
              isLast={index === currentModuleLessons.length - 1}
              highlightComplete={completionSummary?.completedLessonId === item.lesson.id}
              highlightUnlocked={completionSummary?.nextLessonId === item.lesson.id}
              onPress={item.locked ? undefined : () => handleLessonPress(item.lesson.id)}
            />
          );
        })}
      </Card>

      {showA1MysteryBox ? (
        <Pressable
          disabled={!moduleComplete}
          style={[styles.mysteryCard, moduleComplete ? styles.mysteryCardUnlocked : styles.mysteryCardLocked]}
        >
          <Text style={styles.mysteryIcon}>{moduleComplete ? '🏆' : '🎁'}</Text>
          <View style={styles.mysteryTextWrap}>
            <Text style={styles.mysteryTitle}>{moduleComplete ? 'A1 Certificate Ready' : 'A1 Certificate Locked'}</Text>
            <Text style={styles.mysteryMeta}>
              {moduleComplete ? 'You unlocked your A1 certificate.' : `Complete ${currentModuleLessons.length} lessons to unlock.`}
            </Text>
          </View>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  pathContainer: {
    padding: 24,
    gap: spacing.md
  },
  moduleTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    color: '#0F172A'
  },
  metaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  metaLabel: {
    ...typography.caption,
    color: '#1E3A8A',
    fontWeight: '700'
  },
  metaValue: {
    ...typography.caption,
    color: '#64748B'
  },
  nodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 62,
    paddingVertical: 8
  },
  verticalLine: {
    position: 'absolute',
    left: 15,
    width: 2,
    backgroundColor: '#E2E8F0'
  },
  verticalLineTop: {
    top: 0,
    bottom: '50%'
  },
  verticalLineBottom: {
    top: '50%',
    bottom: 0
  },
  verticalLineDone: {
    backgroundColor: '#93C5FD'
  },
  node: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  completedNode: {
    backgroundColor: '#2563EB'
  },
  currentNode: {
    borderWidth: 2,
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF'
  },
  openNode: {
    borderWidth: 1,
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF'
  },
  lockedNode: {
    backgroundColor: '#E2E8F0'
  },
  nodePressed: {
    transform: [{ scale: 0.95 }]
  },
  nodeJustCompleted: {
    backgroundColor: '#22C55E',
    borderColor: '#16A34A',
    borderWidth: 1
  },
  nodeJustUnlocked: {
    borderColor: '#22C55E',
    borderWidth: 2,
    backgroundColor: '#ECFDF5'
  },
  check: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  nodeTextWrap: {
    flex: 1
  },
  nodeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A'
  },
  nodeStatus: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4
  },
  nodeStatusCurrent: {
    color: '#1D4ED8',
    fontWeight: '600'
  },
  justDoneText: {
    ...typography.caption,
    color: '#047857',
    fontWeight: '700',
    marginTop: spacing.xs
  },
  justUnlockedText: {
    ...typography.caption,
    color: '#15803D',
    fontWeight: '700',
    marginTop: spacing.xs
  },
  summaryTitle: {
    ...typography.bodyStrong,
    color: '#166534',
    marginBottom: spacing.xs
  },
  summaryLine: {
    ...typography.body,
    color: colors.textPrimary
  },
  summarySubline: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  mysteryCard: {
    marginTop: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  mysteryCardLocked: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  mysteryCardUnlocked: { backgroundColor: '#ECFDF5', borderColor: '#86EFAC' },
  mysteryIcon: { fontSize: 20 },
  mysteryTextWrap: { flex: 1 },
  mysteryTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  mysteryMeta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }
});
