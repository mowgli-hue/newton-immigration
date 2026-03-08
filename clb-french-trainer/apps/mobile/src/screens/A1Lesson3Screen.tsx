import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { StructuredLessonScreen } from './StructuredLessonScreen';
import { useAuth } from '../context/AuthContext';
import { useCurriculumProgress } from '../context/CurriculumProgressContext';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { sendLessonCompletionEmail } from '../services/notifications/notificationEmailService';

type Props = NativeStackScreenProps<MainStackParamList, 'A1Lesson3Screen'>;

export function A1Lesson3Screen({ navigation }: Props) {
  const { user } = useAuth();
  const { completeLesson } = useCurriculumProgress();

  return (
    <StructuredLessonScreen
      lessonId="a1-lesson-3"
      onComplete={({ passed, scorePercent }) => {
        if (passed) {
          completeLesson({
            lessonId: 'a1-lesson-3',
            masteryScore: scorePercent,
            productionCompleted: true,
            strictModeCompleted: false,
            skillScoreUpdates: {
              listeningScore: Math.max(70, scorePercent - 5),
              speakingScore: Math.max(75, scorePercent),
              writingScore: Math.max(72, scorePercent - 3)
            }
          });
        }

        if (passed) {
          if (user?.email) {
            void sendLessonCompletionEmail({
              userId: user?.uid ?? 'guest',
              email: user.email,
              displayName: user?.displayName ?? undefined,
              lessonId: 'a1-lesson-3',
              lessonTitle: 'A1 Lesson 3',
              scorePercent,
              nextLessonId: 'a1-lesson-4'
            }).catch(() => undefined);
          }

          (navigation.navigate as any)('PathMapScreen', {
            completionSummary: {
              completedLessonId: 'a1-lesson-3',
              completedLessonScore: scorePercent,
              nextLessonId: 'a1-lesson-4'
            }
          });
          return;
        }

        (navigation.navigate as any)('LearningHubScreen');
      }}
    />
  );
}
