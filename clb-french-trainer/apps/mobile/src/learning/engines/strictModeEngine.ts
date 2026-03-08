import type { FocusSessionState } from '../types';

export function assertStrictProgression(state: FocusSessionState): {
  valid: boolean;
  message?: string;
} {
  if (!state.strictMode) {
    return { valid: true };
  }

  for (let i = 1; i < state.blocks.length; i += 1) {
    const currentCompleted = state.blocks[i].completed;
    const prevCompleted = state.blocks[i - 1].completed;

    if (currentCompleted && !prevCompleted) {
      return {
        valid: false,
        message: 'Strict mode violation: complete earlier blocks before advanced blocks.'
      };
    }
  }

  return { valid: true };
}

export function shouldLockBreak(state: FocusSessionState): boolean {
  return state.strictMode && state.blocks.some((block) => !block.completed);
}
