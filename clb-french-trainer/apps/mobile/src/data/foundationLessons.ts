export type FoundationPracticeQuestion = {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correctOption: number;
  companionTip: string;
};

export type FoundationLesson = {
  id: string;
  order: number;
  title: string;
  explanation: string;
  example: string;
  practiceQuestions: FoundationPracticeQuestion[];
};

export const foundationLessons: FoundationLesson[] = [
  {
    id: 'alphabet-sounds',
    order: 1,
    title: 'Alphabet & Sounds',
    explanation:
      'French uses the same 26 letters as English, but pronunciation differs. Start by identifying key vowel sounds and common silent letters.',
    example: 'Example: "e" in "je" is soft, and final consonants are often silent (e.g., "petit").',
    practiceQuestions: [
      {
        id: 'a1',
        prompt: 'How many letters are in the French alphabet?',
        options: ['24', '25', '26', '27'],
        correctOption: 2,
        companionTip: 'French keeps the same 26-letter alphabet as English.'
      },
      {
        id: 'a2',
        prompt: 'In many basic words, what often happens to the final consonant?',
        options: ['It is doubled', 'It is silent', 'It changes gender', 'It gets stressed'],
        correctOption: 1,
        companionTip: 'Listen for softer endings. Final consonants are frequently not pronounced.'
      },
      {
        id: 'a3',
        prompt: 'Which pair is a French vowel combination often taught early?',
        options: ['ai', 'kr', 'zx', 'pt'],
        correctOption: 0,
        companionTip: 'Combinations like "ai", "au", and "ou" are common in beginner French.'
      }
    ]
  },
  {
    id: 'basic-greetings',
    order: 2,
    title: 'Basic Greetings',
    explanation:
      'Use formal and informal greetings depending on context. Start with polite expressions used in daily life and services.',
    example: 'Example: "Bonjour" (hello), "Bonsoir" (good evening), "Merci" (thank you).',
    practiceQuestions: [
      {
        id: 'g1',
        prompt: 'What is the most common daytime greeting?',
        options: ['Bonsoir', 'Bonjour', 'Salutations', 'A demain'],
        correctOption: 1,
        companionTip: 'Use "Bonjour" during the day in most settings.'
      },
      {
        id: 'g2',
        prompt: 'Which phrase means "thank you"?',
        options: ['S\'il vous plait', 'Pardon', 'Merci', 'Excusez-moi'],
        correctOption: 2,
        companionTip: '"Merci" is the direct equivalent of "thank you".'
      },
      {
        id: 'g3',
        prompt: 'Which phrase is appropriate for evening greeting?',
        options: ['Bonsoir', 'Bonjour', 'Bonne nuit', 'Au revoir'],
        correctOption: 0,
        companionTip: 'Use "Bonsoir" when greeting someone in the evening.'
      }
    ]
  },
  {
    id: 'introducing-yourself',
    order: 3,
    title: 'Introducing Yourself',
    explanation:
      'Basic self-introduction includes name, origin, and simple personal details. Use short complete sentences with "je".',
    example: 'Example: "Je m\'appelle Sara. Je viens du Canada."',
    practiceQuestions: [
      {
        id: 'i1',
        prompt: 'How do you say "My name is Ali"?',
        options: ['Je suis Ali nom', 'Je m\'appelle Ali', 'Mon nom appelle Ali', 'Je appelle Ali'],
        correctOption: 1,
        companionTip: 'Use the fixed expression "Je m\'appelle..." for introducing your name.'
      },
      {
        id: 'i2',
        prompt: 'Which sentence means "I am from Morocco"?',
        options: ['Je suis Maroc', 'Je viens du Maroc', 'Je vais au Maroc', 'Je parle Maroc'],
        correctOption: 1,
        companionTip: 'For origin, use "Je viens de/du...".'
      },
      {
        id: 'i3',
        prompt: 'Choose the correct basic self-introduction sentence.',
        options: [
          'Je m\'appelle Lina.',
          'Je m\'appeles Lina.',
          'Je appeler Lina.',
          'Je suis appelle Lina.'
        ],
        correctOption: 0,
        companionTip: 'Watch verb agreement and keep the expression unchanged: "Je m\'appelle".'
      }
    ]
  },
  {
    id: 'numbers-0-20',
    order: 4,
    title: 'Numbers 0-20',
    explanation:
      'Mastering numbers 0 to 20 helps with age, dates, and everyday transactions. Recognize number words and matching digits.',
    example: 'Example: "douze" = 12, "dix-sept" = 17, "vingt" = 20.',
    practiceQuestions: [
      {
        id: 'n1',
        prompt: 'What number is "dix"?',
        options: ['8', '9', '10', '12'],
        correctOption: 2,
        companionTip: '"Dix" is ten. It is used in many compound numbers.'
      },
      {
        id: 'n2',
        prompt: 'Which word corresponds to 17?',
        options: ['dix-sept', 'sept-dix', 'vingt-sept', 'seize'],
        correctOption: 0,
        companionTip: '17 is "dix-sept" (10 + 7 structure).'
      },
      {
        id: 'n3',
        prompt: 'What does "vingt" mean?',
        options: ['18', '19', '20', '21'],
        correctOption: 2,
        companionTip: '"Vingt" is 20. This is a key milestone number in French counting.'
      }
    ]
  }
];
