import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'StudyPlanIntroScreen'>;

export function StudyPlanIntroScreen({ navigation, route }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <Card>
          <Text style={styles.step}>Step 4 of 5</Text>
          <Text style={styles.title}>Your training structure</Text>

          <View style={styles.structureCard}>
            <Text style={styles.structureTitle}>25-minute guided sessions:</Text>
            <Text style={styles.structureLine}>• Activation</Text>
            <Text style={styles.structureLine}>• Teaching</Text>
            <Text style={styles.structureLine}>• Practice</Text>
            <Text style={styles.structureLine}>• Speaking production</Text>
            <Text style={styles.structureLine}>• Mastery check</Text>
          </View>

          <Text style={styles.subtitle}>One focused session per day builds measurable progress.</Text>

          <Button
            label="Continue"
            onPress={() =>
              navigation.navigate('DiagnosticResultScreen', {
                goalType: route.params.goalType,
                selfLevel: route.params.selfLevel
              })
            }
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
    marginBottom: spacing.lg
  },
  structureCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8FBFF',
    padding: spacing.md,
    marginBottom: spacing.lg
  },
  structureTitle: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginBottom: spacing.sm
  },
  structureLine: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl
  }
});
