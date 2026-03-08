import { env } from '../../core/config/env';

export type WritingCorrectionInput = {
  prompt: string;
  text: string;
  targetClbLevel?: 5 | 7;
  taskType?: 'speaking' | 'writing';
  expectedElements: string[];
  minWords: number;
  rubricFocus: Array<'grammar' | 'coherence' | 'vocabulary' | 'taskCompletion'>;
};

export type WritingCorrectionResult = {
  scorePercent: number;
  passed: boolean;
  rubric: {
    grammar: number;
    coherence: number;
    vocabulary: number;
    taskCompletion: number;
  };
  feedback: string;
  corrections: string[];
  improvedModel: string;
};

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’]/g, "'").replace(/[^\w\s']/g, ' ');
}

export async function assessWritingResponse(input: WritingCorrectionInput): Promise<WritingCorrectionResult> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/learning/ai/writing-correct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...input,
        targetClbLevel: input.targetClbLevel,
        taskType: input.taskType ?? 'writing'
      })
    });

    if (response.ok) {
      return (await response.json()) as WritingCorrectionResult;
    }
  } catch {
    // Fall back to local placeholder scoring when backend is not reachable.
  }

  const normalized = normalize(input.text);
  const words = normalized.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const found = input.expectedElements.reduce((count, token) => {
    return count + (normalized.includes(normalize(token)) ? 1 : 0);
  }, 0);

  const taskCompletion = input.expectedElements.length ? Math.round((found / input.expectedElements.length) * 100) : 100;
  const grammar = Math.max(55, Math.min(88, taskCompletion - (wordCount < input.minWords ? 15 : 0)));
  const coherence = wordCount >= input.minWords ? 75 : 58;
  const vocabulary = Math.min(85, 60 + Math.round(Math.min(20, wordCount / 2)));
  const scorePercent = Math.round((grammar + coherence + vocabulary + taskCompletion) / 4);

  return {
    scorePercent,
    passed: scorePercent >= 70,
    rubric: { grammar, coherence, vocabulary, taskCompletion },
    feedback:
      scorePercent >= 70
        ? 'Your writing covers the main task. Next, improve accuracy and connect ideas more naturally.'
        : 'Your response needs more required elements and clearer sentence structure.',
    corrections: [
      wordCount < input.minWords ? `Write at least ${input.minWords} words.` : 'Word count is adequate.',
      found < input.expectedElements.length ? `Include these ideas: ${input.expectedElements.slice(found, found + 2).join(', ')}` : 'All key elements included.'
    ],
    improvedModel: `Model answer should include: ${input.expectedElements.join(', ')}.`
  };
}
