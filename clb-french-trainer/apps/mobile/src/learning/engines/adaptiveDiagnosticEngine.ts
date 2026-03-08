import type {
  AdaptiveDiagnosticState,
  DiagnosticQuestion,
  DiagnosticResult,
  DiagnosticTier
} from '../types';

const TIER_ORDER: DiagnosticTier[] = ['A1', 'A2', 'B1', 'B2'];

function tierIndex(tier: DiagnosticTier): number {
  return TIER_ORDER.indexOf(tier);
}

export function initializeAdaptiveDiagnostic(initialMaxTier: DiagnosticTier, totalQuestions = 15): AdaptiveDiagnosticState {
  return {
    totalQuestions,
    initialMaxTier,
    currentTier: 'A1',
    attempts: [],
    usedQuestionIds: []
  };
}

export function pickNextQuestion(
  state: AdaptiveDiagnosticState,
  questionsByTier: Record<DiagnosticTier, DiagnosticQuestion[]>
): DiagnosticQuestion {
  const currentIndex = tierIndex(state.currentTier);
  const eligible = TIER_ORDER.slice(0, currentIndex + 1).flatMap((tier) => questionsByTier[tier] ?? []);
  if (!eligible.length) {
    return questionsByTier.A1[0];
  }

  const attemptCounts = new Map<string, number>();
  state.attempts.forEach((attempt) => {
    attemptCounts.set(attempt.questionId, (attemptCounts.get(attempt.questionId) ?? 0) + 1);
  });

  const minCount = eligible.reduce((min, question) => {
    const count = attemptCounts.get(question.id) ?? 0;
    return Math.min(min, count);
  }, Number.POSITIVE_INFINITY);

  const leastUsed = eligible.filter((question) => (attemptCounts.get(question.id) ?? 0) === minCount);
  const lastQuestionId = state.attempts[state.attempts.length - 1]?.questionId;
  const withoutImmediateRepeat = leastUsed.filter((question) => question.id !== lastQuestionId);

  return (withoutImmediateRepeat[0] ?? leastUsed[0] ?? eligible[0]);
}

export function submitAdaptiveAnswer(
  state: AdaptiveDiagnosticState,
  question: DiagnosticQuestion,
  selectedOption: number
): AdaptiveDiagnosticState {
  const isCorrect = selectedOption === question.correctOption;
  const maxIndex = tierIndex(state.initialMaxTier);
  const currentIndex = tierIndex(state.currentTier);

  const nextTier = isCorrect && currentIndex < maxIndex ? TIER_ORDER[currentIndex + 1] : state.currentTier;

  return {
    ...state,
    currentTier: nextTier,
    usedQuestionIds: [...state.usedQuestionIds, question.id],
    attempts: [
      ...state.attempts,
      {
        questionId: question.id,
        tier: question.tier,
        selectedOption,
        isCorrect
      }
    ]
  };
}

export function isDiagnosticComplete(state: AdaptiveDiagnosticState): boolean {
  return state.attempts.length >= state.totalQuestions;
}

function mapScoreToCEFR(scorePercent: number): DiagnosticResult['cefrRecommendation'] {
  if (scorePercent <= 40) {
    return 'A1';
  }

  if (scorePercent <= 60) {
    return 'A2';
  }

  if (scorePercent <= 75) {
    return 'B1';
  }

  if (scorePercent <= 90) {
    return 'B2';
  }

  return 'C1';
}

export function finalizeDiagnostic(state: AdaptiveDiagnosticState): DiagnosticResult {
  const correctCount = state.attempts.filter((attempt) => attempt.isCorrect).length;
  const totalQuestions = state.totalQuestions;
  const scorePercent = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);

  return {
    scorePercent,
    correctCount,
    totalQuestions,
    cefrRecommendation: mapScoreToCEFR(scorePercent)
  };
}
