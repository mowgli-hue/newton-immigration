import type { CEFRLevel } from './lesson';

export type LessonProgress = {
  lessonId: string;
  scorePercent: number;
  passed: boolean;
  completedAt: number;
};

export type DailySessionRecord = {
  dateKey: string;
  sessionsCompleted: number;
  strictSessionsCompleted: number;
};

export type UserLearningProgress = {
  userId: string;
  currentLevel: CEFRLevel;
  completedLessons: Record<string, LessonProgress>;
  unlockedLessons: string[];
  dailyRecords: Record<string, DailySessionRecord>;
  lastLessonId?: string;
  updatedAt: number;
};
