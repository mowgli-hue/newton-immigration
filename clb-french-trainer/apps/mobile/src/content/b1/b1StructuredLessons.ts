import type { StructuredLessonContent } from '../../types/LessonContentTypes';

type B1Spec = {
  lessonNumber: number;
  title: string;
  focus: string;
  outcomes: string[];
  vocabularyTargets: string[];
  grammarTargets: string[];
  teachExamples: string[];
  scenarioTitle: string;
  scenarioExplanation: string;
  scenarioExamples: string[];
  listeningMessage: string;
  sentencePuzzle: { tokens: string[]; correctOrder: string[]; hint: string; explanationOnWrong: string };
  memoryPairs: Array<{ id: string; left: string; right: string }>;
  classification: {
    prompt: string;
    categories: Array<{ id: string; label: string }>;
    items: Array<{ id: string; label: string; correctCategoryId: string }>;
    explanationOnWrong: string;
    hint?: string;
  };
  mcqPrompt: string;
  mcqOptions: [string, string, string, string];
  mcqCorrect: number;
  mcqWrong: string;
  shortPrompt: string;
  shortAnswers: string[];
  productionMode: 'spoken' | 'written' | 'mixed';
  productionPrompt: string;
  productionExpected: string[];
  productionSample: string;
  testPrompt: string;
  testOptions: [string, string, string, string];
  testCorrect: number;
  testWrong: string;
  writingPrompt: string;
  writingExpected: string[];
  writingSample: string;
};

function makeB1Lesson(spec: B1Spec): StructuredLessonContent {
  const idb = `b1l${spec.lessonNumber}`;
  return {
    id: `b1-structured-${spec.lessonNumber}`,
    curriculumLessonId: `b1-lesson-${spec.lessonNumber}`,
    levelId: 'b1',
    moduleId: 'b1-functional-module-1',
    title: `B1 Lesson ${spec.lessonNumber}: ${spec.title}`,
    estimatedMinutes: 25,
    mode: 'guided',
    outcomes: spec.outcomes,
    vocabularyTargets: spec.vocabularyTargets,
    grammarTargets: spec.grammarTargets,
    blocks: [
      {
        id: `${idb}-teach`,
        type: 'teach',
        title: `Teach: ${spec.focus}`,
        targetMinutes: 6,
        objectives: [spec.focus],
        teachingSegments: [
          {
            id: `${idb}-seg1`,
            title: spec.focus,
            explanation: `B1 goal: use ${spec.focus.toLowerCase()} clearly in longer real-life communication.`,
            examples: spec.teachExamples,
            companionTip: 'At B1, try to add one reason or detail after each main sentence.'
          },
          {
            id: `${idb}-seg2`,
            title: spec.scenarioTitle,
            explanation: spec.scenarioExplanation,
            examples: spec.scenarioExamples,
            companionTip: 'Imagine this as a real workplace or service conversation in Canada.'
          }
        ],
        requiresCompletionToAdvance: true
      },
      {
        id: `${idb}-practice`,
        type: 'practice',
        title: 'Practice: Functional Communication Drills',
        targetMinutes: 8,
        objectives: ['Recognize the target pattern and apply it in realistic B1 contexts'],
        exercises: [
          {
            id: `${idb}-p1`,
            kind: 'multipleChoice',
            prompt: spec.mcqPrompt,
            options: spec.mcqOptions,
            correctOptionIndex: spec.mcqCorrect,
            explanationOnWrong: spec.mcqWrong,
            skillFocus: 'reading',
            points: 5
          },
          {
            id: `${idb}-p2`,
            kind: 'shortAnswer',
            prompt: spec.shortPrompt,
            acceptedAnswers: spec.shortAnswers,
            normalizeAccents: true,
            explanationOnWrong: `Review the B1 form for ${spec.title.toLowerCase()}.`,
            skillFocus: 'writing',
            points: 5
          },
          {
            id: `${idb}-p2b`,
            kind: 'sentenceOrderPuzzle',
            prompt: 'Rebuild the B1 sentence in the correct order.',
            instructions: 'Tap tiles in order.',
            tokens: spec.sentencePuzzle.tokens,
            correctOrder: spec.sentencePuzzle.correctOrder,
            explanationOnWrong: spec.sentencePuzzle.explanationOnWrong,
            skillFocus: 'writing',
            points: 5,
            hint: { message: spec.sentencePuzzle.hint }
          },
          {
            id: `${idb}-p2c`,
            kind: 'memoryMatch',
            prompt: 'Memory Match: connect key B1 expressions and meanings/functions.',
            instructions: 'Tap two cards at a time to find matches.',
            pairs: spec.memoryPairs,
            explanationOnWrong: 'Complete all matches, then submit.',
            skillFocus: 'reading',
            points: 5
          },
          {
            id: `${idb}-p2d`,
            kind: 'quickClassification',
            prompt: spec.classification.prompt,
            instructions: 'Select a category, then tap each item to classify it.',
            categories: spec.classification.categories,
            items: spec.classification.items,
            explanationOnWrong: spec.classification.explanationOnWrong,
            skillFocus: 'reading',
            points: 5,
            hint: spec.classification.hint ? { message: spec.classification.hint } : undefined
          },
          {
            id: `${idb}-p3`,
            kind: 'listeningPrompt',
            prompt: 'Choose the best interpretation of the message.',
            options: [
              'The speaker is giving a simple greeting only',
              'The speaker is explaining a situation and need',
              'The speaker is ending the conversation immediately',
              'The speaker is refusing all options'
            ],
            correctOptionIndex: 1,
            explanationOnWrong: 'At B1, identify the purpose plus one supporting detail.',
            skillFocus: 'listening',
            points: 10,
            audioText: spec.listeningMessage
          }
        ],
        requiresCompletionToAdvance: true
      },
      {
        id: `${idb}-production`,
        type: 'production',
        title: 'Production: Functional B1 Response',
        targetMinutes: 5,
        objectives: ['Produce a structured response with purpose and detail'],
        productionTask: {
          id: `${idb}-prod`,
          title: 'B1 Production Task',
          instructions: 'Respond clearly with purpose, detail, and a polite or logical follow-up.',
          mode: spec.productionMode,
          mandatory: true,
          targetMinutes: 5,
          exercise:
            spec.productionMode === 'spoken'
              ? {
                  id: `${idb}-prod-ex`,
                  kind: 'speakingPrompt',
                  prompt: spec.productionPrompt,
                  expectedPatterns: spec.productionExpected,
                  minWords: 16,
                  rubricFocus: ['taskCompletion', 'fluency', 'grammar', 'pronunciation'],
                  sampleAnswer: spec.productionSample,
                  fallbackTextEvaluationAllowed: true,
                  skillFocus: 'speaking',
                  points: 20
                }
              : {
                  id: `${idb}-prod-ex`,
                  kind: 'writingPrompt',
                  prompt: spec.productionPrompt,
                  expectedElements: spec.productionExpected,
                  minWords: 24,
                  rubricFocus: ['taskCompletion', 'grammar', 'coherence', 'vocabulary'],
                  sampleAnswer: spec.productionSample,
                  skillFocus: 'writing',
                  points: 20
                }
        },
        requiresCompletionToAdvance: true
      },
      {
        id: `${idb}-test`,
        type: 'miniTest',
        title: 'Mini Test: B1 Mastery Check',
        targetMinutes: 6,
        objectives: ['Confirm functional B1 use with accuracy and clarity'],
        exercises: [
          {
            id: `${idb}-t1`,
            kind: 'multipleChoice',
            prompt: spec.testPrompt,
            options: spec.testOptions,
            correctOptionIndex: spec.testCorrect,
            explanationOnWrong: spec.testWrong,
            skillFocus: 'reading',
            points: 5
          },
          {
            id: `${idb}-t2`,
            kind: 'writingPrompt',
            prompt: spec.writingPrompt,
            expectedElements: spec.writingExpected,
            minWords: 28,
            rubricFocus: ['taskCompletion', 'grammar', 'coherence', 'vocabulary'],
            sampleAnswer: spec.writingSample,
            skillFocus: 'writing',
            points: 20
          }
        ],
        requiresCompletionToAdvance: true
      }
    ],
    assessment: {
      masteryThresholdPercent: 80,
      productionRequired: true,
      retryIncorrectLater: true,
      strictSequential: true
    },
    aiHooks: {
      companionPersonaHookId: 'b1-coach',
      speakingAssessmentHookId: 'speaking-v1',
      writingCorrectionHookId: 'writing-v1',
      dynamicExplanationHookId: `b1-lesson-${spec.lessonNumber}-explainer`
    }
  };
}

