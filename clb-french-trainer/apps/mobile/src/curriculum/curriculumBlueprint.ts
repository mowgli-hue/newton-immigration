import type {
  Level,
  LevelId,
  LessonProductionTask,
  LessonQuestion,
  LessonTeachingSection,
  Module,
  SessionStructure,
  SkillFocus
} from '../types/CurriculumTypes';

function createSessionStructure(blocks: SessionStructure['blocks'], reviewMinutes: number): SessionStructure {
  return {
    totalMinutes: 25,
    blocks,
    reviewMinutes
  };
}

function createLessons(
  moduleId: string,
  lessonSpecs: Array<{
    id: string;
    objectives: string[];
    skillFocus: SkillFocus[];
    productionRequired?: boolean;
    masteryThreshold: number;
    teachingSections?: LessonTeachingSection[];
    controlledPractice?: LessonQuestion[];
    productionTask?: LessonProductionTask;
    miniMasteryTest?: LessonQuestion[];
    companionCorrectionHookId?: string;
  }>
) {
  return lessonSpecs.map((lesson) => ({
    id: lesson.id,
    moduleId,
    objectives: lesson.objectives,
    skillFocus: lesson.skillFocus,
    productionRequired: lesson.productionRequired ?? true,
    masteryThreshold: lesson.masteryThreshold,
    teachingSections: lesson.teachingSections,
    controlledPractice: lesson.controlledPractice,
    productionTask: lesson.productionTask,
    miniMasteryTest: lesson.miniMasteryTest,
    companionCorrectionHookId: lesson.companionCorrectionHookId
  }));
}

function practiceSet(prefix: string, prompts: string[], skillFocus: SkillFocus): LessonQuestion[] {
  return prompts.map((prompt, index) => ({
    id: `${prefix}-p${index + 1}`,
    type: 'multipleChoice',
    prompt,
    expectedAnswer: 'TBD',
    skillFocus
  }));
}

function masteryTestSet(prefix: string, prompts: string[], skillFocus: SkillFocus): LessonQuestion[] {
  return prompts.map((prompt, index) => ({
    id: `${prefix}-t${index + 1}`,
    type: 'shortAnswer',
    prompt,
    expectedAnswer: 'TBD',
    skillFocus
  }));
}

