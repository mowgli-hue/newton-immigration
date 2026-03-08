export type LessonPhase = 'learn' | 'listen' | 'speak' | 'practice' | 'review';

export type LessonStepKind =
  | 'activation'
  | 'intro'
  | 'learn_segment'
  | 'exercise'
  | 'review_block'
  | 'completion';

export type LessonStep = {
  id: string;
  kind: LessonStepKind;
  phase: LessonPhase;
  title: string;
  subtitle?: string;
  blockIndex?: number;
  exerciseId?: string;
  segmentId?: string;
};
