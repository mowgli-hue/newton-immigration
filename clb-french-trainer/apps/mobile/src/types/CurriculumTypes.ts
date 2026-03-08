export type StageType = 'foundation' | 'cefr' | 'clb-target' | 'tef-simulation';

export type SkillFocus = 'listening' | 'speaking' | 'reading' | 'writing' | 'integrated';

export type LevelId = 'foundation' | 'a1' | 'a2' | 'b1' | 'clb5' | 'clb7' | 'tef-simulation';

export type SessionBlockType = 'teach' | 'practice' | 'production' | 'miniTest';
export type StructuredQuestionType = 'multipleChoice' | 'fillBlank' | 'match' | 'shortAnswer';

export type SessionBlockTemplate = {
  type: SessionBlockType;
  minutes: number;
  focus: SkillFocus | 'integrated';
  purpose: string;
};

export type SessionStructure = {
  totalMinutes: 25;
  blocks: [SessionBlockTemplate, SessionBlockTemplate, SessionBlockTemplate, SessionBlockTemplate];
  reviewMinutes: number;
};

export type MasteryThresholds = {
  overallMinScore: number;
  listeningMin: number;
  speakingMin: number;
  readingMin: number;
  writingMin: number;
  timedPerformanceMin?: number;
  productionTaskRequired: boolean;
};

export interface Level {
  id: LevelId;
  title: string;
  stageType: StageType;
  objectives: string[];
  grammarTargets: string[];
  vocabularyThemes: string[];
  listeningGoals: string[];
  speakingGoals: string[];
  writingGoals: string[];
  masteryThresholds: MasteryThresholds;
  sessionStructure: SessionStructure;
}

export interface Lesson {
  id: string;
  moduleId: string;
  objectives: string[];
  skillFocus: SkillFocus[];
  productionRequired: boolean;
  masteryThreshold: number;
  teachingSections?: LessonTeachingSection[];
  controlledPractice?: LessonQuestion[];
  productionTask?: LessonProductionTask;
  miniMasteryTest?: LessonQuestion[];
  companionCorrectionHookId?: string;
}

export type LessonTeachingSection = {
  id: string;
  title: string;
  keyPoints: string[];
  examples: string[];
};

export type LessonQuestion = {
  id: string;
  type: StructuredQuestionType;
  prompt: string;
  options?: string[];
  expectedAnswer: string | string[];
  skillFocus: SkillFocus;
};

export type LessonProductionTask = {
  id: string;
  prompt: string;
  mode: 'spoken' | 'written' | 'mixed';
  mandatory: boolean;
  companionCorrectionHookId?: string;
};

export interface Module {
  id: string;
  levelId: LevelId;
  title: string;
  lessons: Lesson[];
}

export type SkillProgress = {
  listeningScore: number;
  speakingScore: number;
  writingScore: number;
  readingScore: number;
  timedPerformanceScore: number;
};

export type LessonCompletionRecord = {
  lessonId: string;
  completed: boolean;
  passed: boolean;
  masteryScore: number;
  productionCompleted: boolean;
  strictModeCompleted: boolean;
  completedAt?: number;
};

export type LevelProgressState = {
  levelId: LevelId;
  currentModuleId?: string;
  currentLessonId?: string;
  skillProgress: SkillProgress;
  lessonRecords: Record<string, LessonCompletionRecord>;
  unlockedLessonIds: string[];
};

export type UserCurriculumState = {
  currentLevelId: LevelId;
  journeyStartedAt: number;
  levels: Record<LevelId, LevelProgressState>;
  performanceCoach: {
    targetClb: 5 | 7;
    lastEstimatedClb: number | null;
    weaknessCounts: {
      articles: number;
      verbTense: number;
      pronunciation: number;
      wordOrder: number;
    };
    lastAdvice: string | null;
    updatedAt: number | null;
  };
};

export type LevelCertificate = {
  id: string;
  levelId: LevelId;
  levelTitle: string;
  issuedAt: number;
  certificateLabel: string;
};

export type ProgressionDecision = {
  canAdvanceLevel: boolean;
  weakestSkill: Exclude<SkillFocus, 'integrated'>;
  weakestSkillScore: number;
  unmetRequirements: string[];
};

export type SessionPlanBlock = {
  type: SessionBlockType;
  title: string;
  minutes: number;
  skillFocus: SkillFocus | 'integrated';
  goals: string[];
  strictRules: string[];
};

export type SessionPlan = {
  levelId: LevelId;
  skillFocus: SkillFocus;
  strictMode: boolean;
  totalMinutes: number;
  blocks: SessionPlanBlock[];
  notes: string[];
};
