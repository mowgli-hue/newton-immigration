import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  correctness?: 'correct' | 'wrong' | null;
  onPress: () => void;
};

export function OptionButton({ label, selected = false, disabled = false, correctness = null, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        selected && styles.selected,
        correctness === 'correct' && styles.correct,
        correctness === 'wrong' && styles.wrong,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled
      ]}
    >
      <View style={styles.dot} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  selected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF'
  },
  correct: {
    borderColor: '#22C55E',
    backgroundColor: '#ECFDF5'
  },
  wrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2'
  },
  pressed: {
    transform: [{ scale: 0.985 }]
  },
  disabled: {
    opacity: 0.7
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#93C5FD'
  },
  label: {
    flex: 1,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '500'
  }
});
