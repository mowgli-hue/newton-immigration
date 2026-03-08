export type ReflexWeakArea =
  | 'greetings'
  | 'food'
  | 'transport'
  | 'gender'
  | 'verbs'
  | 'sentence_structure'
  | 'workplace';

export type ReflexPerformanceProfile = {
  reflexAccuracy: number;
  reflexSpeed: number;
  weakVocabularyAreas: ReflexWeakArea[];
  sessionsPlayed: number;
  longestStreak: number;
  updatedAt: number;
};

export type ReflexSessionMetrics = {
  accuracyPercent: number;
  averageReactionMs: number;
  longestStreak: number;
  weakAreaCounts: Partial<Record<ReflexWeakArea, number>>;
};
