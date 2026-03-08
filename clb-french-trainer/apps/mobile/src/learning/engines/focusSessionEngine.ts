import type { FocusBlock, FocusBlockType, FocusSessionState } from '../types';

export const FOCUS_DURATION_SECONDS = 25 * 60;
export const BREAK_DURATION_SECONDS = 5 * 60;

const DEFAULT_BLOCKS: Array<{ id: FocusBlockType; title: string; description: string }> = [
  { id: 'teaching', title: 'Teaching', description: 'Understand the key concept with guided instruction.' },
  { id: 'practice', title: 'Practice', description: 'Apply what you learned with controlled exercises.' },
  { id: 'production', title: 'Production', description: 'Create output independently in French.' },
  { id: 'miniTest', title: 'Mini Test', description: 'Validate mastery with a short checkpoint.' }
];

function makeBlocks(): FocusBlock[] {
  return DEFAULT_BLOCKS.map((block) => ({ ...block, completed: false }));
}

export function createFocusSession(lessonId: string, strictMode: boolean): FocusSessionState {
  return {
    lessonId,
    strictMode,
    phase: 'focus',
    isRunning: false,
    focusSecondsRemaining: FOCUS_DURATION_SECONDS,
    breakSecondsRemaining: BREAK_DURATION_SECONDS,
    currentBlockIndex: 0,
    blocks: makeBlocks()
  };
}

export function withStrictMode(state: FocusSessionState, strictMode: boolean): FocusSessionState {
  return { ...state, strictMode };
}

export function startOrPauseSession(state: FocusSessionState): FocusSessionState {
  if (state.phase === 'done') {
    return state;
  }

  return {
    ...state,
    isRunning: !state.isRunning,
    startedAt: state.startedAt ?? Date.now()
  };
}

export function canSelectBlock(state: FocusSessionState, nextIndex: number): boolean {
  if (!state.strictMode) {
    return true;
  }

  if (nextIndex <= state.currentBlockIndex) {
    return true;
  }

  return state.blocks[nextIndex - 1]?.completed ?? false;
}

export function selectBlock(state: FocusSessionState, nextIndex: number): FocusSessionState {
  if (!canSelectBlock(state, nextIndex)) {
    return state;
  }

  return {
    ...state,
    currentBlockIndex: Math.max(0, Math.min(nextIndex, state.blocks.length - 1))
  };
}

export function completeCurrentBlock(state: FocusSessionState): FocusSessionState {
  const nextBlocks = state.blocks.map((block, index) =>
    index === state.currentBlockIndex ? { ...block, completed: true } : block
  );

  const nextIndex = Math.min(state.currentBlockIndex + 1, nextBlocks.length - 1);

  return {
    ...state,
    blocks: nextBlocks,
    currentBlockIndex: nextIndex
  };
}

export function canSkipCurrentBlock(state: FocusSessionState): boolean {
  if (state.strictMode) {
    return false;
  }

  return state.currentBlockIndex < state.blocks.length - 1;
}

export function skipCurrentBlock(state: FocusSessionState): FocusSessionState {
  if (!canSkipCurrentBlock(state)) {
    return state;
  }

  return {
    ...state,
    currentBlockIndex: state.currentBlockIndex + 1
  };
}

export function areAllBlocksCompleted(state: FocusSessionState): boolean {
  return state.blocks.every((block) => block.completed);
}

export function startBreak(state: FocusSessionState): FocusSessionState {
  if (state.phase !== 'focus') {
    return state;
  }

  if (state.strictMode && !areAllBlocksCompleted(state)) {
    return { ...state, isRunning: false };
  }

  return {
    ...state,
    phase: 'break',
    isRunning: true,
    breakSecondsRemaining: BREAK_DURATION_SECONDS
  };
}

export function tickSession(state: FocusSessionState): FocusSessionState {
  if (!state.isRunning || state.phase === 'done') {
    return state;
  }

  if (state.phase === 'focus') {
    const nextFocus = Math.max(0, state.focusSecondsRemaining - 1);
    const focusState = { ...state, focusSecondsRemaining: nextFocus };

    if (nextFocus > 0) {
      return focusState;
    }

    return startBreak(focusState);
  }

  const nextBreak = Math.max(0, state.breakSecondsRemaining - 1);
  if (nextBreak > 0) {
    return { ...state, breakSecondsRemaining: nextBreak };
  }

  return {
    ...state,
    phase: 'done',
    isRunning: false,
    breakSecondsRemaining: 0,
    completedAt: Date.now()
  };
}

export function restartSession(state: FocusSessionState): FocusSessionState {
  return createFocusSession(state.lessonId, state.strictMode);
}
