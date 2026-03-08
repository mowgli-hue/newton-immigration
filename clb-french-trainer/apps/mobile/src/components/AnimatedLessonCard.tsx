import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = {
  title: string;
  subtitle: string;
  statusText: string;
  locked: boolean;
  current?: boolean;
  onPress?: () => void;
};

export function AnimatedLessonCard({ title, subtitle, statusText, locked, current = false, onPress }: Props) {
  const opacity = useRef(new Animated.Value(locked ? 0.75 : 1)).current;
  const scale = useRef(new Animated.Value(locked ? 0.985 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: locked ? 0.7 : 1,
        duration: 220,
        useNativeDriver: true
      }),
      Animated.spring(scale, {
        toValue: locked ? 0.985 : 1,
        friction: 8,
        tension: 70,
        useNativeDriver: true
      })
    ]).start();
  }, [locked, opacity, scale]);

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <Pressable
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.card, locked && styles.locked, current && styles.current, pressed && onPress ? styles.pressed : undefined]}
      >
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text style={styles.status}>{statusText}</Text>
        </View>
        <View style={[styles.dot, locked ? styles.dotLocked : current ? styles.dotCurrent : styles.dotOpen]} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  locked: {
    backgroundColor: colors.backgroundLight
  },
  current: {
    borderColor: colors.secondary,
    backgroundColor: '#EFF6FF'
  },
  pressed: {
    transform: [{ scale: 0.995 }]
  },
  textWrap: {
    flex: 1,
    paddingRight: spacing.md
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  status: {
    ...typography.caption,
    color: colors.secondary,
    marginTop: spacing.xs,
    fontWeight: '600'
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  dotLocked: {
    backgroundColor: colors.border
  },
  dotCurrent: {
    backgroundColor: colors.primary
  },
  dotOpen: {
    backgroundColor: '#16A34A'
  }
});
