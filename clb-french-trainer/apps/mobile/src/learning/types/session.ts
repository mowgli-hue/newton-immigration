export type FocusBlockType = 'teaching' | 'practice' | 'production' | 'miniTest';

export type FocusBlock = {
  id: FocusBlockType;
  title: string;
  description: string;
  completed: boolean;
};

export type SessionPhase = 'focus' | 'break' | 'done';

export type FocusSessionState = {
  lessonId: string;
  strictMode: boolean;
  phase: SessionPhase;
  isRunning: boolean;
  focusSecondsRemaining: number;
  breakSecondsRemaining: number;
  currentBlockIndex: number;
  blocks: FocusBlock[];
  startedAt?: number;
  completedAt?: number;
};
