import type { Lesson } from '../../types';

export const b2Lessons: Lesson[] = [
  {
    id: 'b2-1',
    level: 'B2',
    module: 'B2 Fluency',
    objectives: ['Understand complex text', 'Argue with nuance'],
    teachingContent: [
      {
        title: 'Advanced Comprehension and Expression',
        body: 'Work with abstract topics and defend positions in detail.',
        examples: ['Bien que...', 'Toutefois...']
      }
    ],
    exercises: [],
    productionTask: {
      prompt: 'Write a structured 180-word argument on a social topic.',
      expectedOutput: 'written',
      checklist: ['Clear thesis', 'Connectors', 'Conclusion']
    },
    miniTest: [],
    masteryThreshold: 80
  }
];
