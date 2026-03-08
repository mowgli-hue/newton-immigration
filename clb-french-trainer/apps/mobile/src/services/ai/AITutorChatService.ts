import { env } from '../../core/config/env';

export type TutorChatMessage = {
  role: 'assistant' | 'user';
  text: string;
};

export type TutorChatInput = {
  question: string;
  routeName?: string;
  companionName?: string;
  hintText?: string;
  recentMessages?: TutorChatMessage[];
};

export type TutorChatResult = {
  reply: string;
  suggestions?: string[];
};

export async function askAITutor(input: TutorChatInput): Promise<TutorChatResult> {
  const response = await fetch(`${env.apiBaseUrl}/learning/ai/tutor-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tutor chat failed (${response.status}): ${text}`);
  }

  return (await response.json()) as TutorChatResult;
}

