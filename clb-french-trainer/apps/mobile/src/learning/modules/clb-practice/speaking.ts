export type CLBSpeakingTask = {
  id: string;
  target: 'CLB5' | 'CLB7';
  scenario: string;
  expectedLengthSeconds: number;
  rubric: string[];
  aiPronunciationReady: boolean;
};

export const clbSpeakingTasks: CLBSpeakingTask[] = [
  {
    id: 'clb-speak-1',
    target: 'CLB5',
    scenario: 'Request service information politely and clearly.',
    expectedLengthSeconds: 60,
    rubric: ['Clarity', 'Task completion', 'Basic grammar control'],
    aiPronunciationReady: true
  },
  {
    id: 'clb-speak-2',
    target: 'CLB7',
    scenario: 'Explain and justify a decision in a workplace context.',
    expectedLengthSeconds: 90,
    rubric: ['Argument structure', 'Language range', 'Pronunciation intelligibility'],
    aiPronunciationReady: true
  }
];
