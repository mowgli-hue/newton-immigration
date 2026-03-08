import type { Lesson } from '../../types';

export const a2Lessons: Lesson[] = [
  {
    id: 'a2-1',
    level: 'A2',
    module: 'A2 Core',
    objectives: ['Describe routines', 'Use present and near future'],
    teachingContent: [
      {
        title: 'Daily Routine Language',
        body: 'Build practical grammar and vocabulary for daily life topics.',
        examples: ['Je vais travailler demain.', 'Je prends le bus.']
      }
    ],
    exercises: [],
    productionTask: {
      prompt: 'Write 5 lines about your weekday routine.',
      expectedOutput: 'written',
      checklist: ['Chronological order', 'At least two verbs']
    },
    miniTest: [],
    masteryThreshold: 75
  }
];
