import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createInitialProgress, completeLesson, getDateKey, recordDailySession } from '../learning/engines';
import type { CEFRLevel, UserLearningProgress } from '../learning/types';
import { loadLearningProgress, saveLearningProgress } from '../services/progress/progressRepository';
import { useAuth } from './AuthContext';

type LearningProgressContextValue = {
  progress: UserLearningProgress | null;
  loading: boolean;
  markLessonComplete: (params: {
    lessonId: string;
    scorePercent: number;
    passed: boolean;
    nextLessonId?: string;
    level?: CEFRLevel;
  }) => Promise<void>;
  trackSessionComplete: (strictMode: boolean) => Promise<void>;
};

const LearningProgressContext = createContext<LearningProgressContextValue | undefined>(undefined);

export function LearningProgressProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserLearningProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!user?.uid) {
        if (mounted) {
          setProgress(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const existing = await loadLearningProgress(user.uid);
      const initial = existing ?? createInitialProgress(user.uid);

      if (mounted) {
        setProgress(initial);
        setLoading(false);
      }

      if (!existing) {
        await saveLearningProgress(initial);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  const persist = useCallback(async (nextProgress: UserLearningProgress) => {
    setProgress(nextProgress);
    await saveLearningProgress(nextProgress);
  }, []);

  const markLessonComplete = useCallback<LearningProgressContextValue['markLessonComplete']>(
    async (params) => {
      if (!progress) {
        return;
      }

      const next = completeLesson(progress, params);
      await persist(next);
    },
    [persist, progress]
  );

  const trackSessionComplete = useCallback<LearningProgressContextValue['trackSessionComplete']>(
    async (strictMode) => {
      if (!progress) {
        return;
      }

      const next = recordDailySession(progress, {
        dateKey: getDateKey(),
        strictMode
      });

      await persist(next);
    },
    [persist, progress]
  );

  const value = useMemo<LearningProgressContextValue>(
    () => ({
      progress,
      loading,
      markLessonComplete,
      trackSessionComplete
    }),
    [progress, loading, markLessonComplete, trackSessionComplete]
  );

  return <LearningProgressContext.Provider value={value}>{children}</LearningProgressContext.Provider>;
}

export function useLearningProgress() {
  const context = useContext(LearningProgressContext);

  if (!context) {
    throw new Error('useLearningProgress must be used inside LearningProgressProvider');
  }

  return context;
}
