import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = {
  onNext: () => void;
};

export function IntroBrandScreen({ onNext }: Props) {
  const scale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.04, duration: 850, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 850, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  return (
    <View style={styles.root}>
      <Pressable onPress={onNext} style={styles.fullPress}>
        <Animated.View style={[styles.brandWrap, { transform: [{ scale }] }]}>
          <View style={styles.markCircle}>
            <Text style={styles.markEmoji}>🍁</Text>
          </View>
          <Text style={styles.brandName}>FRANCO</Text>
          <Text style={styles.tagline}>Make French interesting.</Text>
          <Text style={styles.tapHint}>Tap to continue</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white
  },
  fullPress: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl
  },
  brandWrap: {
    alignItems: 'center'
  },
  markCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    borderColor: '#93C5FD',
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg
  },
  markEmoji: {
    fontSize: 40
  },
  brandName: {
    ...typography.heading1,
    color: colors.primary,
    letterSpacing: 2.4,
    marginBottom: spacing.sm
  },
  tagline: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xl
  },
  tapHint: {
    ...typography.caption,
    color: colors.textSecondary
  }
});
