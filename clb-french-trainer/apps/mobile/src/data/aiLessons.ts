export type AnswerValidationRule =
  | {
      mode: 'exact';
      accepted: string[];
    }
  | {
      mode: 'includes';
      accepted: string[];
    }
  | {
      mode: 'keywords';
      keywords: string[];
      minWords?: number;
    };

export type InteractivePrompt = {
  prompt: string;
  placeholder?: string;
  validation: AnswerValidationRule;
  successFeedback: string;
  incorrectFeedback: string;
  companionHint: string;
};

export type AILessonCheckpointQuestion = {
  id: string;
  prompt: string;
  placeholder?: string;
  validation: AnswerValidationRule;
  successFeedback: string;
  incorrectFeedback: string;
  companionHint: string;
};

export type AILessonStep =
  | {
      id: string;
      type: 'explanation';
      title: string;
      teacherText: string;
      example?: string;
    }
  | {
      id: string;
      type: 'example';
      title: string;
      teacherText: string;
      example: string;
    }
  | {
      id: string;
      type: 'question' | 'practice';
      title: string;
      teacherText: string;
      interaction: InteractivePrompt;
    }
  | {
      id: string;
      type: 'checkpoint';
      title: string;
      teacherText: string;
      passThreshold: number;
      questions: AILessonCheckpointQuestion[];
    };

export type AILessonScript = {
  id: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  lessonTitle: string;
  objectives: string[];
  steps: AILessonStep[];
};

export const aiLessons: AILessonScript[] = [
  {
    id: 'a1-2-introducing-yourself',
    level: 'A1',
    lessonTitle: 'A1 Lesson 2 - Introducing Yourself',
    objectives: [
      'Say your name using Je m\'appelle',
      'Use Je suis for simple identity statements',
      'Respond to basic self-introduction prompts'
    ],
    steps: [
      {
        id: 'intro-explanation',
        type: 'explanation',
        title: 'Explanation',
        teacherText:
          'In French, "Je m\'appelle" means "My name is". Use it before your name when introducing yourself politely.',
        example: 'Je m\'appelle Sara.'
      },
      {
        id: 'intro-example',
        type: 'example',
        title: 'Example',
        teacherText:
          'You can also use "Je suis" to add a simple detail about who you are, such as your role or nationality.',
        example: 'Je suis etudiant. / Je suis canadien.'
      },
      {
        id: 'guided-question',
        type: 'question',
        title: 'Question',
        teacherText: 'Let us try a guided response first. Write the correct phrase for: "My name is Ali."',
        interaction: {
          prompt: 'Type the French sentence.',
          placeholder: 'Example: Je m\'appelle ...',
          validation: {
            mode: 'exact',
            accepted: ["je m'appelle ali", 'je m appelle ali']
          },
          successFeedback: 'Correct. You used the core introduction structure properly.',
          incorrectFeedback: 'Not yet. Start with "Je m\'appelle" and then add the name Ali.',
          companionHint: 'Structure: Je + m\'appelle + name.'
        }
      },
      {
        id: 'open-practice',
        type: 'practice',
        title: 'Practice',
        teacherText:
          'Now write a short self-introduction using your own details. Include your name and one simple detail (student, worker, country, etc.).',
        interaction: {
          prompt: 'Write 1-2 short French sentences.',
          placeholder: 'Je m\'appelle ... Je suis ...',
          validation: {
            mode: 'includes',
            accepted: ["je m'appelle", 'je m appelle']
          },
          successFeedback: 'Good practice. Strong start. You can add "Je suis ..." as a second sentence for extra practice.',
          incorrectFeedback: 'Start with the core sentence: "Je m\'appelle ...". Keep it simple first.',
          companionHint: 'First win: write one correct sentence with "Je m\'appelle ...". Add "Je suis ..." after that.'
        }
      },
      {
        id: 'checkpoint-mini-test',
        type: 'checkpoint',
        title: 'Checkpoint',
        teacherText: 'Mini checkpoint: answer 3 quick questions. You need at least 70% to pass this scripted session.',
        passThreshold: 70,
        questions: [
          {
            id: 'cp-1',
            prompt: 'Translate: "My name is Lina."',
            placeholder: 'French sentence',
            validation: {
              mode: 'exact',
              accepted: ["je m'appelle lina", 'je m appelle lina']
            },
            successFeedback: 'Correct. Excellent structure.',
            incorrectFeedback: 'Use: Je m\'appelle Lina.',
            companionHint: 'Do not translate word-by-word. Use the French expression.'
          },
          {
            id: 'cp-2',
            prompt: 'Complete: Je ___ etudiant.',
            placeholder: 'One word',
            validation: {
              mode: 'exact',
              accepted: ['suis']
            },
            successFeedback: 'Correct. "Je suis" is the right form.',
            incorrectFeedback: 'The correct verb form with "Je" is "suis".',
            companionHint: 'Think of the verb etre: je suis.'
          },
          {
            id: 'cp-3',
            prompt: 'Write a polite self-introduction starter (beginning only).',
            placeholder: 'Short phrase',
            validation: {
              mode: 'includes',
              accepted: ["je m'appelle"]
            },
            successFeedback: 'Correct. That is the correct starter phrase.',
            incorrectFeedback: 'Use the polite starter: "Je m\'appelle ..."',
            companionHint: 'This checkpoint checks your memory of the exact formula.'
          }
        ]
      }
    ]
  }
];

export function getAILessonById(lessonId: string): AILessonScript | undefined {
  return aiLessons.find((lesson) => lesson.id === lessonId);
}
