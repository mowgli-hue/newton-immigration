import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'BeginnerFoundationScreen'>;

export function BeginnerFoundationScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <Card>
          <Text style={styles.title}>A1 Beginner Foundation</Text>
          <Text style={styles.message}>Foundation path recommended.</Text>
          <Text style={styles.subtitle}>
            We will start with alphabet basics, essential vocabulary, and core sentence patterns before full diagnostic evaluation.
          </Text>

          <View style={styles.actions}>
            <Button label="Start Foundation" onPress={() => navigation.navigate('A1FoundationScreen')} />
            <Button label="Re-take Self Assessment" variant="outline" onPress={() => navigation.replace('SelfAssessmentScreen')} />
          </View>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.xl
  },
  container: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center'
  },
  title: {
    ...typography.heading2,
    marginBottom: spacing.sm
  },
  message: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginBottom: spacing.sm
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl
  },
  actions: {
    gap: spacing.sm
  }
});
