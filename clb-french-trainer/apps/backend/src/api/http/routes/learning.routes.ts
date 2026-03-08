import { Router } from 'express';
import { z } from 'zod';

import { config } from '../../../infrastructure/config/env';

export const learningRouter = Router();

const speakingAssessSchema = z.object({
  prompt: z.string().min(1),
  transcriptText: z.string().default(''),
  expectedPatterns: z.array(z.string()).default([]),
  rubricFocus: z.array(z.enum(['pronunciation', 'fluency', 'grammar', 'taskCompletion'])).optional()
});

const writingAssessSchema = z.object({
  prompt: z.string().min(1),
  text: z.string().default(''),
  expectedElements: z.array(z.string()).default([]),
  minWords: z.number().int().min(0).default(0),
  rubricFocus: z.array(z.enum(['grammar', 'coherence', 'vocabulary', 'taskCompletion'])).optional()
});

const pronunciationAssessSchema = z.object({
  audioBase64: z.string().min(1),
  language: z.string().default('fr-CA'),
  referenceText: z.string().optional(),
  contentType: z.string().optional(),
  gradingSystem: z.enum(['HundredMark', 'FivePoint']).default('HundredMark')
});

const aiCoachGuidanceSchema = z.object({
  currentLevelTitle: z.string().min(1),
  currentModuleTitle: z.string().optional(),
  roadmapDay: z.number().int().min(1).optional(),
  weakestSkill: z.enum(['listening', 'speaking', 'reading', 'writing', 'integrated']).optional(),
  performance: z.object({
    activity: z.object({
      eventsLast7Days: z.number().int().min(0),
      lessonsStartedLast7Days: z.number().int().min(0),
      lessonsCompletedLast7Days: z.number().int().min(0)
    }),
    quality: z.object({
      exerciseAccuracyPercent: z.number().min(0).max(100),
      retryRatePercent: z.number().min(0).max(100),
      temporaryApprovalCount: z.number().int().min(0),
      speakingAiAverage: z.number().min(0).max(100).nullable(),
      writingAiAverage: z.number().min(0).max(100).nullable()
    }),
    integrity: z.object({
      confidence: z.enum(['high', 'medium', 'low']),
      signals: z.array(z.string()).default([])
    }),
    guidanceTargets: z.array(z.enum(['listening', 'speaking', 'reading', 'writing', 'review'])).default([]),
    summary: z.string()
  })
});

const aiTutorChatSchema = z.object({
  question: z.string().min(1),
  routeName: z.string().optional(),
  companionName: z.string().optional(),
  hintText: z.string().optional(),
  recentMessages: z.array(z.object({
    role: z.enum(['assistant', 'user']),
    text: z.string().min(1)
  })).max(10).optional()
});

async function callOpenAIJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  if (!config.openAiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured on backend.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openAiApiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI response did not contain content.');
  }

  return JSON.parse(content) as T;
}

