import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'LevelUnlockScreen'>;

export function LevelUnlockScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <Card>
          <Text style={styles.badge}>Progression</Text>
          <Text style={styles.title}>Level Unlock (Placeholder)</Text>
          <Text style={styles.subtitle}>This placeholder lets you continue building the unlock flow next.</Text>
          <Button label="Return to Learning Hub" onPress={() => (navigation.navigate as any)('LearningHubScreen')} />
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacing.xl },
  container: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  badge: { ...typography.caption, color: colors.secondary, fontWeight: '700', marginBottom: spacing.xs },
  title: { ...typography.heading2, marginBottom: spacing.sm },
  subtitle: { ...typography.body, marginBottom: spacing.lg },
});
