import type { PerformanceAnalysis } from '../../types/LearningTelemetryTypes';

export type AICoachGuidance = {
  title: string;
  coachingMessage: string;
  nextActions: string[];
  riskNote?: string;
};

function targetLabel(target: PerformanceAnalysis['guidanceTargets'][number]) {
  if (target === 'review') return 'review and retention';
  return target;
}

export function buildAICoachGuidance(analysis: PerformanceAnalysis): AICoachGuidance {
  const primary = analysis.guidanceTargets[0];
  const nextActions: string[] = [];

  if (primary === 'speaking') {
    nextActions.push('Do one speaking drill session and repeat each model line 3 times.');
    nextActions.push('Record speaking responses and check Azure pronunciation before marking complete.');
  } else if (primary === 'writing') {
    nextActions.push('Do one writing correction session and rewrite after AI feedback.');
    nextActions.push('Focus on sentence connectors and task completion phrases.');
  } else if (primary === 'review') {
    nextActions.push('Run a review/retrieval session before opening a new lesson.');
    nextActions.push('Repeat missed items from recent lessons and avoid rushing through retries.');
  } else if (primary === 'listening') {
    nextActions.push('Run a listening + shadowing session today.');
    nextActions.push('Replay one short audio block and summarize it aloud.');
  } else {
    nextActions.push('Continue your current lesson and complete the production task before moving on.');
  }

  if (analysis.quality.temporaryApprovalCount > 0) {
    nextActions.push('Replace temporary approvals with real speaking/writing submissions when possible.');
  }

  return {
    title: `AI Coach Focus: ${targetLabel(primary)[0].toUpperCase()}${targetLabel(primary).slice(1)}`,
    coachingMessage: analysis.summary,
    nextActions: nextActions.slice(0, 3),
    riskNote:
      analysis.integrity.confidence === 'high'
        ? undefined
        : `Performance confidence: ${analysis.integrity.confidence}. ${analysis.integrity.signals[0] ?? ''}`.trim()
  };
}

