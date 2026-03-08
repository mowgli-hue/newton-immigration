import type {
  Exercise,
  ExerciseEvaluationResult,
  LessonSessionExerciseState,
  LessonSessionState,
  MatchingPairExercise,
  MemoryMatchExercise,
  MultipleChoiceExercise,
  QuickClassificationExercise,
  SentenceOrderPuzzleExercise,
  ShortAnswerExercise,
  StructuredLessonContent
} from '../types/LessonContentTypes';

type ExerciseSubmission =
  | { kind: 'choice'; selectedIndex: number }
  | { kind: 'shortText'; text: string }
  | { kind: 'matching'; pairs: Array<{ leftId: string; rightId: string }> }
  | { kind: 'memoryMatch'; pairs: Array<{ leftId: string; rightId: string }> }
  | { kind: 'sentenceOrder'; orderedTokens: string[] }
  | { kind: 'quickClassification'; assignments: Array<{ itemId: string; categoryId: string }> }
  | { kind: 'spokenText'; transcript: string }
  | { kind: 'writtenText'; text: string };

function normalizeText(text: string, normalizeAccents = true): string {
  let value = text.trim().toLowerCase();
  value = value.replace(/[’]/g, "'");
  value = value.replace(/[.,!?;:]/g, '');
  if (normalizeAccents) {
    value = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  return value.replace(/\s+/g, ' ');
}

function isAdjacentTransposition(a: string, b: string): boolean {
  if (a.length !== b.length || a.length < 2) return false;
  let firstDiff = -1;
  let secondDiff = -1;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      if (firstDiff === -1) {
        firstDiff = i;
      } else if (secondDiff === -1) {
        secondDiff = i;
      } else {
        return false;
      }
    }
  }
  if (firstDiff === -1 || secondDiff === -1) return false;
  return (
    secondDiff === firstDiff + 1 &&
    a[firstDiff] === b[secondDiff] &&
    a[secondDiff] === b[firstDiff]
  );
}

