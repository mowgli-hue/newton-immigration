import {
  curriculumLevelMap,
  curriculumLevels,
  curriculumModulesByLevel,
  getCurriculumLevel
} from '../curriculum/curriculumBlueprint';
import type {
  Level,
  LevelId,
  Lesson,
  LessonCompletionRecord,
  LevelProgressState,
  ProgressionDecision,
  SkillProgress,
  SkillFocus,
  UserCurriculumState
} from '../types/CurriculumTypes';

type CoreSkill = 'listening' | 'speaking' | 'reading' | 'writing';

const CORE_SKILLS: CoreSkill[] = ['listening', 'speaking', 'reading', 'writing'];

export function createEmptySkillProgress(): SkillProgress {
  return {
    listeningScore: 0,
    speakingScore: 0,
    readingScore: 0,
    writingScore: 0,
    timedPerformanceScore: 0
  };
}

export function createInitialLevelProgress(levelId: LevelId): LevelProgressState {
  const modules = curriculumModulesByLevel[levelId];
  const firstLessonId = modules[0]?.lessons[0]?.id;

  return {
    levelId,
    currentModuleId: modules[0]?.id,
    currentLessonId: firstLessonId,
    skillProgress: createEmptySkillProgress(),
    lessonRecords: {},
    unlockedLessonIds: firstLessonId ? [firstLessonId] : []
  };
}

export function createInitialCurriculumState(): UserCurriculumState {
  return {
    currentLevelId: 'foundation',
    journeyStartedAt: Date.now(),
    levels: {
      foundation: createInitialLevelProgress('foundation'),
      a1: createInitialLevelProgress('a1'),
      a2: createInitialLevelProgress('a2'),
      b1: createInitialLevelProgress('b1'),
      clb5: createInitialLevelProgress('clb5'),
      clb7: createInitialLevelProgress('clb7'),
      'tef-simulation': createInitialLevelProgress('tef-simulation')
    },
    performanceCoach: {
      targetClb: 5,
      lastEstimatedClb: null,
      weaknessCounts: {
        articles: 0,
        verbTense: 0,
        pronunciation: 0,
        wordOrder: 0
      },
      lastAdvice: null,
      updatedAt: null
    }
  };
}

function scoreForSkill(skillProgress: SkillProgress, skill: CoreSkill): number {
  switch (skill) {
    case 'listening':
      return skillProgress.listeningScore;
    case 'speaking':
      return skillProgress.speakingScore;
    case 'reading':
      return skillProgress.readingScore;
    case 'writing':
      return skillProgress.writingScore;
  }
}

export function getWeakestSkill(skillProgress: SkillProgress): {
  skill: CoreSkill;
  score: number;
} {
  let weakest: CoreSkill = 'listening';
  let weakestScore = skillProgress.listeningScore;

  for (const skill of CORE_SKILLS.slice(1)) {
    const score = scoreForSkill(skillProgress, skill);
    if (score < weakestScore) {
      weakest = skill;
      weakestScore = score;
    }
  }

  return { skill: weakest, score: weakestScore };
}

function calculateOverallScore(skillProgress: SkillProgress): number {
  const total =
    skillProgress.listeningScore +
    skillProgress.speakingScore +
    skillProgress.readingScore +
    skillProgress.writingScore;
  return Math.round(total / 4);
}

function hasAllLessonsPassed(levelProgress: LevelProgressState, levelId: LevelId): boolean {
  const modules = curriculumModulesByLevel[levelId];
  const allLessons = modules.flatMap((module) => module.lessons);

  return allLessons.every((lesson) => {
    const record = levelProgress.lessonRecords[lesson.id];
    if (!record?.passed) {
      return false;
    }

    if (lesson.productionRequired && !record.productionCompleted) {
      return false;
    }

    return true;
  });
}

function meetsLevelSkillThresholds(level: Level, skillProgress: SkillProgress): string[] {
  const unmet: string[] = [];
  const thresholds = level.masteryThresholds;
  const overall = calculateOverallScore(skillProgress);

  if (overall < thresholds.overallMinScore) {
    unmet.push(`Overall score ${overall} < required ${thresholds.overallMinScore}`);
  }

  if (skillProgress.listeningScore < thresholds.listeningMin) {
    unmet.push(`Listening ${skillProgress.listeningScore} < required ${thresholds.listeningMin}`);
  }

  if (skillProgress.speakingScore < thresholds.speakingMin) {
    unmet.push(`Speaking ${skillProgress.speakingScore} < required ${thresholds.speakingMin}`);
  }

  if (skillProgress.readingScore < thresholds.readingMin) {
    unmet.push(`Reading ${skillProgress.readingScore} < required ${thresholds.readingMin}`);
  }

  if (skillProgress.writingScore < thresholds.writingMin) {
    unmet.push(`Writing ${skillProgress.writingScore} < required ${thresholds.writingMin}`);
  }

  if (
    typeof thresholds.timedPerformanceMin === 'number' &&
    skillProgress.timedPerformanceScore < thresholds.timedPerformanceMin
  ) {
    unmet.push(
      `Timed performance ${skillProgress.timedPerformanceScore} < required ${thresholds.timedPerformanceMin}`
    );
  }

  return unmet;
}

