import type { Lesson } from '../../types';

export const a1Lessons: Lesson[] = [
  {
    id: 'a1-1',
    level: 'A1',
    module: 'A1 Lesson 1',
    objectives: ['Alphabet A-G', 'Vowel sounds', 'Core greetings'],
    teachingContent: [
      {
        title: 'French Alphabet Starter',
        body: 'Learn letter names, basic vowel sounds, and common greeting expressions.',
        examples: ['Bonjour', 'Salut', 'Merci', 'Au revoir']
      }
    ],
    exercises: [],
    productionTask: {
      prompt: 'Record a 20-second greeting self-introduction.',
      expectedOutput: 'spoken',
      checklist: ['Uses Bonjour', 'Includes Merci']
    },
    miniTest: [],
    masteryThreshold: 70
  }
];
