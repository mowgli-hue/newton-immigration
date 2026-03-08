import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type FocusTimerProps = {
  totalSeconds: number;
  remainingSeconds: number;
  phaseLabel: string;
};

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

export function FocusTimer({ totalSeconds, remainingSeconds, phaseLabel }: FocusTimerProps) {
  const progress = totalSeconds > 0 ? Math.max(0, Math.min(1, remainingSeconds / totalSeconds)) : 0;

  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.wrapper}>
      <View style={styles.circleWrap}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.secondary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.centerContent}>
          <Text style={styles.phaseText}>{phaseLabel}</Text>
          <Text style={styles.timeText}>{formatTime(remainingSeconds)}</Text>
        </View>
      </View>
      <Text style={styles.caption}>Disciplined session flow: 25 min focus + 5 min break.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: spacing.xl
  },
  circleWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center'
  },
  phaseText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  timeText: {
    ...typography.heading2,
    color: colors.textPrimary
  },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center'
  }
});