export function evaluateLevelProgression(
  levelId: LevelId,
  levelProgress: LevelProgressState
): ProgressionDecision {
  const level = getCurriculumLevel(levelId);
  const weakest = getWeakestSkill(levelProgress.skillProgress);
  const unmetRequirements = meetsLevelSkillThresholds(level, levelProgress.skillProgress);

  if (!hasAllLessonsPassed(levelProgress, levelId)) {
    unmetRequirements.push('Not all lessons are passed with required production tasks completed.');
  }

  // CLB advancement must be controlled by the weakest skill (explicit rule).
  if ((levelId === 'clb5' || levelId === 'clb7') && weakest.score < level.masteryThresholds.overallMinScore) {
    unmetRequirements.push(
      `Weakest skill (${weakest.skill}) controls CLB advancement and is below readiness at ${weakest.score}.`
    );
  }

  return {
    canAdvanceLevel: unmetRequirements.length === 0,
    weakestSkill: weakest.skill,
    weakestSkillScore: weakest.score,
    unmetRequirements
  };
}

export function getNextLevelId(levelId: LevelId): LevelId | null {
  const order: LevelId[] = ['foundation', 'a1', 'a2', 'b1', 'clb5', 'clb7', 'tef-simulation'];
  const index = order.indexOf(levelId);
  if (index < 0 || index === order.length - 1) {
    return null;
  }

  return order[index + 1];
}

export function applyLessonCompletion(
  levelProgress: LevelProgressState,
  lesson: Lesson,
  payload: {
    masteryScore: number;
    productionCompleted: boolean;
    strictModeCompleted: boolean;
    skillScoreUpdates?: Partial<SkillProgress>;
    timedPerformanceScore?: number;
  }
): LevelProgressState {
  const passed = payload.masteryScore >= lesson.masteryThreshold && (!lesson.productionRequired || payload.productionCompleted);

  const nextSkillProgress: SkillProgress = {
    ...levelProgress.skillProgress,
    ...payload.skillScoreUpdates,
    timedPerformanceScore:
      typeof payload.timedPerformanceScore === 'number'
        ? payload.timedPerformanceScore
        : levelProgress.skillProgress.timedPerformanceScore
  };

  const record: LessonCompletionRecord = {
    lessonId: lesson.id,
    completed: true,
    passed,
    masteryScore: payload.masteryScore,
    productionCompleted: payload.productionCompleted,
    strictModeCompleted: payload.strictModeCompleted,
    completedAt: Date.now()
  };

  const updatedRecords = {
    ...levelProgress.lessonRecords,
    [lesson.id]: record
  };

  const unlockedLessonIds = computeUnlockedLessons(levelProgress.levelId, updatedRecords);
  const nextCurrentLessonId = pickNextUnlockedIncompleteLesson(levelProgress.levelId, unlockedLessonIds, updatedRecords);
  const nextCurrentModuleId = findModuleIdForLesson(levelProgress.levelId, nextCurrentLessonId) ?? levelProgress.currentModuleId;

  return {
    ...levelProgress,
    currentLessonId: nextCurrentLessonId,
    currentModuleId: nextCurrentModuleId,
    skillProgress: nextSkillProgress,
    lessonRecords: updatedRecords,
    unlockedLessonIds
  };
}

export function computeUnlockedLessons(
  levelId: LevelId,
  lessonRecords: Record<string, LessonCompletionRecord>
): string[] {
  const modules = curriculumModulesByLevel[levelId];
  const orderedLessons = modules.flatMap((module) => module.lessons);
  const unlocked: string[] = [];

  for (let i = 0; i < orderedLessons.length; i += 1) {
    const lesson = orderedLessons[i];

    if (i === 0) {
      unlocked.push(lesson.id);
      continue;
    }

    const prevLesson = orderedLessons[i - 1];
    const prevRecord = lessonRecords[prevLesson.id];

    if (prevRecord?.passed && (!prevLesson.productionRequired || prevRecord.productionCompleted)) {
      unlocked.push(lesson.id);
    } else {
      break;
    }
  }

  return unlocked;
}

export function canAccessLesson(levelProgress: LevelProgressState, lessonId: string): boolean {
  return levelProgress.unlockedLessonIds.includes(lessonId);
}

export function pickNextUnlockedIncompleteLesson(
  levelId: LevelId,
  unlockedLessonIds: string[],
  lessonRecords: Record<string, LessonCompletionRecord>
): string | undefined {
  const orderedLessons = curriculumModulesByLevel[levelId].flatMap((module) => module.lessons);

  return orderedLessons.find((lesson) => {
    if (!unlockedLessonIds.includes(lesson.id)) {
      return false;
    }

    return !lessonRecords[lesson.id]?.passed;
  })?.id;
}

export function findModuleIdForLesson(levelId: LevelId, lessonId?: string): string | undefined {
  if (!lessonId) {
    return undefined;
  }

  return curriculumModulesByLevel[levelId].find((module) => module.lessons.some((lesson) => lesson.id === lessonId))?.id;
}

export function canPromoteToNextLevel(userState: UserCurriculumState): ProgressionDecision {
  const current = userState.currentLevelId;
  return evaluateLevelProgression(current, userState.levels[current]);
}

// Firestore integration placeholder:
// export async function syncCurriculumProgressToFirestore(userId: string, state: UserCurriculumState) {
//   // Persist level state, skill scores, lesson completion, and timed metrics per user.
// }
