export type CLBListeningTask = {
  id: string;
  target: 'CLB5' | 'CLB7';
  objective: string;
  audioPlaceholder: string;
  prompts: string[];
  scoringRubric: string[];
};

export const clbListeningTasks: CLBListeningTask[] = [
  {
    id: 'clb-listen-1',
    target: 'CLB5',
    objective: 'Extract key details from practical conversations.',
    audioPlaceholder: 'placeholder://audio/listening/clb5/001',
    prompts: ['Identify purpose', 'Identify one date/time detail'],
    scoringRubric: ['Key idea captured', 'Detail accuracy']
  },
  {
    id: 'clb-listen-2',
    target: 'CLB7',
    objective: 'Infer intention and summarize nuanced information.',
    audioPlaceholder: 'placeholder://audio/listening/clb7/001',
    prompts: ['State speaker intent', 'Summarize two supporting details'],
    scoringRubric: ['Inference quality', 'Summary coherence']
  }
];
