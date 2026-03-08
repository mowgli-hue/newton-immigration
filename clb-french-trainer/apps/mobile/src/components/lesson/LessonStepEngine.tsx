import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { LessonStep } from '../../types/LessonStepTypes';
import { LessonProgressBar } from './LessonProgressBar';
import { PhaseBadge } from './PhaseBadge';
import { StepContainer } from './StepContainer';

type Props = {
  step: LessonStep;
  stepIndex: number;
  totalSteps: number;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function LessonStepEngine({
  step,
  stepIndex,
  totalSteps,
  title,
  subtitle,
  onBack,
  children,
  footer
}: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.topArea}>
        <LessonProgressBar current={stepIndex + 1} total={totalSteps} />
        <View style={styles.row}>
          <PhaseBadge phase={step.phase} />
          {onBack ? (
            <Pressable onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ) : null}
        </View>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <StepContainer>{children}</StepContainer>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8FAFC'
  },
  topArea: {
    marginBottom: 10
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  backBtn: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF'
  },
  backText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600'
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    color: '#0F172A',
    fontWeight: '700'
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#475569'
  },
  footer: {
    marginTop: 10
  }
});
