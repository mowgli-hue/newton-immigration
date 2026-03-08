import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import type { Companion } from '../context/CompanionContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = {
  companion: Companion;
  speaking?: boolean;
  subtitle?: string;
};

export function AITeacherAvatar({ companion, speaking = false, subtitle }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: speaking ? 1.06 : 1.02, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true })
      ])
    );

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -3, duration: 900, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 900, useNativeDriver: true })
      ])
    );

    pulseLoop.start();
    floatLoop.start();

    return () => {
      pulseLoop.stop();
      floatLoop.stop();
    };
  }, [floatY, pulse, speaking]);

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.outerRing, { transform: [{ scale: pulse }] }]} />
      <Animated.View style={[styles.avatarCore, { transform: [{ translateY: floatY }] }]}>
        <Text style={styles.emoji}>{companion.emoji}</Text>
      </Animated.View>
      <Text style={styles.name}>{companion.name}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  outerRing: {
    position: 'absolute',
    top: 4,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#DBEAFE'
  },
  avatarCore: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: spacing.sm
  },
  emoji: {
    fontSize: 30
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center'
  }
});
