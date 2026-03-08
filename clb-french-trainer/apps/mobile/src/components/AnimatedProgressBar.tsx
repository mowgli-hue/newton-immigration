import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = {
  label?: string;
  value: number;
  max?: number;
  height?: number;
  showValue?: boolean;
  color?: string;
};

export function AnimatedProgressBar({
  label,
  value,
  max = 100,
  height = 8,
  showValue = true,
  color = colors.secondary
}: Props) {
  const progress = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const anim = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 350,
      useNativeDriver: false
    }).start();
  }, [anim, progress]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.wrap}>
      {(label || showValue) ? (
        <View style={styles.row}>
          <Text style={styles.label}>{label ?? ''}</Text>
          {showValue ? <Text style={styles.value}>{Math.round(progress * 100)}%</Text> : null}
        </View>
      ) : null}
      <View style={[styles.track, { height }]}> 
        <Animated.View style={[styles.fill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    gap: spacing.sm
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary
  },
  value: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  track: {
    width: '100%',
    backgroundColor: colors.border,
    borderRadius: 999,
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    borderRadius: 999
  }
});
