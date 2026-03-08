import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = {
  totalSeconds: number;
  remainingSeconds: number;
  label?: string;
  size?: number;
};

function formatMmSs(seconds: number) {
  const m = Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, '0');
  const s = Math.floor(Math.max(0, seconds) % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function CircularSessionTimer({ totalSeconds, remainingSeconds, label = 'Session', size = 92 }: Props) {
  const progress = totalSeconds > 0 ? Math.max(0, Math.min(1, remainingSeconds / totalSeconds)) : 0;
  const anim = useRef(new Animated.Value(progress)).current;
  const [progressValue, setProgressValue] = useState(progress);

  useEffect(() => {
    const id = anim.addListener(({ value }) => setProgressValue(value));
    return () => anim.removeListener(id);
  }, [anim]);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false
    }).start();
  }, [anim, progress]);

  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = useMemo(() => circumference * (1 - progressValue), [circumference, progressValue]);

  return (
    <View style={styles.wrap}>
      <View style={styles.ringWrap}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.border} strokeWidth={strokeWidth} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.secondary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.center}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.time}>{formatMmSs(remainingSeconds)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  center: {
    position: 'absolute',
    alignItems: 'center'
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary
  },
  time: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: spacing.xs
  }
});
