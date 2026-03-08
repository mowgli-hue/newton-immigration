import { config } from '../../infrastructure/config/env';

type CampaignType = 'welcome' | 'studyReminder' | 'weeklyReport';

function pickBySeed(options: string[], seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return options[hash % options.length] ?? options[0] ?? 'Franco update';
}

type SubjectInput = {
  campaign: CampaignType;
  userId: string;
  daySeed?: string;
  displayName?: string;
};

function buildFallbackSubject(input: SubjectInput): string {
  const name = input.displayName?.trim();
  const shortName = name ? name.split(/\s+/)[0] : '';
  const baseSeed = `${input.userId}:${input.daySeed ?? ''}:${input.campaign}`;

  if (input.campaign === 'welcome') {
    return pickBySeed(
      [
        `Welcome to Franco${shortName ? `, ${shortName}` : ''}: Your CLB roadmap starts now`,
        `You are in${shortName ? `, ${shortName}` : ''} - Begin your French performance plan`,
        `Franco onboarding ready: Start your first 25-minute session`
      ],
      baseSeed
    );
  }

  if (input.campaign === 'studyReminder') {
    return pickBySeed(
      [
        `Today's 25-minute French session is waiting`,
        `Quick focus session today: keep your French streak`,
        `One session today = stronger CLB progress`
      ],
      baseSeed
    );
  }

  return pickBySeed(
    [
      'Your weekly Franco progress summary',
      'Weekly CLB progress check: strengths and next focus',
      'This week in Franco: progress report and next actions'
    ],
    baseSeed
  );
}

async function generateAiSubject(input: SubjectInput): Promise<string | null> {
  if (!config.openAiApiKey) return null;

  const campaignHint =
    input.campaign === 'welcome'
      ? 'Welcome/onboarding email'
      : input.campaign === 'studyReminder'
        ? 'Daily study reminder email'
        : 'Weekly progress summary email';

  const fallback = buildFallbackSubject(input);
  const prompt = [
    'Generate one high-conversion email subject line.',
    `Campaign: ${campaignHint}`,
    `Learner first name (optional): ${input.displayName?.trim() || 'none'}`,
    'Tone: professional, encouraging, focused on French learning progress in Canada.',
    'Constraints: 45-70 characters, no clickbait, no ALL CAPS, no emoji.',
    `Fallback reference: ${fallback}`,
    'Return only the subject text.'
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openAiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: prompt,
      max_output_tokens: 60
    })
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { output_text?: string };
  const subject = data.output_text?.trim();
  if (!subject) return null;
  if (subject.length < 20 || subject.length > 90) return null;
  return subject;
}

export async function buildSubject(input: SubjectInput): Promise<string> {
  const ai = await generateAiSubject(input).catch(() => null);
  return ai || buildFallbackSubject(input);
}
