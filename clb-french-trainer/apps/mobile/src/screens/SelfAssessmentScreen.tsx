import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import type { MainStackParamList } from '../navigation/AppNavigator';
import type { OnboardingGoalType } from '../navigation/routePersistence';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'SelfAssessmentScreen'>;

type GoalOption = {
  id: OnboardingGoalType;
  label: string;
};

const goalOptions: GoalOption[] = [
  { id: 'tef_canada', label: 'TEF Canada exam' },
  { id: 'express_entry_points', label: 'Express Entry language points' },
  { id: 'workplace_french', label: 'Workplace French' },
  { id: 'personal_fluency', label: 'Personal fluency' }
];

export function SelfAssessmentScreen({ navigation }: Props) {
  const [selectedGoal, setSelectedGoal] = useState<OnboardingGoalType | null>(null);

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <Card>
          <Text style={styles.step}>Step 2 of 5</Text>
          <Text style={styles.title}>What are you preparing for?</Text>
          <Text style={styles.subtitle}>Choose one focus so your path can be personalized.</Text>

          <View style={styles.optionList}>
            {goalOptions.map((option) => {
              const selected = selectedGoal === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setSelectedGoal(option.id)}
                  style={[styles.optionCard, selected && styles.optionCardSelected]}
                >
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Button
            label="Continue"
            disabled={!selectedGoal}
            onPress={() => {
              if (!selectedGoal) return;
              navigation.navigate('DiagnosticFlowScreen', { goalType: selectedGoal });
            }}
          />
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'center'
  },
  container: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center'
  },
  step: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg
  },
  optionList: {
    gap: spacing.sm,
    marginBottom: spacing.xl
  },
  optionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
    minHeight: 64,
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  optionCardSelected: {
    borderColor: colors.secondary,
    backgroundColor: '#EEF4FF'
  },
  optionLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary
  },
  optionLabelSelected: {
    color: colors.primary
  }
});
