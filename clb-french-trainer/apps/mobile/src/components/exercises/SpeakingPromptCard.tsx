import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../Button';
import { Card } from '../Card';
import { InputField } from '../InputField';
import type { SpeakingPromptExercise } from '../../types/LessonContentTypes';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = {
  exercise: SpeakingPromptExercise;
  transcriptText: string;
  disabled?: boolean;
  isRecording?: boolean;
  recordingStatusText?: string;
  onChangeTranscript: (value: string) => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onSubmit: () => void;
};

export function SpeakingPromptCard({
  exercise,
  transcriptText,
  disabled,
  isRecording = false,
  recordingStatusText,
  onChangeTranscript,
  onStartRecording,
  onStopRecording,
  onSubmit
}: Props) {
  return (
    <Card>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      <Text style={styles.meta}>
        Speaking check (AI-ready placeholder). Future upgrade: voice recording + pronunciation scoring.
      </Text>

      <View style={styles.row}>
        {isRecording ? (
          <Button label="Stop Recording" variant="outline" onPress={onStopRecording ?? (() => undefined)} />
        ) : (
          <Button label="Start Recording" variant="outline" onPress={onStartRecording ?? (() => undefined)} />
        )}
      </View>
      {recordingStatusText ? <Text style={styles.meta}>{recordingStatusText}</Text> : null}

      <InputField
        label="Transcript / What you said"
        value={transcriptText}
        onChangeText={onChangeTranscript}
        placeholder="Type what you said (temporary until speech input is enabled)"
        autoCapitalize="sentences"
        autoCorrect={false}
        multiline
        style={styles.multiline}
      />

      <View style={styles.row}>
        <Button label="Check Speaking Response" onPress={onSubmit} disabled={disabled || !transcriptText.trim()} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  prompt: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md
  },
  row: {
    marginBottom: spacing.sm
  },
  multiline: {
    minHeight: 96
  }
});
