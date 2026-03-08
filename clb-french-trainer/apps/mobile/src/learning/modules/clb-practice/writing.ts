export type CLBWritingTask = {
  id: string;
  target: 'CLB5' | 'CLB7';
  prompt: string;
  expectedWords: number;
  rubric: string[];
  aiCorrectionReady: boolean;
};

export const clbWritingTasks: CLBWritingTask[] = [
  {
    id: 'clb-write-1',
    target: 'CLB5',
    prompt: 'Write a short request email to reschedule an appointment.',
    expectedWords: 120,
    rubric: ['Purpose clarity', 'Politeness', 'Basic accuracy'],
    aiCorrectionReady: true
  },
  {
    id: 'clb-write-2',
    target: 'CLB7',
    prompt: 'Write an opinion response with reasons and a recommendation.',
    expectedWords: 200,
    rubric: ['Argument structure', 'Cohesion', 'Grammar range'],
    aiCorrectionReady: true
  }
];
