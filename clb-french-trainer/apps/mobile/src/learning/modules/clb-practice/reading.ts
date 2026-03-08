export type CLBReadingTask = {
  id: string;
  target: 'CLB5' | 'CLB7';
  textType: 'notice' | 'email' | 'article';
  passage: string;
  questions: string[];
};

export const clbReadingTasks: CLBReadingTask[] = [
  {
    id: 'clb-read-1',
    target: 'CLB5',
    textType: 'email',
    passage: 'Placeholder practical message for CLB5 reading.',
    questions: ['What is the main request?', 'What action is required?']
  },
  {
    id: 'clb-read-2',
    target: 'CLB7',
    textType: 'article',
    passage: 'Placeholder opinion text for CLB7 analysis.',
    questions: ['What is the author position?', 'What evidence supports it?']
  }
];
