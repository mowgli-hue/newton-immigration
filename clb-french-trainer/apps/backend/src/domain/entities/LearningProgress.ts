export type SkillName = 'listening' | 'speaking' | 'reading' | 'writing';

export type LearningProgress = {
  userId: string;
  skill: SkillName;
  score: number;
  clbEstimate: number;
  updatedAt: string;
};
