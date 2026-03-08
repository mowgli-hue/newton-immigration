export type LearningTelemetryEventType =
  | 'lesson_started'
  | 'lesson_completed'
  | 'exercise_submitted'
  | 'retry_round_started'
  | 'retry_round_completed'
  | 'ai_assessment'
  | 'temporary_approval_used'
  | 'recording_analysis_failed'
  | 'recording_analysis_succeeded';

export type LearningTelemetryEvent = {
  id: string;
  timestamp: number;
  type: LearningTelemetryEventType;
  levelId?: string;
  moduleId?: string;
  lessonId?: string;
  exerciseId?: string;
  skill?: 'listening' | 'speaking' | 'reading' | 'writing' | 'integrated';
  correct?: boolean;
  retryMode?: boolean;
  scorePercent?: number;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export type LearningTelemetrySnapshot = {
  events: LearningTelemetryEvent[];
};

export type PerformanceAnalysis = {
  activity: {
    eventsLast7Days: number;
    lessonsStartedLast7Days: number;
    lessonsCompletedLast7Days: number;
  };
  quality: {
    exerciseAccuracyPercent: number;
    retryRatePercent: number;
    temporaryApprovalCount: number;
    speakingAiAverage: number | null;
    writingAiAverage: number | null;
  };
  integrity: {
    confidence: 'high' | 'medium' | 'low';
    signals: string[];
  };
  guidanceTargets: Array<'listening' | 'speaking' | 'reading' | 'writing' | 'review'>;
  summary: string;
};

