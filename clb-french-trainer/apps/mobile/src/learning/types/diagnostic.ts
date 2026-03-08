export type DiagnosticTier = 'A1' | 'A2' | 'B1' | 'B2';

export type DiagnosticDomain = 'grammar' | 'vocabulary' | 'reading' | 'listening';

export type DiagnosticQuestion = {
  id: string;
  tier: DiagnosticTier;
  domain: DiagnosticDomain;
  prompt: string;
  options: [string, string, string, string];
  correctOption: number;
  passage?: string;
};

export type DiagnosticAttempt = {
  questionId: string;
  tier: DiagnosticTier;
  selectedOption: number;
  isCorrect: boolean;
};

export type AdaptiveDiagnosticState = {
  totalQuestions: number;
  initialMaxTier: DiagnosticTier;
  currentTier: DiagnosticTier;
  attempts: DiagnosticAttempt[];
  usedQuestionIds: string[];
};

export type DiagnosticResult = {
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  cefrRecommendation: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
};
