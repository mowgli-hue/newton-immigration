import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from './AuthContext';
import type { LessonNotesState } from '../types/LessonNotesTypes';

const STORAGE_KEY = 'clb:lesson-notes:v1';

type VisitPayload = {
  lessonId: string;
  lessonTitle?: string;
  levelId?: string;
  objectives?: string[];
  grammarTargets?: string[];
  teacherSummary?: string;
  vocabulary?: string[];
};

type ErrorPayload = {
  lessonId: string;
  exerciseId?: string;
  prompt?: string;
  message: string;
};

type AIFeedbackPayload = {
  lessonId: string;
  type: 'speaking' | 'writing';
  title: string;
  scorePercent: number;
  lines: string[];
};

type LessonNotesContextValue = {
  state: LessonNotesState;
  markLessonVisit: (payload: VisitPayload) => void;
  markLessonComplete: (payload: { lessonId: string }) => void;
  recordError: (payload: ErrorPayload) => void;
  recordAIFeedback: (payload: AIFeedbackPayload) => void;
  getRecentNotes: () => Array<LessonNotesState['byLessonId'][string]>;
};

const LessonNotesContext = createContext<LessonNotesContextValue | undefined>(undefined);

const initialState: LessonNotesState = { byLessonId: {}, recentLessonIds: [] };

function upsertRecent(recent: string[], lessonId: string): string[] {
  return [lessonId, ...recent.filter((id) => id !== lessonId)].slice(0, 20);
}

function normalizeLessonNotesState(input: unknown): LessonNotesState {
  if (!input || typeof input !== 'object') {
    return initialState;
  }

  const raw = input as Partial<LessonNotesState>;
  const byLessonIdRaw = raw.byLessonId && typeof raw.byLessonId === 'object' ? raw.byLessonId : {};
  const byLessonId: LessonNotesState['byLessonId'] = {};

  Object.entries(byLessonIdRaw as Record<string, any>).forEach(([lessonId, note]) => {
    if (!note || typeof note !== 'object') {
      return;
    }

    byLessonId[lessonId] = {
      lessonId,
      lessonTitle: typeof note.lessonTitle === 'string' ? note.lessonTitle : undefined,
      levelId: typeof note.levelId === 'string' ? note.levelId : undefined,
      objectives: Array.isArray(note.objectives) ? note.objectives.filter((v: unknown) => typeof v === 'string') : [],
      grammarTargets: Array.isArray(note.grammarTargets) ? note.grammarTargets.filter((v: unknown) => typeof v === 'string') : [],
      teacherSummary: typeof note.teacherSummary === 'string' ? note.teacherSummary : undefined,
      visitedAt: typeof note.visitedAt === 'number' ? note.visitedAt : undefined,
      completedAt: typeof note.completedAt === 'number' ? note.completedAt : undefined,
      vocabulary: Array.isArray(note.vocabulary) ? note.vocabulary.filter((v: unknown) => typeof v === 'string') : [],
      errors: Array.isArray(note.errors) ? note.errors : [],
      aiFeedback: Array.isArray(note.aiFeedback) ? note.aiFeedback : []
    };
  });

  const recentLessonIds = Array.isArray(raw.recentLessonIds)
    ? raw.recentLessonIds.filter((id): id is string => typeof id === 'string' && Boolean(byLessonId[id])).slice(0, 20)
    : [];

  return {
    byLessonId,
    recentLessonIds
  };
}

