export function toPercent(score: number, max: number): number {
  if (max <= 0) {
    return 0;
  }

  return Math.round((score / max) * 100);
}
