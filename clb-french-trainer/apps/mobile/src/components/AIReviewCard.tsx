import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  estimatedClb: number | null;
  targetClb: 5 | 7;
  strongestSkill: string;
  weakestSkill: string;
  insight: string;
};

export function AIReviewCard({
  estimatedClb,
  targetClb,
  strongestSkill,
  weakestSkill,
  insight
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Your AI Performance Review</Text>

      {estimatedClb == null ? (
        <Text style={styles.emptyText}>
          Complete a speaking or writing task to unlock your AI performance review.
        </Text>
      ) : (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>Estimated Current CLB</Text>
            <Text style={styles.value}>CLB {estimatedClb}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Target CLB</Text>
            <Text style={styles.value}>CLB {targetClb}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Strongest Skill</Text>
            <Text style={styles.value}>{strongestSkill}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Weakest Skill</Text>
            <Text style={styles.value}>{weakestSkill}</Text>
          </View>
          <View style={styles.insightWrap}>
            <Text style={styles.insightLabel}>AI Insight</Text>
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F3F8FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 12
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  label: {
    fontSize: 13,
    color: '#475569'
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A'
  },
  insightWrap: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    padding: 10
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 4
  },
  insightText: {
    fontSize: 13,
    color: '#334155'
  },
  emptyText: {
    fontSize: 13,
    color: '#475569'
  }
});