export function LessonNotesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<LessonNotesState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const storageKey = `${STORAGE_KEY}:${user?.uid ?? 'guest'}`;

  useEffect(() => {
    let mounted = true;
    setHydrated(false);
    setState(initialState);
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw && mounted) {
          setState(normalizeLessonNotesState(JSON.parse(raw)));
        }
      } catch {
        // ignore parse/storage errors locally for now
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
    void AsyncStorage.setItem(storageKey, JSON.stringify(state));
  }, [hydrated, state, storageKey]);

  const markLessonVisit = useCallback((payload: VisitPayload) => {
    setState((prev) => {
      const existing = prev.byLessonId[payload.lessonId];
      const next = {
        lessonId: payload.lessonId,
        lessonTitle: payload.lessonTitle ?? existing?.lessonTitle,
        levelId: payload.levelId ?? existing?.levelId,
        objectives: Array.from(new Set([...(existing?.objectives ?? []), ...(payload.objectives ?? [])])).slice(0, 8),
        grammarTargets: Array.from(new Set([...(existing?.grammarTargets ?? []), ...(payload.grammarTargets ?? [])])).slice(
          0,
          8
        ),
        teacherSummary: payload.teacherSummary ?? existing?.teacherSummary,
        visitedAt: Date.now(),
        completedAt: existing?.completedAt,
        vocabulary: Array.from(new Set([...(existing?.vocabulary ?? []), ...(payload.vocabulary ?? [])])),
        errors: existing?.errors ?? [],
        aiFeedback: existing?.aiFeedback ?? []
      };
      return {
        byLessonId: { ...prev.byLessonId, [payload.lessonId]: next },
        recentLessonIds: upsertRecent(prev.recentLessonIds, payload.lessonId)
      };
    });
  }, []);

  const markLessonComplete = useCallback((payload: { lessonId: string }) => {
    setState((prev) => {
      const existing = prev.byLessonId[payload.lessonId];
      if (!existing) return prev;
      return {
        ...prev,
        byLessonId: {
          ...prev.byLessonId,
          [payload.lessonId]: { ...existing, completedAt: Date.now() }
        }
      };
    });
  }, []);

  const recordError = useCallback((payload: ErrorPayload) => {
    setState((prev) => {
      const existing = prev.byLessonId[payload.lessonId] ?? {
        lessonId: payload.lessonId,
        objectives: [],
        grammarTargets: [],
        vocabulary: [],
        errors: [],
        aiFeedback: []
      };
      const error = {
        id: `${payload.lessonId}-err-${Date.now()}`,
        exerciseId: payload.exerciseId,
        prompt: payload.prompt,
        message: payload.message,
        createdAt: Date.now()
      };
      return {
        byLessonId: {
          ...prev.byLessonId,
          [payload.lessonId]: {
            ...existing,
            errors: [...existing.errors, error].slice(-25)
          }
        },
        recentLessonIds: upsertRecent(prev.recentLessonIds, payload.lessonId)
      };
    });
  }, []);

  const recordAIFeedback = useCallback((payload: AIFeedbackPayload) => {
    setState((prev) => {
      const existing = prev.byLessonId[payload.lessonId] ?? {
        lessonId: payload.lessonId,
        objectives: [],
        grammarTargets: [],
        vocabulary: [],
        errors: [],
        aiFeedback: []
      };
      const entry = {
        id: `${payload.lessonId}-ai-${Date.now()}`,
        type: payload.type,
        title: payload.title,
        scorePercent: payload.scorePercent,
        lines: payload.lines.slice(0, 12),
        createdAt: Date.now()
      };
      return {
        byLessonId: {
          ...prev.byLessonId,
          [payload.lessonId]: {
            ...existing,
            aiFeedback: [entry, ...existing.aiFeedback].slice(0, 15)
          }
        },
        recentLessonIds: upsertRecent(prev.recentLessonIds, payload.lessonId)
      };
    });
  }, []);

  const getRecentNotes = useCallback(() => {
    return state.recentLessonIds.map((id) => state.byLessonId[id]).filter(Boolean);
  }, [state]);

  const value = useMemo<LessonNotesContextValue>(
    () => ({ state, markLessonVisit, markLessonComplete, recordError, recordAIFeedback, getRecentNotes }),
    [state, markLessonVisit, markLessonComplete, recordError, recordAIFeedback, getRecentNotes]
  );

  return <LessonNotesContext.Provider value={value}>{children}</LessonNotesContext.Provider>;
}

export function useLessonNotes() {
  const ctx = useContext(LessonNotesContext);
  if (!ctx) throw new Error('useLessonNotes must be used within LessonNotesProvider');
  return ctx;
}
