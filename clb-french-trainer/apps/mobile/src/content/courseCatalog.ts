import type { LevelId, SkillFocus } from '../types/CurriculumTypes';

export type CourseModuleManifest = {
  id: string;
  levelId: LevelId;
  title: string;
  purpose: string;
  targetWeeks: number;
  lessonCount: number;
  dominantSkills: SkillFocus[];
  includesAI: Array<'writing-correction' | 'speaking-check' | 'pronunciation' | 'dynamic-explanation'>;
};

export const courseCatalog: CourseModuleManifest[] = [
  {
    id: 'foundation-module-0',
    levelId: 'foundation',
    title: 'Module 0: Absolute Beginner Foundation',
    purpose: 'Build zero-level survival French before CEFR A1 progression',
    targetWeeks: 2,
    lessonCount: 8,
    dominantSkills: ['speaking', 'listening', 'reading'],
    includesAI: ['speaking-check', 'dynamic-explanation']
  },
  {
    id: 'a1-core-module-1',
    levelId: 'a1',
    title: 'A1 Core Module 1: Identity and Daily Basics',
    purpose: 'Establish core grammar patterns and simple everyday communication',
    targetWeeks: 4,
    lessonCount: 12,
    dominantSkills: ['speaking', 'reading', 'writing', 'listening'],
    includesAI: ['writing-correction', 'speaking-check', 'dynamic-explanation']
  },
  {
    id: 'a1-core-module-2',
    levelId: 'a1',
    title: 'A1 Core Module 2: Services and Routine',
    purpose: 'Practice appointments, shopping, transport, and daily routines',
    targetWeeks: 4,
    lessonCount: 12,
    dominantSkills: ['listening', 'speaking', 'writing'],
    includesAI: ['writing-correction', 'speaking-check']
  },
  {
    id: 'a2-module-1',
    levelId: 'a2',
    title: 'A2 Module 1: Everyday Problem Solving',
    purpose: 'Move from memorized language to flexible everyday communication',
    targetWeeks: 6,
    lessonCount: 40,
    dominantSkills: ['listening', 'speaking', 'reading', 'writing'],
    includesAI: ['writing-correction', 'speaking-check', 'dynamic-explanation']
  },
  {
    id: 'b1-module-1',
    levelId: 'b1',
    title: 'B1 Module 1: Functional Independence',
    purpose: 'Build coherent responses in work, housing, and community contexts',
    targetWeeks: 8,
    lessonCount: 40,
    dominantSkills: ['speaking', 'writing', 'reading', 'listening'],
    includesAI: ['writing-correction', 'speaking-check', 'dynamic-explanation']
  },
  {
    id: 'clb5-target-module',
    levelId: 'clb5',
    title: 'CLB 5 Target Module',
    purpose: 'Benchmark-focused practical communication and TEF bridge tasks',
    targetWeeks: 6,
    lessonCount: 40,
    dominantSkills: ['listening', 'speaking', 'writing', 'reading'],
    includesAI: ['writing-correction', 'speaking-check', 'pronunciation', 'dynamic-explanation']
  },
  {
    id: 'clb7-target-module',
    levelId: 'clb7',
    title: 'CLB 7 Target Module',
    purpose: 'Advanced task performance for immigration and professional communication',
    targetWeeks: 8,
    lessonCount: 40,
    dominantSkills: ['speaking', 'writing', 'listening', 'reading'],
    includesAI: ['writing-correction', 'speaking-check', 'pronunciation', 'dynamic-explanation']
  },
  {
    id: 'tef-simulation-lab',
    levelId: 'tef-simulation',
    title: 'TEF Canada Simulation Lab',
    purpose: 'Timed simulations, scoring, and weak-skill remediation',
    targetWeeks: 4,
    lessonCount: 20,
    dominantSkills: ['listening', 'speaking', 'reading', 'writing'],
    includesAI: ['writing-correction', 'speaking-check', 'pronunciation']
  }
];
