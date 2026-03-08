import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type FocusMode = 'idle' | 'focus' | 'break';
type FocusCompletionPhase = 'hidden' | 'prompt' | 'break' | 'complete';

type FocusSessionContextValue = {
  mode: FocusMode;
  completionPhase: FocusCompletionPhase;
  showCompletionModal: boolean;
  isRunning: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  completedFocusCycles: number;
  startFocusSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  resetSession: () => void;
  ensureFocusStarted: () => void;
  skipBreak: () => void;
  startBreakFromCompletion: () => void;
  continueStudyingAfterFocus: () => void;
  closeBreakComplete: () => void;
};

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

const FocusSessionContext = createContext<FocusSessionContextValue | undefined>(undefined);

export function FocusSessionProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<FocusMode>('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(FOCUS_SECONDS);
  const [completedFocusCycles, setCompletedFocusCycles] = useState(0);
  const [completionPhase, setCompletionPhase] = useState<FocusCompletionPhase>('hidden');

  useEffect(() => {
    if (!isRunning || mode === 'idle') {
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev > 0) {
          return prev - 1;
        }

        if (mode === 'focus') {
          setMode('idle');
          setIsRunning(false);
          setCompletionPhase('prompt');
          setCompletedFocusCycles((count) => count + 1);
          return 0;
        }

        setCompletionPhase('complete');
        setMode('idle');
        setIsRunning(false);
        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, mode]);

  const value = useMemo<FocusSessionContextValue>(() => {
    const startFocusSession = () => {
      setCompletionPhase('hidden');
      setMode('focus');
      setRemainingSeconds(FOCUS_SECONDS);
      setIsRunning(true);
    };

    return {
      mode,
      completionPhase,
      showCompletionModal: completionPhase !== 'hidden',
      isRunning,
      remainingSeconds,
      totalSeconds: mode === 'break' ? BREAK_SECONDS : FOCUS_SECONDS,
      completedFocusCycles,
      startFocusSession,
      pauseSession: () => setIsRunning(false),
      resumeSession: () => {
        if (mode === 'idle') {
          setMode('focus');
          setRemainingSeconds((prev) => (prev > 0 ? prev : FOCUS_SECONDS));
        }
        setIsRunning(true);
      },
      resetSession: () => {
        setCompletionPhase('hidden');
        setMode('idle');
        setIsRunning(false);
        setRemainingSeconds(FOCUS_SECONDS);
      },
      ensureFocusStarted: () => {
        setMode((prevMode) => {
          if (prevMode === 'idle') {
            return 'focus';
          }
          return prevMode;
        });
        setRemainingSeconds((prev) => (mode === 'idle' ? FOCUS_SECONDS : prev));
        setIsRunning(true);
      },
      skipBreak: () => {
        setCompletionPhase('hidden');
        setMode('idle');
        setIsRunning(false);
        setRemainingSeconds(FOCUS_SECONDS);
      },
      startBreakFromCompletion: () => {
        setCompletionPhase('break');
        setMode('break');
        setIsRunning(true);
        setRemainingSeconds(BREAK_SECONDS);
      },
      continueStudyingAfterFocus: () => {
        setCompletionPhase('hidden');
        setMode('idle');
        setIsRunning(false);
        setRemainingSeconds(FOCUS_SECONDS);
      },
      closeBreakComplete: () => {
        setCompletionPhase('hidden');
        setMode('idle');
        setIsRunning(false);
        setRemainingSeconds(FOCUS_SECONDS);
      }
    };
  }, [completedFocusCycles, completionPhase, isRunning, mode, remainingSeconds]);

  return <FocusSessionContext.Provider value={value}>{children}</FocusSessionContext.Provider>;
}

export function useFocusSession() {
  const context = useContext(FocusSessionContext);
  if (!context) {
    throw new Error('useFocusSession must be used within FocusSessionProvider');
  }
  return context;
}
