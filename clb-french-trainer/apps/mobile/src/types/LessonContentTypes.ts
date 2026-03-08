import type { LevelId, SkillFocus } from './CurriculumTypes';

export type LessonBlockType = 'teach' | 'practice' | 'production' | 'miniTest';
export type ExerciseKind =
  | 'multipleChoice'
  | 'matchingPairs'
  | 'memoryMatch'
  | 'sentenceOrderPuzzle'
  | 'quickClassification'
  | 'shortAnswer'
  | 'listeningPrompt'
  | 'speakingPrompt'
  | 'readingComprehension'
  | 'writingPrompt';

export type LessonMode = 'foundation' | 'guided' | 'exam-bridge' | 'simulation';

export type CompanionHint = {
  title?: string;
  message: string;
  retryPrompt?: string;
};

export type TeachingSegment = {
  id: string;
  title: string;
  explanation: string;
  examples: string[];
  companionTip?: string;
  funFact?: string;
  pronunciationCues?: string[];
};

type ExerciseBase = {
  id: string;
  kind: ExerciseKind;
  prompt: string;
  skillFocus: SkillFocus;
  points: number;
  hint?: CompanionHint;
  remediationTag?: string;
};

export type MultipleChoiceExercise = ExerciseBase & {
  kind: 'multipleChoice' | 'listeningPrompt' | 'readingComprehension';
  options: string[];
  correctOptionIndex: number;
  explanationOnCorrect?: string;
  explanationOnWrong: string;
  audioText?: string;
  readingPassage?: string;
};

export type MatchingPairExercise = ExerciseBase & {
  kind: 'matchingPairs';
  leftItems: Array<{ id: string; label: string }>;
  rightItems: Array<{ id: string; label: string }>;
  correctPairs: Array<{ leftId: string; rightId: string }>;
  instructions?: string;
  explanationOnWrong: string;
};

export type MemoryMatchExercise = ExerciseBase & {
  kind: 'memoryMatch';
  pairs: Array<{ id: string; left: string; right: string }>;
  instructions?: string;
  explanationOnWrong: string;
};

export type SentenceOrderPuzzleExercise = ExerciseBase & {
  kind: 'sentenceOrderPuzzle';
  tokens: string[];
  correctOrder: string[];
  instructions?: string;
  explanationOnWrong: string;
  allowExtraPunctuation?: boolean;
};

export type QuickClassificationExercise = ExerciseBase & {
  kind: 'quickClassification';
  instructions?: string;
  categories: Array<{ id: string; label: string }>;
  items: Array<{ id: string; label: string; correctCategoryId: string }>;
  explanationOnWrong: string;
};

export type ShortAnswerExercise = ExerciseBase & {
  kind: 'shortAnswer';
  acceptedAnswers: string[];
  normalizeAccents?: boolean;
  explanationOnWrong: string;
};

export type SpeakingPromptExercise = ExerciseBase & {
  kind: 'speakingPrompt';
  expectedPatterns: string[];
  minWords?: number;
  targetDurationSeconds?: number;
  rubricFocus: Array<'pronunciation' | 'fluency' | 'grammar' | 'taskCompletion'>;
  sampleAnswer: string;
  fallbackTextEvaluationAllowed?: boolean;
};

export type WritingPromptExercise = ExerciseBase & {
  kind: 'writingPrompt';
  expectedElements: string[];
  minWords: number;
  rubricFocus: Array<'grammar' | 'coherence' | 'vocabulary' | 'taskCompletion'>;
  sampleAnswer: string;
};

export type Exercise =
  | MultipleChoiceExercise
  | MatchingPairExercise
  | MemoryMatchExercise
  | SentenceOrderPuzzleExercise
  | QuickClassificationExercise
  | ShortAnswerExercise
  | SpeakingPromptExercise
  | WritingPromptExercise;

export type ProductionTask = {
  id: string;
  title: string;
  instructions: string;
  mode: 'spoken' | 'written' | 'mixed';
  mandatory: boolean;
  targetMinutes: number;
  exercise: SpeakingPromptExercise | WritingPromptExercise;
};

export type LessonBlock = {
  id: string;
  type: LessonBlockType;
  title: string;
  targetMinutes: number;
  objectives: string[];
  teachingSegments?: TeachingSegment[];
  exercises?: Exercise[];
  productionTask?: ProductionTask;
  requiresCompletionToAdvance: boolean;
};

export type LessonAssessmentPolicy = {
  masteryThresholdPercent: number;
  productionRequired: boolean;
  retryIncorrectLater: boolean;
  strictSequential: boolean;
};

export type LessonAIFeedbackHooks = {
  companionPersonaHookId?: string;
  speakingAssessmentHookId?: string;
  writingCorrectionHookId?: string;
  dynamicExplanationHookId?: string;
};

export type StructuredLessonContent = {
  id: string;
  curriculumLessonId?: string;
  levelId: LevelId;
  moduleId: string;
  title: string;
  estimatedMinutes: 25;
  mode: LessonMode;
  outcomes: string[];
  vocabularyTargets: string[];
  grammarTargets: string[];
  blocks: [LessonBlock, LessonBlock, LessonBlock, LessonBlock];
  assessment: LessonAssessmentPolicy;
  aiHooks?: LessonAIFeedbackHooks;
};

export type ExerciseEvaluationResult = {
  correct: boolean;
  earnedPoints: number;
  maxPoints: number;
  feedback: string;
  companionHint?: string;
  shouldRetryLater: boolean;
};

export type LessonSessionExerciseState = {
  exerciseId: string;
  attempts: number;
  completed: boolean;
  correct: boolean;
  earnedPoints: number;
  maxPoints: number;
  queuedForRetry: boolean;
  lastFeedback?: string;
};

export type LessonSessionState = {
  lessonId: string;
  blockIndex: number;
  exerciseIndex: number;
  blockCompletion: Record<string, boolean>;
  productionCompleted: boolean;
  exerciseStates: Record<string, LessonSessionExerciseState>;
  retryQueue: string[];
  totalEarnedPoints: number;
  totalAvailablePoints: number;
  status: 'inProgress' | 'needsRetryRound' | 'passed' | 'failed';
};

export type GeneratedDailyTrackPlan = {
  startLevel: LevelId;
  durationMonths: number;
  minimumDailySessions: number;
  phases: Array<{
    monthRange: string;
    focusLevel: string;
    goals: string[];
    expectedMilestones: string[];
  }>;
};
