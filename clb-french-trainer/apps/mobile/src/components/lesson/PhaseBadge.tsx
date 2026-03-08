import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { LessonPhase } from '../../types/LessonStepTypes';

const badgeMap: Record<LessonPhase, { label: string; bg: string; border: string; text: string }> = {
  learn: { label: 'Learn', bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
  listen: { label: 'Listen', bg: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9' },
  speak: { label: 'Speak', bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
  practice: { label: 'Practice', bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' },
  review: { label: 'Review', bg: '#FFFBEB', border: '#FDE68A', text: '#A16207' }
};

type Props = { phase: LessonPhase };

export function PhaseBadge({ phase }: Props) {
  const s = badgeMap[phase];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg, borderColor: s.border }]}> 
      <Text style={[styles.label, { color: s.text }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start'
  },
  label: {
    fontSize: 12,
    fontWeight: '700'
  }
});