const B1_SPECS: B1Spec[] = [
  {
    lessonNumber: 1,
    title: 'Explaining a Workplace Problem Clearly',
    focus: 'Problem + cause + requested solution',
    outcomes: ['Explain a work issue clearly', 'Give one cause/detail', 'Ask for a practical solution'],
    vocabularyTargets: ['problème', 'retard', 'horaire', 'équipe', 'solution'],
    grammarTargets: ['Cause/effect connectors', 'polite requests'],
    teachExamples: ["J'ai eu un retard de bus, donc je suis arrivé en retard.", 'Est-ce possible de modifier mon horaire aujourd’hui ?'],
    scenarioTitle: 'Work Shift Communication',
    scenarioExplanation: 'This scenario trains B1 workplace communication: state the issue, explain the cause, and ask for a workable next step.',
    scenarioExamples: ['Le bus était en retard ce matin.', "Je peux rester plus tard pour compenser."],
    listeningMessage: "Bonjour, j'ai eu un retard de bus, donc je serai en retard de dix minutes.",
    sentencePuzzle: {
      tokens: ['Le', 'bus', 'était', 'en', 'retard', ',', 'donc', 'je', 'suis', 'arrivé', 'en', 'retard'],
      correctOrder: ['Le', 'bus', 'était', 'en', 'retard', ',', 'donc', 'je', 'suis', 'arrivé', 'en', 'retard'],
      hint: 'State the cause first, then use donc for the result.',
      explanationOnWrong: 'Place the cause clause before donc + result.'
    },
    memoryPairs: [
      { id: 'b11m1', left: 'donc', right: 'so / therefore (result)' },
      { id: 'b11m2', left: 'retard', right: 'delay / lateness' }
    ],
    classification: {
      prompt: 'Classify each phrase by role in a workplace message.',
      categories: [{ id: 'problem', label: 'Problem / Cause' }, { id: 'solution', label: 'Request / Solution' }],
      items: [
        { id: 'i1', label: 'Le bus était en retard.', correctCategoryId: 'problem' },
        { id: 'i2', label: 'Est-ce possible de changer mon horaire ?', correctCategoryId: 'solution' },
        { id: 'i3', label: "J'arrive dix minutes en retard.", correctCategoryId: 'problem' },
        { id: 'i4', label: 'Je peux rester plus tard.', correctCategoryId: 'solution' }
      ],
      explanationOnWrong: 'Separate the explanation of the issue from the requested/possible solution.'
    },
    mcqPrompt: 'Choose the strongest workplace message.',
    mcqOptions: [
      "J'ai un retard de bus, donc je serai en retard de 10 minutes.",
      'Bus retard. Merci.',
      'Je suis bus retard problème.',
      'Bonjour au revoir.'
    ],
    mcqCorrect: 0,
    mcqWrong: 'At B1, include the problem and a concrete detail.',
    shortPrompt: 'Type one connector used to show result (so/therefore) in French.',
    shortAnswers: ['donc'],
    productionMode: 'spoken',
    productionPrompt: 'Explain a small workplace problem, give the cause, and propose one solution.',
    productionExpected: ['problème', 'donc'],
    productionSample: "Bonjour, j'ai un problème de transport ce matin, donc je serai en retard. Je peux finir plus tard ce soir.",
    testPrompt: 'Which line shows a cause and a result clearly?',
    testOptions: ['Je suis retard.', 'Bus donc.', 'Le train est annulé, donc je vais arriver plus tard.', 'Merci au revoir.'],
    testCorrect: 2,
    testWrong: 'Use a full cause clause plus donc + result.',
    writingPrompt: 'Write a short message to a supervisor explaining a delay and proposing a solution.',
    writingExpected: ['donc', 'retard'],
    writingSample: "Bonjour, j'ai un retard de transport, donc j'arriverai vers 9h15. Je peux rester plus tard aujourd'hui."
  },
  {
    lessonNumber: 2,
    title: 'Past Experience and Background',
    focus: 'Describe past experience with sequence and detail',
    outcomes: ['Describe a past experience clearly', 'Use sequence markers', 'Add one useful detail'],
    vocabularyTargets: ['expérience', 'avant', 'ensuite', 'après', 'formation'],
    grammarTargets: ['passé composé and sequencing'],
    teachExamples: ["Avant, j'ai travaillé dans un café. Ensuite, j'ai suivi une formation."],
    scenarioTitle: 'Work and Study Background',
    scenarioExplanation: 'This lesson helps learners describe their past jobs or studies in interviews or settlement conversations.',
    scenarioExamples: ["J'ai travaillé dans la restauration pendant deux ans.", "Après, j'ai commencé un programme au collège."],
    listeningMessage: "Avant, j'ai travaillé dans un magasin. Ensuite, j'ai suivi une formation.",
    sentencePuzzle: {
      tokens: ['Avant,', "j'ai", 'travaillé', 'dans', 'un', 'magasin'],
      correctOrder: ['Avant,', "j'ai", 'travaillé', 'dans', 'un', 'magasin'],
      hint: 'Start with the sequence marker, then the past verb form.',
      explanationOnWrong: 'Use sequence marker + passé composé clause.'
    },
    memoryPairs: [
      { id: 'b12m1', left: 'avant', right: 'before / earlier' },
      { id: 'b12m2', left: 'ensuite', right: 'then / next' }
    ],
    classification: {
      prompt: 'Classify the sequence word by timeline role.',
      categories: [{ id: 'earlier', label: 'Earlier Stage' }, { id: 'later', label: 'Later Stage' }],
      items: [
        { id: 'i1', label: 'avant', correctCategoryId: 'earlier' },
        { id: 'i2', label: 'ensuite', correctCategoryId: 'later' },
        { id: 'i3', label: 'après', correctCategoryId: 'later' },
        { id: 'i4', label: "au début", correctCategoryId: 'earlier' }
      ],
      explanationOnWrong: 'Sort by whether the word points to an earlier or later part of the story.'
    },
    mcqPrompt: 'Choose the best short background summary.',
    mcqOptions: [
      "Avant, j'ai travaillé dans un café. Ensuite, j'ai étudié au collège.",
      'Travail café collège merci.',
      'Je suis avant café.',
      'Ensuite avant après.'
    ],
    mcqCorrect: 0,
    mcqWrong: 'At B1, use sequence words and complete past sentences.',
    shortPrompt: 'Type the sequence word meaning "then / next" in French.',
    shortAnswers: ['ensuite'],
    productionMode: 'mixed',
    productionPrompt: 'Describe a past work or study experience in 3-4 sentences with sequence words.',
    productionExpected: ['avant', 'ensuite'],
    productionSample: "Avant, j'ai travaillé dans un magasin. Ensuite, j'ai commencé une formation en ligne.",
    testPrompt: 'Which sentence best adds a useful past detail?',
    testOptions: ['J’ai travaillé.', "J'ai travaillé pendant deux ans dans un magasin.", 'Travail magasin.', 'Merci.'],
    testCorrect: 1,
    testWrong: 'B1 responses should add a time, place, or duration detail.',
    writingPrompt: 'Write a short background paragraph about previous work or studies (3-4 lines).',
    writingExpected: ['avant', 'ensuite'],
    writingSample: "Avant, j'ai travaillé dans un restaurant pendant un an. Ensuite, j'ai commencé une formation administrative."
  },
  {
    lessonNumber: 3,
    title: 'Giving Directions with Landmarks',
    focus: 'Explain directions step by step',
    outcomes: ['Give clear directions with sequence', 'Use landmarks', 'Check understanding'],
    vocabularyTargets: ['tourner', 'continuer', 'coin', 'en face de', 'près de'],
    grammarTargets: ['Imperative / direction sequencing'],
    teachExamples: ['Tournez à gauche au coin.', 'Continuez tout droit jusqu’à la banque.'],
    scenarioTitle: 'Giving Directions in a Canadian City',
    scenarioExplanation: 'B1 learners often help visitors or clients find buildings, transit stops, and service offices.',
    scenarioExamples: ['La clinique est en face de la pharmacie.', 'Le bureau est près de la station de métro.'],
    listeningMessage: 'Continuez tout droit, puis tournez à droite au coin de la banque.',
    sentencePuzzle: {
      tokens: ['Continuez', 'tout', 'droit', ',', 'puis', 'tournez', 'à', 'droite'],
      correctOrder: ['Continuez', 'tout', 'droit', ',', 'puis', 'tournez', 'à', 'droite'],
      hint: 'Use the first instruction, then puis + second instruction.',
      explanationOnWrong: 'Direction instructions usually follow a clear step-by-step order.'
    },
    memoryPairs: [
      { id: 'b13m1', left: 'en face de', right: 'opposite / across from' },
      { id: 'b13m2', left: 'près de', right: 'near' }
    ],
    classification: {
      prompt: 'Classify the item as action instruction or landmark phrase.',
      categories: [{ id: 'action', label: 'Direction Action' }, { id: 'landmark', label: 'Landmark / Location Phrase' }],
      items: [
        { id: 'i1', label: 'tournez à gauche', correctCategoryId: 'action' },
        { id: 'i2', label: 'en face de la banque', correctCategoryId: 'landmark' },
        { id: 'i3', label: 'continuez tout droit', correctCategoryId: 'action' },
        { id: 'i4', label: 'près de la station', correctCategoryId: 'landmark' }
      ],
      explanationOnWrong: 'Separate movement instructions from landmark/location references.'
    },
    mcqPrompt: 'Choose the clearest direction instruction.',
    mcqOptions: [
      'Continuez tout droit, puis tournez à droite au coin.',
      'Banque droite coin.',
      'Je suis direction.',
      'Merci à droite.'
    ],
    mcqCorrect: 0,
    mcqWrong: 'B1 directions should be sequential and specific.',
    shortPrompt: 'Type the French phrase meaning "near".',
    shortAnswers: ['près de', 'pres de'],
    productionMode: 'spoken',
    productionPrompt: 'Give directions to a clinic or office using at least two steps and one landmark.',
    productionExpected: ['puis', 'près de'],
    productionSample: "Continuez tout droit, puis tournez à gauche. La clinique est près de la banque.",
    testPrompt: 'Which sentence adds a useful landmark detail?',
    testOptions: ['Tournez.', 'C’est en face de la pharmacie.', 'Merci.', 'Droite.'],
    testCorrect: 1,
    testWrong: 'Landmarks make directions easier to follow.',
    writingPrompt: 'Write short directions (3-4 lines) to a service office using sequence and a landmark.',
    writingExpected: ['puis', 'en face de'],
    writingSample: "Continuez tout droit jusqu'au coin. Puis tournez à droite. Le bureau est en face de la pharmacie."
  },
  {
    lessonNumber: 4,
    title: 'Comparing Options and Justifying Choices',
    focus: 'Compare + justify with criteria',
    outcomes: ['Compare two options', 'Give reasons', 'Choose one clearly'],
    vocabularyTargets: ['avantage', 'inconvénient', 'pratique', 'coûteux', 'préférer'],
    grammarTargets: ['comparatives and justification connectors'],
    teachExamples: ['Le bus est moins coûteux, mais le train est plus rapide.', 'Je préfère le bus parce que...'],
    scenarioTitle: 'Choosing Between Transport or Class Options',
    scenarioExplanation: 'B1 learners need to compare options and justify choices for work, school, and appointments.',
    scenarioExamples: ['Le cours du matin est plus pratique pour mon horaire.', 'Le trajet est plus long mais moins cher.'],
    listeningMessage: 'Je préfère le cours du matin parce qu’il est plus pratique pour mon travail.',
    sentencePuzzle: {
      tokens: ['Je', 'préfère', 'le', 'bus', 'parce', 'que', "c'est", 'moins', 'cher'],
      correctOrder: ['Je', 'préfère', 'le', 'bus', 'parce', 'que', "c'est", 'moins', 'cher'],
      hint: 'State your choice first, then give the reason with parce que.',
      explanationOnWrong: 'A clear B1 choice statement usually includes the option and the reason.'
    },
    memoryPairs: [
      { id: 'b14m1', left: 'avantage', right: 'advantage' },
      { id: 'b14m2', left: 'inconvénient', right: 'disadvantage' }
    ],
    classification: {
      prompt: 'Classify each phrase as positive point or negative point.',
      categories: [{ id: 'pro', label: 'Advantage' }, { id: 'con', label: 'Disadvantage' }],
      items: [
        { id: 'i1', label: 'plus rapide', correctCategoryId: 'pro' },
        { id: 'i2', label: 'plus coûteux', correctCategoryId: 'con' },
        { id: 'i3', label: 'plus pratique', correctCategoryId: 'pro' },
        { id: 'i4', label: 'moins flexible', correctCategoryId: 'con' }
      ],
      explanationOnWrong: 'Sort by whether the point supports or weakens the option.'
    },
    mcqPrompt: 'Choose the strongest comparison + reason statement.',
    mcqOptions: [
      'Je préfère le bus parce que c’est moins cher et plus pratique.',
      'Bus plus.',
      'Je suis bus choix.',
      'Moins plus train bus.'
    ],
    mcqCorrect: 0,
    mcqWrong: 'B1 comparisons should include a choice and a clear reason.',
    shortPrompt: 'Type the French word for disadvantage.',
    shortAnswers: ['inconvénient', 'inconvenient'],
    productionMode: 'spoken',
    productionPrompt: 'Compare two options and justify your choice with at least two criteria.',
    productionExpected: ['je préfère', 'parce que'],
    productionSample: 'Je préfère le cours du matin parce que c’est plus pratique et moins stressant pour moi.',
    testPrompt: 'Which line clearly justifies a choice?',
    testOptions: ['Je préfère le train.', 'Je préfère le train parce qu’il est plus rapide.', 'Train rapide.', 'Merci train.'],
    testCorrect: 1,
    testWrong: 'At B1, add a reason after your choice.',
    writingPrompt: 'Write a short comparison paragraph choosing between two options (transport/course/apartment).',
    writingExpected: ['je préfère', 'parce que'],
    writingSample: 'Je préfère le bus parce que c’est moins cher et plus pratique pour mon horaire.'
  },
  {
    lessonNumber: 5,
    title: 'Explaining Past Problems and Solutions',
    focus: 'Narrate a problem and how it was solved',
    outcomes: ['Narrate a past issue', 'Explain response/solution', 'Sequence events clearly'],
    vocabularyTargets: ['situation', 'solution', 'finalement', 'au début', 'résoudre'],
    grammarTargets: ['past narration with connectors'],
    teachExamples: ['Au début, il y avait un problème de document. Finalement, le bureau a résolu la situation.'],
    scenarioTitle: 'Service Office Problem Follow-up',
    scenarioExplanation: 'This lesson develops B1 narration for explaining what happened in a service situation and how it was resolved.',
    scenarioExamples: ["J'ai attendu longtemps, puis j'ai parlé à un agent.", 'Finalement, mon dossier a été corrigé.'],
    listeningMessage: "Au début, il y avait un problème avec mon dossier. Finalement, l'agent l'a corrigé.",
    sentencePuzzle: {
      tokens: ['Au', 'début', ',', 'il', 'y', 'avait', 'un', 'problème'],
      correctOrder: ['Au', 'début', ',', 'il', 'y', 'avait', 'un', 'problème'],
      hint: 'Use the time marker first, then the description of the issue.',
      explanationOnWrong: 'Past narration starts with a sequence/time marker and a full statement.'
    },
    memoryPairs: [
      { id: 'b15m1', left: 'au début', right: 'at first' },
      { id: 'b15m2', left: 'finalement', right: 'finally / in the end' }
    ],
    classification: {
      prompt: 'Classify each phrase as problem stage or solution stage.',
      categories: [{ id: 'problem', label: 'Problem Stage' }, { id: 'solution', label: 'Solution Stage' }],
      items: [
        { id: 'i1', label: 'Il y avait un problème de dossier.', correctCategoryId: 'problem' },
        { id: 'i2', label: "L'agent a corrigé le dossier.", correctCategoryId: 'solution' },
        { id: 'i3', label: "J'ai attendu longtemps.", correctCategoryId: 'problem' },
        { id: 'i4', label: 'Finalement, la situation a été résolue.', correctCategoryId: 'solution' }
      ],
      explanationOnWrong: 'Separate the issue description from the resolution steps.'
    },
    mcqPrompt: 'Choose the best short problem-solution narrative.',
    mcqOptions: [
      "Au début, j'ai eu un problème, mais finalement le bureau m'a aidé.",
      'Problème bureau merci.',
      'Je suis problème solution.',
      'Au début finalement.'
    ],
    mcqCorrect: 0,
    mcqWrong: 'A B1 narrative should mention both the problem and the resolution.',
    shortPrompt: 'Type the connector meaning "finally / in the end".',
    shortAnswers: ['finalement'],
    productionMode: 'mixed',
    productionPrompt: 'Describe a past service problem and explain how it was solved.',
    productionExpected: ['au début', 'finalement'],
    productionSample: "Au début, j'ai eu un problème de rendez-vous. Finalement, la réceptionniste a changé la date.",
    testPrompt: 'Which sentence clearly indicates a resolution?',
    testOptions: ['Il y avait un problème.', 'Finalement, on a trouvé une solution.', 'Je suis problème.', 'Dossier.'],
    testCorrect: 1,
    testWrong: 'Resolution language should show what happened in the end.',
    writingPrompt: 'Write a short past problem-solution message (3-4 lines).',
    writingExpected: ['au début', 'finalement'],
    writingSample: "Au début, il y avait un problème avec mon document. Finalement, le bureau a trouvé une solution."
  },
  {
    lessonNumber: 6,
    title: 'Workplace Requests and Negotiation',
    focus: 'Request and negotiate politely at work',
    outcomes: ['Make a workplace request', 'Negotiate a time/solution', 'Stay polite under pressure'],
    vocabularyTargets: ['demander', 'proposer', 'possible', 'solution', 'horaire'],
    grammarTargets: ['conditionnel/polite forms (intro)', 'request language'],
    teachExamples: ['Je voudrais proposer une autre solution.', 'Serait-il possible de changer mon horaire ?'],
    scenarioTitle: 'Shift and Schedule Negotiation',
    scenarioExplanation: 'B1 learners need to negotiate schedules politely and propose alternatives in workplace settings.',
    scenarioExamples: ['Je peux commencer plus tôt demain.', 'Je propose d’échanger mon quart.'],
    listeningMessage: "Serait-il possible de changer mon quart de vendredi ? Je peux travailler samedi.",
    sentencePuzzle: {
      tokens: ['Serait-il', 'possible', 'de', 'changer', 'mon', 'quart', '?'],
      correctOrder: ['Serait-il', 'possible', 'de', 'changer', 'mon', 'quart', '?'],
      hint: 'Use the polite request frame in full.',
      explanationOnWrong: 'Keep the polite request frame together before the action.'
    },
    memoryPairs: [
      { id: 'b16m1', left: 'je propose', right: 'I propose' },
      { id: 'b16m2', left: 'serait-il possible', right: 'would it be possible' }
    ],
    classification: {
      prompt: 'Classify the line as request or proposed solution.',
      categories: [{ id: 'request', label: 'Request' }, { id: 'proposal', label: 'Proposed Solution' }],
      items: [
        { id: 'i1', label: 'Serait-il possible de changer mon horaire ?', correctCategoryId: 'request' },
        { id: 'i2', label: 'Je peux commencer plus tôt.', correctCategoryId: 'proposal' },
        { id: 'i3', label: 'Je propose un autre horaire.', correctCategoryId: 'proposal' },
        { id: 'i4', label: 'Je voudrais demander un changement.', correctCategoryId: 'request' }
      ],
      explanationOnWrong: 'Distinguish between asking and offering a solution.'
    },
    mcqPrompt: 'Choose the strongest workplace negotiation line.',
    mcqOptions: [
      'Serait-il possible de changer mon horaire ? Je peux commencer plus tôt.',
      'Changer horaire.',
      'Je suis horaire solution.',
      'Merci.'
    ],
    mcqCorrect: 0,
    mcqWrong: 'A strong B1 line combines a polite request and a possible solution.',
    shortPrompt: 'Type the phrase used to propose an idea: "I propose".',
    shortAnswers: ['je propose'],
    productionMode: 'spoken',
    productionPrompt: 'Make a polite workplace request and propose one alternative solution.',
    productionExpected: ['possible', 'je propose'],
    productionSample: "Serait-il possible de changer mon horaire ? Je propose de travailler samedi matin.",
    testPrompt: 'Which option sounds more professional/polite?',
    testOptions: ['Changez mon horaire.', 'Je veux changer mon horaire.', 'Serait-il possible de changer mon horaire ?', 'Horaire change.'],
    testCorrect: 2,
    testWrong: 'Use the polite request frame for professional communication.',
    writingPrompt: 'Write a short workplace request with one alternative proposal (3-4 lines).',
    writingExpected: ['possible', 'je propose'],
    writingSample: "Bonjour, serait-il possible de changer mon quart ? Je propose de travailler jeudi soir à la place."
  },
  {
    lessonNumber: 7,
    title: 'Healthcare Appointments and Follow-Up',
    focus: 'Explain symptoms and follow-up needs clearly',
    outcomes: ['Explain symptoms and timing', 'Ask follow-up questions', 'Confirm next steps'],
    vocabularyTargets: ['symptôme', 'douleur', 'depuis', 'amélioration', 'suivi'],
    grammarTargets: ['time + symptom detail'],
    teachExamples: ['J’ai cette douleur depuis trois jours.', 'Est-ce que je dois prendre un rendez-vous de suivi ?'],
    scenarioTitle: 'Clinic Follow-Up Conversation',
    scenarioExplanation: 'B1 clinic communication requires symptoms, duration, and follow-up questions in a clear order.',
    scenarioExamples: ["J'ai moins de fièvre aujourd'hui, mais j'ai encore mal à la gorge."],
    listeningMessage: "J'ai cette douleur depuis trois jours et je voudrais savoir si j'ai besoin d'un suivi.",
    sentencePuzzle: {
      tokens: ['J’', 'ai', 'cette', 'douleur', 'depuis', 'trois', 'jours'],
      correctOrder: ['J’', 'ai', 'cette', 'douleur', 'depuis', 'trois', 'jours'],
      hint: 'Symptom first, then duration detail.',
      explanationOnWrong: 'Give the symptom, then add depuis + duration.'
    },
    memoryPairs: [
      { id: 'b17m1', left: 'depuis', right: 'since / for (duration)' },
      { id: 'b17m2', left: 'suivi', right: 'follow-up' }
    ],
    classification: {
      prompt: 'Classify the line as symptom information or follow-up question.',
      categories: [{ id: 'symptom', label: 'Symptom / Detail' }, { id: 'followup', label: 'Follow-Up / Next Step' }],
      items: [
        { id: 'i1', label: "J'ai mal à la gorge depuis trois jours.", correctCategoryId: 'symptom' },
        { id: 'i2', label: 'Ai-je besoin d’un rendez-vous de suivi ?', correctCategoryId: 'followup' },
        { id: 'i3', label: "J'ai moins de fièvre aujourd'hui.", correctCategoryId: 'symptom' },
        { id: 'i4', label: 'Quand dois-je revenir ?', correctCategoryId: 'followup' }
      ],
      explanationOnWrong: 'Separate symptom details from next-step/follow-up questions.'
    },
    mcqPrompt: 'Choose the clearest B1 clinic message.',
    mcqOptions: [
      "J'ai mal à la gorge depuis trois jours et je voudrais un rendez-vous.",
      'Gorge mal rendez-vous.',
      'Je suis douleur.',
      'Bonjour merci.'
    ],
    mcqCorrect: 0,
    mcqWrong: 'At B1, combine symptom + duration + request.',
    shortPrompt: 'Type the French word used for duration (since/for):',
    shortAnswers: ['depuis'],
    productionMode: 'mixed',
    productionPrompt: 'Explain a symptom, give the duration, and ask one follow-up question.',
    productionExpected: ['depuis', 'suivi'],
    productionSample: "J'ai une douleur au dos depuis une semaine. Est-ce que j'ai besoin d'un rendez-vous de suivi ?",
    testPrompt: 'Which sentence adds a useful health detail?',
    testOptions: ['J’ai mal.', "J'ai mal depuis trois jours.", 'Mal.', 'Douleur.'],
    testCorrect: 1,
    testWrong: 'B1 messages should add duration or intensity details.',
    writingPrompt: 'Write a short clinic follow-up message with symptom + duration + question.',
    writingExpected: ['depuis', 'rendez-vous'],
    writingSample: "Bonjour, j'ai encore mal à la gorge depuis trois jours. Est-ce possible d'avoir un rendez-vous de suivi ?"
  },
  {
    lessonNumber: 8,
    title: 'Giving Opinions with Reasons',
    focus: 'Express and support an opinion',
    outcomes: ['State an opinion clearly', 'Give reasons/examples', 'Use connectors for structure'],
    vocabularyTargets: ['à mon avis', 'je pense que', 'parce que', 'par exemple', 'important'],
    grammarTargets: ['opinion phrases and connectors'],
    teachExamples: ['À mon avis, le transport public est important parce que...', 'Je pense que cette option est meilleure.'],
    scenarioTitle: 'Community and Everyday Opinion Tasks',
    scenarioExplanation: 'This lesson prepares learners for CLB/TEF-style opinion tasks by building clear reasons and examples.',
    scenarioExamples: ['Je pense que les cours du soir sont utiles pour les travailleurs.'],
    listeningMessage: "À mon avis, ce service est utile parce qu'il aide les nouveaux arrivants.",
    sentencePuzzle: {
      tokens: ['Je', 'pense', 'que', 'ce', 'service', 'est', 'utile'],
      correctOrder: ['Je', 'pense', 'que', 'ce', 'service', 'est', 'utile'],
      hint: 'Use the opinion frame first.',
      explanationOnWrong: 'Start with je pense que / à mon avis, then the opinion content.'
    },
    memoryPairs: [
      { id: 'b18m1', left: 'à mon avis', right: 'in my opinion' },
      { id: 'b18m2', left: 'par exemple', right: 'for example' }
    ],
    classification: {
      prompt: 'Classify the phrase by opinion structure role.',
      categories: [{ id: 'opinion', label: 'Opinion Statement' }, { id: 'support', label: 'Reason / Example' }],
      items: [
        { id: 'i1', label: 'Je pense que...', correctCategoryId: 'opinion' },
        { id: 'i2', label: 'parce que...', correctCategoryId: 'support' },
        { id: 'i3', label: 'À mon avis...', correctCategoryId: 'opinion' },
        { id: 'i4', label: 'par exemple...', correctCategoryId: 'support' }
      ],
      explanationOnWrong: 'Separate opinion starters from support/example connectors.'
    },
    mcqPrompt: 'Choose the strongest opinion statement.',
    mcqOptions: [
      "Je pense que ce programme est utile parce qu'il aide les étudiants.",
      'Programme utile.',
      'Je suis opinion.',
      'Parce que utile.'
    ],
    mcqCorrect: 0,
    mcqWrong: 'A good B1 opinion includes the opinion and a reason.',
    shortPrompt: 'Type the French phrase for "in my opinion".',
    shortAnswers: ['à mon avis', 'a mon avis'],
    productionMode: 'spoken',
    productionPrompt: 'Give an opinion about a community/work/study topic and support it with one reason and one example.',
    productionExpected: ['je pense que', 'parce que'],
    productionSample: "Je pense que les cours du soir sont utiles parce que les travailleurs peuvent étudier après le travail.",
    testPrompt: 'Which line introduces an example?',
    testOptions: ['Je pense que...', 'par exemple...', 'à mon avis...', 'important'],
    testCorrect: 1,
    testWrong: 'par exemple introduces an example.',
    writingPrompt: 'Write a short opinion paragraph (4-5 lines) with a reason and example.',
    writingExpected: ['je pense que', 'par exemple'],
    writingSample: "Je pense que les transports publics sont importants. Par exemple, ils aident les personnes sans voiture à aller au travail."
  },
  {
    lessonNumber: 9,
    title: 'Formal and Semi-Formal Emails',
    focus: 'Write clearer B1 request/complaint emails',
    outcomes: ['Write purpose clearly', 'Organize details', 'Use polite closing'],
    vocabularyTargets: ['objet', 'concernant', 'demande', 'problème', 'cordialement'],
    grammarTargets: ['email structure and register'],
    teachExamples: ['Bonjour, je vous écris concernant...', 'Je vous remercie de votre aide.'],
    scenarioTitle: 'Emailing an Institution or Employer',
    scenarioExplanation: 'B1 email tasks require a clear subject, purpose, details, and polite close.',
    scenarioExamples: ["Je vous écris concernant mon horaire de travail de la semaine prochaine."],
    listeningMessage: "Bonjour, je vous écris concernant mon rendez-vous de jeudi.",
    sentencePuzzle: {
      tokens: ['Je', 'vous', 'écris', 'concernant', 'mon', 'rendez-vous'],
      correctOrder: ['Je', 'vous', 'écris', 'concernant', 'mon', 'rendez-vous'],
      hint: 'Use the email purpose line in standard order.',
      explanationOnWrong: 'Start with je vous écris, then state the topic.'
    },
    memoryPairs: [
      { id: 'b19m1', left: 'concernant', right: 'regarding / about' },
      { id: 'b19m2', left: 'cordialement', right: 'formal closing' }
    ],
    classification: {
      prompt: 'Classify each line by email section.',
      categories: [{ id: 'purpose', label: 'Purpose / Detail' }, { id: 'closing', label: 'Polite Closing' }],
      items: [
        { id: 'i1', label: 'Je vous écris concernant...', correctCategoryId: 'purpose' },
        { id: 'i2', label: 'Je vous remercie de votre aide.', correctCategoryId: 'closing' },
        { id: 'i3', label: "J'ai un problème avec...", correctCategoryId: 'purpose' },
        { id: 'i4', label: 'Cordialement,', correctCategoryId: 'closing' }
      ],
      explanationOnWrong: 'Sort by message body/purpose vs closing formulas.'
    },
    mcqPrompt: 'Choose the strongest email opening line.',
    mcqOptions: [
      "Bonjour, je vous écris concernant mon rendez-vous de lundi.",
      'Bonjour rendez-vous lundi.',
      'Je suis email.',
      'Cordialement.'
    ],
    mcqCorrect: 0,
    mcqWrong: 'B1 emails should start with a clear purpose line.',
    shortPrompt: 'Type the formal word meaning "regarding".',
    shortAnswers: ['concernant'],
    productionMode: 'written',
    productionPrompt: 'Write a short formal/semi-formal email to request help or explain a problem.',
    productionExpected: ['bonjour', 'je vous écris'],
    productionSample: "Bonjour, je vous écris concernant mon horaire. J'ai un problème de disponibilité cette semaine. Merci de votre aide.",
    testPrompt: 'Which line is the best formal closing?',
    testOptions: ['Merci.', 'Au revoir.', 'Cordialement,', 'Salut.'],
    testCorrect: 2,
    testWrong: 'Cordialement is a common formal closing.',
    writingPrompt: 'Write a short email (4-5 lines) with opening, purpose, detail, and closing.',
    writingExpected: ['bonjour', 'cordialement'],
    writingSample: "Bonjour, je vous écris concernant mon rendez-vous. Je dois demander un changement de date. Merci de votre compréhension. Cordialement,"
  },
  {
    lessonNumber: 10,
    title: 'Reading Service Notices and Policies',
    focus: 'Identify main rules and key details',
    outcomes: ['Read notices for key rules', 'Identify obligations', 'Summarize actions required'],
    vocabularyTargets: ['veuillez', 'obligatoire', 'interdit', 'avant', 'présenter'],
    grammarTargets: ['instruction language and notices'],
    teachExamples: ['Veuillez présenter une pièce d’identité.', 'Le port du masque est obligatoire.'],
    scenarioTitle: 'Building Rules and Service Notices',
    scenarioExplanation: 'B1 learners need to extract rules and actions from signs, notices, and short policy messages.',
    scenarioExamples: ['Présentez-vous 15 minutes avant votre rendez-vous.'],
    listeningMessage: "Veuillez vous présenter quinze minutes avant votre rendez-vous avec une pièce d'identité.",
    sentencePuzzle: {
      tokens: ['Veuillez', 'présenter', 'une', 'pièce', "d'identité"],
      correctOrder: ['Veuillez', 'présenter', 'une', 'pièce', "d'identité"],
      hint: 'Notice instructions usually start with Veuillez + infinitive.',
      explanationOnWrong: 'Keep the instruction phrase in order: veuillez + action.'
    },
    memoryPairs: [
      { id: 'b110m1', left: 'obligatoire', right: 'mandatory' },
      { id: 'b110m2', left: 'interdit', right: 'forbidden' }
    ],
    classification: {
      prompt: 'Classify each notice phrase by type.',
      categories: [{ id: 'rule', label: 'Rule / Restriction' }, { id: 'instruction', label: 'Instruction / Action' }],
      items: [
        { id: 'i1', label: 'Le paiement est obligatoire.', correctCategoryId: 'rule' },
        { id: 'i2', label: 'Veuillez présenter votre carte.', correctCategoryId: 'instruction' },
        { id: 'i3', label: 'Il est interdit de fumer.', correctCategoryId: 'rule' },
        { id: 'i4', label: 'Présentez-vous à la réception.', correctCategoryId: 'instruction' }
      ],
      explanationOnWrong: 'Rules say what is allowed/required; instructions say what to do.'
    },
    mcqPrompt: 'Choose the line that expresses an instruction.',
    mcqOptions: [
      'Veuillez apporter votre document.',
      'Le paiement est obligatoire.',
      'Il est interdit de stationner.',
      'Merci.'
    ],
    mcqCorrect: 0,
    mcqWrong: 'Instructions often begin with veuillez or imperative forms.',
    shortPrompt: 'Type the French word for mandatory.',
    shortAnswers: ['obligatoire'],
    productionMode: 'mixed',
    productionPrompt: 'Explain one service rule and one instruction to a client/visitor.',
    productionExpected: ['obligatoire', 'veuillez'],
    productionSample: "Le document est obligatoire. Veuillez le présenter à la réception.",
    testPrompt: 'Which line indicates a restriction?',
    testOptions: ['Veuillez entrer.', 'Il est interdit de fumer.', 'Présentez votre carte.', 'Merci.'],
    testCorrect: 1,
    testWrong: 'interdit indicates a restriction/prohibition.',
    writingPrompt: 'Write a short notice summary with one rule and one instruction.',
    writingExpected: ['obligatoire', 'veuillez'],
    writingSample: "La pièce d'identité est obligatoire. Veuillez arriver 15 minutes avant le rendez-vous."
  },
  {
    lessonNumber: 11,
    title: 'Structured Opinion Response (TEF/CLB Bridge)',
    focus: 'Short argument with reasons and examples',
    outcomes: ['State thesis/opinion', 'Support with reasons', 'Use simple structure'],
    vocabularyTargets: ['selon moi', 'd’abord', 'ensuite', 'cependant', 'conclusion'],
    grammarTargets: ['opinion organization connectors'],
    teachExamples: ["Selon moi, cette mesure est utile. D'abord..., ensuite..."],
    scenarioTitle: 'Opinion Task Preparation',
    scenarioExplanation: 'This lesson bridges everyday French toward CLB/TEF opinion tasks by building structure and support.',
    scenarioExamples: ['Selon moi, les cours en ligne sont utiles, mais ils ont aussi des limites.'],
    listeningMessage: "Selon moi, ce programme est utile parce qu'il aide les nouveaux arrivants à trouver du travail.",
    sentencePuzzle: {
      tokens: ['Selon', 'moi', ',', 'ce', 'programme', 'est', 'utile'],
      correctOrder: ['Selon', 'moi', ',', 'ce', 'programme', 'est', 'utile'],
      hint: 'Start with the opinion frame.',
      explanationOnWrong: 'Place the opinion starter before the statement.'
    },
    memoryPairs: [
      { id: 'b111m1', left: "d'abord", right: 'first point' },
      { id: 'b111m2', left: 'ensuite', right: 'second point / next point' }
    ],
    classification: {
      prompt: 'Classify the line by argument structure role.',
      categories: [{ id: 'position', label: 'Opinion / Position' }, { id: 'support', label: 'Support / Example' }],
      items: [
        { id: 'i1', label: 'Selon moi, ce service est utile.', correctCategoryId: 'position' },
        { id: 'i2', label: "Par exemple, il aide les étudiants à pratiquer.", correctCategoryId: 'support' },
        { id: 'i3', label: "Je pense que c'est une bonne idée.", correctCategoryId: 'position' },
        { id: 'i4', label: "Parce qu'il est moins cher...", correctCategoryId: 'support' }
      ],
      explanationOnWrong: 'Separate the main position from supporting reasons/examples.'
    },
    mcqPrompt: 'Choose the strongest short opinion response.',
    mcqOptions: [
      "Je pense que ce programme est utile parce qu'il aide les nouveaux arrivants.",
      'Programme utile.',
      'Je suis opinion.',
      'Parce que programme.'
    ],
    mcqCorrect: 0,
    mcqWrong: 'B1 opinion responses need the opinion and a supporting reason.',
    shortPrompt: 'Type the connector meaning "first" for organizing ideas.',
    shortAnswers: ["d'abord", 'dabord'],
    productionMode: 'spoken',
    productionPrompt: 'Give an opinion on a practical topic with two reasons and one example.',
    productionExpected: ['je pense que', 'par exemple'],
    productionSample: "Je pense que les cours du soir sont utiles parce qu'ils sont flexibles. Par exemple, les travailleurs peuvent étudier après le travail.",
    testPrompt: 'Which line introduces the speaker’s position?',
    testOptions: ['Par exemple...', 'Selon moi...', 'Ensuite...', 'Cordialement'],
    testCorrect: 1,
    testWrong: 'Selon moi introduces the speaker’s position/opinion.',
    writingPrompt: 'Write a short structured opinion paragraph with at least two connectors.',
    writingExpected: ['selon moi', 'ensuite'],
    writingSample: "Selon moi, les transports publics sont importants. D'abord, ils réduisent les coûts. Ensuite, ils facilitent l'accès au travail."
  },
  {
    lessonNumber: 12,
    title: 'B1 Integration Checkpoint (Work + Services + Opinion)',
    focus: 'Integrated functional communication and reasoning',
    outcomes: ['Handle a multi-step practical task', 'Explain, request, and justify', 'Prepare for CLB 5/7 transition'],
    vocabularyTargets: ['situation', 'demande', 'solution', 'raison', 'détail'],
    grammarTargets: ['integrated B1 functional structures'],
    teachExamples: ["J'explique la situation, je fais ma demande, puis je donne une raison."],
    scenarioTitle: 'Integrated B1 Scenario',
    scenarioExplanation: 'This checkpoint combines workplace/service communication and opinion justification in one structured response.',
    scenarioExamples: ["Bonjour, je vous écris pour expliquer la situation et proposer une solution."],
    listeningMessage: "Bonjour, j'ai un problème avec mon horaire. Je voudrais proposer une solution parce que je dois assister à un rendez-vous.",
    sentencePuzzle: {
      tokens: ['Je', 'voudrais', 'proposer', 'une', 'solution', 'parce', 'que', "j'ai", 'un', 'rendez-vous'],
      correctOrder: ['Je', 'voudrais', 'proposer', 'une', 'solution', 'parce', 'que', "j'ai", 'un', 'rendez-vous'],
      hint: 'State the request/proposal, then add a reason.',
      explanationOnWrong: 'Keep the proposal phrase before parce que + reason.'
    },
    memoryPairs: [
      { id: 'b112m1', left: 'solution', right: 'proposed fix / next step' },
      { id: 'b112m2', left: 'raison', right: 'why / justification' }
    ],
    classification: {
      prompt: 'Classify each line as explanation, request/proposal, or reason.',
      categories: [
        { id: 'explain', label: 'Explain Situation' },
        { id: 'request', label: 'Request / Proposal' },
        { id: 'reason', label: 'Reason / Justification' }
      ],
      items: [
        { id: 'i1', label: "J'ai un problème avec mon horaire.", correctCategoryId: 'explain' },
        { id: 'i2', label: 'Je voudrais proposer une solution.', correctCategoryId: 'request' },
        { id: 'i3', label: "Parce que j'ai un rendez-vous important.", correctCategoryId: 'reason' },
        { id: 'i4', label: 'Est-ce possible de changer mon quart ?', correctCategoryId: 'request' }
      ],
      explanationOnWrong: 'Identify the function of each sentence in the communication structure.'
    },
    mcqPrompt: 'Choose the strongest integrated B1 response opening.',
    mcqOptions: [
      "Bonjour, j'ai un problème avec mon horaire et je voudrais proposer une solution.",
      'Horaire problème solution.',
      'Bonjour merci.',
      'Je suis horaire.'
    ],
    mcqCorrect: 0,
    mcqWrong: 'An integrated B1 response should explain the issue and state the request/proposal.',
    shortPrompt: 'Type one key B1 word used to justify a request (reason):',
    shortAnswers: ['raison', 'parce que'],
    productionMode: 'mixed',
    productionPrompt: 'Complete an integrated B1 task: explain a situation, make a request/proposal, and justify it.',
    productionExpected: ['problème', 'solution', 'parce que'],
    productionSample: "Bonjour, j'ai un problème avec mon horaire. Je voudrais proposer une solution parce que j'ai un rendez-vous médical.",
    testPrompt: 'Which line functions as a justification?',
    testOptions: ['Je voudrais un changement.', "Parce que j'ai un rendez-vous important.", 'Bonjour.', 'Merci.'],
    testCorrect: 1,
    testWrong: 'A justification answers why the request is needed.',
    writingPrompt: 'Write a short integrated B1 message (4-6 lines) with explanation, request, and justification.',
    writingExpected: ['problème', 'parce que'],
    writingSample: "Bonjour, j'ai un problème avec mon horaire de vendredi. Je voudrais demander un changement parce que j'ai un rendez-vous important. Je propose de travailler samedi matin."
  }
];

