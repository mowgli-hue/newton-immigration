import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from './AuthContext';
import {
  curriculumModulesByLevel,
  getCurriculumLevel,
  getLessonById as getCurriculumLessonById,
  getModulesForLevel
} from '../curriculum/curriculumBlueprint';
import {
  applyLessonCompletion,
  canAccessLesson,
  createInitialCurriculumState,
  evaluateLevelProgression,
  getNextLevelId,
  getWeakestSkill
} from '../engine/ProgressionEngine';
import { generateSessionPlan } from '../engine/SessionGenerator';
import type {
  LevelCertificate,
  LevelId,
  Lesson,
  ProgressionDecision,
  SessionPlan,
  SkillFocus,
  SkillProgress,
  UserCurriculumState
} from '../types/CurriculumTypes';
import { loadCloudCurriculumState, saveCloudCurriculumState } from '../services/cloud/userStateRepository';

type CompleteLessonPayload = {
  lessonId: string;
  masteryScore: number;
  productionCompleted: boolean;
  strictModeCompleted: boolean;
  skillScoreUpdates?: Partial<SkillProgress>;
  timedPerformanceScore?: number;
};

type LessonUiState = {
  lesson: Lesson;
  locked: boolean;
  completed: boolean;
  passed: boolean;
  isCurrent: boolean;
};

type GenerateTodaySessionInput = {
  strictMode?: boolean;
  skillFocus?: SkillFocus;
};

type PerformanceWeaknessKey = 'articles' | 'verbTense' | 'pronunciation' | 'wordOrder';
type RecordPerformanceFeedbackPayload = {
  estimatedClb: number;
  targetClb: 5 | 7;
  weaknesses: PerformanceWeaknessKey[];
  advice: string;
};

type CurriculumProgressContextValue = {
  curriculumState: UserCurriculumState;
  currentLevel: ReturnType<typeof getCurriculumLevel>;
  currentModule: ReturnType<typeof getModulesForLevel>[number] | null;
  currentModuleLessons: LessonUiState[];
  todaySessionPlan: SessionPlan | null;
  earnedCertificates: LevelCertificate[];
  canChooseStartingLevel: boolean;
  completeLesson: (payload: CompleteLessonPayload) => void;
  canUnlockNextLevel: () => ProgressionDecision;
  generateTodaySession: (input?: GenerateTodaySessionInput) => SessionPlan;
  setStartingLevel: (levelId: LevelId) => void;
  recordPerformanceFeedback: (payload: RecordPerformanceFeedbackPayload) => void;
};

const CurriculumProgressContext = createContext<CurriculumProgressContextValue | undefined>(undefined);
const CURRICULUM_PROGRESS_STORAGE_KEY = 'clb:curriculum-progress:v1';
const CERTIFICATES_STORAGE_KEY = 'clb:level-certificates:v1';

function defaultSessionFocusForCurrentLevel(state: UserCurriculumState): SkillFocus {
  const currentLevelProgress = state.levels[state.currentLevelId];
  const weakest = getWeakestSkill(currentLevelProgress.skillProgress);
  return weakest.skill;
}

