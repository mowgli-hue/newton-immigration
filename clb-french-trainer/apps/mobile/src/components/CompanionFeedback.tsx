import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Tone = 'neutral' | 'success' | 'warning';

type Props = {
  title?: string;
  message: string;
  visible?: boolean;
  tone?: Tone;
};

export function CompanionFeedback({ title = 'Companion Insight', message, visible = true, tone = 'neutral' }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 240,
        useNativeDriver: true
      }),
      Animated.timing(translateX, {
        toValue: visible ? 0 : 18,
        duration: 240,
        useNativeDriver: true
      })
    ]).start();
  }, [opacity, translateX, visible]);

  const toneStyle = tone === 'success'
    ? { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }
    : tone === 'warning'
      ? { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }
      : { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' };

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      <View style={[styles.card, toneStyle]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md
  },
  title: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginBottom: spacing.xs
  },
  message: {
    ...typography.caption,
    color: colors.textSecondary
  }
});
