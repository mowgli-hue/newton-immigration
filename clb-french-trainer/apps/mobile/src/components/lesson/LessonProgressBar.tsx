import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';

type Props = {
  current: number;
  total: number;
};

export function LessonProgressBar({ current, total }: Props) {
  const pct = Math.max(0, Math.min(100, total > 0 ? Math.round((current / total) * 100) : 0));
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 260, useNativeDriver: false }).start();
  }, [anim, pct]);

  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.meta}>Progress</Text>
        <Text style={styles.metaStrong}>{pct}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  meta: { fontSize: 12, color: '#475569' },
  metaStrong: { fontSize: 12, color: '#0F172A', fontWeight: '700' },
  track: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 999
  }
});
