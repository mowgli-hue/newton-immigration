export type ClbTarget = 5 | 7;

export type ExamSkill = 'listening' | 'speaking' | 'reading' | 'writing';

export interface SkillScore {
  skill: ExamSkill;
  value: number;
  max: number;
}
