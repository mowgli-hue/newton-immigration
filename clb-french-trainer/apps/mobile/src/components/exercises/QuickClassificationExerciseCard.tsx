import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../Button';
import { Card } from '../Card';
import type { QuickClassificationExercise } from '../../types/LessonContentTypes';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = {
  exercise: QuickClassificationExercise;
  disabled?: boolean;
  onSubmit: (assignments: Array<{ itemId: string; categoryId: string }>) => void;
};

export function QuickClassificationExerciseCard({ exercise, disabled, onSubmit }: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(exercise.categories[0]?.id ?? null);
  const [assignmentsMap, setAssignmentsMap] = useState<Record<string, string>>({});

  const assignments = useMemo(
    () => Object.entries(assignmentsMap).map(([itemId, categoryId]) => ({ itemId, categoryId })),
    [assignmentsMap]
  );

  return (
    <Card>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      {exercise.instructions ? <Text style={styles.instructions}>{exercise.instructions}</Text> : null}

      <Text style={styles.sectionLabel}>Choose category</Text>
      <View style={styles.categoryRow}>
        {exercise.categories.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => !disabled && setSelectedCategoryId(category.id)}
            style={[styles.categoryChip, selectedCategoryId === category.id && styles.categoryChipSelected]}
          >
            <Text style={[styles.categoryChipText, selectedCategoryId === category.id && styles.categoryChipTextSelected]}>
              {category.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Classify items</Text>
      <View style={styles.itemsWrap}>
        {exercise.items.map((item) => {
          const assignedCategory = exercise.categories.find((c) => c.id === assignmentsMap[item.id]);
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                if (disabled || !selectedCategoryId) return;
                setAssignmentsMap((prev) => ({ ...prev, [item.id]: selectedCategoryId }));
              }}
              style={styles.itemRow}
            >
              <View style={styles.itemTextWrap}>
                <Text style={styles.itemText}>{item.label}</Text>
              </View>
              <View style={[styles.assignmentBadge, assignedCategory && styles.assignmentBadgeAssigned]}>
                <Text style={[styles.assignmentBadgeText, assignedCategory && styles.assignmentBadgeTextAssigned]}>
                  {assignedCategory?.label ?? 'Unassigned'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Button
        label="Check Classification"
        variant="outline"
        onPress={() => onSubmit(assignments)}
        disabled={disabled || assignments.length !== exercise.items.length}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  prompt: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  instructions: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.secondary,
    marginBottom: spacing.xs
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.white
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  categoryChipText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700'
  },
  categoryChipTextSelected: {
    color: colors.white
  },
  itemsWrap: {
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  itemRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  itemTextWrap: {
    flex: 1
  },
  itemText: {
    ...typography.body,
    color: colors.textPrimary
  },
  assignmentBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
    paddingVertical: 4,
    paddingHorizontal: 10
  },
  assignmentBadgeAssigned: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF'
  },
  assignmentBadgeText: {
    ...typography.caption,
    color: colors.textSecondary
  },
  assignmentBadgeTextAssigned: {
    color: colors.primary,
    fontWeight: '700'
  }
});

