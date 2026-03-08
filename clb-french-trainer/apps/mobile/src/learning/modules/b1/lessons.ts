import type { Lesson } from '../../types';

export const b1Lessons: Lesson[] = [
  {
    id: 'b1-1',
    level: 'B1',
    module: 'B1 Communication',
    objectives: ['Express opinion', 'Handle work and service scenarios'],
    teachingContent: [
      {
        title: 'Functional Communication',
        body: 'Develop independence in everyday and workplace interactions.',
        examples: ['Je pense que...', 'Selon moi...']
      }
    ],
    exercises: [],
    productionTask: {
      prompt: 'Deliver a 1-minute opinion response on a familiar topic.',
      expectedOutput: 'spoken',
      checklist: ['Clear position', 'Two supporting points']
    },
    miniTest: [],
    masteryThreshold: 75
  }
];