const B1_GENERATED_TOPICS: Array<{
  title: string;
  focus: string;
  outcomes: string[];
  vocabularyTargets: string[];
  grammarTargets: string[];
  teachExamples: string[];
  scenarioTitle: string;
  scenarioExplanation: string;
  scenarioExamples: string[];
  listeningMessage: string;
  productionMode: 'spoken' | 'written' | 'mixed';
  productionPrompt: string;
  productionExpected: string[];
  productionSample: string;
  writingPrompt: string;
  writingExpected: string[];
  writingSample: string;
}> = [
  {
    title: 'Negotiating Shift Changes Professionally',
    focus: 'Request alternatives and justify constraints',
    outcomes: ['Explain scheduling constraints', 'Propose alternatives', 'Negotiate politely'],
    vocabularyTargets: ['quart', 'contrainte', 'alternative', 'équipe', 'solution'],
    grammarTargets: ['Conditionnel polite requests', 'cause/effect connectors'],
    teachExamples: ['Je voudrais proposer une alternative pour mon quart de vendredi.'],
    scenarioTitle: 'Work Schedule Negotiation',
    scenarioExplanation: 'B1 learners need to negotiate practical changes while staying clear and professional.',
    scenarioExamples: ['Je peux travailler samedi matin pour compenser.'],
    listeningMessage: "Je ne peux pas travailler vendredi soir, mais je peux prendre le quart de samedi matin.",
    productionMode: 'spoken',
    productionPrompt: 'Explain your scheduling issue and propose two alternatives.',
    productionExpected: ['je voudrais', 'je peux'],
    productionSample: "Je voudrais changer mon quart de vendredi. Je peux travailler samedi matin ou lundi soir.",
    writingPrompt: 'Write a structured shift-change request email.',
    writingExpected: ['quart', 'solution'],
    writingSample: "Bonjour, je voudrais discuter de mon quart de vendredi. Je propose une solution: travailler samedi matin."
  },
  {
    title: 'Formal Complaint and Follow-Up',
    focus: 'Structure complaint with evidence and requested action',
    outcomes: ['Describe issue objectively', 'Add evidence', 'Request specific action'],
    vocabularyTargets: ['plainte', 'service', 'preuve', 'demande', 'suivi'],
    grammarTargets: ['Formal register patterns'],
    teachExamples: ["Je vous écris pour déposer une plainte concernant le service."],
    scenarioTitle: 'Service Complaint Case',
    scenarioExplanation: 'This pattern strengthens clarity, professionalism, and action-oriented writing.',
    scenarioExamples: ['Le problème est arrivé le 12 février à 14h.'],
    listeningMessage: "Je vous écris pour signaler un problème de service et demander un suivi rapide.",
    productionMode: 'written',
    productionPrompt: 'Write a complaint message with issue, evidence, and requested action.',
    productionExpected: ['plainte', 'demande'],
    productionSample: "Je vous écris pour déposer une plainte. Le 12 février, le service n'était pas disponible. Je demande un suivi.",
    writingPrompt: 'Write a formal follow-up after a complaint.',
    writingExpected: ['suivi', 'merci'],
    writingSample: 'Merci de confirmer le suivi de ma demande dans les prochains jours.'
  },
  {
    title: 'Interview Response Development',
    focus: 'Answer workplace questions with structure',
    outcomes: ['Give structured answers', 'Use examples', 'Maintain clear sequence'],
    vocabularyTargets: ['expérience', 'compétence', 'objectif', 'responsabilité', 'exemple'],
    grammarTargets: ['Past narration with connectors'],
    teachExamples: ["J'ai travaillé dans le service client pendant deux ans, puis j'ai géré une petite équipe."],
    scenarioTitle: 'Job Interview Communication',
    scenarioExplanation: 'Learners practice coherent, example-based interview responses.',
    scenarioExamples: ["Par exemple, j'ai amélioré le temps de réponse de l'équipe."],
    listeningMessage: "Dans mon dernier poste, j'ai travaillé avec des clients et j'ai coordonné l'équipe du soir.",
    productionMode: 'spoken',
    productionPrompt: 'Answer: Why are you a good fit for this role?',
    productionExpected: ["j'ai", 'par exemple'],
    productionSample: "Je suis un bon candidat parce que j'ai de l'expérience en service client. Par exemple, j'ai formé deux nouveaux collègues.",
    writingPrompt: 'Write a short interview-style self-presentation.',
    writingExpected: ['expérience', 'objectif'],
    writingSample: "J'ai de l'expérience en service. Mon objectif est de contribuer à une équipe professionnelle."
  },
  {
    title: 'Policy Explanation and Clarification',
    focus: 'Explain policy points and clarify implications',
    outcomes: ['Summarize policy statements', 'Ask clarifying questions', 'Confirm understanding'],
    vocabularyTargets: ['politique', 'règle', 'obligation', 'clarifier', 'appliquer'],
    grammarTargets: ['Relative clauses and precision'],
    teachExamples: ['Cette règle concerne les employés qui travaillent le week-end.'],
    scenarioTitle: 'Workplace Policy Briefing',
    scenarioExplanation: 'B1 learners build confidence in formal policy language.',
    scenarioExamples: ['Pouvez-vous clarifier comment cette règle est appliquée ?'],
    listeningMessage: "La politique indique que les employés doivent confirmer leurs horaires avant jeudi.",
    productionMode: 'mixed',
    productionPrompt: 'Summarize a policy and ask one clarification question.',
    productionExpected: ['politique', 'clarifier'],
    productionSample: "La politique demande une confirmation avant jeudi. Pouvez-vous clarifier si cela s'applique aux employés temporaires ?",
    writingPrompt: 'Write a concise policy clarification request.',
    writingExpected: ['règle', 'question'],
    writingSample: "Bonjour, j'ai une question sur la nouvelle règle. Est-ce qu'elle s'applique à tous les postes ?"
  },
  {
    title: 'Housing Dispute Resolution',
    focus: 'Present issue, evidence, and desired resolution',
    outcomes: ['Explain tenancy issue', 'Provide timeline/evidence', 'Propose resolution'],
    vocabularyTargets: ['locataire', 'propriétaire', 'fuite', 'preuve', 'résolution'],
    grammarTargets: ['Past + present problem framing'],
    teachExamples: ["Depuis deux semaines, il y a une fuite dans la cuisine."],
    scenarioTitle: 'Tenant-Landlord Resolution',
    scenarioExplanation: 'Learners practice clear dispute communication for housing stability.',
    scenarioExamples: ['Je demande une intervention avant vendredi.'],
    listeningMessage: "Je vous contacte pour une fuite signalée la semaine dernière qui n'est pas encore réparée.",
    productionMode: 'written',
    productionPrompt: 'Write a formal housing issue message with timeline and request.',
    productionExpected: ['fuite', 'intervention'],
    productionSample: "Il y a une fuite depuis deux semaines. Je demande une intervention avant vendredi.",
    writingPrompt: 'Draft a follow-up housing complaint.',
    writingExpected: ['locataire', 'résolution'],
    writingSample: "En tant que locataire, je demande une résolution rapide du problème de chauffage."
  },
  {
    title: 'Community Issue Discussion',
    focus: 'Present viewpoint with balanced arguments',
    outcomes: ['State position clearly', 'Give pros/cons', 'Suggest practical recommendation'],
    vocabularyTargets: ['communauté', 'avantage', 'inconvénient', 'proposer', 'recommandation'],
    grammarTargets: ['Opinion connectors and concessions'],
    teachExamples: ["Selon moi, cette initiative est utile, mais elle a aussi des limites."],
    scenarioTitle: 'Community Debate Task',
    scenarioExplanation: 'This lesson develops balanced argumentation for CLB7 preparation.',
    scenarioExamples: ['Je recommande une phase pilote avant la mise en œuvre complète.'],
    listeningMessage: "Ce projet a des avantages pour la communauté, cependant il faut améliorer l'accessibilité.",
    productionMode: 'spoken',
    productionPrompt: 'Give a balanced opinion on a community program with one recommendation.',
    productionExpected: ['selon moi', 'je recommande'],
    productionSample: "Selon moi, le programme est utile. Cependant, je recommande plus de communication en français et en anglais.",
    writingPrompt: 'Write a short balanced recommendation paragraph.',
    writingExpected: ['avantage', 'recommandation'],
    writingSample: "Ce projet a un avantage important: il soutient les familles. Je recommande d'ajouter des horaires flexibles."
  },
  {
    title: 'Healthcare Follow-Up with Timeline',
    focus: 'Explain symptom timeline and request follow-up action',
    outcomes: ['Describe symptoms with timing', 'Ask one follow-up question', 'Confirm next steps clearly'],
    vocabularyTargets: ['symptôme', 'depuis', 'suivi', 'ordonnance', 'clinique'],
    grammarTargets: ['Time framing', 'clarification questions'],
    teachExamples: ["J'ai ce symptôme depuis trois jours et je veux un suivi."],
    scenarioTitle: 'Clinic Follow-Up Communication',
    scenarioExplanation: 'B1 medical communication should be specific, chronological, and polite.',
    scenarioExamples: ["J'ai commencé ce traitement mardi et les symptômes continuent."],
    listeningMessage: "J'ai des symptômes depuis trois jours. Je voudrais savoir si je dois revenir à la clinique.",
    productionMode: 'mixed',
    productionPrompt: 'Explain your symptom timeline and request follow-up guidance.',
    productionExpected: ['depuis', 'suivi'],
    productionSample: "J'ai des symptômes depuis mardi. Je voudrais un suivi cette semaine pour vérifier le traitement.",
    writingPrompt: 'Write a short clinic follow-up note with timeline and question.',
    writingExpected: ['symptôme', 'depuis'],
    writingSample: "Bonjour, j'ai des symptômes depuis trois jours. Est-ce que je dois revenir pour un suivi ?"
  },
  {
    title: 'Training Request at Work',
    focus: 'Request training and justify business value',
    outcomes: ['State training need', 'Link request to work quality', 'Propose a practical plan'],
    vocabularyTargets: ['formation', 'compétence', 'qualité', 'objectif', 'proposer'],
    grammarTargets: ['Purpose statements', 'workplace justification'],
    teachExamples: ["Je souhaite suivre une formation pour améliorer la qualité du service."],
    scenarioTitle: 'Professional Development Request',
    scenarioExplanation: 'B1 learners need to justify training requests with practical benefits.',
    scenarioExamples: ['Cette formation m’aidera à mieux répondre aux clients.'],
    listeningMessage: "Je propose de suivre une formation courte pour améliorer la communication avec les clients.",
    productionMode: 'written',
    productionPrompt: 'Write a structured request for professional training.',
    productionExpected: ['formation', 'objectif'],
    productionSample: "Je souhaite suivre une formation en communication. Mon objectif est d'améliorer la qualité du service client.",
    writingPrompt: 'Write a short manager email requesting training approval.',
    writingExpected: ['compétence', 'qualité'],
    writingSample: "Bonjour, je demande une formation pour développer mes compétences et améliorer la qualité de mon travail."
  },
  {
    title: 'School Program Comparison',
    focus: 'Compare two options and justify your recommendation',
    outcomes: ['Compare options with criteria', 'Identify one trade-off', 'Recommend one option'],
    vocabularyTargets: ['option', 'critère', 'coût', 'horaire', 'recommander'],
    grammarTargets: ['Comparative structures', 'decision language'],
    teachExamples: ['Le programme A est moins cher, mais le programme B est plus flexible.'],
    scenarioTitle: 'Course Selection Decision',
    scenarioExplanation: 'B1 comparison tasks require criteria and a clear recommendation.',
    scenarioExamples: ["Je recommande le programme B pour son horaire du soir."],
    listeningMessage: "Le programme A est moins cher, mais le programme B convient mieux à mon horaire de travail.",
    productionMode: 'spoken',
    productionPrompt: 'Compare two program options and recommend one with reasons.',
    productionExpected: ['option', 'je recommande'],
    productionSample: "Je recommande l'option B. Elle coûte un peu plus cher, mais l'horaire est plus compatible avec mon travail.",
    writingPrompt: 'Write a short recommendation comparing two programs.',
    writingExpected: ['critère', 'recommander'],
    writingSample: "Selon mes critères, je recommande l'option B pour sa flexibilité et son meilleur horaire."
  },
  {
    title: 'Tenant Meeting Preparation',
    focus: 'Prepare key points before a housing meeting',
    outcomes: ['Present issue clearly', 'Prioritize discussion points', 'State expected outcome'],
    vocabularyTargets: ['réunion', 'logement', 'priorité', 'attente', 'problème'],
    grammarTargets: ['Structured sequencing', 'priority language'],
    teachExamples: ["Pour la réunion, ma priorité est de résoudre le problème d'humidité."],
    scenarioTitle: 'Housing Meeting Agenda',
    scenarioExplanation: 'B1 learners should prepare concise, ordered points before meetings.',
    scenarioExamples: ["J'attends une réponse écrite après la réunion."],
    listeningMessage: "Pour la réunion de demain, je veux présenter trois points prioritaires sur le logement.",
    productionMode: 'mixed',
    productionPrompt: 'Prepare a short meeting message with priorities and expected outcome.',
    productionExpected: ['priorité', 'réponse'],
    productionSample: "Ma priorité est la réparation de la fuite. J'attends une réponse écrite avec un délai précis.",
    writingPrompt: 'Write a brief housing meeting preparation note.',
    writingExpected: ['réunion', 'attente'],
    writingSample: "Pour la réunion de jeudi, je vais présenter mes priorités et mon attente d'une intervention rapide."
  },
  {
    title: 'Conflict De-escalation at Work',
    focus: 'Address disagreement using neutral and solution-oriented language',
    outcomes: ['Describe disagreement neutrally', 'Suggest collaborative solution', 'Maintain professional tone'],
    vocabularyTargets: ['désaccord', 'clarifier', 'collaborer', 'solution', 'respect'],
    grammarTargets: ['Neutral framing', 'polite negotiation phrases'],
    teachExamples: ["Je comprends votre point, mais je propose une autre solution."],
    scenarioTitle: 'Workplace Communication Reset',
    scenarioExplanation: 'B1 users need calm, solution-focused language during disagreements.',
    scenarioExamples: ['Nous pouvons clarifier les rôles avant la prochaine réunion.'],
    listeningMessage: "Je comprends votre position. Pour avancer, je propose de clarifier les responsabilités de chacun.",
    productionMode: 'spoken',
    productionPrompt: 'Respond to a disagreement and propose a collaborative next step.',
    productionExpected: ['je propose', 'solution'],
    productionSample: "Je comprends votre point de vue. Je propose une solution commune pour respecter les délais.",
    writingPrompt: 'Write a short de-escalation message after a tense exchange.',
    writingExpected: ['désaccord', 'respect'],
    writingSample: "Après notre désaccord, je propose une discussion courte pour trouver une solution dans le respect."
  },
  {
    title: 'Community Event Coordination',
    focus: 'Coordinate volunteers and logistics with clear task language',
    outcomes: ['Assign tasks clearly', 'Confirm schedule details', 'Request confirmation'],
    vocabularyTargets: ['bénévole', 'logistique', 'horaire', 'responsable', 'confirmation'],
    grammarTargets: ['Task assignment structures'],
    teachExamples: ['Je suis responsable des inscriptions et de la coordination des bénévoles.'],
    scenarioTitle: 'Volunteer Team Coordination',
    scenarioExplanation: 'B1 coordination tasks require clear responsibilities and timing.',
    scenarioExamples: ['Pouvez-vous confirmer votre disponibilité avant vendredi ?'],
    listeningMessage: "Je coordonne les bénévoles pour samedi. Merci de confirmer votre disponibilité avant vendredi.",
    productionMode: 'written',
    productionPrompt: 'Write a coordination message assigning tasks and asking confirmation.',
    productionExpected: ['responsable', 'confirmation'],
    productionSample: "Je suis responsable de la logistique. Merci de confirmer votre rôle et votre horaire avant vendredi.",
    writingPrompt: 'Write a short volunteer coordination email.',
    writingExpected: ['bénévole', 'horaire'],
    writingSample: "Bonjour, merci de confirmer votre horaire bénévole pour samedi et votre tâche principale."
  },
  {
    title: 'Academic Progress Discussion',
    focus: 'Discuss strengths, weaknesses, and next actions',
    outcomes: ['Describe progress with examples', 'Identify one weakness', 'Plan next step'],
    vocabularyTargets: ['progrès', 'difficulté', 'objectif', 'stratégie', 'améliorer'],
    grammarTargets: ['Contrast and progression connectors'],
    teachExamples: ["J'ai fait des progrès en compréhension, mais j'ai encore des difficultés à l'oral."],
    scenarioTitle: 'Learning Progress Review',
    scenarioExplanation: 'B1 reflections should include evidence and concrete next steps.',
    scenarioExamples: ["Mon objectif est d'améliorer la fluidité avec une pratique quotidienne."],
    listeningMessage: "J'ai progressé en lecture, mais je dois améliorer ma prononciation. Je vais pratiquer chaque jour.",
    productionMode: 'mixed',
    productionPrompt: 'Explain your progress, one challenge, and one improvement plan.',
    productionExpected: ['progrès', 'objectif'],
    productionSample: "J'ai fait des progrès en écriture. J'ai encore une difficulté en prononciation, donc je vais pratiquer dix minutes par jour.",
    writingPrompt: 'Write a short self-evaluation with next steps.',
    writingExpected: ['difficulté', 'améliorer'],
    writingSample: "J'ai une difficulté en expression orale. Pour améliorer ce point, je vais pratiquer avec des enregistrements."
  },
  {
    title: 'Public Service Appointment Escalation',
    focus: 'Escalate delayed requests while maintaining professionalism',
    outcomes: ['State delay and impact', 'Request escalation politely', 'Ask for timeline'],
    vocabularyTargets: ['retard', 'escalade', 'impact', 'délai', 'priorité'],
    grammarTargets: ['Formal escalation patterns'],
    teachExamples: ['Ma demande est en retard et cela a un impact sur mon dossier.'],
    scenarioTitle: 'Administrative Delay Follow-Up',
    scenarioExplanation: 'B1 escalation tasks require factual tone and clear requested action.',
    scenarioExamples: ['Je demande une escalade de ma demande et un délai de réponse.'],
    listeningMessage: "Ma demande est en attente depuis un mois. Je souhaite une escalade et une réponse avec délai.",
    productionMode: 'written',
    productionPrompt: 'Write an escalation message for a delayed public-service request.',
    productionExpected: ['retard', 'délai'],
    productionSample: "Ma demande est en retard depuis quatre semaines. Je demande une escalade et une réponse avec un délai précis.",
    writingPrompt: 'Write a concise escalation follow-up.',
    writingExpected: ['impact', 'priorité'],
    writingSample: "Ce retard a un impact important sur mon dossier. Merci de traiter cette demande en priorité."
  }
];

