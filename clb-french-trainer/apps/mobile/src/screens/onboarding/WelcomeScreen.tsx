import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../../components/Button';
import type { MainStackParamList } from '../../navigation/AppNavigator';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'WelcomeScreen'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.gradientLayer} pointerEvents="none" />
      <View style={styles.content}>
        <Text style={styles.headline}>Build your Canadian French performance.</Text>
        <Text style={styles.subtext}>
          Structured 25-minute sessions aligned with CLB and TEF standards.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button label="Start" onPress={() => navigation.navigate('SelfAssessmentScreen')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FBFF',
    padding: spacing.xl,
    justifyContent: 'space-between'
  },
  gradientLayer: {
    position: 'absolute',
    top: -160,
    right: -120,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: '#DBEAFE',
    opacity: 0.55
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 560,
    alignSelf: 'center',
    width: '100%'
  },
  headline: {
    ...typography.heading1,
    color: colors.textPrimary,
    fontSize: 36,
    lineHeight: 44,
    marginBottom: spacing.md
  },
  subtext: {
    ...typography.body,
    color: colors.textSecondary,
    maxWidth: 520
  },
  footer: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center'
  }
});