export const curriculumLevels: Level[] = [
  {
    id: 'foundation',
    title: 'Foundation (Absolute Beginner)',
    stageType: 'foundation',
    objectives: [
      'Build survival French from zero knowledge',
      'Establish pronunciation and sound awareness',
      'Prepare for structured A1 progression'
    ],
    grammarTargets: [
      'Alphabet and sound-symbol recognition',
      'Subject pronouns: je/tu/il/elle',
      'etre and avoir basics',
      'Articles: un/une/le/la',
      'Simple sentence order',
      'Negation introduction: ne...pas'
    ],
    vocabularyThemes: [
      'Greetings and politeness',
      'Identity and personal information',
      'Numbers and time',
      'Classroom and study language',
      'Canadian cities and provinces basics',
      'Weather words and seasons'
    ],
    listeningGoals: [
      'Discriminate core vowel and nasal sounds',
      'Recognize greetings and names',
      'Identify numbers and times in slow speech',
      'Follow simple classroom instructions'
    ],
    speakingGoals: [
      'Repeat model sounds and words clearly',
      'Introduce self with basic phrases',
      'Spell name and state simple personal details',
      'Perform greeting exchanges'
    ],
    writingGoals: [
      'Copy words and phrases accurately',
      'Complete basic identity fields',
      'Write 1-2 sentence self-introduction'
    ],
    masteryThresholds: {
      overallMinScore: 70,
      listeningMin: 80,
      speakingMin: 70,
      readingMin: 65,
      writingMin: 65,
      productionTaskRequired: true
    },
    sessionStructure: createSessionStructure(
      [
        { type: 'teach', minutes: 7, focus: 'integrated', purpose: 'Teach sounds, forms, and model phrases' },
        { type: 'practice', minutes: 7, focus: 'reading', purpose: 'Recognition and controlled drills' },
        { type: 'production', minutes: 5, focus: 'speaking', purpose: 'Guided self-introduction production' },
        { type: 'miniTest', minutes: 6, focus: 'integrated', purpose: 'Quick mastery check + review' }
      ],
      2
    )
  },
  {
    id: 'a1',
    title: 'A1 Beginner (CEFR A1)',
    stageType: 'cefr',
    objectives: [
      'Handle simple daily interactions',
      'Use memorized patterns with basic flexibility',
      'Build early listening and speaking confidence for Canadian life'
    ],
    grammarTargets: [
      'Present tense regular -er verbs',
      'Common irregulars: aller, faire',
      'Question forms and basic inversion alternatives',
      'Adjective agreement basics',
      'Possessives and place prepositions',
      'Near future introduction'
    ],
    vocabularyThemes: [
      'Housing basics',
      'Transportation and commuting',
      'Food and shopping',
      'Health appointments',
      'Work schedules',
      'Canadian public services and community terms'
    ],
    listeningGoals: [
      'Understand short announcements and simple directions',
      'Capture prices, times, and dates',
      'Identify purpose in routine dialogues'
    ],
    speakingGoals: [
      'Introduce self and family',
      'Ask for directions and basic information',
      'Make simple requests and purchases',
      'Describe routine in short sentences'
    ],
    writingGoals: [
      'Write short messages and requests',
      'Complete simple forms',
      'Draft basic emails for appointments or absences'
    ],
    masteryThresholds: {
      overallMinScore: 75,
      listeningMin: 72,
      speakingMin: 72,
      readingMin: 70,
      writingMin: 70,
      productionTaskRequired: true
    },
    sessionStructure: createSessionStructure(
      [
        { type: 'teach', minutes: 6, focus: 'integrated', purpose: 'Teach pattern + model examples' },
        { type: 'practice', minutes: 8, focus: 'integrated', purpose: 'Controlled comprehension and form drills' },
        { type: 'production', minutes: 5, focus: 'speaking', purpose: 'Short role-play or written output' },
        { type: 'miniTest', minutes: 6, focus: 'integrated', purpose: 'Checkpoint and error correction' }
      ],
      2
    )
  },
  {
    id: 'a2',
    title: 'A2 Elementary (CEFR A2)',
    stageType: 'cefr',
    objectives: [
      'Manage everyday tasks with greater independence',
      'Report simple past and future plans',
      'Prepare for CLB 5 bridge skills'
    ],
    grammarTargets: [
      'passe compose introduction and common usage',
      'Reflexive verbs',
      'Comparatives',
      'Object pronouns basics',
      'Modal verbs: pouvoir/devoir/vouloir',
      'Basic connectors: parce que, mais, donc'
    ],
    vocabularyThemes: [
      'Work and schedules',
      'Renting and landlord communication',
      'Banking and bills',
      'Healthcare and pharmacy',
      'Government and settlement services',
      'Weather advisories and community events in Canada'
    ],
    listeningGoals: [
      'Extract main idea and key details from service dialogues',
      'Understand short voicemail-like messages',
      'Follow routine workplace or transit updates'
    ],
    speakingGoals: [
      'Describe past experiences',
      'Explain a simple problem and request help',
      'Compare options and justify a basic choice',
      'Give short opinions with one reason'
    ],
    writingGoals: [
      'Write short emails (reschedule, request, explain)',
      'Write a short paragraph about routine or experience',
      'Use connectors for simple cohesion'
    ],
    masteryThresholds: {
      overallMinScore: 78,
      listeningMin: 75,
      speakingMin: 75,
      readingMin: 74,
      writingMin: 74,
      productionTaskRequired: true
    },
    sessionStructure: createSessionStructure(
      [
        { type: 'teach', minutes: 6, focus: 'integrated', purpose: 'Teach target form + communicative use' },
        { type: 'practice', minutes: 7, focus: 'reading', purpose: 'Guided transformations and comprehension' },
        { type: 'production', minutes: 6, focus: 'writing', purpose: 'Scenario response or short output' },
        { type: 'miniTest', minutes: 6, focus: 'integrated', purpose: 'Mini assessment and correction loop' }
      ],
      2
    )
  },
  {
    id: 'b1',
    title: 'B1 Intermediate (CEFR B1)',
    stageType: 'cefr',
    objectives: [
      'Achieve independent communication in practical and workplace contexts',
      'Develop coherent spoken and written responses',
      'Build CLB 5 to CLB 6 functional readiness'
    ],
    grammarTargets: [
      'passe compose vs imparfait',
      'Future simple and conditionnel basics',
      'Relative pronouns: qui/que/ou',
      'Pronoun placement reinforcement',
      'Subjunctive introduction in common expressions',
      'Discourse connectors for explanation and comparison'
    ],
    vocabularyThemes: [
      'Workplace communication',
      'Interviews and employment tasks',
      'Customer service interactions',
      'Healthcare navigation in Canada',
      'Tenancy and housing issues',
      'Education and training pathways'
    ],
    listeningGoals: [
      'Follow longer practical conversations',
      'Identify intent and sequence key points',
      'Infer basic attitudes from context'
    ],
    speakingGoals: [
      'Explain a problem and propose solutions',
      'Handle workplace role-plays',
      'Compare and justify choices with criteria',
      'Deliver short opinion responses with support'
    ],
    writingGoals: [
      'Write structured emails (formal/informal)',
      'Write complaint or request emails',
      'Write short opinion paragraphs (120-180 words)',
      'Explain processes clearly'
    ],
    masteryThresholds: {
      overallMinScore: 80,
      listeningMin: 78,
      speakingMin: 78,
      readingMin: 78,
      writingMin: 78,
      timedPerformanceMin: 72,
      productionTaskRequired: true
    },
    sessionStructure: createSessionStructure(
      [
        { type: 'teach', minutes: 5, focus: 'integrated', purpose: 'Teach strategy + high-yield language pattern' },
        { type: 'practice', minutes: 8, focus: 'integrated', purpose: 'Task fragments and targeted drills' },
        { type: 'production', minutes: 6, focus: 'speaking', purpose: 'Timed response or practical role-play' },
        { type: 'miniTest', minutes: 6, focus: 'integrated', purpose: 'Scored checkpoint + feedback' }
      ],
      2
    )
  },
  {
    id: 'clb5',
    title: 'CLB 5 Target Module',
    stageType: 'clb-target',
    objectives: [
      'Reach functional CLB 5 performance for Canadian daily/workplace tasks',
      'Build TEF-style timing tolerance at moderate difficulty',
      'Stabilize all skills with no major weaknesses'
    ],
    grammarTargets: [
      'Accuracy under time pressure in present/past/future',
      'Polite requests and modal forms',
      'Question accuracy and response patterns',
      'High-frequency connectors for coherence',
      'Common agreement error reduction'
    ],
    vocabularyThemes: [
      'Employment scheduling and shifts',
      'Appointments and service requests',
      'Housing issues and maintenance',
      'Transit disruptions',
      'School communication in Canada',
      'Documents and public services'
    ],
    listeningGoals: [
      'Extract key practical details quickly',
      'Identify instructions, obligations, dates and times',
      'Understand purpose in service interactions'
    ],
    speakingGoals: [
      'Handle service transactions and requests',
      'Describe situations and ask for help',
      'Give basic opinions with relevant support',
      'Complete CLB5 practical role-play tasks'
    ],
    writingGoals: [
      'Write functional emails and short messages',
      'Confirm, request, reschedule, or explain clearly',
      'Maintain task purpose and adequate clarity under time pressure'
    ],
    masteryThresholds: {
      overallMinScore: 82,
      listeningMin: 80,
      speakingMin: 80,
      readingMin: 78,
      writingMin: 78,
      timedPerformanceMin: 75,
      productionTaskRequired: true
    },
    sessionStructure: createSessionStructure(
      [
        { type: 'teach', minutes: 4, focus: 'integrated', purpose: 'Task strategy and performance model' },
        { type: 'practice', minutes: 8, focus: 'integrated', purpose: 'TEF-style micro-drills and detail extraction' },
        { type: 'production', minutes: 7, focus: 'integrated', purpose: 'Timed functional output task' },
        { type: 'miniTest', minutes: 6, focus: 'integrated', purpose: 'Benchmark-aligned checkpoint' }
      ],
      2
    )
  },
  {
    id: 'clb7',
    title: 'CLB 7 Target Module',
    stageType: 'clb-target',
    objectives: [
      'Reach CLB 7 benchmark readiness with balanced skills',
      'Improve coherence, register, and argumentation',
      'Perform consistently under TEF-like timing'
    ],
    grammarTargets: [
      'Conditionnel for requests and nuance',
      'Subjunctive in common triggers',
      'Complex connectors and sentence linking',
      'Tense consistency in longer responses',
      'Register control and precision'
    ],
    vocabularyThemes: [
      'Workplace policy and communication',
      'Education and career development',
      'Immigration settlement topics in Canada',
      'Healthcare access and public services',
      'Community issues and civic participation',
      'Current affairs and social topics'
    ],
    listeningGoals: [
      'Infer intent and attitude',
      'Track multi-point arguments',
      'Distinguish fact from opinion',
      'Summarize longer audio accurately'
    ],
    speakingGoals: [
      'Justify decisions with criteria',
      'Deliver structured opinions with examples',
      'Handle workplace simulations with nuance',
      'Sustain monologue and respond to follow-up prompts'
    ],
    writingGoals: [
      'Write formal emails and complaint/appeal letters',
      'Write short opinion essays (180-250 words)',
      'Use cohesive devices and paragraph structure',
      'Maintain appropriate register and clarity'
    ],
    masteryThresholds: {
      overallMinScore: 85,
      listeningMin: 83,
      speakingMin: 83,
      readingMin: 82,
      writingMin: 82,
      timedPerformanceMin: 80,
      productionTaskRequired: true
    },
    sessionStructure: createSessionStructure(
      [
        { type: 'teach', minutes: 4, focus: 'integrated', purpose: 'Exam strategy and language upgrade' },
        { type: 'practice', minutes: 7, focus: 'integrated', purpose: 'Planning and targeted response drills' },
        { type: 'production', minutes: 8, focus: 'integrated', purpose: 'Timed monologue/email/essay segment' },
        { type: 'miniTest', minutes: 6, focus: 'integrated', purpose: 'CLB7 rubric checkpoint and analysis' }
      ],
      2
    )
  },
  {
    id: 'tef-simulation',
    title: 'TEF Canada Simulation Lab',
    stageType: 'tef-simulation',
    objectives: [
      'Build exam performance under TEF Canada conditions',
      'Train timing, strategy, and consistency by skill',
      'Validate CLB 5 or CLB 7 readiness with simulations'
    ],
    grammarTargets: [
      'Error correction under timed conditions',
      'Grammar application in exam tasks rather than explicit teaching',
      'Cohesion and accuracy in task-based responses'
    ],
    vocabularyThemes: [
      'Canadian civic and community topics',
      'Workplace and service scenarios',
      'Social and opinion topics common in exam preparation',
      'High-frequency functional and argumentative vocabulary'
    ],
    listeningGoals: [
      'Timed comprehension with note-taking discipline',
      'Distinguish distractors from key details',
      'Make fast gist vs detail decisions'
    ],
    speakingGoals: [
      'Complete TEF-style interaction and opinion simulations',
      'Plan quickly and respond under time pressure',
      'Improve follow-up response stability'
    ],
    writingGoals: [
      'Complete TEF-style functional and opinion writing tasks',
      'Plan, draft, and revise under time constraints',
      'Maintain structure and register under pressure'
    ],
    masteryThresholds: {
      overallMinScore: 85,
      listeningMin: 80,
      speakingMin: 80,
      readingMin: 80,
      writingMin: 80,
      timedPerformanceMin: 82,
      productionTaskRequired: true
    },
    sessionStructure: createSessionStructure(
      [
        { type: 'teach', minutes: 3, focus: 'integrated', purpose: 'Task briefing and rubric reminders' },
        { type: 'practice', minutes: 8, focus: 'integrated', purpose: 'Timed simulation segment' },
        { type: 'production', minutes: 6, focus: 'integrated', purpose: 'Retry or rewrite focused output' },
        { type: 'miniTest', minutes: 8, focus: 'integrated', purpose: 'Score logging and performance analysis' }
      ],
      2
    )
  }
];

