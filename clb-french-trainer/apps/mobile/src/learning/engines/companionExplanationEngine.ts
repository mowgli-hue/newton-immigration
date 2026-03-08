export type CompanionStyle = 'calm' | 'motivational' | 'analytical';

export type ExplanationRequest = {
  style: CompanionStyle;
  topic: string;
  isCorrect: boolean;
  learnerAnswer?: string;
  correctAnswer?: string;
};

const stylePrefix: Record<CompanionStyle, string> = {
  calm: 'Take it step by step.',
  motivational: 'You are making progress.',
  analytical: 'Let us break this down clearly.'
};

export function generateCompanionExplanation(request: ExplanationRequest): string {
  if (request.isCorrect) {
    return `${stylePrefix[request.style]} Correct on ${request.topic}. Keep the same pattern for the next item.`;
  }

  const learnerPart = request.learnerAnswer ? ` You selected: ${request.learnerAnswer}.` : '';
  const correctPart = request.correctAnswer ? ` Correct form: ${request.correctAnswer}.` : '';

  return `${stylePrefix[request.style]} ${request.topic} needs one adjustment.${learnerPart}${correctPart} Review the rule, then retry.`;
}

export function getCompanionHint(style: CompanionStyle, topic: string): string {
  const hints: Record<CompanionStyle, string> = {
    calm: `Focus on one signal word in the ${topic} prompt before answering.`,
    motivational: `You can solve this ${topic} task by eliminating two wrong options first.`,
    analytical: `For ${topic}, identify tense, subject, then agreement in that order.`
  };

  return hints[style];
}
