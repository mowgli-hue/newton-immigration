import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'ModuleReviewScreen'>;

export function ModuleReviewScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <Card>
          <Text style={styles.title}>Module Review (Placeholder)</Text>
          <Text style={styles.subtitle}>Quick review screen placeholder so the progression path can continue.</Text>
          <View style={styles.actions}>
            <Button label="Level Unlock" onPress={() => (navigation.navigate as any)('LevelUnlockScreen')} />
            <Button label="Back to Learning Hub" variant="outline" onPress={() => (navigation.navigate as any)('LearningHubScreen')} />
          </View>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacing.xl },
  container: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  title: { ...typography.heading2, marginBottom: spacing.sm },
  subtitle: { ...typography.body, marginBottom: spacing.lg },
  actions: { gap: spacing.sm }
});
