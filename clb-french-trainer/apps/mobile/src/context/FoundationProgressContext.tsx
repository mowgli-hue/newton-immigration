import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from './AuthContext';
import { foundationLessons } from '../data/foundationLessons';

type FoundationProgressContextValue = {
  completedLessonIds: string[];
  markLessonComplete: (lessonId: string) => void;
  resetFoundationProgress: () => void;
  totalLessons: number;
};

const FoundationProgressContext = createContext<FoundationProgressContextValue | undefined>(undefined);
const FOUNDATION_PROGRESS_STORAGE_KEY = 'clb:foundation-progress:v1';

export function FoundationProgressProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const storageKey = `${FOUNDATION_PROGRESS_STORAGE_KEY}:${user?.uid ?? 'guest'}`;

  useEffect(() => {
    let mounted = true;
    setHydrated(false);
    setCompletedLessonIds([]);
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw && mounted) {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) {
            setCompletedLessonIds(parsed.filter((v): v is string => typeof v === 'string'));
          }
        }
      } catch {
        // ignore load errors
      } finally {
        if (mounted) setHydrated(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(storageKey, JSON.stringify(completedLessonIds));
  }, [hydrated, completedLessonIds, storageKey]);

  const value = useMemo<FoundationProgressContextValue>(
    () => ({
      completedLessonIds,
      markLessonComplete(lessonId: string) {
        setCompletedLessonIds((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));
      },
      resetFoundationProgress() {
        setCompletedLessonIds([]);
      },
      totalLessons: foundationLessons.length
    }),
    [completedLessonIds]
  );

  return <FoundationProgressContext.Provider value={value}>{children}</FoundationProgressContext.Provider>;
}

export function useFoundationProgress() {
  const context = useContext(FoundationProgressContext);

  if (!context) {
    throw new Error('useFoundationProgress must be used inside FoundationProgressProvider');
  }

  return context;
}
