import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Tone = 'success' | 'warning' | 'neutral';

type Props = {
  message: string;
  tone?: Tone;
};

export function MicroFeedback({ message, tone = 'neutral' }: Props) {
  return (
    <View style={[styles.box, tone === 'success' && styles.success, tone === 'warning' && styles.warning]}>
      <Text style={[styles.text, tone === 'success' && styles.successText, tone === 'warning' && styles.warningText]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  success: {
    borderColor: '#86EFAC',
    backgroundColor: '#ECFDF5'
  },
  warning: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2'
  },
  text: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '500'
  },
  successText: {
    color: '#166534'
  },
  warningText: {
    color: '#991B1B'
  }
});
