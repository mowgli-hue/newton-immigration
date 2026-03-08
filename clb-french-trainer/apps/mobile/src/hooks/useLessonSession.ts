import { useMemo, useState } from 'react';
import * as Speech from 'expo-speech';

import {
  getAILessonById,
  type AILessonCheckpointQuestion,
  type AILessonScript,
  type AILessonStep,
  type AnswerValidationRule
} from '../data/aiLessons';

type FeedbackState = {
  type: 'success' | 'error' | 'info';
  text: string;
  hint?: string;
};

type SessionStatus = 'idle' | 'awaitingInput' | 'validated';

type CheckpointResult = {
  questionId: string;
  correct: boolean;
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`´]/g, "'")
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"]/g, '')
    .replace(/\s+/g, ' ');
}

function validateAnswer(input: string, rule: AnswerValidationRule): boolean {
  const normalized = normalize(input);

  if (!normalized) {
    return false;
  }

  if (rule.mode === 'exact') {
    return rule.accepted.some((accepted) => normalize(accepted) === normalized);
  }

  if (rule.mode === 'includes') {
    return rule.accepted.some((accepted) => normalized.includes(normalize(accepted)));
  }

  const words = normalized.split(' ').filter(Boolean);
  const minWordsOk = rule.minWords ? words.length >= rule.minWords : true;
  const keywordsOk = rule.keywords.every((keyword) => normalized.includes(normalize(keyword)));
  return minWordsOk && keywordsOk;
}

function checkpointPercent(results: CheckpointResult[], total: number): number {
  if (total === 0) {
    return 0;
  }

  const correct = results.filter((result) => result.correct).length;
  return Math.round((correct / total) * 100);
}

export type LessonSessionController = {
  lesson?: AILessonScript;
  currentStep?: AILessonStep;
  stepIndex: number;
  totalSteps: number;
  progressPercent: number;
  userInput: string;
  setUserInput: (value: string) => void;
  feedback: FeedbackState | null;
  canSubmit: boolean;
  canContinue: boolean;
  submitResponse: () => void;
  continueStep: () => void;
  repeatStep: () => void;
  playTeacherAudio: () => Promise<void>;
  currentPrompt?: string;
  currentPlaceholder?: string;
  requiresInput: boolean;
  isComplete: boolean;
  checkpointIndex: number;
  checkpointTotal: number;
  checkpointScorePercent: number | null;
  currentTeacherText: string;
  isRetryRound: boolean;
};

export function useLessonSession(lessonId: string): LessonSessionController {
  const lesson = useMemo(() => getAILessonById(lessonId), [lessonId]);
  const [stepIndex, setStepIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [checkpointQuestionIndex, setCheckpointQuestionIndex] = useState(0);
  const [checkpointResults, setCheckpointResults] = useState<CheckpointResult[]>([]);
  const [checkpointScore, setCheckpointScore] = useState<number | null>(null);
  const [retryQueueStepIds, setRetryQueueStepIds] = useState<string[]>([]);
  const [activeRetryStepId, setActiveRetryStepId] = useState<string | null>(null);

  const totalSteps = lesson?.steps.length ?? 0;
  const baseStep = lesson?.steps[stepIndex];
  const currentStep = activeRetryStepId
    ? lesson?.steps.find((step) => step.id === activeRetryStepId)
    : baseStep;
  const isRetryRound = Boolean(activeRetryStepId);

  const checkpointQuestion =
    currentStep?.type === 'checkpoint' ? currentStep.questions[checkpointQuestionIndex] : undefined;

  const requiresInput = currentStep?.type === 'question' || currentStep?.type === 'practice' || currentStep?.type === 'checkpoint';

  const currentTeacherText = useMemo(() => {
    if (!currentStep) {
      return 'Lesson script not found.';
    }

    if (currentStep.type === 'checkpoint' && checkpointQuestion) {
      return `${currentStep.teacherText}\n\nCheckpoint ${checkpointQuestionIndex + 1} of ${currentStep.questions.length}: ${checkpointQuestion.prompt}`;
    }

    return isRetryRound
      ? `Retry Round\n\nLet us try this again with a simpler approach.\n\n${currentStep.teacherText}`
      : currentStep.teacherText;
  }, [currentStep, checkpointQuestion, checkpointQuestionIndex, isRetryRound]);

  const currentPrompt = useMemo(() => {
    if (!currentStep) {
      return undefined;
    }

    if (currentStep.type === 'question' || currentStep.type === 'practice') {
      return currentStep.interaction.prompt;
    }

    if (currentStep.type === 'checkpoint' && checkpointQuestion) {
      return checkpointQuestion.prompt;
    }

    return undefined;
  }, [currentStep, checkpointQuestion]);

  const currentPlaceholder = useMemo(() => {
    if (!currentStep) {
      return undefined;
    }

    if (currentStep.type === 'question' || currentStep.type === 'practice') {
      return currentStep.interaction.placeholder;
    }

    if (currentStep.type === 'checkpoint' && checkpointQuestion) {
      return checkpointQuestion.placeholder;
    }

    return undefined;
  }, [currentStep, checkpointQuestion]);

  const canSubmit = requiresInput && normalize(userInput).length > 0 && status !== 'validated';
  const canContinue = !!currentStep && (!requiresInput || status === 'validated');

  const progressPercent = useMemo(() => {
    if (!totalSteps) {
      return 0;
    }

    if (currentStep?.type !== 'checkpoint') {
      return Math.round(((stepIndex + 1) / totalSteps) * 100);
    }

    const completedTopLevel = (stepIndex / totalSteps) * 100;
    const checkpointPart = ((checkpointQuestionIndex + 1) / currentStep.questions.length) * (100 / totalSteps);
    return Math.round(completedTopLevel + checkpointPart);
  }, [totalSteps, stepIndex, currentStep, checkpointQuestionIndex]);

  const advanceToNextTopLevelStep = () => {
    if (!lesson) {
      return;
    }

    if (stepIndex >= lesson.steps.length - 1) {
      return;
    }

    setStepIndex((prev) => prev + 1);
    setUserInput('');
    setFeedback(null);
    setStatus('idle');
    setCheckpointQuestionIndex(0);
    setCheckpointResults([]);
    setCheckpointScore(null);
  };

  const submitStandardStep = (step: Extract<AILessonStep, { type: 'question' | 'practice' }>) => {
    const isCorrect = validateAnswer(userInput, step.interaction.validation);

    if (isCorrect) {
      setStatus('validated');
      setFeedback({ type: 'success', text: step.interaction.successFeedback });
      return;
    }

    if (!isRetryRound) {
      setRetryQueueStepIds((prev) => (prev.includes(step.id) ? prev : [...prev, step.id]));
    }

    // Do not hard-block progression on wrong answer. Explain simply, then revisit later.
    setStatus('validated');
    setFeedback({
      type: 'error',
      text: `${step.interaction.incorrectFeedback} We will repeat this question later.`,
      hint: step.interaction.companionHint
    });
  };

  const submitCheckpointQuestion = (step: Extract<AILessonStep, { type: 'checkpoint' }>, question: AILessonCheckpointQuestion) => {
    const isCorrect = validateAnswer(userInput, question.validation);

    if (!isCorrect) {
      setStatus('awaitingInput');
      setFeedback({ type: 'error', text: question.incorrectFeedback, hint: question.companionHint });
      return;
    }

    const nextResults = [...checkpointResults, { questionId: question.id, correct: true }];
    setCheckpointResults(nextResults);

    if (checkpointQuestionIndex < step.questions.length - 1) {
      setCheckpointQuestionIndex((prev) => prev + 1);
      setUserInput('');
      setStatus('awaitingInput');
      setFeedback({ type: 'success', text: question.successFeedback });
      return;
    }

    const percent = checkpointPercent(nextResults, step.questions.length);
    setCheckpointScore(percent);

    if (percent >= step.passThreshold) {
      setStatus('validated');
      setFeedback({ type: 'success', text: `Checkpoint passed (${percent}%). You are ready to move forward.` });
      return;
    }

    setStatus('awaitingInput');
    setCheckpointQuestionIndex(0);
    setCheckpointResults([]);
    setUserInput('');
    setFeedback({
      type: 'error',
      text: `Checkpoint score ${percent}%. You need ${step.passThreshold}% to pass. Repeat the checkpoint.`,
      hint: 'Use the core structures exactly: Je m\'appelle / Je suis.'
    });
  };

  const submitResponse = () => {
    if (!currentStep) {
      return;
    }

    if (currentStep.type === 'question' || currentStep.type === 'practice') {
      submitStandardStep(currentStep);
      return;
    }

    if (currentStep.type === 'checkpoint' && checkpointQuestion) {
      submitCheckpointQuestion(currentStep, checkpointQuestion);
    }
  };

  const continueStep = () => {
    if (!currentStep || !canContinue) {
      return;
    }

    if (activeRetryStepId) {
      const [, ...remaining] = retryQueueStepIds;
      setActiveRetryStepId(remaining[0] ?? null);
      setRetryQueueStepIds(remaining);
      setUserInput('');
      setFeedback(null);
      setStatus('idle');
      return;
    }

    if (stepIndex >= totalSteps - 1) {
      if (retryQueueStepIds.length > 0) {
        setActiveRetryStepId(retryQueueStepIds[0]);
        setRetryQueueStepIds((prev) => prev.slice(1));
        setUserInput('');
        setFeedback({ type: 'info', text: 'Now we will repeat the questions you missed.' });
        setStatus('idle');
        return;
      }

      setFeedback({ type: 'success', text: 'Scripted AI Teacher session complete. Excellent work.' });
      setStatus('validated');
      return;
    }

    advanceToNextTopLevelStep();
  };

  const repeatStep = () => {
    setUserInput('');
    setFeedback({ type: 'info', text: 'Step repeated. Read the teacher message and try again.' });
    setStatus(requiresInput ? 'awaitingInput' : 'idle');
  };

  const playTeacherAudio = async () => {
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        Speech.stop();
      }

      const voiceOptions = await pickTeacherVoice();

      Speech.speak(currentTeacherText, {
        ...voiceOptions
      });
    } catch {
      // Keep session flow stable if speech is unavailable.
    }
  };

  const isComplete = !!lesson && stepIndex === totalSteps - 1 && status === 'validated';

  return {
    lesson,
    currentStep,
    stepIndex,
    totalSteps,
    progressPercent,
    userInput,
    setUserInput,
    feedback,
    canSubmit,
    canContinue,
    submitResponse,
    continueStep,
    repeatStep,
    playTeacherAudio,
    currentPrompt,
    currentPlaceholder,
    requiresInput,
    isComplete,
    checkpointIndex: checkpointQuestionIndex,
    checkpointTotal: currentStep?.type === 'checkpoint' ? currentStep.questions.length : 0,
    checkpointScorePercent: checkpointScore,
    currentTeacherText,
    isRetryRound
  };
}
  const pickTeacherVoice = async (): Promise<Speech.SpeechOptions> => {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      const englishIndianVoices = voices.filter((voice) => (voice.language ?? '').toLowerCase() === 'en-in');
      const frenchVoices = voices.filter((voice) => (voice.language ?? '').toLowerCase().startsWith('fr'));

      const femaleHint = (value?: string) =>
        !!value && /(female|woman|amelie|aurelie|celine|marie|julie|lea|claire|audrey)/i.test(value);

      // User preference: clearer Indian English style voice if available.
      const englishIndianPreferred =
        englishIndianVoices.find((voice) => femaleHint(voice.name)) ??
        englishIndianVoices.find((voice) => voice.quality === 'Enhanced') ??
        englishIndianVoices[0];

      const preferred =
        englishIndianPreferred ??
        frenchVoices.find((voice) => femaleHint(voice.name)) ??
        frenchVoices.find((voice) => voice.quality === 'Enhanced' && femaleHint(voice.identifier)) ??
        frenchVoices.find((voice) => voice.quality === 'Enhanced') ??
        frenchVoices[0];

      if (preferred) {
        return {
          language: preferred.language,
          voice: preferred.identifier,
          rate: 0.78,
          pitch: 1.02
        };
      }
    } catch {
      // fallback below
    }

    return {
      language: 'en-IN',
      rate: 0.78,
      pitch: 1.02
    };
  };