export const curriculumModules: Module[] = [
  {
    id: 'foundation-core',
    levelId: 'foundation',
    title: 'Foundation Core: Survival French Basics',
    lessons: createLessons('foundation-core', [
      {
        id: 'foundation-lesson-1',
        objectives: ['Alphabet and basic sounds', 'Greeting recognition'],
        skillFocus: ['listening', 'speaking'],
        masteryThreshold: 70
      },
      {
        id: 'foundation-lesson-2',
        objectives: ['Introduce yourself', 'Use Je m\'appelle and Je suis'],
        skillFocus: ['speaking', 'writing'],
        masteryThreshold: 70
      },
      {
        id: 'foundation-lesson-3',
        objectives: ['Numbers and time', 'Simple information exchange'],
        skillFocus: ['listening', 'speaking', 'reading'],
        masteryThreshold: 72
      },
      {
        id: 'foundation-lesson-4',
        objectives: ['Numbers 0-20', 'Simple quantity and age expressions'],
        skillFocus: ['listening', 'speaking', 'reading'],
        masteryThreshold: 72
      }
    ])
  },
  {
    id: 'a1-core',
    levelId: 'a1',
    title: 'A1 Core: Daily Communication Starter',
    lessons: createLessons('a1-core', [
      {
        id: 'a1-lesson-1',
        objectives: ['Subject pronouns', 'etre in present tense', 'Simple identity statements'],
        skillFocus: ['speaking', 'listening'],
        masteryThreshold: 75,
        teachingSections: [
          {
            id: 'a1l1-teach-1',
            title: 'Subject Pronouns',
            keyPoints: ['je, tu, il, elle, nous, vous, ils, elles', 'Pronoun choice changes verb form'],
            examples: ['Je suis etudiant.', 'Elle est au Canada.']
          },
          {
            id: 'a1l1-teach-2',
            title: 'Etre (to be)',
            keyPoints: ['Present tense forms', 'Use for identity and description'],
            examples: ['Je suis', 'Tu es', 'Il/Elle est']
          }
        ],
        controlledPractice: practiceSet(
          'a1l1',
          [
            'Choose the correct pronoun for Marie: ___ est a Montreal.',
            'Complete: Je ___ etudiant.',
            'Complete: Nous ___ au cours de francais.',
            'Choose the correct form: Tu ___ canadien?',
            'Replace the noun with a pronoun: Ali est ici. -> ___ est ici.',
            'Complete: Vous ___ en classe.',
            'Match pronoun and verb: Elles ___ contentes.',
            'Choose the correct sentence with etre.'
          ],
          'speaking'
        ),
        productionTask: {
          id: 'a1l1-production',
          prompt: 'Introduce yourself using Je suis + one identity detail and one location detail.',
          mode: 'spoken',
          mandatory: true,
          companionCorrectionHookId: 'companion:a1:pronouns-etre:correction'
        },
        miniMasteryTest: masteryTestSet(
          'a1l1',
          [
            'Write the correct form of etre with je.',
            'Complete: Elle ___ a Toronto.',
            'Write a short sentence with Nous sommes.'
          ],
          'writing'
        ),
        companionCorrectionHookId: 'companion:a1:pronouns-etre'
      },
      {
        id: 'a1-lesson-2',
        objectives: ['Articles', 'Gender awareness', 'Noun phrase basics'],
        skillFocus: ['reading', 'writing'],
        masteryThreshold: 75,
        teachingSections: [
          {
            id: 'a1l2-teach-1',
            title: 'Definite and Indefinite Articles',
            keyPoints: ['un / une', 'le / la', 'les (plural)'],
            examples: ['un livre', 'une table', 'le bus']
          },
          {
            id: 'a1l2-teach-2',
            title: 'Gender Patterns',
            keyPoints: ['Many nouns must be memorized with article', 'Use article as part of the word'],
            examples: ['la maison', 'le cafe']
          }
        ],
        controlledPractice: practiceSet(
          'a1l2',
          [
            'Choose the best article: ___ maison (feminine singular).',
            'Choose the best article: ___ livre (masculine singular).',
            'Complete with indefinite article: J\'ai ___ stylo.',
            'Choose correct phrase: le table / la table.',
            'Convert to plural article: le document -> ___ documents.',
            'Select the article for feminine noun in a shopping context.',
            'Choose the correct noun phrase used in class.',
            'Identify the article error in a short sentence.'
          ],
          'reading'
        ),
        productionTask: {
          id: 'a1l2-production',
          prompt: 'Write 4 noun phrases with correct articles (2 masculine, 2 feminine).',
          mode: 'written',
          mandatory: true,
          companionCorrectionHookId: 'companion:a1:articles-gender:correction'
        },
        miniMasteryTest: masteryTestSet(
          'a1l2',
          [
            'Fill in: ___ voiture est ici. (definite, feminine)',
            'Fill in: J\'ai ___ rendez-vous. (indefinite, masculine)',
            'Write one correct phrase with les.'
          ],
          'writing'
        ),
        companionCorrectionHookId: 'companion:a1:articles-gender'
      },
      {
        id: 'a1-lesson-3',
        objectives: ['Present tense -ER verbs', 'Daily action sentence building'],
        skillFocus: ['reading', 'speaking', 'writing'],
        masteryThreshold: 75,
        teachingSections: [
          {
            id: 'a1l3-teach-1',
            title: '-ER Verb Pattern',
            keyPoints: ['Remove -er and add endings', 'je -e, tu -es, il/elle -e, nous -ons, vous -ez, ils/elles -ent'],
            examples: ['parler -> je parle', 'habiter -> nous habitons']
          }
        ],
        controlledPractice: practiceSet(
          'a1l3',
          [
            'Complete: Je parl___ francais.',
            'Complete: Nous travaill___ a Ottawa.',
            'Choose correct form: Vous habit___ a Montreal.',
            'Complete: Ils etudi___ le soir.',
            'Choose correct form of aimer with tu.',
            'Correct the error in: Je habites au Canada.',
            'Pick the right ending for nous in an -ER verb.',
            'Choose the correct present-tense sentence.',
            'Complete: Elle arriv___ a 8h.',
            'Complete: Vous regard___ le document.'
          ],
          'writing'
        ),
        productionTask: {
          id: 'a1l3-production',
          prompt: 'Write 5 simple sentences about your day using 5 different -ER verbs.',
          mode: 'written',
          mandatory: true,
          companionCorrectionHookId: 'companion:a1:er-verbs:correction'
        },
        miniMasteryTest: masteryTestSet(
          'a1l3',
          [
            'Conjugate parler with nous.',
            'Conjugate habiter with vous.',
            'Write one sentence using aimer in present tense.'
          ],
          'writing'
        ),
        companionCorrectionHookId: 'companion:a1:er-verbs'
      },
      {
        id: 'a1-lesson-4',
        objectives: ['Asking questions', 'Question words for daily situations'],
        skillFocus: ['speaking', 'listening', 'reading'],
        masteryThreshold: 75,
        teachingSections: [
          {
            id: 'a1l4-teach-1',
            title: 'Question Forms',
            keyPoints: ['Intonation questions', 'Est-ce que', 'Question words: ou, quand, comment, pourquoi'],
            examples: ['Vous habitez a Toronto?', 'Est-ce que vous travaillez?']
          }
        ],
        controlledPractice: practiceSet(
          'a1l4',
          [
            'Choose a question word for location.',
            'Transform into question with est-ce que: Vous travaillez ici.',
            'Choose the best question for asking time.',
            'Complete: ___ tu t\'appelles?',
            'Complete: ___ est le cours de francais?',
            'Select a polite question to ask for help.',
            'Identify the question form in a sentence.',
            'Reorder words to form a simple question.'
          ],
          'speaking'
        ),
        productionTask: {
          id: 'a1l4-production',
          prompt: 'Write or say 4 questions you can ask at a service desk in Canada.',
          mode: 'mixed',
          mandatory: true,
          companionCorrectionHookId: 'companion:a1:questions:correction'
        },
        miniMasteryTest: masteryTestSet(
          'a1l4',
          [
            'Write one question using est-ce que.',
            'Choose a question word for reason (why).',
            'Write one polite information question.'
          ],
          'speaking'
        ),
        companionCorrectionHookId: 'companion:a1:questions'
      },
      {
        id: 'a1-lesson-5',
        objectives: ['Daily routine expressions', 'Time sequencing with simple present'],
        skillFocus: ['listening', 'speaking', 'writing'],
        masteryThreshold: 75,
        teachingSections: [
          {
            id: 'a1l5-teach-1',
            title: 'Daily Routine Language',
            keyPoints: ['Frequency and time expressions', 'Sequence words: puis, ensuite'],
            examples: ['Je me leve a 7h.', 'Ensuite, je prends le bus.']
          }
        ],
        controlledPractice: practiceSet(
          'a1l5',
          [
            'Choose the correct verb for morning routine sentence.',
            'Complete a simple sentence with a time expression.',
            'Put routine actions in logical order (morning).',
            'Choose a connector to continue a routine description.',
            'Complete: Je ___ le bus pour aller au travail.',
            'Select the best sentence for evening routine.',
            'Identify the time in a routine sentence.',
            'Choose the correct pronoun and verb combination.',
            'Complete a daily routine sentence with ensuite.',
            'Pick the best phrase for weekday schedule.'
          ],
          'listening'
        ),
        productionTask: {
          id: 'a1l5-production',
          prompt: 'Describe your weekday routine in 5-6 simple French sentences.',
          mode: 'written',
          mandatory: true,
          companionCorrectionHookId: 'companion:a1:daily-routine:correction'
        },
        miniMasteryTest: masteryTestSet(
          'a1l5',
          [
            'Write one sentence about morning routine.',
            'Use ensuite in a short routine sentence.',
            'Write one sentence with a specific time.'
          ],
          'writing'
        ),
        companionCorrectionHookId: 'companion:a1:daily-routine'
      },
      {
        id: 'a1-lesson-6',
        objectives: ['Asking questions', 'Question words for daily situations'],
        skillFocus: ['speaking', 'listening', 'reading'],
        masteryThreshold: 75
      },
      {
        id: 'a1-lesson-7',
        objectives: ['Daily routine expressions', 'Time sequencing with simple present'],
        skillFocus: ['listening', 'speaking', 'writing'],
        masteryThreshold: 75
      },
      {
        id: 'a1-lesson-8',
        objectives: ['Time and schedule expressions', 'Appointments and class schedules'],
        skillFocus: ['listening', 'reading', 'writing'],
        masteryThreshold: 75
      },
      {
        id: 'a1-lesson-9',
        objectives: ['Directions and places', 'Location questions and simple answers'],
        skillFocus: ['speaking', 'listening', 'reading'],
        masteryThreshold: 75
      },
      {
        id: 'a1-lesson-10',
        objectives: ['Shopping and prices', 'Polite requests in stores'],
        skillFocus: ['speaking', 'listening', 'reading'],
        masteryThreshold: 75
      },
      {
        id: 'a1-lesson-11',
        objectives: ['Appointments and polite requests', 'Availability and time requests'],
        skillFocus: ['speaking', 'listening', 'writing'],
        masteryThreshold: 75
      },
      {
        id: 'a1-lesson-12',
        objectives: ['Module integration checkpoint', 'Combined A1 communication skills'],
        skillFocus: ['integrated', 'writing', 'speaking'],
        masteryThreshold: 75
      },
      ...Array.from({ length: 28 }, (_, index) => {
        const lessonNumber = index + 13;
        const isBenchmark = lessonNumber % 10 === 0;
        const isReview = lessonNumber % 7 === 0;
        const isWriting = lessonNumber % 5 === 0 && !isBenchmark;
        const isSpeaking = lessonNumber % 4 === 0 && !isWriting && !isBenchmark;
        const isListening = lessonNumber % 3 === 0 && !isSpeaking && !isWriting && !isBenchmark;
        const skillFocus: SkillFocus[] = isBenchmark
          ? ['integrated', 'speaking', 'writing']
          : isReview
            ? ['integrated', 'reading', 'writing']
            : isWriting
              ? ['writing', 'reading']
              : isSpeaking
                ? ['speaking', 'listening']
                : isListening
                  ? ['listening', 'reading', 'speaking']
                  : ['reading', 'speaking', 'writing'];

        const objectiveLabel = isBenchmark
          ? 'A1 benchmark session'
          : isReview
            ? 'A1 retrieval and correction review'
            : isWriting
              ? 'A1 writing correction and production practice'
              : isSpeaking
                ? 'A1 speaking drill and repetition practice'
                : isListening
                  ? 'A1 listening and shadowing practice'
                  : 'A1 core teaching and applied communication practice';

        return {
          id: `a1-lesson-${lessonNumber}`,
          objectives: [
            objectiveLabel,
            `A1 Session ${lessonNumber}: practical Canadian-life communication`,
            isBenchmark ? 'Readiness check with reduced support' : 'Production task completion and mastery reinforcement'
          ],
          skillFocus,
          masteryThreshold: isBenchmark ? 78 : isReview ? 76 : 75
        };
      })
    ])
  },
  {
    id: 'a2-bridge',
    levelId: 'a2',
    title: 'A2 Bridge: Everyday Independence',
    lessons: createLessons('a2-bridge', [
      {
        id: 'a2-lesson-1',
        objectives: ['Describe routines and plans', 'Modal verbs in context'],
        skillFocus: ['speaking', 'writing'],
        masteryThreshold: 78
      },
      {
        id: 'a2-lesson-2',
        objectives: ['Service interactions and problem reporting'],
        skillFocus: ['listening', 'speaking'],
        masteryThreshold: 78
      },
      {
        id: 'a2-lesson-3',
        objectives: ['Short practical emails and past events'],
        skillFocus: ['reading', 'writing'],
        masteryThreshold: 80
      },
      {
        id: 'a2-lesson-4',
        objectives: ['Comparisons and choices', 'Preference statements with reasons'],
        skillFocus: ['speaking', 'reading', 'writing'],
        masteryThreshold: 78
      },
      {
        id: 'a2-lesson-5',
        objectives: ['Service problem reporting', 'Polite help requests'],
        skillFocus: ['speaking', 'listening', 'writing'],
        masteryThreshold: 78
      },
      {
        id: 'a2-lesson-6',
        objectives: ['Housing and landlord communication', 'Repair requests'],
        skillFocus: ['reading', 'writing', 'speaking'],
        masteryThreshold: 78
      },
      {
        id: 'a2-lesson-7',
        objectives: ['Healthcare and pharmacy basics', 'Simple symptom descriptions'],
        skillFocus: ['speaking', 'listening', 'reading'],
        masteryThreshold: 78
      },
      {
        id: 'a2-lesson-8',
        objectives: ['Work schedules and availability', 'Schedule change requests'],
        skillFocus: ['speaking', 'writing', 'listening'],
        masteryThreshold: 78
      },
      {
        id: 'a2-lesson-9',
        objectives: ['Community/government services', 'Form and office help'],
        skillFocus: ['speaking', 'reading', 'writing'],
        masteryThreshold: 78
      },
      {
        id: 'a2-lesson-10',
        objectives: ['Voicemail and short message comprehension', 'Response planning'],
        skillFocus: ['listening', 'writing', 'reading'],
        masteryThreshold: 79
      },
      {
        id: 'a2-lesson-11',
        objectives: ['A2 practical email writing', 'Purpose and detail clarity'],
        skillFocus: ['writing', 'reading'],
        masteryThreshold: 80
      },
      {
        id: 'a2-lesson-12',
        objectives: ['A2 integration checkpoint', 'CLB 5 bridge readiness'],
        skillFocus: ['integrated', 'speaking', 'writing'],
        masteryThreshold: 80
      },
      ...Array.from({ length: 28 }, (_, index) => {
        const lessonNumber = index + 13;
        const isBenchmark = lessonNumber % 10 === 0;
        const isReview = lessonNumber % 7 === 0;
        const isWriting = lessonNumber % 5 === 0 && !isBenchmark;
        const isSpeaking = lessonNumber % 4 === 0 && !isWriting && !isBenchmark;
        const isListening = lessonNumber % 3 === 0 && !isSpeaking && !isWriting && !isBenchmark;

        const skillFocus: SkillFocus[] = isBenchmark
          ? ['integrated', 'speaking', 'writing']
          : isReview
            ? ['integrated', 'reading', 'writing']
            : isWriting
              ? ['writing', 'reading']
              : isSpeaking
                ? ['speaking', 'listening']
                : isListening
                  ? ['listening', 'reading', 'speaking']
                  : ['speaking', 'writing', 'reading'];

        const objectiveLabel = isBenchmark
          ? 'A2 benchmark and CLB5 bridge checkpoint'
          : isReview
            ? 'A2 review cycle with retrieval and correction'
            : isWriting
              ? 'A2 functional writing and revision practice'
              : isSpeaking
                ? 'A2 speaking drill with practical scenarios'
                : isListening
                  ? 'A2 listening extraction and response planning'
                  : 'A2 core teach-practice-production cycle';

        return {
          id: `a2-lesson-${lessonNumber}`,
          objectives: [
            objectiveLabel,
            `A2 Session ${lessonNumber}: practical communication for Canadian contexts`,
            isBenchmark ? 'Timed task performance and readiness logging' : 'Production task completion required'
          ],
          skillFocus,
          masteryThreshold: isBenchmark ? 81 : isReview ? 79 : 78
        };
      })
    ])
  },
  {
    id: 'b1-functional',
    levelId: 'b1',
    title: 'B1 Functional: Independent Communication',
    lessons: createLessons('b1-functional', [
      {
        id: 'b1-lesson-1',
        objectives: ['Explain a problem and solution', 'Workplace vocabulary'],
        skillFocus: ['speaking', 'listening'],
        masteryThreshold: 80
      },
      {
        id: 'b1-lesson-2',
        objectives: ['Opinion structure and connectors'],
        skillFocus: ['speaking', 'writing'],
        masteryThreshold: 80
      },
      {
        id: 'b1-lesson-3',
        objectives: ['Formal request/complaint email format'],
        skillFocus: ['reading', 'writing'],
        masteryThreshold: 82
      },
      {
        id: 'b1-lesson-4',
        objectives: ['Compare options and justify choices', 'Use comparison language with reasons'],
        skillFocus: ['speaking', 'writing', 'reading'],
        masteryThreshold: 82
      },
      {
        id: 'b1-lesson-5',
        objectives: ['Explain past problems and solutions', 'Sequence events with connectors'],
        skillFocus: ['speaking', 'writing', 'listening'],
        masteryThreshold: 82
      },
      {
        id: 'b1-lesson-6',
        objectives: ['Workplace requests and negotiation', 'Polite solution proposals'],
        skillFocus: ['speaking', 'listening', 'writing'],
        masteryThreshold: 83
      },
      {
        id: 'b1-lesson-7',
        objectives: ['Healthcare and service explanations', 'Describe symptoms or issues clearly'],
        skillFocus: ['speaking', 'listening', 'reading'],
        masteryThreshold: 83
      },
      {
        id: 'b1-lesson-8',
        objectives: ['Housing communication and tenancy issues', 'Write practical B1 messages'],
        skillFocus: ['writing', 'reading', 'speaking'],
        masteryThreshold: 83
      },
      {
        id: 'b1-lesson-9',
        objectives: ['Workplace incident reporting', 'Explain cause and action taken'],
        skillFocus: ['writing', 'speaking', 'reading'],
        masteryThreshold: 84
      },
      {
        id: 'b1-lesson-10',
        objectives: ['Opinion speaking with examples', 'Coherent spoken structure'],
        skillFocus: ['speaking', 'listening'],
        masteryThreshold: 84
      },
      {
        id: 'b1-lesson-11',
        objectives: ['Structured B1 email and follow-up', 'Tone and clarity'],
        skillFocus: ['writing', 'reading'],
        masteryThreshold: 84
      },
      {
        id: 'b1-lesson-12',
        objectives: ['B1 integration checkpoint', 'CLB 5/7 bridge readiness'],
        skillFocus: ['integrated', 'speaking', 'writing'],
        masteryThreshold: 85
      },
      ...Array.from({ length: 28 }, (_, index) => {
        const lessonNumber = index + 13;
        const isBenchmark = lessonNumber % 10 === 0;
        const isReview = lessonNumber % 7 === 0;
        const isWriting = lessonNumber % 5 === 0 && !isBenchmark;
        const isSpeaking = lessonNumber % 4 === 0 && !isWriting && !isBenchmark;
        const isListening = lessonNumber % 3 === 0 && !isSpeaking && !isWriting && !isBenchmark;

        const skillFocus: SkillFocus[] = isBenchmark
          ? ['integrated', 'speaking', 'writing']
          : isReview
            ? ['integrated', 'reading', 'writing']
            : isWriting
              ? ['writing', 'reading']
              : isSpeaking
                ? ['speaking', 'listening']
                : isListening
                  ? ['listening', 'reading', 'speaking']
                  : ['speaking', 'writing', 'reading'];

        const objectiveLabel = isBenchmark
          ? 'B1 benchmark checkpoint with CLB bridge scoring'
          : isReview
            ? 'B1 review cycle and correction session'
            : isWriting
              ? 'B1 structured writing and rewrite task'
              : isSpeaking
                ? 'B1 role-play speaking and fluency drills'
                : isListening
                  ? 'B1 listening analysis and synthesis task'
                  : 'B1 core communication and reasoning session';

        return {
          id: `b1-lesson-${lessonNumber}`,
          objectives: [
            objectiveLabel,
            `B1 Session ${lessonNumber}: coherent practical and workplace communication`,
            isBenchmark ? 'Benchmark readiness with timed component' : 'Production completion and mastery reinforcement'
          ],
          skillFocus,
          masteryThreshold: isBenchmark ? 86 : isReview ? 84 : 82
        };
      })
    ])
  },
  {
    id: 'clb5-target',
    levelId: 'clb5',
    title: 'CLB 5 Target: Practical Benchmark Performance',
    lessons: createLessons(
      'clb5-target',
      Array.from({ length: 40 }, (_, index) => {
        const lessonNumber = index + 1;
        const isBenchmark = lessonNumber % 10 === 0;
        const isReview = lessonNumber % 7 === 0;
        const isWriting = lessonNumber % 5 === 0 && !isBenchmark;
        const isSpeaking = lessonNumber % 4 === 0 && !isWriting && !isBenchmark;
        const isListening = lessonNumber % 3 === 0 && !isSpeaking && !isWriting && !isBenchmark;

        const skillFocus: SkillFocus[] = isBenchmark
          ? ['integrated', 'speaking', 'writing']
          : isReview
            ? ['integrated', 'reading', 'writing']
            : isWriting
              ? ['writing', 'reading']
              : isSpeaking
                ? ['speaking', 'listening']
                : isListening
                  ? ['listening', 'reading']
                  : ['speaking', 'reading', 'writing'];

        const objectiveLabel = isBenchmark
          ? 'CLB5 benchmark simulation block'
          : isReview
            ? 'CLB5 retrieval and weak-skill review'
            : isWriting
              ? 'CLB5 practical writing and correction'
              : isSpeaking
                ? 'CLB5 service-role speaking task'
                : isListening
                  ? 'CLB5 listening detail extraction practice'
                  : 'CLB5 practical communication session';

        return {
          id: `clb5-lesson-${lessonNumber}`,
          objectives: [
            objectiveLabel,
            `CLB5 Session ${lessonNumber}: benchmark-oriented functional communication`,
            isBenchmark ? 'Timed benchmark scoring and analysis' : 'Production task mandatory for progression'
          ],
          skillFocus,
          masteryThreshold: isBenchmark ? 84 : isReview ? 83 : 82
        };
      })
    )
  },
  {
    id: 'clb7-target',
    levelId: 'clb7',
    title: 'CLB 7 Target: Advanced Functional Proficiency',
    lessons: createLessons(
      'clb7-target',
      Array.from({ length: 40 }, (_, index) => {
        const lessonNumber = index + 1;
        const isBenchmark = lessonNumber % 10 === 0;
        const isReview = lessonNumber % 7 === 0;
        const isWriting = lessonNumber % 5 === 0 && !isBenchmark;
        const isSpeaking = lessonNumber % 4 === 0 && !isWriting && !isBenchmark;
        const isListening = lessonNumber % 3 === 0 && !isSpeaking && !isWriting && !isBenchmark;

        const skillFocus: SkillFocus[] = isBenchmark
          ? ['integrated', 'speaking', 'writing']
          : isReview
            ? ['integrated', 'reading', 'writing']
            : isWriting
              ? ['writing', 'reading']
              : isSpeaking
                ? ['speaking', 'listening']
                : isListening
                  ? ['listening', 'reading']
                  : ['speaking', 'writing', 'reading'];

        const objectiveLabel = isBenchmark
          ? 'CLB7 benchmark simulation block'
          : isReview
            ? 'CLB7 argument review and correction cycle'
            : isWriting
              ? 'CLB7 formal writing and revision task'
              : isSpeaking
                ? 'CLB7 structured speaking and justification practice'
                : isListening
                  ? 'CLB7 listening inference and synthesis task'
                  : 'CLB7 advanced functional communication session';

        return {
          id: `clb7-lesson-${lessonNumber}`,
          objectives: [
            objectiveLabel,
            `CLB7 Session ${lessonNumber}: advanced benchmark-aligned performance`,
            isBenchmark ? 'Timed benchmark scoring and detailed analysis' : 'Production quality required before progression'
          ],
          skillFocus,
          masteryThreshold: isBenchmark ? 87 : isReview ? 86 : 85
        };
      })
    )
  },
  {
    id: 'tef-simulation-lab',
    levelId: 'tef-simulation',
    title: 'TEF Canada Simulation Lab',
    lessons: createLessons('tef-simulation-lab', [
      {
        id: 'tef-sim-listening',
        objectives: ['Timed listening simulation and distractor control'],
        skillFocus: ['listening'],
        masteryThreshold: 85
      },
      {
        id: 'tef-sim-speaking',
        objectives: ['TEF-style speaking simulation and follow-ups'],
        skillFocus: ['speaking'],
        masteryThreshold: 85
      },
      {
        id: 'tef-sim-writing',
        objectives: ['TEF-style writing tasks and timed revision'],
        skillFocus: ['writing', 'reading'],
        masteryThreshold: 85
      }
    ])
  }
];

export const curriculumLevelMap: Record<LevelId, Level> = Object.fromEntries(
  curriculumLevels.map((level) => [level.id, level])
) as Record<LevelId, Level>;

export const curriculumModulesByLevel: Record<LevelId, Module[]> = {
  foundation: curriculumModules.filter((module) => module.levelId === 'foundation'),
  a1: curriculumModules.filter((module) => module.levelId === 'a1'),
  a2: curriculumModules.filter((module) => module.levelId === 'a2'),
  b1: curriculumModules.filter((module) => module.levelId === 'b1'),
  clb5: curriculumModules.filter((module) => module.levelId === 'clb5'),
  clb7: curriculumModules.filter((module) => module.levelId === 'clb7'),
  'tef-simulation': curriculumModules.filter((module) => module.levelId === 'tef-simulation')
};

export function getCurriculumLevel(levelId: LevelId): Level {
  return curriculumLevelMap[levelId];
}

export function getModulesForLevel(levelId: LevelId): Module[] {
  return curriculumModulesByLevel[levelId];
}

export function getLessonById(lessonId: string) {
  for (const module of curriculumModules) {
    const lesson = module.lessons.find((item) => item.id === lessonId);
    if (lesson) {
      return lesson;
    }
  }

  return undefined;
}
