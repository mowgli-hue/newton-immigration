import type { CEFRLevel, UserLearningProgress } from '../types';

export function createInitialProgress(userId: string): UserLearningProgress {
  return {
    userId,
    currentLevel: 'Foundation',
    completedLessons: {},
    unlockedLessons: ['foundation-0-1'],
    dailyRecords: {},
    updatedAt: Date.now()
  };
}

export function completeLesson(
  progress: UserLearningProgress,
  params: {
    lessonId: string;
    scorePercent: number;
    passed: boolean;
    nextLessonId?: string;
    level?: CEFRLevel;
  }
): UserLearningProgress {
  const nextUnlocked = params.passed && params.nextLessonId
    ? Array.from(new Set([...progress.unlockedLessons, params.nextLessonId]))
    : progress.unlockedLessons;

  return {
    ...progress,
    currentLevel: params.level ?? progress.currentLevel,
    completedLessons: {
      ...progress.completedLessons,
      [params.lessonId]: {
        lessonId: params.lessonId,
        scorePercent: params.scorePercent,
        passed: params.passed,
        completedAt: Date.now()
      }
    },
    unlockedLessons: nextUnlocked,
    lastLessonId: params.lessonId,
    updatedAt: Date.now()
  };
}

export function recordDailySession(
  progress: UserLearningProgress,
  params: { dateKey: string; strictMode: boolean }
): UserLearningProgress {
  const existing = progress.dailyRecords[params.dateKey] ?? {
    dateKey: params.dateKey,
    sessionsCompleted: 0,
    strictSessionsCompleted: 0
  };

  const nextRecord = {
    ...existing,
    sessionsCompleted: existing.sessionsCompleted + 1,
    strictSessionsCompleted: existing.strictSessionsCompleted + (params.strictMode ? 1 : 0)
  };

  return {
    ...progress,
    dailyRecords: {
      ...progress.dailyRecords,
      [params.dateKey]: nextRecord
    },
    updatedAt: Date.now()
  };
}

export function getDateKey(input = new Date()): string {
  const year = input.getFullYear();
  const month = `${input.getMonth() + 1}`.padStart(2, '0');
  const day = `${input.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}
