import { env } from '../../core/config/env';

export type PronunciationAssessmentInput = {
  audioBase64: string;
  language?: string;
  referenceText?: string;
  contentType?: string;
};

export type PronunciationAssessmentResult = {
  transcriptText: string;
  lexicalText?: string;
  confidence?: number | null;
  pronunciation: null | {
    accuracyScore: number | null;
    fluencyScore: number | null;
    completenessScore: number | null;
    pronunciationScore: number | null;
  };
  raw?: {
    recognitionStatus?: string | null;
    duration?: number | null;
    offset?: number | null;
  };
  meta?: {
    attempt?: string;
  };
};

export async function assessPronunciation(input: PronunciationAssessmentInput): Promise<PronunciationAssessmentResult> {
  const response = await fetch(`${env.apiBaseUrl}/learning/ai/pronunciation-assess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64: input.audioBase64,
      language: input.language ?? 'fr-CA',
      referenceText: input.referenceText,
      contentType: input.contentType
    })
  });

  if (!response.ok) {
    const text = await response.text();
    let details = text;
    try {
      const parsed = JSON.parse(text) as {
        message?: string;
        details?: string;
        attempt?: string;
        hint?: string;
      };
      details =
        [parsed.message, parsed.details, parsed.attempt ? `attempt=${parsed.attempt}` : '', parsed.hint]
          .filter(Boolean)
          .join(' | ') || text;
    } catch {
      // keep raw text
    }
    throw new Error(`Pronunciation assessment failed (${response.status}). ${details}`);
  }

  return (await response.json()) as PronunciationAssessmentResult;
}
