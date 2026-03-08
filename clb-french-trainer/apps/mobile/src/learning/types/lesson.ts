export type CEFRLevel = 'Foundation' | 'A1' | 'A2' | 'B1' | 'B2';
export type CLBTarget = 'CLB5' | 'CLB7';

export type LessonExerciseType = 'multipleChoice' | 'matching' | 'ordering' | 'shortAnswer';

export type LessonExercise = {
  id: string;
  type: LessonExerciseType;
  prompt: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
};

export type ProductionTask = {
  prompt: string;
  expectedOutput: 'spoken' | 'written' | 'mixed';
  checklist: string[];
};

export type Lesson = {
  id: string;
  level: CEFRLevel;
  module: string;
  objectives: string[];
  teachingContent: {
    title: string;
    body: string;
    examples: string[];
    companionTip?: string;
  }[];
  exercises: LessonExercise[];
  productionTask: ProductionTask;
  miniTest: LessonExercise[];
  masteryThreshold: number;
};

export type LessonSummary = {
  id: string;
  level: CEFRLevel;
  module: string;
  title: string;
  objectives: string[];
};
