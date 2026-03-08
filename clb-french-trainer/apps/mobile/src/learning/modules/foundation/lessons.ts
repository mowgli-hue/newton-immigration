import type { Lesson } from '../../types';

export const foundationLessons: Lesson[] = [
  {
    id: 'foundation-0-1',
    level: 'Foundation',
    module: 'Module 0',
    objectives: ['Recognize letters A to G', 'Produce basic French sounds'],
    teachingContent: [
      {
        title: 'Alphabet and Sounds',
        body: 'French uses the Latin alphabet with sound patterns that differ from English.',
        examples: ['A: ah', 'E: uh', 'G: zhay'],
        companionTip: 'Repeat each letter out loud three times before moving ahead.'
      }
    ],
    exercises: [
      {
        id: 'f01-e1',
        type: 'multipleChoice',
        prompt: 'Which letter sound is closest to "zhay"?',
        options: ['B', 'G', 'C', 'D'],
        correctAnswer: 'G'
      }
    ],
    productionTask: {
      prompt: 'Say A-G slowly and clearly, then write them in your notebook.',
      expectedOutput: 'mixed',
      checklist: ['Correct sequence', 'Clear articulation', 'Notebook practice complete']
    },
    miniTest: [
      {
        id: 'f01-t1',
        type: 'multipleChoice',
        prompt: 'French letter G is often pronounced as:',
        options: ['gay', 'zhay', 'jee', 'kah'],
        correctAnswer: 'zhay'
      }
    ],
    masteryThreshold: 70
  },
  {
    id: 'foundation-0-2',
    level: 'Foundation',
    module: 'Module 0',
    objectives: ['Use Bonjour and Merci correctly'],
    teachingContent: [
      {
        title: 'Basic Greetings',
        body: 'Polite greetings are core to daily French communication.',
        examples: ['Bonjour = Hello', 'Merci = Thank you']
      }
    ],
    exercises: [],
    productionTask: {
      prompt: 'Say Bonjour and Merci in a short greeting exchange.',
      expectedOutput: 'spoken',
      checklist: ['Clear pronunciation']
    },
    miniTest: [],
    masteryThreshold: 70
  },
  {
    id: 'foundation-0-3',
    level: 'Foundation',
    module: 'Module 0',
    objectives: ['Introduce yourself with Je m\'appelle...'],
    teachingContent: [
      {
        title: 'Introducing Yourself',
        body: 'Simple self-introduction builds confidence for first conversations.',
        examples: ['Je m\'appelle Sara.', 'Je suis etudiant.']
      }
    ],
    exercises: [],
    productionTask: {
      prompt: 'Write and speak one self-introduction line.',
      expectedOutput: 'mixed',
      checklist: ['Name included', 'Correct structure']
    },
    miniTest: [],
    masteryThreshold: 70
  },
  {
    id: 'foundation-0-4',
    level: 'Foundation',
    module: 'Module 0',
    objectives: ['Count from 0 to 20'],
    teachingContent: [
      {
        title: 'Numbers 0-20',
        body: 'Numbers support dates, times, and daily transactions.',
        examples: ['0 zero', '10 dix', '20 vingt']
      }
    ],
    exercises: [],
    productionTask: {
      prompt: 'Count from 0 to 20 without reading.',
      expectedOutput: 'spoken',
      checklist: ['Stable pacing', 'Correct sequence']
    },
    miniTest: [],
    masteryThreshold: 70
  }
];
