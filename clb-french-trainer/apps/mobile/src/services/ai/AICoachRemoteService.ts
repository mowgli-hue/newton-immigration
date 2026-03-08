import { env } from '../../core/config/env';
import type { PerformanceAnalysis } from '../../types/LearningTelemetryTypes';
import type { AICoachGuidance } from './AICoachService';

export type AICoachRemoteInput = {
  currentLevelTitle: string;
  currentModuleTitle?: string;
  roadmapDay?: number;
  weakestSkill?: 'listening' | 'speaking' | 'reading' | 'writing' | 'integrated';
  performance: PerformanceAnalysis;
};

export async function fetchAICoachGuidance(input: AICoachRemoteInput): Promise<AICoachGuidance> {
  const response = await fetch(`${env.apiBaseUrl}/learning/ai/coach-guidance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI Coach backend failed (${response.status}): ${text}`);
  }

  return (await response.json()) as AICoachGuidance;
}

