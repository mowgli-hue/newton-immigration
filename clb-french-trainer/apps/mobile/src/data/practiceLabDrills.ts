export type SpeedRecallPrompt = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

export type ErrorHunterPrompt = {
  id: string;
  incorrectSentence: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export const speedRecallPrompts: SpeedRecallPrompt[] = [
  {
    id: 'sr-1',
    prompt: '"Je suis" means:',
    options: ['I am', 'You are', 'I have', 'They are'],
    correctIndex: 0
  },
  {
    id: 'sr-2',
    prompt: 'Choose the correct greeting for a formal context:',
    options: ['Salut', 'Bonjour', 'Coucou', 'Allo'],
    correctIndex: 1
  },
  {
    id: 'sr-3',
    prompt: '"Merci" means:',
    options: ['Please', 'Sorry', 'Thank you', 'Welcome'],
    correctIndex: 2
  },
  {
    id: 'sr-4',
    prompt: '"Je m\'appelle" is used to:',
    options: ['Ask age', 'Say your name', 'Ask address', 'Say goodbye'],
    correctIndex: 1
  },
  {
    id: 'sr-5',
    prompt: 'Select the correct article for "livre":',
    options: ['la', 'les', 'une', 'le'],
    correctIndex: 3
  },
  {
    id: 'sr-6',
    prompt: '"Nous" refers to:',
    options: ['I', 'We', 'You (singular)', 'They'],
    correctIndex: 1
  },
  {
    id: 'sr-7',
    prompt: 'How do you say "Goodbye" in French?',
    options: ['Bonsoir', 'Merci', 'Au revoir', 'Pardon'],
    correctIndex: 2
  },
  {
    id: 'sr-8',
    prompt: '"J\'habite au Canada" means:',
    options: ['I work in Canada', 'I study in Canada', 'I live in Canada', 'I travel to Canada'],
    correctIndex: 2
  }
];

export const errorHunterPrompts: ErrorHunterPrompt[] = [
  {
    id: 'eh-1',
    incorrectSentence: 'Je suis 25 ans.',
    options: ['Je suis 25 ans.', 'J\'ai 25 ans.', 'Je ai 25 ans.', 'J\'est 25 ans.'],
    correctIndex: 1,
    explanation: 'Age in French uses "avoir" (to have): J\'ai 25 ans.'
  },
  {
    id: 'eh-2',
    incorrectSentence: 'Je m\'appelle John, enchantée.',
    options: ['Je m\'appelle John, enchantée.', 'Je m\'appelle John, enchanté.', 'Je m\'appelle John enchanté.', 'J\'appelle John, enchanté.'],
    correctIndex: 1,
    explanation: 'If the speaker is male, use "enchanté". Keep punctuation clear.'
  },
  {
    id: 'eh-3',
    incorrectSentence: 'Il sont canadien.',
    options: ['Ils sont canadien.', 'Il est canadien.', 'Ils sont canadiens.', 'Il sont canadiens.'],
    correctIndex: 2,
    explanation: 'Plural subject "Ils" needs plural adjective "canadiens".'
  },
  {
    id: 'eh-4',
    incorrectSentence: 'Je habite à Vancouver.',
    options: ['J\'habite à Vancouver.', 'Je habite à Vancouver.', 'J\'habites à Vancouver.', 'Je habite au Vancouver.'],
    correctIndex: 0,
    explanation: 'Before a vowel, "je" contracts to "j\'".'
  },
  {
    id: 'eh-5',
    incorrectSentence: 'Nous est prêts.',
    options: ['Nous est prêts.', 'Nous sommes prêts.', 'Nous êtes prêts.', 'Nous suis prêts.'],
    correctIndex: 1,
    explanation: 'Conjugation of "être" with "nous" is "sommes".'
  },
  {
    id: 'eh-6',
    incorrectSentence: 'Je voudrais un information.',
    options: ['Je voudrais un information.', 'Je voudrais des informations.', 'Je voudrais une information.', 'Je voudrais informations.'],
    correctIndex: 2,
    explanation: '"Information" is feminine singular: "une information".'
  }
];
