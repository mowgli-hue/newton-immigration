import type { LearningTelemetryEvent, PerformanceAnalysis } from '../types/LearningTelemetryTypes';

function average(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function analyzePerformance(events: LearningTelemetryEvent[]): PerformanceAnalysis {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recent = events.filter((e) => e.timestamp >= sevenDaysAgo);

  const exerciseEvents = recent.filter((e) => e.type === 'exercise_submitted');
  const aiEvents = recent.filter((e) => e.type === 'ai_assessment');
  const speakingScores = aiEvents.filter((e) => e.metadata?.assessmentType === 'speaking' && typeof e.scorePercent === 'number').map((e) => e.scorePercent as number);
  const writingScores = aiEvents.filter((e) => e.metadata?.assessmentType === 'writing' && typeof e.scorePercent === 'number').map((e) => e.scorePercent as number);
  const retrySubmissions = exerciseEvents.filter((e) => e.retryMode);
  const incorrect = exerciseEvents.filter((e) => e.correct === false);
  const correct = exerciseEvents.filter((e) => e.correct === true);
  const tempApprovals = recent.filter((e) => e.type === 'temporary_approval_used');
  const recordingFails = recent.filter((e) => e.type === 'recording_analysis_failed');

  const signals: string[] = [];
  let confidence: PerformanceAnalysis['integrity']['confidence'] = 'high';

  if (tempApprovals.length >= 4) {
    signals.push('Frequent temporary approvals used in speaking/writing tasks.');
    confidence = 'low';
  } else if (tempApprovals.length >= 2) {
    signals.push('Some temporary approvals used; AI evidence is partial.');
    confidence = 'medium';
  }

  if (retrySubmissions.length > 0 && pct(retrySubmissions.length, exerciseEvents.length || 1) > 45) {
    signals.push('High retry dependence; review before advancing difficulty.');
    confidence = confidence === 'high' ? 'medium' : confidence;
  }

  if (recordingFails.length >= 2) {
    signals.push('Speaking recording/analysis failed multiple times; speaking evidence may be incomplete.');
    confidence = confidence === 'high' ? 'medium' : confidence;
  }

  const guidanceTargets: PerformanceAnalysis['guidanceTargets'] = [];
  const speakingAvg = average(speakingScores);
  const writingAvg = average(writingScores);
  const accuracyPct = pct(correct.length, exerciseEvents.length || 1);
  const retryRatePct = pct(retrySubmissions.length, exerciseEvents.length || 1);

  if (speakingAvg != null && speakingAvg < 75) guidanceTargets.push('speaking');
  if (writingAvg != null && writingAvg < 75) guidanceTargets.push('writing');
  if (accuracyPct < 70 || retryRatePct > 35) guidanceTargets.push('review');
  if (guidanceTargets.length === 0) guidanceTargets.push('listening');

  const summary =
    accuracyPct >= 80 && retryRatePct <= 25
      ? 'Performance is stable this week. Continue progressing and keep one review session for retention.'
      : retryRatePct > 35
        ? 'Learning is progressing, but retry dependence is high. Add review and slower production practice before moving faster.'
        : 'Progress is mixed. Focus on guided practice and one weak skill before benchmarking again.';

  return {
    activity: {
      eventsLast7Days: recent.length,
      lessonsStartedLast7Days: recent.filter((e) => e.type === 'lesson_started').length,
      lessonsCompletedLast7Days: recent.filter((e) => e.type === 'lesson_completed').length
    },
    quality: {
      exerciseAccuracyPercent: accuracyPct,
      retryRatePercent: retryRatePct,
      temporaryApprovalCount: tempApprovals.length,
      speakingAiAverage: speakingAvg,
      writingAiAverage: writingAvg
    },
    integrity: {
      confidence,
      signals
    },
    guidanceTargets,
    summary
  };
}

