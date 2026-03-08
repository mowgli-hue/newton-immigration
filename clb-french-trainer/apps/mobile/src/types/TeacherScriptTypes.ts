import type { LevelId } from './CurriculumTypes';

export type ScriptStepType = 'intro' | 'teach' | 'practice' | 'production' | 'miniTest' | 'wrapUp';

export type ScriptExercisePlan = {
  id: string;
  prompt: string;
  expectedAnswer: string;
  teacherExplanation: string;
  remediationPrompt?: string;
  points?: number;
};

export type ScriptStep = {
  id: string;
  stepType: ScriptStepType;
  title: string;
  durationMinutes: number;
  teacherTalkTrack: string[];
  learnerActions: string[];
  exercises?: ScriptExercisePlan[];
};

export type TeacherScriptVideoSegment = {
  title: string;
  timestampStart: string;
  timestampEnd: string;
  objective: string;
};

export type TeacherLessonScript = {
  lessonId: string;
  lessonTitle: string;
  levelId: LevelId;
  targetMinutes: number;
  teachingObjective: string;
  scriptSteps: ScriptStep[];
  masteryThresholdPercent: number;
  retryPolicy: string;
  commonMistakesToCoach: string[];
  checkpointRubric: string[];
  youtubeRecordingOutline: TeacherScriptVideoSegment[];
};