function normalizeB1Token(token: string): string {
  return token
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '');
}

function buildB1McqOptions(topic: (typeof B1_GENERATED_TOPICS)[number]): [string, string, string, string] {
  const correct = topic.teachExamples[0] ?? topic.scenarioExamples[0] ?? topic.productionSample;
  const keywordA = topic.vocabularyTargets[0] ?? 'mot';
  const keywordB = topic.vocabularyTargets[1] ?? 'mot';
  return [correct, 'Bonjour, merci.', `${keywordA}, ${keywordB}.`, `Je suis ${keywordA}.`];
}

function buildB1TestOptions(topic: (typeof B1_GENERATED_TOPICS)[number]): [string, string, string, string] {
  const strongest = `${topic.teachExamples[0] ?? ''} ${topic.scenarioExamples[0] ?? ''}`.trim() || topic.productionSample;
  const keywordA = topic.vocabularyTargets[0] ?? 'mot';
  return [strongest, 'Merci.', `${keywordA}.`, 'Je veux aide.'];
}

function makeGeneratedB1Spec(lessonNumber: number, topicIndex: number): B1Spec {
  const topic = B1_GENERATED_TOPICS[topicIndex % B1_GENERATED_TOPICS.length];
  return {
    lessonNumber,
    title: topic.title,
    focus: topic.focus,
    outcomes: topic.outcomes,
    vocabularyTargets: topic.vocabularyTargets,
    grammarTargets: topic.grammarTargets,
    teachExamples: topic.teachExamples,
    scenarioTitle: topic.scenarioTitle,
    scenarioExplanation: topic.scenarioExplanation,
    scenarioExamples: topic.scenarioExamples,
    listeningMessage: topic.listeningMessage,
    sentencePuzzle: {
      tokens: topic.teachExamples[0].replace(/[.,!?]/g, '').split(' '),
      correctOrder: topic.teachExamples[0].replace(/[.,!?]/g, '').split(' '),
      hint: 'Keep the key structure in logical order: context -> request/reason.',
      explanationOnWrong: 'Rebuild the sentence by placing subject, key verb, and detail in sequence.'
    },
    memoryPairs: [
      { id: `b1g${lessonNumber}m1`, left: topic.vocabularyTargets[0], right: 'core concept' },
      { id: `b1g${lessonNumber}m2`, left: topic.vocabularyTargets[1], right: 'supporting concept' }
    ],
    classification: {
      prompt: 'Classify by communication function.',
      categories: [
        { id: 'context', label: 'Context / Situation' },
        { id: 'action', label: 'Request / Action' },
        { id: 'reason', label: 'Reason / Support' }
      ],
      items: [
        { id: 'i1', label: topic.scenarioExamples[0] ?? topic.teachExamples[0], correctCategoryId: 'context' },
        { id: 'i2', label: topic.scenarioExamples[1] ?? topic.productionPrompt, correctCategoryId: 'action' },
        { id: 'i3', label: topic.productionSample, correctCategoryId: 'reason' }
      ],
      explanationOnWrong: 'B1 responses should clearly separate context, action, and supporting reason.'
    },
    mcqPrompt: `Pick the best B1 line for: ${topic.focus.toLowerCase()}.`,
    mcqOptions: buildB1McqOptions(topic),
    mcqCorrect: 0,
    mcqWrong: 'Strong B1 lines include purpose and detail.',
    shortPrompt: 'Type one key word from this lesson.',
    shortAnswers: Array.from(
      new Set([
        ...topic.vocabularyTargets.slice(0, 4).map((item) => item.toLowerCase()),
        ...topic.vocabularyTargets.slice(0, 4).map((item) => normalizeB1Token(item))
      ])
    ),
    productionMode: topic.productionMode,
    productionPrompt: topic.productionPrompt,
    productionExpected: topic.productionExpected,
    productionSample: topic.productionSample,
    testPrompt: 'Which response is most complete and professional?',
    testOptions: buildB1TestOptions(topic),
    testCorrect: 0,
    testWrong: 'Professional B1 responses combine clarity, detail, and action.',
    writingPrompt: topic.writingPrompt,
    writingExpected: topic.writingExpected,
    writingSample: topic.writingSample
  };
}

const B1_ALL_SPECS: B1Spec[] = [
  ...B1_SPECS,
  ...Array.from({ length: 28 }, (_, index) => makeGeneratedB1Spec(index + 13, index))
];

export const b1StructuredLessons: StructuredLessonContent[] = B1_ALL_SPECS.map(makeB1Lesson);
