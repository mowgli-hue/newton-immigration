import type { ReflexWeakArea } from '../types/ReflexPerformanceTypes';

export type ReflexRunItem = {
  id: string;
  targetPrompt: string;
  answer: string;
  distractors: [string, string];
  weakArea: ReflexWeakArea;
};

export type ReflexRunLevelConfig = {
  id: 1 | 2 | 3 | 4 | 5;
  label: string;
  subtitle: string;
  mode: 'text' | 'audio';
  startSpeed: number;
  speedStep: number;
  minSpeed: number;
  maxSpeed: number;
  items: ReflexRunItem[];
};

export const reflexRunLevels: ReflexRunLevelConfig[] = [
  {
    id: 1,
    label: 'Level 1 - Direct Translation',
    subtitle: 'Fast English to French recall',
    mode: 'text',
    startSpeed: 132,
    speedStep: 8,
    minSpeed: 110,
    maxSpeed: 250,
    items: [
      { id: 'l1-1', targetPrompt: 'hello', answer: 'bonjour', distractors: ['merci', 'au revoir'], weakArea: 'greetings' },
      { id: 'l1-2', targetPrompt: 'thank you', answer: 'merci', distractors: ['bonjour', 'salut'], weakArea: 'greetings' },
      { id: 'l1-3', targetPrompt: 'train', answer: 'train', distractors: ['voiture', 'maison'], weakArea: 'transport' },
      { id: 'l1-4', targetPrompt: 'bus', answer: 'bus', distractors: ['livre', 'bonjour'], weakArea: 'transport' },
      { id: 'l1-5', targetPrompt: 'apple', answer: 'pomme', distractors: ['pain', 'fromage'], weakArea: 'food' }
    ]
  },
  {
    id: 2,
    label: 'Level 2 - Gender Focus',
    subtitle: 'Pick article + noun reflex',
    mode: 'text',
    startSpeed: 150,
    speedStep: 9,
    minSpeed: 126,
    maxSpeed: 285,
    items: [
      { id: 'l2-1', targetPrompt: 'the house', answer: 'la maison', distractors: ['le maison', 'les maison'], weakArea: 'gender' },
      { id: 'l2-2', targetPrompt: 'the book', answer: 'le livre', distractors: ['la livre', 'les livre'], weakArea: 'gender' },
      { id: 'l2-3', targetPrompt: 'an information', answer: 'une information', distractors: ['un information', 'des information'], weakArea: 'gender' },
      { id: 'l2-4', targetPrompt: 'a car', answer: 'une voiture', distractors: ['un voiture', 'le voiture'], weakArea: 'gender' }
    ]
  },
  {
    id: 3,
    label: 'Level 3 - Verb Conjugation',
    subtitle: 'Correct person + verb form',
    mode: 'text',
    startSpeed: 166,
    speedStep: 10,
    minSpeed: 138,
    maxSpeed: 320,
    items: [
      { id: 'l3-1', targetPrompt: 'I am', answer: 'je suis', distractors: ['je es', 'je sont'], weakArea: 'verbs' },
      { id: 'l3-2', targetPrompt: 'we are', answer: 'nous sommes', distractors: ['nous suis', 'nous est'], weakArea: 'verbs' },
      { id: 'l3-3', targetPrompt: 'they are', answer: 'ils sont', distractors: ['ils est', 'ils sommes'], weakArea: 'verbs' },
      { id: 'l3-4', targetPrompt: 'you are (formal)', answer: 'vous êtes', distractors: ['vous est', 'vous suis'], weakArea: 'verbs' }
    ]
  },
  {
    id: 4,
    label: 'Level 4 - Audio Target',
    subtitle: 'Listen and move fast',
    mode: 'audio',
    startSpeed: 178,
    speedStep: 11,
    minSpeed: 148,
    maxSpeed: 346,
    items: [
      { id: 'l4-1', targetPrompt: 'bonjour', answer: 'bonjour', distractors: ['bonsoir', 'merci'], weakArea: 'greetings' },
      { id: 'l4-2', targetPrompt: 'merci', answer: 'merci', distractors: ['bonjour', 'salut'], weakArea: 'greetings' },
      { id: 'l4-3', targetPrompt: 'train', answer: 'train', distractors: ['tram', 'bus'], weakArea: 'transport' },
      { id: 'l4-4', targetPrompt: 'pomme', answer: 'pomme', distractors: ['poire', 'pain'], weakArea: 'food' }
    ]
  },
  {
    id: 5,
    label: 'Level 5 - Sentence Completion',
    subtitle: 'Complete functional French chunks',
    mode: 'text',
    startSpeed: 192,
    speedStep: 12,
    minSpeed: 160,
    maxSpeed: 380,
    items: [
      {
        id: 'l5-1',
        targetPrompt: 'Je ____ au Canada.',
        answer: 'vis',
        distractors: ['vivons', 'vivez'],
        weakArea: 'sentence_structure'
      },
      {
        id: 'l5-2',
        targetPrompt: 'Nous ____ prêts.',
        answer: 'sommes',
        distractors: ['est', 'êtes'],
        weakArea: 'verbs'
      },
      {
        id: 'l5-3',
        targetPrompt: 'Je travaille ____ bureau.',
        answer: 'au',
        distractors: ['à la', 'aux'],
        weakArea: 'workplace'
      },
      {
        id: 'l5-4',
        targetPrompt: 'Elle prend ____ bus.',
        answer: 'le',
        distractors: ['la', 'les'],
        weakArea: 'transport'
      }
    ]
  }
];

export function getReflexLevel(levelId: 1 | 2 | 3 | 4 | 5) {
  return reflexRunLevels.find((level) => level.id === levelId) ?? reflexRunLevels[0];
}
