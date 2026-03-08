import type { StructuredLessonContent } from '../../types/LessonContentTypes';

export const foundationStructuredLessons: StructuredLessonContent[] = [
  {
    id: 'foundation-structured-alphabet-sounds',
    curriculumLessonId: 'alphabet-sounds',
    levelId: 'foundation',
    moduleId: 'foundation-module-0',
    title: 'Foundation 1: Alphabet & Sounds',
    estimatedMinutes: 25,
    mode: 'foundation',
    outcomes: [
      'Recognize the French alphabet structure',
      'Notice basic pronunciation differences from English',
      'Identify common beginner sound patterns'
    ],
    vocabularyTargets: ['alphabet', 'lettre', 'son', 'bonjour', 'je'],
    grammarTargets: ['Sound-symbol recognition', 'Pronunciation awareness'],
    blocks: [
      {
        id: 'f-alpha-teach',
        type: 'teach',
        title: 'Teach: Alphabet Awareness',
        targetMinutes: 7,
        objectives: ['Introduce A-Z and common beginner sound habits'],
        teachingSegments: [
          {
            id: 'alpha-1',
            title: 'Same Alphabet, Different Sounds',
            explanation:
              'French uses the same 26 letters as English, but letter names and pronunciation patterns can sound different.',
            examples: ['French alphabet = 26 letters', 'Final consonants are often not pronounced in basic words'],
            companionTip: 'Focus on listening and repeating, not speed.',
            funFact: 'French rhythm is syllable-based, so clarity matters more than stress.',
            pronunciationCues: ['A', 'B', 'C', 'D', 'E', 'F', 'G']
          },
          {
            id: 'alpha-2',
            title: 'Beginner Sound Patterns',
            explanation:
              'Some combinations like ai, ou, and au appear often in beginner French. Train your ear to notice them.',
            examples: ['ai', 'ou', 'au'],
            companionTip: 'When you see a new combination, repeat it three times slowly before using it in a word.',
            pronunciationCues: ['ai', 'ou', 'au']
          },
          {
            id: 'alpha-3',
            title: 'Mini Vocabulary: Fruits',
            explanation: 'Learn a few easy fruit words to make French feel practical early.',
            examples: ['une pomme', 'une banane', 'une orange'],
            companionTip: 'Tap and repeat each fruit slowly. Keep the vowel sounds clear.',
            pronunciationCues: ['pomme', 'banane', 'orange']
          }
        ],
        requiresCompletionToAdvance: true
      },
      {
        id: 'f-alpha-practice',
        type: 'practice',
        title: 'Practice: Recognition and Matching',
        targetMinutes: 7,
        objectives: ['Recognize alphabet facts and sound combinations'],
        exercises: [
          {
            id: 'alpha-p1',
            kind: 'multipleChoice',
            prompt: 'How many letters are in the French alphabet?',
            options: ['24', '25', '26', '27'],
            correctOptionIndex: 2,
            explanationOnWrong: 'French uses the same 26-letter alphabet as English.',
            skillFocus: 'reading',
            points: 5
          },
          {
            id: 'alpha-p2',
            kind: 'multipleChoice',
            prompt: 'Which sound group is common in beginner French?',
            options: ['ai', 'kr', 'pt', 'zx'],
            correctOptionIndex: 0,
            explanationOnWrong: 'ai is a common beginner French sound group.',
            skillFocus: 'listening',
            points: 5
          },
          {
            id: 'alpha-p3',
            kind: 'matchingPairs',
            prompt: 'Match each French item to its type.',
            leftItems: [
              { id: 'm1', label: 'Bonjour' },
              { id: 'm2', label: 'pomme' },
              { id: 'm3', label: 'ai / ou / au' }
            ],
            rightItems: [
              { id: 'r1', label: 'Common sound groups' },
              { id: 'r2', label: 'Greeting word' },
              { id: 'r3', label: 'Fruit word' }
            ],
            correctPairs: [
              { leftId: 'm1', rightId: 'r2' },
              { leftId: 'm2', rightId: 'r3' },
              { leftId: 'm3', rightId: 'r1' }
            ],
            explanationOnWrong: 'Read each word again and match by meaning.',
            skillFocus: 'reading',
            points: 10
          }
        ],
        requiresCompletionToAdvance: true
      },
      {
        id: 'f-alpha-production',
        type: 'production',
        title: 'Produce: Sound Awareness Practice',
        targetMinutes: 5,
        objectives: ['Say beginner sounds and one greeting clearly'],
        productionTask: {
          id: 'alpha-prod',
          title: 'Say alphabet and greeting sounds',
          instructions: 'Say A-B-C slowly, then say Bonjour clearly once.',
          mode: 'spoken',
          mandatory: true,
          targetMinutes: 5,
          exercise: {
            id: 'alpha-prod-ex',
            kind: 'speakingPrompt',
            prompt: 'Say: "A, B, C... Bonjour" with clear pronunciation.',
            expectedPatterns: ['a', 'b', 'c', 'bonjour'],
            minWords: 4,
            rubricFocus: ['taskCompletion', 'pronunciation', 'fluency'],
            sampleAnswer: 'A, B, C. Bonjour.',
            fallbackTextEvaluationAllowed: true,
            skillFocus: 'speaking',
            points: 15,
            hint: { message: 'Keep it simple: A, B, C, then Bonjour.' }
          }
        },
        requiresCompletionToAdvance: true
      },
      {
        id: 'f-alpha-test',
        type: 'miniTest',
        title: 'Mini Test: Alphabet & Sound Basics',
        targetMinutes: 6,
        objectives: ['Confirm beginner alphabet and sound knowledge'],
        exercises: [
          {
            id: 'alpha-t1',
            kind: 'shortAnswer',
            prompt: 'Type the number of letters in the French alphabet.',
            acceptedAnswers: ['26'],
            explanationOnWrong: 'The French alphabet has 26 letters.',
            skillFocus: 'writing',
            points: 5
          },
          {
            id: 'alpha-t2',
            kind: 'multipleChoice',
            prompt: 'Which is a common beginner French letter combination?',
            options: ['zx', 'kr', 'ou', 'pt'],
            correctOptionIndex: 2,
            explanationOnWrong: 'ou is a common beginner French vowel combination.',
            skillFocus: 'reading',
            points: 5
          },
          {
            id: 'alpha-t3',
            kind: 'multipleChoice',
            prompt: 'What is the best way to practice French sounds?',
            options: ['Repeat slowly and clearly', 'Speak very fast', 'Skip listening', 'Only read silently'],
            correctOptionIndex: 0,
            explanationOnWrong: 'Slow clear repetition is best for beginners.',
            skillFocus: 'speaking',
            points: 10
          }
        ],
        requiresCompletionToAdvance: true
      }
    ],
    assessment: {
      masteryThresholdPercent: 70,
      productionRequired: true,
      retryIncorrectLater: true,
      strictSequential: true
    }
  },
  {
    id: 'foundation-structured-basic-greetings',
    curriculumLessonId: 'basic-greetings',
    levelId: 'foundation',
    moduleId: 'foundation-module-0',
    title: 'Foundation 2: Basic Greetings',
    estimatedMinutes: 25,
    mode: 'foundation',
    outcomes: [
      'Use Bonjour/Bonsoir appropriately',
      'Use Merci in everyday interactions',
      'Recognize polite opening and closing language'
    ],
    vocabularyTargets: ['bonjour', 'bonsoir', 'merci', "s'il vous plaît", 'au revoir'],
    grammarTargets: ['Politeness routines', 'Greeting formulas'],
    blocks: [
      {
        id: 'f-greet-teach',
        type: 'teach',
        title: 'Teach: Polite Greeting Routine',
        targetMinutes: 7,
        objectives: ['Teach common greetings for Canadian daily contexts'],
        teachingSegments: [
          {
            id: 'greet-1',
            title: 'Daytime and Evening Greetings',
            explanation: 'Use Bonjour during the day and Bonsoir in the evening.',
            examples: ['Bonjour (daytime)', 'Bonsoir (evening greeting)'],
            companionTip: 'When unsure, Bonjour is the safest default during the day.'
          },
          {
            id: 'greet-2',
            title: 'Politeness Core',
            explanation: 'Merci and s’il vous plaît help make your French respectful and natural.',
            examples: ['Merci = thank you', 'S’il vous plaît = please'],
            companionTip: 'Politeness is especially important in service and immigration settings.'
          }
        ],
        requiresCompletionToAdvance: true
      },
      {
        id: 'f-greet-practice',
        type: 'practice',
        title: 'Practice: Greeting Choice and Matching',
        targetMinutes: 7,
        objectives: ['Choose correct greeting by context'],
        exercises: [
          {
            id: 'greet-p1',
            kind: 'multipleChoice',
            prompt: 'What is the most common daytime greeting?',
            options: ['Bonsoir', 'Bonjour', 'Bonne nuit', 'A demain'],
            correctOptionIndex: 1,
            explanationOnWrong: 'Bonjour is the standard daytime greeting.',
            skillFocus: 'reading',
            points: 5
          },
          {
            id: 'greet-p2',
            kind: 'multipleChoice',
            prompt: 'Which phrase means "thank you"?',
            options: ['Merci', "S'il vous plaît", 'Bonjour', 'Bonsoir'],
            correctOptionIndex: 0,
            explanationOnWrong: 'Merci means thank you.',
            skillFocus: 'reading',
            points: 5
          },
          {
            id: 'greet-p3',
            kind: 'matchingPairs',
            prompt: 'Match the French phrase to its use.',
            leftItems: [
              { id: 'gl1', label: 'Bonjour' },
              { id: 'gl2', label: 'Bonsoir' },
              { id: 'gl3', label: 'Merci' }
            ],
            rightItems: [
              { id: 'gr1', label: 'Evening greeting' },
              { id: 'gr2', label: 'Thank you' },
              { id: 'gr3', label: 'Daytime greeting' }
            ],
            correctPairs: [
              { leftId: 'gl1', rightId: 'gr3' },
              { leftId: 'gl2', rightId: 'gr1' },
              { leftId: 'gl3', rightId: 'gr2' }
            ],
            explanationOnWrong: 'Review when each phrase is used and try again.',
            skillFocus: 'reading',
            points: 10
          }
        ],
        requiresCompletionToAdvance: true
      },
      {
        id: 'f-greet-production',
        type: 'production',
        title: 'Produce: Greeting Mini Dialogue',
        targetMinutes: 5,
        objectives: ['Produce a basic greeting + thanks interaction'],
        productionTask: {
          id: 'greet-prod',
          title: 'Service Counter Mini Dialogue',
          instructions: 'Say a greeting and thank-you line like in a store or office.',
          mode: 'spoken',
          mandatory: true,
          targetMinutes: 5,
          exercise: {
            id: 'greet-prod-ex',
            kind: 'speakingPrompt',
            prompt: 'Say a polite line using Bonjour and Merci.',
            expectedPatterns: ['bonjour', 'merci'],
            minWords: 3,
            rubricFocus: ['taskCompletion', 'pronunciation', 'fluency'],
            sampleAnswer: 'Bonjour. Merci.',
            fallbackTextEvaluationAllowed: true,
            skillFocus: 'speaking',
            points: 15,
            hint: { message: 'Use both Bonjour and Merci in one short interaction.' }
          }
        },
        requiresCompletionToAdvance: true
      },
      {
        id: 'f-greet-test',
        type: 'miniTest',
        title: 'Mini Test: Greeting Control',
        targetMinutes: 6,
        objectives: ['Verify greeting and politeness usage'],
        exercises: [
          {
            id: 'greet-t1',
            kind: 'multipleChoice',
            prompt: 'You meet someone at 8 PM. Which greeting is best?',
            options: ['Bonsoir', 'Bonjour', 'Merci', 'Au revoir'],
            correctOptionIndex: 0,
            explanationOnWrong: 'Bonsoir is used in the evening.',
            skillFocus: 'reading',
            points: 5
          },
          {
            id: 'greet-t2',
            kind: 'shortAnswer',
            prompt: 'Type the French word for "thank you".',
            acceptedAnswers: ['merci'],
            explanationOnWrong: 'The correct answer is merci.',
            skillFocus: 'writing',
            points: 5
          },
          {
            id: 'greet-t3',
            kind: 'speakingPrompt',
            prompt: 'Say a short polite interaction: Bonjour + Merci + Au revoir.',
            expectedPatterns: ['bonjour', 'merci', 'au revoir'],
            minWords: 3,
            rubricFocus: ['taskCompletion', 'pronunciation', 'fluency', 'grammar'],
            sampleAnswer: 'Bonjour, merci, au revoir.',
            fallbackTextEvaluationAllowed: true,
            skillFocus: 'speaking',
            points: 15,
            hint: { message: 'Include all three: Bonjour, Merci, Au revoir.' }
          }
        ],
        requiresCompletionToAdvance: true
      }
    ],
    assessment: {
      masteryThresholdPercent: 70,
      productionRequired: true,
      retryIncorrectLater: true,
      strictSequential: true
    }
  },
  {
    id: 'foundation-structured-introducing-yourself',
    curriculumLessonId: 'introducing-yourself',
    levelId: 'foundation',
    moduleId: 'foundation-module-0',
    title: 'Foundation 3: Introducing Yourself',
    estimatedMinutes: 25,
    mode: 'foundation',
    outcomes: [
      'Say your name using Je m’appelle',
      'Say where you are from using Je viens de/du',
      'Say a short self-introduction'
    ],
    vocabularyTargets: ["je m'appelle", 'je viens de', 'Canada', 'Maroc', 'bonjour'],
    grammarTargets: ['Je m’appelle ...', 'Je viens de/du ...'],
    blocks: [
      {
        id: 'f-intro-teach',
        type: 'teach',
        title: 'Teach: Name and Origin',
        targetMinutes: 7,
        objectives: ['Teach self-introduction structures'],
        teachingSegments: [
          {
            id: 'intro-name',
            title: 'Name Structure',
            explanation: 'Use Je m’appelle + your name to introduce yourself.',
            examples: ["Je m'appelle Sara.", "Je m'appelle Ali."],
            companionTip: 'Keep this expression together. Do not change the verb part.'
          },
          {
            id: 'intro-origin',
            title: 'Origin Structure',
            explanation: 'Use Je viens de/du + place to say where you are from.',
            examples: ['Je viens du Maroc.', 'Je viens du Canada.'],
            companionTip: 'Think of this as “I come from …”.'
          }
        ],
        requiresCompletionToAdvance: true
      },
      {
        id: 'f-intro-practice',
        type: 'practice',
        title: 'Practice: Identity Sentence Recognition',
        targetMinutes: 7,
        objectives: ['Recognize correct self-introduction sentences'],
        exercises: [
          {
            id: 'intro-p1',
            kind: 'multipleChoice',
            prompt: 'How do you say "My name is Ali"?',
            options: ["Je m'appelle Ali", 'Je suis Ali nom', 'Je appelle Ali', 'Mon nom appelle Ali'],
            correctOptionIndex: 0,
            explanationOnWrong: 'Use Je m’appelle + name.',
            skillFocus: 'reading',
            points: 5
          },
          {
            id: 'intro-p2',
            kind: 'multipleChoice',
            prompt: 'Which sentence means "I am from Morocco"?',
            options: ['Je viens du Maroc', 'Je suis Maroc', 'Je vais au Maroc', 'Je parle Maroc'],
            correctOptionIndex: 0,
            explanationOnWrong: 'Use Je viens du ... for country of origin.',
            skillFocus: 'reading',
            points: 5
          },
          {
            id: 'intro-p3',
            kind: 'shortAnswer',
            prompt: 'Type the expression for "My name is..." in French.',
            acceptedAnswers: ["je m'appelle"],
            normalizeAccents: true,
            explanationOnWrong: 'The fixed expression is Je m’appelle.',
            skillFocus: 'writing',
            points: 10
          }
        ],
        requiresCompletionToAdvance: true
      },
      {
        id: 'f-intro-production',
        type: 'production',
        title: 'Produce: 2-Line Self Introduction',
        targetMinutes: 5,
        objectives: ['Produce name + origin in one response'],
        productionTask: {
          id: 'intro-prod',
          title: 'Spoken Self Intro',
          instructions: 'Say your name and origin in two short lines.',
          mode: 'spoken',
          mandatory: true,
          targetMinutes: 5,
          exercise: {
            id: 'intro-prod-ex',
            kind: 'speakingPrompt',
            prompt: 'Say: Bonjour. Je m’appelle [name]. Je viens du/de [country].',
            expectedPatterns: ['bonjour', "je m'appelle", 'je viens'],
            minWords: 6,
            rubricFocus: ['taskCompletion', 'fluency', 'pronunciation', 'grammar'],
            sampleAnswer: "Bonjour. Je m'appelle Lina. Je viens du Canada.",
            fallbackTextEvaluationAllowed: true,
            skillFocus: 'speaking',
            points: 20,
            hint: { message: 'Use three parts: greeting + name + origin.' }
          }
        },
        requiresCompletionToAdvance: true
      },
      {
        id: 'f-intro-test',
        type: 'miniTest',
        title: 'Mini Test: Self Introduction',
        targetMinutes: 6,
        objectives: ['Check beginner identity production and recognition'],
        exercises: [
          {
            id: 'intro-t1',
            kind: 'multipleChoice',
            prompt: 'Choose the correct basic self-introduction sentence.',
            options: ["Je m'appelle Lina.", "Je m'appeles Lina.", 'Je appeler Lina.', 'Je suis appelle Lina.'],
            correctOptionIndex: 0,
            explanationOnWrong: 'Correct fixed expression: Je m’appelle + name.',
            skillFocus: 'reading',
            points: 5
          },
          {
            id: 'intro-t2',
            kind: 'speakingPrompt',
            prompt: 'Say a 2-line self-introduction with name and country.',
            expectedPatterns: ['bonjour', "je m'appelle", 'je viens'],
            minWords: 6,
            rubricFocus: ['taskCompletion', 'pronunciation', 'fluency', 'grammar'],
            sampleAnswer: "Bonjour. Je m'appelle Karim. Je viens du Maroc.",
            fallbackTextEvaluationAllowed: true,
            skillFocus: 'speaking',
            points: 20,
            hint: { message: 'Include greeting, name, and origin.' }
          }
        ],
        requiresCompletionToAdvance: true
      }
    ],
    assessment: {
      masteryThresholdPercent: 70,
      productionRequired: true,
      retryIncorrectLater: true,
      strictSequential: true
    }
  },
  {
    id: 'foundation-structured-numbers-0-20',
    curriculumLessonId: 'numbers-0-20',
    levelId: 'foundation',
    moduleId: 'foundation-module-0',
    title: 'Foundation 4: Numbers 0-20',
    estimatedMinutes: 25,
    mode: 'foundation',
    outcomes: [
      'Recognize numbers 0-20 in French',
      'Map spoken/written number words to digits',
      'Use numbers for simple age or quantity statements'
    ],
    vocabularyTargets: ['zéro', 'un', 'deux', 'dix', 'dix-sept', 'vingt'],
    grammarTargets: ['Number recognition', 'Basic quantity expressions'],
    blocks: [
      {
        id: 'f-num-teach',
        type: 'teach',
        title: 'Teach: Number Families 0-20',
        targetMinutes: 7,
        objectives: ['Teach core numbers and teen formation patterns'],
        teachingSegments: [
          {
            id: 'num-1',
            title: 'Flash Cards: 0-10',
            explanation: 'Tap each number card. Hear it in French. Repeat once before moving to the next card.',
            examples: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            companionTip: 'Start slow. Accuracy first, speed later.',
            pronunciationCues: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
          },
          {
            id: 'num-2',
            title: 'Flash Cards: 11-20',
            explanation: 'Now tap 11 to 20. Notice teen forms like 17 (dix-sept).',
            examples: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
            companionTip: 'For 17, 18, 19, say dix + the second part clearly.',
            pronunciationCues: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20']
          },
          {
            id: 'num-3',
            title: 'Numbers in Daily Life',
            explanation: 'Use numbers in short phrases you will say in Canada.',
            examples: ['J’ai 20 ans.', 'Numéro 12', '17 dollars'],
            companionTip: 'After each phrase, repeat only the number one more time.',
            pronunciationCues: ['20', '12', '17', 'vingt ans', 'numéro douze', 'dix-sept dollars']
          }
        ],
        requiresCompletionToAdvance: true
      },
      {
        id: 'f-num-practice',
        type: 'practice',
        title: 'Practice: Number Recognition',
        targetMinutes: 7,
        objectives: ['Match French words to digits 0-20'],
        exercises: [
          {
            id: 'num-p1',
            kind: 'multipleChoice',
            prompt: 'What number is "dix"?',
            options: ['8', '9', '10', '12'],
            correctOptionIndex: 2,
            explanationOnWrong: 'dix means 10.',
            skillFocus: 'reading',
            points: 5
          },
          {
            id: 'num-p2',
            kind: 'multipleChoice',
            prompt: 'Which word corresponds to 17?',
            options: ['dix-sept', 'sept-dix', 'vingt-sept', 'seize'],
            correctOptionIndex: 0,
            explanationOnWrong: '17 se dit dix-sept.',
            skillFocus: 'reading',
            points: 5
          },
          {
            id: 'num-p3',
            kind: 'matchingPairs',
            prompt: 'Match the French number to the digit.',
            leftItems: [
              { id: 'nl1', label: 'douze' },
              { id: 'nl2', label: 'vingt' },
              { id: 'nl3', label: 'dix' }
            ],
            rightItems: [
              { id: 'nr1', label: '20' },
              { id: 'nr2', label: '10' },
              { id: 'nr3', label: '12' }
            ],
            correctPairs: [
              { leftId: 'nl1', rightId: 'nr3' },
              { leftId: 'nl2', rightId: 'nr1' },
              { leftId: 'nl3', rightId: 'nr2' }
            ],
            explanationOnWrong: 'Review the three number words and pair them again.',
            skillFocus: 'reading',
            points: 10
          }
        ],
        requiresCompletionToAdvance: true
      },
      {
        id: 'f-num-production',
        type: 'production',
        title: 'Produce: Number Use',
        targetMinutes: 5,
        objectives: ['Say numbers clearly in a simple phrase'],
        productionTask: {
          id: 'num-prod',
          title: 'Simple Number Speaking',
          instructions: 'Say two numbers between 0 and 20, then one short phrase.',
          mode: 'spoken',
          mandatory: true,
          targetMinutes: 5,
          exercise: {
            id: 'num-prod-ex',
            kind: 'speakingPrompt',
            prompt: 'Say: "dix, dix-sept, vingt" clearly.',
            expectedPatterns: ['dix', 'dix-sept', 'vingt'],
            minWords: 3,
            rubricFocus: ['taskCompletion', 'pronunciation', 'fluency', 'grammar'],
            sampleAnswer: 'dix, dix-sept, vingt',
            fallbackTextEvaluationAllowed: true,
            skillFocus: 'speaking',
            points: 15,
            hint: { message: 'Keep it simple: say three numbers clearly.' }
          }
        },
        requiresCompletionToAdvance: true
      },
      {
        id: 'f-num-test',
        type: 'miniTest',
        title: 'Mini Test: Numbers 0-20',
        targetMinutes: 6,
        objectives: ['Check number recognition and short production'],
        exercises: [
          {
            id: 'num-t1',
            kind: 'multipleChoice',
            prompt: 'What does "vingt" mean?',
            options: ['18', '19', '20', '21'],
            correctOptionIndex: 2,
            explanationOnWrong: '20 se dit vingt.',
            skillFocus: 'reading',
            points: 5
          },
          {
            id: 'num-t2',
            kind: 'shortAnswer',
            prompt: 'Type the French word for 10.',
            acceptedAnswers: ['dix'],
            explanationOnWrong: '10 in French is dix.',
            skillFocus: 'writing',
            points: 5
          },
          {
            id: 'num-t3',
            kind: 'speakingPrompt',
            prompt: 'Say: "dix, vingt".',
            expectedPatterns: ['dix', 'vingt'],
            minWords: 2,
            rubricFocus: ['taskCompletion', 'pronunciation', 'fluency', 'grammar'],
            sampleAnswer: 'dix, vingt',
            fallbackTextEvaluationAllowed: true,
            skillFocus: 'speaking',
            points: 15,
            hint: { message: 'Say two number words clearly, for example: dix, vingt.' }
          }
        ],
        requiresCompletionToAdvance: true
      }
    ],
    assessment: {
      masteryThresholdPercent: 70,
      productionRequired: true,
      retryIncorrectLater: true,
      strictSequential: true
    }
  }
];
