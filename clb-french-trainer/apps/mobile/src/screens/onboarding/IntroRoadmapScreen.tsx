import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = {
  onStart: () => void;
};

const months = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8'];

export function IntroRoadmapScreen({ onStart }: Props) {
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 1400,
      useNativeDriver: false
    }).start();
  }, [progress]);

  const widthInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <Text style={styles.title}>Your 8-Month French Journey</Text>
        <Text style={styles.subtitle}>Daily 25-minute sessions. Clear progress from beginner to CLB goals.</Text>

        <View style={styles.calendarCard}>
          <Text style={styles.calendarTitle}>Roadmap</Text>
          <View style={styles.monthRow}>
            {months.map((month) => (
              <View key={month} style={styles.monthBadge}>
                <Text style={styles.monthText}>{month}</Text>
              </View>
            ))}
          </View>
          <View style={styles.track}>
            <Animated.View style={[styles.trackFill, { width: widthInterpolate }]} />
          </View>
          <Text style={styles.meta}>230 sessions • 1 session/day • TEF & CLB aligned</Text>
        </View>

        <Pressable style={styles.cardHint} onPress={onStart}>
          <Text style={styles.cardHintText}>Tap below to start your path</Text>
        </Pressable>

        <Button label="Start" onPress={onStart} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
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
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center'
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg
  },
  calendarCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  calendarTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  monthRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm
  },
  monthBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4
  },
  monthText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700'
  },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
    overflow: 'hidden',
    marginBottom: spacing.sm
  },
  trackFill: {
    height: '100%',
    backgroundColor: colors.secondary
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary
  },
  cardHint: {
    alignItems: 'center',
    marginBottom: spacing.md
  },
  cardHintText: {
    ...typography.caption,
    color: colors.textSecondary
  }
});
