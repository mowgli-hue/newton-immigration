import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MainStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'PathPreparationScreen'>;

const STEPS = [
  { text: 'Analyzing your starting level...', icon: 'brain' as const },
  { text: 'Selecting training modules...', icon: 'book-open-page-variant' as const },
  { text: 'Mapping your path toward CLB 5...', icon: 'chart-line' as const },
  { text: 'Preparing your first 25-minute session...', icon: 'clock-outline' as const }
];

const TOTAL_DURATION_MS = 3600;
const STEP_DURATION_MS = 900;

export function PathPreparationScreen({ navigation, route }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [week, setWeek] = useState(1);
  const progress = useRef(new Animated.Value(0)).current;
  const marker1 = useRef(new Animated.Value(0)).current;
  const marker3 = useRef(new Animated.Value(0)).current;
  const marker5 = useRef(new Animated.Value(0)).current;
  const calendarFade = useRef(new Animated.Value(1)).current;

  const currentStep = useMemo(() => STEPS[Math.min(stepIndex, STEPS.length - 1)], [stepIndex]);

  useEffect(() => {
    const progressAnim = Animated.timing(progress, {
      toValue: 1,
      duration: TOTAL_DURATION_MS,
      useNativeDriver: false
    });
    progressAnim.start();

    const stepTimer = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, STEP_DURATION_MS);

    const weekTimer = setInterval(() => {
      Animated.sequence([
        Animated.timing(calendarFade, { toValue: 0.3, duration: 120, useNativeDriver: true }),
        Animated.timing(calendarFade, { toValue: 1, duration: 120, useNativeDriver: true })
      ]).start();
      setWeek((prev) => (prev >= 8 ? 1 : prev + 1));
    }, 600);

    const doneTimer = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: route.params.nextRoute as never, params: route.params.nextParams as never }]
      });
    }, TOTAL_DURATION_MS + 200);

    return () => {
      clearInterval(stepTimer);
      clearInterval(weekTimer);
      clearTimeout(doneTimer);
    };
  }, [calendarFade, navigation, progress, route.params.nextParams, route.params.nextRoute]);

  useEffect(() => {
    if (stepIndex >= 2) {
      Animated.stagger(120, [
        Animated.timing(marker1, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(marker3, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(marker5, { toValue: 1, duration: 180, useNativeDriver: true })
      ]).start();
    }
  }, [marker1, marker3, marker5, stepIndex]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <LinearGradient colors={['#F8FBFF', '#EEF4FF', '#FFFFFF']} style={styles.root}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={currentStep.icon} size={24} color={colors.primary} />
        </View>
        <Text style={styles.title}>Preparing your learning path</Text>
        <Text style={styles.subtitle}>{currentStep.text}</Text>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        <View style={styles.clbTrackWrap}>
          <View style={styles.clbLine} />
          <Animated.View style={[styles.clbMarker, styles.clbMarkerStart, { opacity: marker1 }]}>
            <Text style={styles.clbText}>CLB1</Text>
          </Animated.View>
          <Animated.View style={[styles.clbMarker, styles.clbMarkerMiddle, { opacity: marker3 }]}>
            <Text style={styles.clbText}>CLB3</Text>
          </Animated.View>
          <Animated.View style={[styles.clbMarker, styles.clbMarkerEnd, { opacity: marker5 }]}>
            <Text style={styles.clbText}>CLB5</Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.calendarCard, { opacity: calendarFade }]}>
          <MaterialCommunityIcons name="calendar-week" size={16} color={colors.secondary} />
          <Text style={styles.calendarText}>Week {week}</Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl
  },
  card: {
    width: '100%',
    maxWidth: 560,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCE7F9',
    backgroundColor: colors.white,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.border,
    marginBottom: spacing.lg
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary
  },
  clbTrackWrap: {
    width: '100%',
    height: 44,
    marginBottom: spacing.lg,
    justifyContent: 'center'
  },
  clbLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: '#D8E2F2'
  },
  clbMarker: {
    position: 'absolute',
    top: 7,
    width: 52,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  clbMarkerStart: {
    left: 0
  },
  clbMarkerMiddle: {
    alignSelf: 'center'
  },
  clbMarkerEnd: {
    right: 0
  },
  clbText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700'
  },
  calendarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  calendarText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700'
  }
});