function hasSmallTypo(userToken: string, expectedToken: string): boolean {
  if (!userToken || !expectedToken) return false;
  if (userToken === expectedToken) return true;
  if (isAdjacentTransposition(userToken, expectedToken)) return true;

  const lenDiff = Math.abs(userToken.length - expectedToken.length);
  if (lenDiff > 1) return false;

  // One-edit tolerance (insert/delete/replace) for beginner-friendly short answers.
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < userToken.length && j < expectedToken.length) {
    if (userToken[i] === expectedToken[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;

    if (userToken.length > expectedToken.length) {
      i += 1;
    } else if (userToken.length < expectedToken.length) {
      j += 1;
    } else {
      i += 1;
      j += 1;
    }
  }

  if (i < userToken.length || j < expectedToken.length) {
    edits += 1;
  }
  return edits <= 1;
}

function isShortAnswerAccepted(
  userInput: string,
  acceptedAnswers: string[],
  normalizeAccents = true
): boolean {
  const normalizedUser = normalizeText(userInput, normalizeAccents);
  if (!normalizedUser) {
    return false;
  }

  const userTokens = normalizedUser.split(' ');

  return acceptedAnswers.some((answer) => {
    const normalizedAnswer = normalizeText(answer, normalizeAccents);
    if (!normalizedAnswer) {
      return false;
    }

    // Exact answer always passes.
    if (normalizedUser === normalizedAnswer) {
      return true;
    }

    // Suffix-style answers like "-ez" should match conjugated words (e.g. "parlez").
    if (normalizedAnswer.startsWith('-') && normalizedAnswer.length > 1) {
      const suffix = normalizedAnswer.slice(1);
      return userTokens.some((token) => token.endsWith(suffix));
    }

    // Multi-word pattern can appear inside a longer valid response.
    if (normalizedAnswer.includes(' ')) {
      return normalizedUser.includes(normalizedAnswer);
    }

    // Single target token can appear as part of a short valid sentence.
    if (userTokens.includes(normalizedAnswer)) {
      return true;
    }

    // Beginner tolerance: allow tiny typo on single-token answers (e.g., "meric" -> "merci").
    if (!normalizedAnswer.includes(' ') && normalizedAnswer.length >= 4) {
      return userTokens.some((token) => hasSmallTypo(token, normalizedAnswer));
    }

    return false;
  });
}

function evaluateMultipleChoice(exercise: MultipleChoiceExercise, submission: ExerciseSubmission): ExerciseEvaluationResult {
  if (submission.kind !== 'choice') {
    return {
      correct: false,
      earnedPoints: 0,
      maxPoints: exercise.points,
      feedback: 'Please choose one option before continuing.',
      shouldRetryLater: true
    };
  }

  const correct = submission.selectedIndex === exercise.correctOptionIndex;
  return {
    correct,
    earnedPoints: correct ? exercise.points : 0,
    maxPoints: exercise.points,
    feedback: correct
      ? exercise.explanationOnCorrect ?? 'Correct.'
      : exercise.explanationOnWrong,
    companionHint: correct ? undefined : exercise.hint?.message,
    shouldRetryLater: !correct
  };
}

function evaluateShortAnswer(exercise: ShortAnswerExercise, submission: ExerciseSubmission): ExerciseEvaluationResult {
  const text = submission.kind === 'shortText' ? submission.text : submission.kind === 'writtenText' ? submission.text : '';
  const accepted = isShortAnswerAccepted(text, exercise.acceptedAnswers, exercise.normalizeAccents ?? true);
  return {
    correct: accepted,
    earnedPoints: accepted ? exercise.points : 0,
    maxPoints: exercise.points,
    feedback: accepted ? 'Correct.' : exercise.explanationOnWrong,
    companionHint: accepted ? undefined : exercise.hint?.message,
    shouldRetryLater: !accepted
  };
}

function evaluateMatching(exercise: MatchingPairExercise, submission: ExerciseSubmission): ExerciseEvaluationResult {
  if (submission.kind !== 'matching') {
    return {
      correct: false,
      earnedPoints: 0,
      maxPoints: exercise.points,
      feedback: 'Complete the matching pairs first.',
      shouldRetryLater: true
    };
  }

  const expected = new Map(exercise.correctPairs.map((pair) => [pair.leftId, pair.rightId]));
  const matchesAll = submission.pairs.length === exercise.correctPairs.length &&
    submission.pairs.every((pair) => expected.get(pair.leftId) === pair.rightId);

  return {
    correct: matchesAll,
    earnedPoints: matchesAll ? exercise.points : 0,
    maxPoints: exercise.points,
    feedback: matchesAll ? 'Great matching.' : exercise.explanationOnWrong,
    companionHint: matchesAll ? undefined : exercise.hint?.message,
    shouldRetryLater: !matchesAll
  };
}

function evaluateMemoryMatch(exercise: MemoryMatchExercise, submission: ExerciseSubmission): ExerciseEvaluationResult {
  if (submission.kind !== 'memoryMatch') {
    return {
      correct: false,
      earnedPoints: 0,
      maxPoints: exercise.points,
      feedback: 'Complete all matches first.',
      shouldRetryLater: true
    };
  }

  const expected = new Map(exercise.pairs.map((pair) => [pair.id, pair.id]));
  const submittedUnique = new Map(submission.pairs.map((pair) => [pair.leftId, pair.rightId]));
  const correct =
    submission.pairs.length === exercise.pairs.length &&
    exercise.pairs.every((pair) => submittedUnique.get(pair.id) === pair.id) &&
    submittedUnique.size === exercise.pairs.length &&
    expected.size === exercise.pairs.length;

  return {
    correct,
    earnedPoints: correct ? exercise.points : 0,
    maxPoints: exercise.points,
    feedback: correct ? 'Great memory matching.' : exercise.explanationOnWrong,
    companionHint: correct ? undefined : exercise.hint?.message,
    shouldRetryLater: !correct
  };
}

function evaluateSentenceOrder(exercise: SentenceOrderPuzzleExercise, submission: ExerciseSubmission): ExerciseEvaluationResult {
  if (submission.kind !== 'sentenceOrder') {
    return {
      correct: false,
      earnedPoints: 0,
      maxPoints: exercise.points,
      feedback: 'Arrange the tiles before checking your answer.',
      shouldRetryLater: true
    };
  }

  const normalizeToken = (value: string) => {
    const trimmed = value.trim();
    if (exercise.allowExtraPunctuation) {
      return trimmed.replace(/[.,!?;:]/g, '');
    }
    return trimmed;
  };

  const submitted = submission.orderedTokens.map(normalizeToken);
  const expected = exercise.correctOrder.map(normalizeToken);
  const correct =
    submitted.length === expected.length && submitted.every((token, index) => token === expected[index]);

  return {
    correct,
    earnedPoints: correct ? exercise.points : 0,
    maxPoints: exercise.points,
    feedback: correct ? 'Correct sentence order.' : exercise.explanationOnWrong,
    companionHint: correct ? undefined : exercise.hint?.message,
    shouldRetryLater: !correct
  };
}

function evaluateQuickClassification(exercise: QuickClassificationExercise, submission: ExerciseSubmission): ExerciseEvaluationResult {
  if (submission.kind !== 'quickClassification') {
    return {
      correct: false,
      earnedPoints: 0,
      maxPoints: exercise.points,
      feedback: 'Classify all items before checking your answer.',
      shouldRetryLater: true
    };
  }

  const submitted = new Map(submission.assignments.map((a) => [a.itemId, a.categoryId]));
  const correct =
    submission.assignments.length === exercise.items.length &&
    exercise.items.every((item) => submitted.get(item.id) === item.correctCategoryId);

  return {
    correct,
    earnedPoints: correct ? exercise.points : 0,
    maxPoints: exercise.points,
    feedback: correct ? 'Great classification.' : exercise.explanationOnWrong,
    companionHint: correct ? undefined : exercise.hint?.message,
    shouldRetryLater: !correct
  };
}

function evaluateProductionLike(exercise: Extract<Exercise, { kind: 'speakingPrompt' | 'writingPrompt' }>, submission: ExerciseSubmission): ExerciseEvaluationResult {
  const text =
    submission.kind === 'spokenText'
      ? submission.transcript
      : submission.kind === 'writtenText' || submission.kind === 'shortText'
        ? submission.text
        : '';
  const normalized = normalizeText(text);

  const expectedPatterns =
    exercise.kind === 'speakingPrompt'
      ? exercise.expectedPatterns
      : exercise.expectedElements;

  const matchedCount = expectedPatterns.reduce((count, token) => {
    return count + (normalized.includes(normalizeText(token)) ? 1 : 0);
  }, 0);
  const ratio = expectedPatterns.length ? matchedCount / expectedPatterns.length : 1;
  const minWords = exercise.kind === 'writingPrompt' ? exercise.minWords : exercise.minWords ?? 0;
  const wordCount = normalized ? normalized.split(' ').length : 0;
  const wordRequirementMet = wordCount >= minWords;
  const correct = ratio >= 0.6 && wordRequirementMet;
  const earnedPoints = Math.round(exercise.points * Math.min(1, ratio)) * (wordRequirementMet ? 1 : 0);

  return {
    correct,
    earnedPoints,
    maxPoints: exercise.points,
    feedback: correct
      ? 'Good response. You included the expected elements for this step.'
      : `You are missing some required elements. Include: ${expectedPatterns.slice(0, 3).join(', ')}.`,
    companionHint: correct ? undefined : exercise.hint?.message,
    shouldRetryLater: !correct
  };
}

export function evaluateExercise(exercise: Exercise, submission: ExerciseSubmission): ExerciseEvaluationResult {
  switch (exercise.kind) {
    case 'multipleChoice':
    case 'listeningPrompt':
    case 'readingComprehension':
      return evaluateMultipleChoice(exercise, submission);
    case 'shortAnswer':
      return evaluateShortAnswer(exercise, submission);
    case 'matchingPairs':
      return evaluateMatching(exercise, submission);
    case 'memoryMatch':
      return evaluateMemoryMatch(exercise, submission);
    case 'sentenceOrderPuzzle':
      return evaluateSentenceOrder(exercise, submission);
    case 'quickClassification':
      return evaluateQuickClassification(exercise, submission);
    case 'speakingPrompt':
    case 'writingPrompt':
      return evaluateProductionLike(exercise, submission);
  }
}

function buildInitialExerciseStates(lesson: StructuredLessonContent): Record<string, LessonSessionExerciseState> {
  const allExercises: Exercise[] = lesson.blocks.flatMap((block) => {
    const blockExercises = block.exercises ?? [];
    const productionExercise = block.productionTask ? [block.productionTask.exercise] : [];
    return [...blockExercises, ...productionExercise];
  });

  return Object.fromEntries(
    allExercises.map((exercise) => [
      exercise.id,
      {
        exerciseId: exercise.id,
        attempts: 0,
        completed: false,
        correct: false,
        earnedPoints: 0,
        maxPoints: exercise.points,
        queuedForRetry: false
      } satisfies LessonSessionExerciseState
    ])
  );
}

export function createLessonSessionState(lesson: StructuredLessonContent): LessonSessionState {
  const totalAvailablePoints = lesson.blocks.reduce((sum, block) => {
    const exercisesPoints = (block.exercises ?? []).reduce((acc, exercise) => acc + exercise.points, 0);
    const productionPoints = block.productionTask ? block.productionTask.exercise.points : 0;
    return sum + exercisesPoints + productionPoints;
  }, 0);

  return {
    lessonId: lesson.id,
    blockIndex: 0,
    exerciseIndex: 0,
    blockCompletion: Object.fromEntries(lesson.blocks.map((block) => [block.id, false])),
    productionCompleted: false,
    exerciseStates: buildInitialExerciseStates(lesson),
    retryQueue: [],
    totalEarnedPoints: 0,
    totalAvailablePoints,
    status: 'inProgress'
  };
}

export function getCurrentBlockExercises(lesson: StructuredLessonContent, blockIndex: number): Exercise[] {
  const block = lesson.blocks[blockIndex];
  if (!block) {
    return [];
  }
  const exercises = [...(block.exercises ?? [])];
  if (block.productionTask) {
    exercises.push(block.productionTask.exercise);
  }
  return exercises;
}

export function applyExerciseSubmission(
  lesson: StructuredLessonContent,
  session: LessonSessionState,
  submission: ExerciseSubmission,
  options?: { exerciseOverride?: Exercise }
): { next: LessonSessionState; evaluation: ExerciseEvaluationResult; currentExercise?: Exercise } {
  const exercises = getCurrentBlockExercises(lesson, session.blockIndex);
  const currentExercise = exercises[session.exerciseIndex];

  if (!currentExercise) {
    return {
      next: session,
      evaluation: {
        correct: false,
        earnedPoints: 0,
        maxPoints: 0,
        feedback: 'No exercise is active.',
        shouldRetryLater: false
      }
    };
  }

  const exerciseForEvaluation =
    options?.exerciseOverride && options.exerciseOverride.id === currentExercise.id
      ? options.exerciseOverride
      : currentExercise;

  const evaluation = evaluateExercise(exerciseForEvaluation, submission);
  const prevState = session.exerciseStates[currentExercise.id];
  const nextExerciseState: LessonSessionExerciseState = {
    ...prevState,
    attempts: prevState.attempts + 1,
    completed: true,
    correct: evaluation.correct || prevState.correct,
    earnedPoints: Math.max(prevState.earnedPoints, evaluation.earnedPoints),
    queuedForRetry: prevState.queuedForRetry || evaluation.shouldRetryLater,
    lastFeedback: evaluation.feedback
  };

  const retryQueue = evaluation.shouldRetryLater && lesson.assessment.retryIncorrectLater
    ? Array.from(new Set([...session.retryQueue, currentExercise.id]))
    : session.retryQueue;

  const deltaPoints = Math.max(0, nextExerciseState.earnedPoints - prevState.earnedPoints);

  return {
    next: {
      ...session,
      exerciseStates: {
        ...session.exerciseStates,
        [currentExercise.id]: nextExerciseState
      },
      productionCompleted:
        session.productionCompleted ||
        (lesson.blocks[session.blockIndex]?.type === 'production' && nextExerciseState.completed),
      retryQueue,
      totalEarnedPoints: session.totalEarnedPoints + deltaPoints
    },
    evaluation,
    currentExercise: exerciseForEvaluation
  };
}

export function continueLesson(lesson: StructuredLessonContent, session: LessonSessionState): LessonSessionState {
  const exercises = getCurrentBlockExercises(lesson, session.blockIndex);
  const block = lesson.blocks[session.blockIndex];
  const isEndOfBlock = session.exerciseIndex >= exercises.length - 1;

  if (!block) {
    return session;
  }

  if (!isEndOfBlock) {
    return {
      ...session,
      exerciseIndex: session.exerciseIndex + 1
    };
  }

  const blockCompletion = {
    ...session.blockCompletion,
    [block.id]: true
  };

  if (session.blockIndex < lesson.blocks.length - 1) {
    return {
      ...session,
      blockCompletion,
      blockIndex: session.blockIndex + 1,
      exerciseIndex: 0
    };
  }

  const scorePercent = getLessonScorePercent({
    totalEarnedPoints: session.totalEarnedPoints,
    totalAvailablePoints: session.totalAvailablePoints
  });
  const passedMastery = scorePercent >= lesson.assessment.masteryThresholdPercent;
  const productionOk = !lesson.assessment.productionRequired || session.productionCompleted;

  if (lesson.assessment.retryIncorrectLater && session.retryQueue.length > 0 && session.status !== 'needsRetryRound') {
    return {
      ...session,
      blockCompletion,
      status: 'needsRetryRound'
    };
  }

  return {
    ...session,
    blockCompletion,
    status: passedMastery && productionOk ? 'passed' : 'failed'
  };
}

export function getLessonScorePercent(session: Pick<LessonSessionState, 'totalEarnedPoints' | 'totalAvailablePoints'>): number {
  if (!session.totalAvailablePoints) {
    return 0;
  }
  return Math.round((session.totalEarnedPoints / session.totalAvailablePoints) * 100);
}

export function getLessonProgressPercent(lesson: StructuredLessonContent, session: LessonSessionState): number {
  const totalExercises = lesson.blocks.reduce((sum, block) => {
    return sum + (block.exercises?.length ?? 0) + (block.productionTask ? 1 : 0);
  }, 0);

  const completedExercises = Object.values(session.exerciseStates).filter((item) => item.completed).length;
  if (!totalExercises) {
    return 0;
  }
  return Math.round((completedExercises / totalExercises) * 100);
}

export function buildRetryRoundExercises(lesson: StructuredLessonContent, session: LessonSessionState): Exercise[] {
  if (!session.retryQueue.length) {
    return [];
  }

  const allExercises = lesson.blocks.flatMap((block) => {
    const base = block.exercises ?? [];
    return block.productionTask ? [...base, block.productionTask.exercise] : base;
  });

  return allExercises.filter((exercise) => session.retryQueue.includes(exercise.id));
}
