export type LessonErrorNote = {
  id: string;
  exerciseId?: string;
  prompt?: string;
  message: string;
  createdAt: number;
};

export type LessonAIFeedbackNote = {
  id: string;
  type: 'speaking' | 'writing';
  title: string;
  scorePercent: number;
  lines: string[];
  createdAt: number;
};

export type LessonNotesRecord = {
  lessonId: string;
  lessonTitle?: string;
  levelId?: string;
  objectives: string[];
  grammarTargets: string[];
  teacherSummary?: string;
  visitedAt?: number;
  completedAt?: number;
  vocabulary: string[];
  errors: LessonErrorNote[];
  aiFeedback: LessonAIFeedbackNote[];
};

export type LessonNotesState = {
  byLessonId: Record<string, LessonNotesRecord>;
  recentLessonIds: string[];
};