learningRouter.post('/ai/speaking-assess', async (req, res) => {
  try {
    const input = speakingAssessSchema.parse(req.body ?? {});

    if (!input.transcriptText.trim()) {
      return res.status(400).json({ message: 'transcriptText is required for speaking assessment.' });
    }

    const result = await callOpenAIJson<{
      scorePercent: number;
      passed: boolean;
      rubric: { pronunciation: number; fluency: number; grammar: number; taskCompletion: number };
      feedback: string;
      correctionModel: string;
    }>(
      'You are a strict but supportive French tutor evaluating beginner/intermediate French speaking transcripts. Return only valid JSON.',
      [
        `Prompt: ${input.prompt}`,
        `Learner transcript: ${input.transcriptText}`,
        `Expected patterns: ${input.expectedPatterns.join(', ') || 'none'}`,
        'Score for transcript-based speaking evaluation only (not real audio pronunciation).',
        'Return JSON keys exactly: scorePercent, passed, rubric, feedback, correctionModel.',
        'rubric must include pronunciation, fluency, grammar, taskCompletion (0-100).',
        'Keep feedback concise (1-2 sentences).',
        'correctionModel should be a better French version of the learner response.'
      ].join('\n')
    );

    return res.json({
      ...result,
      transcriptText: input.transcriptText,
      needsHumanReview: true,
      note: 'Transcript-based speaking check only. Pronunciation scoring requires audio provider integration.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return res.status(500).json({ message });
  }
});

learningRouter.post('/ai/writing-correct', async (req, res) => {
  try {
    const input = writingAssessSchema.parse(req.body ?? {});

    if (!input.text.trim()) {
      return res.status(400).json({ message: 'text is required for writing correction.' });
    }

    const result = await callOpenAIJson<{
      scorePercent: number;
      passed: boolean;
      rubric: { grammar: number; coherence: number; vocabulary: number; taskCompletion: number };
      feedback: string;
      corrections: string[];
      improvedModel: string;
    }>(
      'You are a French writing tutor for TEF/CEFR learners. Evaluate the learner text and return only valid JSON.',
      [
        `Prompt: ${input.prompt}`,
        `Learner text: ${input.text}`,
        `Expected elements: ${input.expectedElements.join(', ') || 'none'}`,
        `Minimum words: ${input.minWords}`,
        'Return JSON keys exactly: scorePercent, passed, rubric, feedback, corrections, improvedModel.',
        'rubric must include grammar, coherence, vocabulary, taskCompletion (0-100).',
        'corrections should be an array of short actionable items (max 4).',
        'improvedModel should be a corrected/improved French response appropriate to learner level.'
      ].join('\n')
    );

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return res.status(500).json({ message });
  }
});

learningRouter.post('/ai/pronunciation-assess', async (req, res) => {
  try {
    const input = pronunciationAssessSchema.parse(req.body ?? {});

    if (!config.azureSpeechKey || !config.azureSpeechRegion) {
      return res.status(500).json({ message: 'Azure Speech is not configured on backend.' });
    }

    const normalizedBase64 = input.audioBase64.replace(/^data:.*?;base64,/, '');
    const audioBuffer = Buffer.from(normalizedBase64, 'base64');

    async function callAzure(
      language: string,
      includePronunciationHeader: boolean,
      contentType: string
    ): Promise<{ ok: boolean; status: number; rawText: string; attempt: string }> {
      const endpoint = `https://${config.azureSpeechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${encodeURIComponent(language)}&format=detailed`;
      const headers: Record<string, string> = {
        'Ocp-Apim-Subscription-Key': config.azureSpeechKey,
        'Content-Type': contentType,
        Accept: 'application/json'
      };

      if (includePronunciationHeader && input.referenceText?.trim()) {
        const pronunciationPayload = {
          ReferenceText: input.referenceText,
          GradingSystem: input.gradingSystem,
          Dimension: 'Comprehensive',
          EnableMiscue: true
        };
        headers['Pronunciation-Assessment'] = Buffer.from(JSON.stringify(pronunciationPayload)).toString('base64');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: audioBuffer
      });
      const rawText = await response.text();
      return {
        ok: response.ok,
        status: response.status,
        rawText,
        attempt: `${language}${includePronunciationHeader ? '+pron' : '+stt'}+${contentType}`
      };
    }

    const preferredType = (input.contentType ?? '').trim();
    const contentTypes = Array.from(
      new Set(
        [
          preferredType || null,
          'audio/mp4',
          'audio/x-m4a',
          'audio/m4a',
          'audio/wav; codecs=audio/pcm; samplerate=16000'
        ].filter(Boolean)
      )
    ) as string[];

    const languages = input.language.toLowerCase() === 'fr-ca' ? ['fr-CA', 'fr-FR'] : [input.language];
    const attempts = contentTypes.flatMap((contentType) => [
      ...languages.map((language) => ({ language, includePronunciationHeader: true, contentType })),
      { language: input.language, includePronunciationHeader: false, contentType }
    ]);

    let rawText = '';
    let lastStatus = 500;
    let usedAttempt = '';
    let success = false;

    for (const attempt of attempts) {
      const result = await callAzure(attempt.language, attempt.includePronunciationHeader, attempt.contentType);
      rawText = result.rawText;
      lastStatus = result.status;
      usedAttempt = result.attempt;
      if (result.ok) {
        success = true;
        break;
      }
    }

    if (!success) {
      return res.status(lastStatus).json({
        message: 'Azure Speech request failed.',
        azureStatus: lastStatus,
        details: rawText,
        attempt: usedAttempt,
        hint:
          'Check AZURE_SPEECH_KEY, AZURE_SPEECH_REGION, and audio format. For iOS Expo recordings, WAV 16k mono is recommended.'
      });
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return res.status(500).json({
        message: 'Azure Speech returned non-JSON response.',
        details: rawText,
        attempt: usedAttempt
      });
    }

    const nbest = Array.isArray(parsed.NBest) ? parsed.NBest[0] : undefined;
    const pron = nbest?.PronunciationAssessment ?? parsed.PronunciationAssessment ?? undefined;

    return res.json({
      transcriptText: parsed.DisplayText ?? nbest?.Display ?? '',
      lexicalText: parsed.Lexical ?? nbest?.Lexical ?? '',
      confidence: nbest?.Confidence ?? null,
      pronunciation: pron
        ? {
            accuracyScore: pron.AccuracyScore ?? null,
            fluencyScore: pron.FluencyScore ?? null,
            completenessScore: pron.CompletenessScore ?? null,
            pronunciationScore: pron.PronScore ?? pron.PronunciationScore ?? null
          }
        : null,
      raw: {
        recognitionStatus: parsed.RecognitionStatus ?? null,
        duration: parsed.Duration ?? null,
        offset: parsed.Offset ?? null
      },
      meta: {
        attempt: usedAttempt
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return res.status(500).json({ message });
  }
});

learningRouter.post('/ai/coach-guidance', async (req, res) => {
  try {
    const input = aiCoachGuidanceSchema.parse(req.body ?? {});

    const result = await callOpenAIJson<{
      title: string;
      coachingMessage: string;
      nextActions: string[];
      riskNote?: string;
    }>(
      'You are an AI French learning coach for a structured CEFR/CLB app. Give concise, practical, step-by-step guidance based on learner performance data. Return only valid JSON.',
      [
        `Current level: ${input.currentLevelTitle}`,
        `Current module: ${input.currentModuleTitle ?? 'unknown'}`,
        `Roadmap day: ${input.roadmapDay ?? 'unknown'}`,
        `Weakest skill (engine): ${input.weakestSkill ?? 'unknown'}`,
        `Performance summary: ${input.performance.summary}`,
        `Accuracy: ${input.performance.quality.exerciseAccuracyPercent}%`,
        `Retry rate: ${input.performance.quality.retryRatePercent}%`,
        `Temporary approvals: ${input.performance.quality.temporaryApprovalCount}`,
        `Speaking AI avg: ${input.performance.quality.speakingAiAverage ?? 'n/a'}`,
        `Writing AI avg: ${input.performance.quality.writingAiAverage ?? 'n/a'}`,
        `Integrity confidence: ${input.performance.integrity.confidence}`,
        `Integrity signals: ${input.performance.integrity.signals.join(' | ') || 'none'}`,
        `Guidance targets: ${input.performance.guidanceTargets.join(', ') || 'none'}`,
        'Return JSON keys exactly: title, coachingMessage, nextActions, riskNote.',
        'nextActions must be an array of 2-4 short actionable steps.',
        'Keep coachingMessage to 1-2 sentences.',
        'Do not promise fluency. Focus on next session and weak skill improvement.',
        'If confidence is low, include a riskNote explaining why the evidence is weak.'
      ].join('\n')
    );

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return res.status(500).json({ message });
  }
});

learningRouter.post('/ai/tutor-chat', async (req, res) => {
  try {
    const input = aiTutorChatSchema.parse(req.body ?? {});

    const result = await callOpenAIJson<{
      reply: string;
      suggestions?: string[];
    }>(
      'You are a patient French tutor inside a structured learning app for CEFR/CLB/TEF Canada prep. Answer briefly, clearly, and at the learner’s level. Give teaching help, not generic chat. Return only valid JSON.',
      [
        `Learner question: ${input.question}`,
        `Current screen: ${input.routeName ?? 'unknown'}`,
        `Companion name: ${input.companionName ?? 'AI Tutor'}`,
        `Screen hint/context: ${input.hintText ?? 'none'}`,
        `Recent messages: ${(input.recentMessages ?? []).map((m) => `${m.role}: ${m.text}`).join(' | ') || 'none'}`,
        'Return JSON keys exactly: reply, suggestions.',
        'reply should be 2-5 short sentences and include a concrete next step.',
        'Use simple French examples when helpful, but explain in clear English if needed.',
        'suggestions should be 0-3 short follow-up prompts the student can tap.'
      ].join('\n')
    );

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return res.status(500).json({ message });
  }
});

learningRouter.get('/dashboard', (_req, res) => {
  res.status(501).json({ message: 'Dashboard endpoint scaffolded' });
});

learningRouter.post('/diagnostic/start', (_req, res) => {
  res.status(501).json({ message: 'Diagnostic endpoint scaffolded' });
});

learningRouter.post('/mock-exam/start', (_req, res) => {
  res.status(501).json({ message: 'Mock exam endpoint scaffolded' });
});