export function CurriculumProgressProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [curriculumState, setCurriculumState] = useState<UserCurriculumState>(() => createInitialCurriculumState());
  const [todaySessionPlan, setTodaySessionPlan] = useState<SessionPlan | null>(null);
  const [earnedCertificates, setEarnedCertificates] = useState<LevelCertificate[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const progressStorageKey = `${CURRICULUM_PROGRESS_STORAGE_KEY}:${user?.uid ?? 'guest'}`;
  const certificatesStorageKey = `${CERTIFICATES_STORAGE_KEY}:${user?.uid ?? 'guest'}`;

  useEffect(() => {
    let mounted = true;
    setHydrated(false);
    setTodaySessionPlan(null);
    setCurriculumState(createInitialCurriculumState());
    setEarnedCertificates([]);

    (async () => {
      try {
        const cloud = user?.uid
          ? await loadCloudCurriculumState<UserCurriculumState, LevelCertificate[]>(user.uid)
          : null;

        if (cloud && mounted) {
          const parsed = cloud.curriculumState;
          const fallback = createInitialCurriculumState();
          setCurriculumState({
            ...parsed,
            journeyStartedAt: typeof parsed.journeyStartedAt === 'number' ? parsed.journeyStartedAt : fallback.journeyStartedAt,
            performanceCoach: parsed.performanceCoach ?? createInitialCurriculumState().performanceCoach
          });
          setEarnedCertificates(cloud.earnedCertificates ?? []);
          await Promise.all([
            AsyncStorage.setItem(progressStorageKey, JSON.stringify(parsed)),
            AsyncStorage.setItem(certificatesStorageKey, JSON.stringify(cloud.earnedCertificates ?? []))
          ]);
          if (mounted) setHydrated(true);
          return;
        }

        const [rawProgress, rawCertificates] = await Promise.all([
          AsyncStorage.getItem(progressStorageKey),
          AsyncStorage.getItem(certificatesStorageKey)
        ]);

        if (rawProgress && mounted) {
          const parsed = JSON.parse(rawProgress) as UserCurriculumState;
          const fallback = createInitialCurriculumState();
          setCurriculumState({
            ...parsed,
            journeyStartedAt: typeof parsed.journeyStartedAt === 'number' ? parsed.journeyStartedAt : fallback.journeyStartedAt,
            performanceCoach: parsed.performanceCoach ?? createInitialCurriculumState().performanceCoach
          });
        }

        if (rawCertificates && mounted) {
          setEarnedCertificates(JSON.parse(rawCertificates) as LevelCertificate[]);
        }

        if (mounted) setHydrated(true);
      } catch {
        if (mounted) setHydrated(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [progressStorageKey, certificatesStorageKey]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void AsyncStorage.setItem(progressStorageKey, JSON.stringify(curriculumState));
    if (user?.uid) {
      void saveCloudCurriculumState(user.uid, {
        curriculumState,
        earnedCertificates
      }).catch(() => undefined);
    }
  }, [curriculumState, earnedCertificates, hydrated, progressStorageKey, user?.uid]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void AsyncStorage.setItem(certificatesStorageKey, JSON.stringify(earnedCertificates));
  }, [earnedCertificates, hydrated, certificatesStorageKey]);

  const currentLevelId = curriculumState.currentLevelId;
  const currentLevel = getCurriculumLevel(currentLevelId);
  const currentLevelProgress = curriculumState.levels[currentLevelId];
  const modules = getModulesForLevel(currentLevelId);

  const currentModule = useMemo(() => {
    if (!modules.length) {
      return null;
    }

    if (!currentLevelProgress.currentModuleId) {
      return modules[0];
    }

    return modules.find((module) => module.id === currentLevelProgress.currentModuleId) ?? modules[0];
  }, [modules, currentLevelProgress.currentModuleId]);

  const currentModuleLessons = useMemo<LessonUiState[]>(() => {
    if (!currentModule) {
      return [];
    }

    return currentModule.lessons.map((lesson) => {
      const record = currentLevelProgress.lessonRecords[lesson.id];
      const unlocked = canAccessLesson(currentLevelProgress, lesson.id);

      return {
        lesson,
        locked: !unlocked,
        completed: Boolean(record?.completed),
        passed: Boolean(record?.passed),
        isCurrent: currentLevelProgress.currentLessonId === lesson.id
      };
    });
  }, [currentModule, currentLevelProgress]);

  const canChooseStartingLevel = useMemo(() => {
    return Object.values(curriculumState.levels).every((levelState) => Object.keys(levelState.lessonRecords).length === 0);
  }, [curriculumState.levels]);

  const canUnlockNextLevel = useCallback((): ProgressionDecision => {
    return evaluateLevelProgression(currentLevelId, curriculumState.levels[currentLevelId]);
  }, [curriculumState.levels, currentLevelId]);

  const completeLesson = useCallback((payload: CompleteLessonPayload) => {
    setCurriculumState((prev) => {
      const levelId = prev.currentLevelId;
      const levelProgress = prev.levels[levelId];
      const lesson = getCurriculumLessonById(payload.lessonId);

      if (!lesson || lesson.moduleId == null) {
        return prev;
      }

      const levelModules = curriculumModulesByLevel[levelId];
      const lessonBelongsToCurrentLevel = levelModules.some((module) => module.lessons.some((item) => item.id === lesson.id));

      if (!lessonBelongsToCurrentLevel) {
        return prev;
      }

      if (!canAccessLesson(levelProgress, lesson.id)) {
        return prev;
      }

      const updatedLevelProgress = applyLessonCompletion(levelProgress, lesson, payload);
      const nextState: UserCurriculumState = {
        ...prev,
        levels: {
          ...prev.levels,
          [levelId]: updatedLevelProgress
        }
      };

      const decision = evaluateLevelProgression(levelId, updatedLevelProgress);
      const nextLevelId = getNextLevelId(levelId);

      if (decision.canAdvanceLevel && nextLevelId) {
        setEarnedCertificates((prevCertificates) => {
          if (prevCertificates.some((c) => c.levelId === levelId)) {
            return prevCertificates;
          }
          const levelInfo = getCurriculumLevel(levelId);
          return [
            {
              id: `cert-${levelId}-${Date.now()}`,
              levelId,
              levelTitle: levelInfo.title,
              issuedAt: Date.now(),
              certificateLabel: `${levelInfo.title} Completion Certificate`
            },
            ...prevCertificates
          ];
        });
        return {
          ...nextState,
          currentLevelId: nextLevelId
        };
      }

      return nextState;
    });
  }, []);

  const generateTodaySession = useCallback(
    (input?: GenerateTodaySessionInput): SessionPlan => {
      const strictMode = input?.strictMode ?? true;
      const skillFocus = input?.skillFocus ?? defaultSessionFocusForCurrentLevel(curriculumState);

      const plan = generateSessionPlan({
        userLevel: curriculumState.currentLevelId,
        skillFocus,
        strictMode
      });

      setTodaySessionPlan(plan);
      return plan;
    },
    [curriculumState]
  );

  const setStartingLevel = useCallback((levelId: LevelId) => {
    setCurriculumState((prev) => {
      const untouched = Object.values(prev.levels).every((levelState) => Object.keys(levelState.lessonRecords).length === 0);
      if (!untouched) {
        return prev;
      }

      return {
        ...prev,
        currentLevelId: levelId
      };
    });
  }, []);

  const recordPerformanceFeedback = useCallback((payload: RecordPerformanceFeedbackPayload) => {
    setCurriculumState((prev) => {
      const current = prev.performanceCoach ?? createInitialCurriculumState().performanceCoach;
      const nextWeaknessCounts = { ...current.weaknessCounts };

      payload.weaknesses.forEach((key) => {
        nextWeaknessCounts[key] += 1;
      });

      return {
        ...prev,
        performanceCoach: {
          targetClb: payload.targetClb,
          lastEstimatedClb: payload.estimatedClb,
          weaknessCounts: nextWeaknessCounts,
          lastAdvice: payload.advice,
          updatedAt: Date.now()
        }
      };
    });
  }, []);

  const value = useMemo<CurriculumProgressContextValue>(
    () => ({
      curriculumState,
      currentLevel,
      currentModule,
      currentModuleLessons,
      todaySessionPlan,
      earnedCertificates,
      canChooseStartingLevel,
      completeLesson,
      canUnlockNextLevel,
      generateTodaySession,
      setStartingLevel,
      recordPerformanceFeedback
    }),
    [
      curriculumState,
      currentLevel,
      currentModule,
      currentModuleLessons,
      todaySessionPlan,
      earnedCertificates,
      canChooseStartingLevel,
      completeLesson,
      canUnlockNextLevel,
      generateTodaySession,
      setStartingLevel,
      recordPerformanceFeedback
    ]
  );

  return <CurriculumProgressContext.Provider value={value}>{children}</CurriculumProgressContext.Provider>;
}

export function useCurriculumProgress() {
  const context = useContext(CurriculumProgressContext);

  if (!context) {
    throw new Error('useCurriculumProgress must be used inside CurriculumProgressProvider');
  }

  return context;
}

// Firestore placeholder:
// Persist curriculumState and daily session plans per authenticated user when cloud sync is enabled.
