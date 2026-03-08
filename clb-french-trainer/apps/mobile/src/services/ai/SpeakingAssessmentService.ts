import { env } from '../../core/config/env';

export type SpeakingAssessmentInput = {
  prompt: string;
  transcriptText?: string;
  audioUri?: string;
  targetClbLevel?: 5 | 7;
  taskType?: 'speaking' | 'writing';
  expectedPatterns: string[];
  rubricFocus: Array<'pronunciation' | 'fluency' | 'grammar' | 'taskCompletion'>;
};

export type SpeakingAssessmentResult = {
  scorePercent: number;
  passed: boolean;
  transcriptText: string;
  rubric: {
    pronunciation: number;
    fluency: number;
    grammar: number;
    taskCompletion: number;
  };
  feedback: string;
  correctionModel: string;
  needsHumanReview?: boolean;
};

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’]/g, "'").replace(/[^\w\s']/g, ' ');
}

export async function assessSpeakingResponse(input: SpeakingAssessmentInput): Promise<SpeakingAssessmentResult> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/learning/ai/speaking-assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...input,
        targetClbLevel: input.targetClbLevel,
        taskType: input.taskType ?? 'speaking'
      })
    });

    if (response.ok) {
      return (await response.json()) as SpeakingAssessmentResult;
    }
  } catch {
    // Fall back to local placeholder scoring when backend is not reachable.
  }

  const transcript = input.transcriptText ?? '';
  const normalized = normalize(transcript);
  const matchCount = input.expectedPatterns.reduce((count, token) => {
    return count + (normalized.includes(normalize(token)) ? 1 : 0);
  }, 0);
  const taskCompletion = input.expectedPatterns.length ? Math.round((matchCount / input.expectedPatterns.length) * 100) : 100;

  // Placeholder scoring. Replace with STT + pronunciation scoring API later.
  const pronunciation = input.audioUri ? 72 : 65;
  const fluency = transcript.split(/\s+/).filter(Boolean).length >= 4 ? 75 : 60;
  const grammar = Math.min(90, Math.max(55, taskCompletion));
  const scorePercent = Math.round((pronunciation + fluency + grammar + taskCompletion) / 4);

  return {
    scorePercent,
    passed: scorePercent >= 70,
    transcriptText: transcript,
    rubric: { pronunciation, fluency, grammar, taskCompletion },
    feedback:
      scorePercent >= 70
        ? 'Good spoken response. Keep practicing pronunciation and rhythm.'
        : 'You communicated part of the idea, but you need clearer structure and required keywords.',
    correctionModel: input.expectedPatterns.join(' '),
    needsHumanReview: !input.audioUri
  };
}
