import type { StructuredLessonContent } from '../../types/LessonContentTypes';

type A2Spec = {
  lessonNumber: number;
  title: string;
  focus: string;
  outcomes: string[];
  vocabularyTargets: string[];
  grammarTargets: string[];
  sampleTeach: string[];
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
  authoredContext?: {
    scenarioTitle: string;
    scenarioExplanation: string;
    scenarioExamples: string[];
    listeningMessage?: string;
    sentencePuzzle?: { tokens: string[]; correctOrder: string[]; hint: string; explanationOnWrong: string };
    memoryPairs?: Array<{ id: string; left: string; right: string }>;
    classification?: {
      prompt: string;
      categories: Array<{ id: string; label: string }>;
      items: Array<{ id: string; label: string; correctCategoryId: string }>;
      hint?: string;
      explanationOnWrong: string;
    };
  };
};

type A2AuthoredContext = NonNullable<A2Spec['authoredContext']>;

const A2_AUTHORED_CONTEXTS: Partial<Record<number, A2AuthoredContext>> = {
  1: {
    scenarioTitle: 'Yesterday: Banking, Transit, and Errands',
    scenarioExplanation:
      'A2 past tense is most useful when reporting what happened yesterday: bank visits, transit, shopping, and appointments.',
    scenarioExamples: ["Hier, j'ai visité la banque.", "J'ai pris le bus et j'ai acheté une carte."],
    listeningMessage: "Hier, j'ai visité la banque et j'ai pris le métro.",
    sentencePuzzle: {
      tokens: ['Hier,', 'j’', 'ai', 'pris', 'le', 'bus'],
      correctOrder: ['Hier,', 'j’', 'ai', 'pris', 'le', 'bus'],
      hint: 'Time marker first, then helper + participle.',
      explanationOnWrong: 'For passé composé, place the time marker first and keep ai + participle together.'
    },
    memoryPairs: [
      { id: 'a21m1', left: 'hier', right: 'past time marker' },
      { id: 'a21m2', left: "j'ai", right: 'past helper form' }
    ],
    classification: {
      prompt: 'Classify items by time meaning.',
      categories: [{ id: 'past', label: 'Past' }, { id: 'notPast', label: 'Not Past' }],
      items: [
        { id: 'i1', label: 'hier', correctCategoryId: 'past' },
        { id: 'i2', label: "j'ai visité", correctCategoryId: 'past' },
        { id: 'i3', label: 'demain', correctCategoryId: 'notPast' },
        { id: 'i4', label: 'je vais', correctCategoryId: 'notPast' }
      ],
      explanationOnWrong: 'Look for past markers and passé composé forms.'
    }
  },
  2: {
    scenarioTitle: 'Planning Tomorrow: Clinic, Work, and Classes',
    scenarioExplanation:
      'Near-future language helps learners plan appointments, classes, and work tasks clearly and politely.',
    scenarioExamples: ['Demain, je vais appeler la clinique.', 'Je vais aller au cours après le travail.'],
    listeningMessage: 'Demain, je vais appeler la clinique à 9h.',
    sentencePuzzle: {
      tokens: ['Demain,', 'je', 'vais', 'aller', 'au', 'cours'],
      correctOrder: ['Demain,', 'je', 'vais', 'aller', 'au', 'cours'],
      hint: 'Time marker + subject + aller + infinitive.',
      explanationOnWrong: 'Keep je vais together before the infinitive.'
    },
    memoryPairs: [
      { id: 'a22m1', left: 'je vais', right: 'near-future starter' },
      { id: 'a22m2', left: 'demain', right: 'future time marker' }
    ],
    classification: {
      prompt: 'Classify the sentence as plan or completed action.',
      categories: [{ id: 'plan', label: 'Future Plan' }, { id: 'done', label: 'Completed Action' }],
      items: [
        { id: 'i1', label: 'Je vais appeler la clinique.', correctCategoryId: 'plan' },
        { id: 'i2', label: "J'ai appelé la clinique.", correctCategoryId: 'done' },
        { id: 'i3', label: 'Nous allons visiter un appartement.', correctCategoryId: 'plan' },
        { id: 'i4', label: "J'ai pris le bus.", correctCategoryId: 'done' }
      ],
      explanationOnWrong: 'Near future uses aller + infinitive; completed actions often use passé composé.'
    }
  },
  3: {
    scenarioTitle: 'Need, Ability, and Requests at Service Counters',
    scenarioExplanation:
      'Modal verbs help learners explain what they can do, must do, or want in offices, community centers, and service desks.',
    scenarioExamples: ['Je dois envoyer ce document.', "Je peux revenir demain.", 'Je veux un rendez-vous.'],
    listeningMessage: "Je dois envoyer ce formulaire aujourd'hui.",
    sentencePuzzle: {
      tokens: ['Je', 'dois', 'envoyer', 'le', 'document'],
      correctOrder: ['Je', 'dois', 'envoyer', 'le', 'document'],
      hint: 'Subject + modal + infinitive.',
      explanationOnWrong: 'Place the modal verb before the infinitive.'
    },
    memoryPairs: [
      { id: 'a23m1', left: 'je peux', right: 'ability' },
      { id: 'a23m2', left: 'je dois', right: 'obligation' }
    ],
    classification: {
      prompt: 'Classify the modal expression by meaning.',
      categories: [{ id: 'ability', label: 'Ability / Option' }, { id: 'need', label: 'Need / Obligation' }],
      items: [
        { id: 'i1', label: 'je peux venir', correctCategoryId: 'ability' },
        { id: 'i2', label: 'je dois envoyer', correctCategoryId: 'need' },
        { id: 'i3', label: 'je peux parler', correctCategoryId: 'ability' },
        { id: 'i4', label: 'je dois remplir', correctCategoryId: 'need' }
      ],
      explanationOnWrong: 'pouvoir = ability/possibility, devoir = obligation.'
    }
  },
  4: {
    scenarioTitle: 'Comparing Housing and Transport Options',
    scenarioExplanation:
      'A2 comparisons are practical for choosing apartments, transit, schedules, and services in Canadian cities.',
    scenarioExamples: ['Cet appartement est moins cher.', 'Le bus est plus rapide que le train.'],
    listeningMessage: 'Le bus est plus rapide que le métro aujourd’hui.',
    sentencePuzzle: {
      tokens: ['Le', 'bus', 'est', 'plus', 'rapide', 'que', 'le', 'train'],
      correctOrder: ['Le', 'bus', 'est', 'plus', 'rapide', 'que', 'le', 'train'],
      hint: 'Keep plus + adjective + que together.',
      explanationOnWrong: 'Comparisons follow adjective patterns: plus/moins + adjective + que.'
    },
    memoryPairs: [
      { id: 'a24m1', left: 'plus', right: 'more' },
      { id: 'a24m2', left: 'moins', right: 'less' }
    ],
    classification: {
      prompt: 'Classify each comparison as positive or lower comparison.',
      categories: [{ id: 'more', label: 'More / Stronger' }, { id: 'less', label: 'Less / Lower' }],
      items: [
        { id: 'i1', label: 'plus rapide', correctCategoryId: 'more' },
        { id: 'i2', label: 'moins cher', correctCategoryId: 'less' },
        { id: 'i3', label: 'plus pratique', correctCategoryId: 'more' },
        { id: 'i4', label: 'moins long', correctCategoryId: 'less' }
      ],
      explanationOnWrong: 'Sort expressions by plus vs moins.'
    }
  },
  5: {
    scenarioTitle: 'Reporting Service Problems (Cards, Accounts, Appointments)',
    scenarioExplanation:
      'This lesson trains A2 problem reporting: say what is wrong, add one detail, and ask for help politely.',
    scenarioExamples: ["J'ai un problème avec ma carte.", 'Ma carte ne marche pas.'],
    listeningMessage: "Bonjour, j'ai un problème avec mon compte.",
    sentencePuzzle: {
      tokens: ['Ma', 'carte', 'ne', 'marche', 'pas'],
      correctOrder: ['Ma', 'carte', 'ne', 'marche', 'pas'],
      hint: 'Negation wraps the verb: ne ... pas.',
      explanationOnWrong: 'Place ne before the verb and pas after it.'
    },
    memoryPairs: [
      { id: 'a25m1', left: 'problème', right: 'problem' },
      { id: 'a25m2', left: 'aide', right: 'help' }
    ],
    classification: {
      prompt: 'Classify the line as problem statement or help request.',
      categories: [{ id: 'problem', label: 'Problem Statement' }, { id: 'request', label: 'Help Request' }],
      items: [
        { id: 'i1', label: "J'ai un problème avec ma carte.", correctCategoryId: 'problem' },
        { id: 'i2', label: "Pouvez-vous m'aider ?", correctCategoryId: 'request' },
        { id: 'i3', label: 'Ma carte ne marche pas.', correctCategoryId: 'problem' },
        { id: 'i4', label: "J'ai besoin d'aide.", correctCategoryId: 'request' }
      ],
      explanationOnWrong: 'Separate statements describing the issue from direct requests for help.'
    }
  },
  6: {
    scenarioTitle: 'Housing and Landlord Communication',
    scenarioExplanation:
      'A2 learners need short but clear messages for housing issues: heating, leaks, access, and repairs.',
    scenarioExamples: ["Le chauffage ne marche pas dans l'appartement.", 'Pouvez-vous réparer la fuite ?'],
    listeningMessage: "Bonjour, le chauffage ne marche pas dans l'appartement.",
    sentencePuzzle: {
      tokens: ['Le', 'chauffage', 'ne', 'marche', 'pas'],
      correctOrder: ['Le', 'chauffage', 'ne', 'marche', 'pas'],
      hint: 'Subject first, then negation around the verb.',
      explanationOnWrong: 'For housing problems, use clear subject + ne ... pas.'
    },
    memoryPairs: [
      { id: 'a26m1', left: 'propriétaire', right: 'landlord / owner' },
      { id: 'a26m2', left: 'chauffage', right: 'heating' }
    ],
    classification: {
      prompt: 'Classify each item as housing problem or repair request.',
      categories: [{ id: 'problem', label: 'Problem' }, { id: 'request', label: 'Repair Request' }],
      items: [
        { id: 'i1', label: 'Le chauffage ne marche pas.', correctCategoryId: 'problem' },
        { id: 'i2', label: 'Pouvez-vous réparer la fuite ?', correctCategoryId: 'request' },
        { id: 'i3', label: "J'ai un problème dans l'appartement.", correctCategoryId: 'problem' },
        { id: 'i4', label: 'Pouvez-vous venir cette semaine ?', correctCategoryId: 'request' }
      ],
      explanationOnWrong: 'Problem lines describe the issue; request lines ask for action.'
    }
  },
  7: {
    scenarioTitle: 'Pharmacy and Basic Health Communication',
    scenarioExplanation:
      'Learners need practical French to describe symptoms and ask for help at pharmacies and clinics.',
    scenarioExamples: ["J'ai mal à la tête.", 'Je cherche un médicament pour la toux.'],
    listeningMessage: "J'ai mal à la gorge. Je cherche un médicament.",
    sentencePuzzle: {
      tokens: ['J’', 'ai', 'mal', 'à', 'la', 'tête'],
      correctOrder: ['J’', 'ai', 'mal', 'à', 'la', 'tête'],
      hint: 'Use the fixed pattern j’ai mal à...',
      explanationOnWrong: 'Keep the symptom pattern together: j’ai mal à + body part.'
    },
    memoryPairs: [
      { id: 'a27m1', left: 'pharmacie', right: 'pharmacy' },
      { id: 'a27m2', left: 'médicament', right: 'medicine' }
    ],
    classification: {
      prompt: 'Classify items as symptom or medicine/help request.',
      categories: [{ id: 'symptom', label: 'Symptom' }, { id: 'request', label: 'Medicine / Help' }],
      items: [
        { id: 'i1', label: "J'ai mal à la tête.", correctCategoryId: 'symptom' },
        { id: 'i2', label: 'Je cherche un médicament.', correctCategoryId: 'request' },
        { id: 'i3', label: "J'ai mal à la gorge.", correctCategoryId: 'symptom' },
        { id: 'i4', label: 'Je suis à la pharmacie.', correctCategoryId: 'request' }
      ],
      explanationOnWrong: 'Sort by symptom description vs request/help language.'
    }
  },
  8: {
    scenarioTitle: 'Work Schedules and Availability Changes',
    scenarioExplanation:
      'A2 users often need to explain shift availability and request schedule changes at work or training programs.',
    scenarioExamples: ['Je suis disponible jeudi soir.', 'Est-ce possible de changer mon horaire ?'],
    listeningMessage: 'Je suis disponible vendredi matin, pas jeudi soir.',
    sentencePuzzle: {
      tokens: ['Je', 'suis', 'disponible', 'jeudi', 'soir'],
      correctOrder: ['Je', 'suis', 'disponible', 'jeudi', 'soir'],
      hint: 'Subject + être + adjective + day/time.',
      explanationOnWrong: 'Put disponible after être, then add the time detail.'
    },
    memoryPairs: [
      { id: 'a28m1', left: 'horaire', right: 'schedule' },
      { id: 'a28m2', left: 'disponible', right: 'available' }
    ],
    classification: {
      prompt: 'Classify items as availability info or schedule-change request.',
      categories: [{ id: 'availability', label: 'Availability' }, { id: 'change', label: 'Change Request' }],
      items: [
        { id: 'i1', label: 'Je suis disponible mardi soir.', correctCategoryId: 'availability' },
        { id: 'i2', label: 'Est-ce possible de changer mon horaire ?', correctCategoryId: 'change' },
        { id: 'i3', label: 'Je peux travailler vendredi matin.', correctCategoryId: 'availability' },
        { id: 'i4', label: 'Pouvez-vous changer mon quart ?', correctCategoryId: 'change' }
      ],
      explanationOnWrong: 'Availability gives timing; change requests ask for schedule modification.'
    }
  },
  9: {
    scenarioTitle: 'Community and Government Service Desks',
    scenarioExplanation:
      'This lesson builds confidence for service offices, settlement centers, and public-service counters in Canada.',
    scenarioExamples: ['Je cherche le bureau des services.', "J'ai besoin d'aide pour ce formulaire."],
    listeningMessage: "Bonjour, j'ai besoin d'aide pour ce formulaire.",
    sentencePuzzle: {
      tokens: ['J’', 'ai', 'besoin', 'd’', 'aide', 'pour', 'ce', 'formulaire'],
      correctOrder: ['J’', 'ai', 'besoin', 'd’', 'aide', 'pour', 'ce', 'formulaire'],
      hint: 'Keep the fixed chunk j’ai besoin d’aide together.',
      explanationOnWrong: 'Use the complete need-expression before the form detail.'
    },
    memoryPairs: [
      { id: 'a29m1', left: 'formulaire', right: 'form' },
      { id: 'a29m2', left: 'bureau', right: 'office/desk' }
    ],
    classification: {
      prompt: 'Classify each line as office navigation or help request.',
      categories: [{ id: 'nav', label: 'Navigation / Where to go' }, { id: 'help', label: 'Help Request' }],
      items: [
        { id: 'i1', label: 'Où est le bon bureau ?', correctCategoryId: 'nav' },
        { id: 'i2', label: "J'ai besoin d'aide pour ce formulaire.", correctCategoryId: 'help' },
        { id: 'i3', label: 'Je cherche le bureau des services.', correctCategoryId: 'nav' },
        { id: 'i4', label: 'Pouvez-vous m’aider avec ce document ?', correctCategoryId: 'help' }
      ],
      explanationOnWrong: 'Separate “where” questions from “help me” requests.'
    }
  },
  10: {
    scenarioTitle: 'Voicemail and Callback Messages',
    scenarioExplanation:
      'A2 learners need to understand short service messages and respond clearly with confirmation or rescheduling.',
    scenarioExamples: ['Votre rendez-vous est confirmé pour jeudi.', 'Veuillez rappeler demain matin.'],
    listeningMessage: 'Votre rendez-vous est confirmé pour jeudi à quatorze heures.',
    sentencePuzzle: {
      tokens: ['Votre', 'rendez-vous', 'est', 'confirmé', 'pour', 'jeudi'],
      correctOrder: ['Votre', 'rendez-vous', 'est', 'confirmé', 'pour', 'jeudi'],
      hint: 'Keep the appointment phrase and confirmation together.',
      explanationOnWrong: 'Use subject phrase + est confirmé + date.'
    },
    memoryPairs: [
      { id: 'a210m1', left: 'confirmé', right: 'confirmed' },
      { id: 'a210m2', left: 'annuler', right: 'to cancel' }
    ],
    classification: {
      prompt: 'Classify the message function.',
      categories: [{ id: 'confirm', label: 'Confirm / Reminder' }, { id: 'change', label: 'Cancel / Reschedule' }],
      items: [
        { id: 'i1', label: 'Votre rendez-vous est confirmé.', correctCategoryId: 'confirm' },
        { id: 'i2', label: 'Je dois annuler mon rendez-vous.', correctCategoryId: 'change' },
        { id: 'i3', label: 'Veuillez rappeler demain.', correctCategoryId: 'confirm' },
        { id: 'i4', label: 'Je veux reporter le rendez-vous.', correctCategoryId: 'change' }
      ],
      explanationOnWrong: 'Sort messages by whether they confirm/remind or change/cancel.'
    }
  },
  11: {
    scenarioTitle: 'Functional Email Writing for Appointments and Requests',
    scenarioExplanation:
      'A2 writing should focus on practical emails with a clear purpose, one request, and enough details to act on.',
    scenarioExamples: ['Bonjour, je vous écris pour demander un rendez-vous.', 'Merci pour votre aide.'],
    listeningMessage: 'Bonjour, je vous écris pour reporter mon rendez-vous.',
    sentencePuzzle: {
      tokens: ['Je', 'vous', 'écris', 'pour', 'demander', 'un', 'rendez-vous'],
      correctOrder: ['Je', 'vous', 'écris', 'pour', 'demander', 'un', 'rendez-vous'],
      hint: 'Keep the email purpose phrase in order.',
      explanationOnWrong: 'The email opening usually follows je vous écris pour + infinitive.'
    },
    memoryPairs: [
      { id: 'a211m1', left: 'je vous écris', right: 'email opening / purpose intro' },
      { id: 'a211m2', left: 'merci', right: 'polite closing element' }
    ],
    classification: {
      prompt: 'Classify each line as email opening/purpose or closing/polite line.',
      categories: [{ id: 'opening', label: 'Opening / Purpose' }, { id: 'closing', label: 'Closing / Politeness' }],
      items: [
        { id: 'i1', label: 'Bonjour, je vous écris pour...', correctCategoryId: 'opening' },
        { id: 'i2', label: 'Merci de votre aide.', correctCategoryId: 'closing' },
        { id: 'i3', label: 'Je voudrais reporter mon rendez-vous.', correctCategoryId: 'opening' },
        { id: 'i4', label: 'Cordialement (future step)', correctCategoryId: 'closing' }
      ],
      explanationOnWrong: 'Sort lines by whether they start the request or close politely.'
    }
  },
  12: {
    scenarioTitle: 'A2 Integration: CLB 5 Bridge Practice',
    scenarioExplanation:
      'This checkpoint combines reporting a problem, asking for help, and giving practical details. It prepares the learner for CLB 5-style functional tasks.',
    scenarioExamples: ["Bonjour, j'ai un problème avec mon rendez-vous.", "J'ai besoin d'aide pour changer l'horaire."],
    listeningMessage: "Bonjour, j'ai un problème avec mon rendez-vous de jeudi. Pouvez-vous m'aider ?",
    sentencePuzzle: {
      tokens: ['J’', 'ai', 'besoin', 'd’', 'aide', 'pour', 'changer', 'mon', 'horaire'],
      correctOrder: ['J’', 'ai', 'besoin', 'd’', 'aide', 'pour', 'changer', 'mon', 'horaire'],
      hint: 'Need expression first, then action detail.',
      explanationOnWrong: 'Use j’ai besoin d’aide before explaining what must change.'
    },
    memoryPairs: [
      { id: 'a212m1', left: 'problème', right: 'problem detail' },
      { id: 'a212m2', left: 'aide', right: 'support request' }
    ],
    classification: {
      prompt: 'Classify each line by practical communication role.',
      categories: [{ id: 'problem', label: 'Problem / Context' }, { id: 'request', label: 'Request / Action' }],
      items: [
        { id: 'i1', label: "J'ai un problème avec mon horaire.", correctCategoryId: 'problem' },
        { id: 'i2', label: "Pouvez-vous m'aider ?", correctCategoryId: 'request' },
        { id: 'i3', label: 'Mon rendez-vous est jeudi.', correctCategoryId: 'problem' },
        { id: 'i4', label: 'Je voudrais changer la date.', correctCategoryId: 'request' }
      ],
      explanationOnWrong: 'Separate problem/context statements from request/action statements.'
    }
  }
};

function makeA2Lesson(spec: A2Spec): StructuredLessonContent {
  const idb = `a2l${spec.lessonNumber}`;
  const context = spec.authoredContext ?? A2_AUTHORED_CONTEXTS[spec.lessonNumber];
  return {
    id: `a2-structured-${spec.lessonNumber}`,
    curriculumLessonId: `a2-lesson-${spec.lessonNumber}`,
    levelId: 'a2',
    moduleId: 'a2-bridge-module-1',
    title: `A2 Lesson ${spec.lessonNumber}: ${spec.title}`,
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
            explanation: `A2 goal: use ${spec.focus.toLowerCase()} in practical Canadian daily-life situations.`,
            examples: spec.sampleTeach,
            companionTip: 'At A2, focus on meaning + accuracy. Short clear sentences are enough.'
          },
          ...(context
            ? [
                {
                  id: `${idb}-seg2`,
                  title: context.scenarioTitle,
                  explanation: context.scenarioExplanation,
                  examples: context.scenarioExamples,
                  companionTip: 'Practice these lines as real messages you might use in Canada.'
                }
              ]
            : [])
        ],
        requiresCompletionToAdvance: true
      },
      {
        id: `${idb}-practice`,
        type: 'practice',
        title: 'Practice: Controlled Communication',
        targetMinutes: 8,
        objectives: ['Understand and apply the pattern in common scenarios'],
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
            explanationOnWrong: `Review the target form for ${spec.title.toLowerCase()}.`,
            skillFocus: 'writing',
            points: 5
          },
          {
            id: `${idb}-p2b`,
            kind: 'sentenceOrderPuzzle',
            prompt: 'Put the sentence in the correct French order.',
            instructions: 'Tap each tile to rebuild the sentence.',
            tokens: context?.sentencePuzzle?.tokens ?? ['Demain,', 'je', 'vais', 'appeler', 'la', 'clinique.'],
            correctOrder: context?.sentencePuzzle?.correctOrder ?? ['Demain,', 'je', 'vais', 'appeler', 'la', 'clinique.'],
            explanationOnWrong: context?.sentencePuzzle?.explanationOnWrong ?? 'Use time expression first, then subject + aller + infinitive.',
            skillFocus: 'writing',
            points: 5,
            hint: { message: context?.sentencePuzzle?.hint ?? 'Look for the time phrase first, then je vais...' }
          },
          {
            id: `${idb}-p2c`,
            kind: 'memoryMatch',
            prompt: 'Memory Match: connect the pattern parts.',
            instructions: 'Find the matching concept pairs.',
            pairs: context?.memoryPairs ?? [
              { id: 'amm1', left: 'demain', right: 'future time marker' },
              { id: 'amm2', left: 'je vais', right: 'near future starter' }
            ],
            explanationOnWrong: 'Review the near-future pattern and complete both matches.',
            skillFocus: 'reading',
            points: 5,
            hint: { message: 'Near future often starts with time marker + je vais + infinitive.' }
          },
          ...(context?.classification
            ? [
                {
                  id: `${idb}-p2d`,
                  kind: 'quickClassification' as const,
                  prompt: context.classification.prompt,
                  instructions: 'Select a category, then tap each item to classify it.',
                  categories: context.classification.categories,
                  items: context.classification.items,
                  explanationOnWrong: context.classification.explanationOnWrong,
                  skillFocus: 'reading' as const,
                  points: 5,
                  hint: context.classification.hint ? { message: context.classification.hint } : undefined
                }
              ]
            : []),
          {
            id: `${idb}-p3`,
            kind: 'listeningPrompt',
            prompt: 'Choose the best meaning of the message in context.',
            options: [
              'A person is greeting only',
              'A person is giving practical information',
              'A person is saying goodbye',
              'A person is refusing to speak'
            ],
            correctOptionIndex: 1,
            explanationOnWrong: 'At A2, focus on the main practical meaning and key detail.',
            skillFocus: 'listening',
            points: 10,
            audioText: context?.listeningMessage ?? spec.sampleTeach[0]
          }
        ],
        requiresCompletionToAdvance: true
      },
      {
        id: `${idb}-production`,
        type: 'production',
        title: 'Production: Real-Life Task',
        targetMinutes: 5,
        objectives: ['Produce a practical A2 response'],
        productionTask: {
          id: `${idb}-prod`,
          title: 'A2 Practical Production',
          instructions: 'Respond to the scenario using clear A2 French.',
          mode: spec.productionMode,
          mandatory: true,
          targetMinutes: 5,
          exercise: spec.productionMode === 'spoken'
            ? {
                id: `${idb}-prod-ex`,
                kind: 'speakingPrompt',
                prompt: spec.productionPrompt,
                expectedPatterns: spec.productionExpected,
                minWords: 10,
                rubricFocus: ['taskCompletion', 'fluency', 'grammar', 'pronunciation'],
                sampleAnswer: spec.productionSample,
                fallbackTextEvaluationAllowed: true,
                skillFocus: 'speaking',
                points: 20,
                hint: { message: `Include: ${spec.productionExpected.join(', ')}` }
              }
            : {
                id: `${idb}-prod-ex`,
                kind: 'writingPrompt',
                prompt: spec.productionPrompt,
                expectedElements: spec.productionExpected,
                minWords: 16,
                rubricFocus: ['taskCompletion', 'grammar', 'coherence', 'vocabulary'],
                sampleAnswer: spec.productionSample,
                skillFocus: 'writing',
                points: 20,
                hint: { message: `Include: ${spec.productionExpected.join(', ')}` }
              }
        },
        requiresCompletionToAdvance: true
      },
      {
        id: `${idb}-test`,
        type: 'miniTest',
        title: 'Mini Test: A2 Checkpoint',
        targetMinutes: 6,
        objectives: ['Check practical understanding and output'],
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
            minWords: 18,
            rubricFocus: ['taskCompletion', 'grammar', 'coherence'],
            sampleAnswer: spec.writingSample,
            skillFocus: 'writing',
            points: 20,
            hint: { message: `Use the key elements: ${spec.writingExpected.join(', ')}` }
          }
        ],
        requiresCompletionToAdvance: true
      }
    ],
    assessment: {
      masteryThresholdPercent: 78,
      productionRequired: true,
      retryIncorrectLater: true,
      strictSequential: true
    },
    aiHooks: {
      companionPersonaHookId: 'a2-coach',
      speakingAssessmentHookId: 'speaking-v1',
      writingCorrectionHookId: 'writing-v1',
      dynamicExplanationHookId: `a2-lesson-${spec.lessonNumber}-explainer`
    }
  };
}

const A2_SPECS: A2Spec[] = [
  {
    lessonNumber: 1,
    title: 'Past Events with Passé Composé (Intro)',
    focus: 'Describing recent past events',
    outcomes: ['Describe one past event', 'Use common past helpers', 'Understand basic past-tense messages'],
    vocabularyTargets: ['hier', 'ce matin', 'j’ai', 'j’ai fait', 'visité'],
    grammarTargets: ['Passé composé intro with avoir'],
    sampleTeach: ['Hier, j’ai visité la banque.', 'Ce matin, j’ai pris le bus.'],
    mcqPrompt: 'Choose the sentence describing a completed past action.',
    mcqOptions: ['Je vais à la banque.', 'J’ai visité la banque.', 'Je visite demain.', 'Je voudrais visiter.'],
    mcqCorrect: 1,
    mcqWrong: 'Passé composé often uses ai/as/a + past participle for a completed action.',
    shortPrompt: 'Type the helper verb used in "j’ai visité".',
    shortAnswers: ['ai'],
    productionMode: 'written',
    productionPrompt: 'Write 3 short sentences about what you did yesterday.',
    productionExpected: ["j'ai", 'hier'],
    productionSample: "Hier, j'ai travaillé. J'ai pris le bus. J'ai étudié le soir.",
    testPrompt: 'Which sentence is the best past-tense report?',
    testOptions: ['Hier, je travaille.', "Hier, j'ai travaillé.", 'Demain, j’ai travaillé.', 'Je voudrais travaillé.'],
    testCorrect: 1,
    testWrong: 'Use a clear past-time marker + passé composé.',
    writingPrompt: 'Write a short message (2-3 lines) about your day yesterday.',
    writingExpected: ['hier', "j'ai"],
    writingSample: "Hier, j'ai travaillé jusqu'à 17h. Ensuite, j'ai fait des courses."
  },
  {
    lessonNumber: 2,
    title: 'Future Plans and Intentions',
    focus: 'Near future (aller + infinitif)',
    outcomes: ['Express simple future plans', 'Talk about appointments/plans', 'Understand intention statements'],
    vocabularyTargets: ['demain', 'ce soir', 'je vais', 'nous allons', 'rendez-vous'],
    grammarTargets: ['Aller + infinitif'],
    sampleTeach: ['Demain, je vais appeler la clinique.', 'Nous allons visiter un appartement.'],
    mcqPrompt: 'Choose the sentence expressing a future plan.',
    mcqOptions: ['Je vais appeler la clinique demain.', "J'ai appelé la clinique.", 'Je veux clinique.', 'Clinique bonjour.'],
    mcqCorrect: 0,
    mcqWrong: 'Use aller + infinitif to express near future plans.',
    shortPrompt: 'Type the infinitive in: Je vais travailler.',
    shortAnswers: ['travailler'],
    productionMode: 'spoken',
    productionPrompt: 'Say 2-3 future plans for tomorrow.',
    productionExpected: ['demain', 'je vais'],
    productionSample: 'Demain, je vais travailler et je vais étudier.',
    testPrompt: 'Which sentence is the best near-future form?',
    testOptions: ['Je vais prendre le bus.', 'Je prends le bus hier.', "J'ai va prendre le bus.", 'Je prends demain bus.'],
    testCorrect: 0,
    testWrong: 'Near future = aller + infinitif.',
    writingPrompt: 'Write a short plan for tomorrow (2-3 lines).',
    writingExpected: ['demain', 'je vais'],
    writingSample: 'Demain, je vais aller au cours. Ensuite, je vais faire des exercices.'
  },
  {
    lessonNumber: 3,
    title: 'Modal Verbs for Daily Needs',
    focus: 'Pouvoir, devoir, vouloir in practical contexts',
    outcomes: ['Express need, ability, and desire', 'Make practical requests', 'Understand modal-based messages'],
    vocabularyTargets: ['pouvoir', 'devoir', 'vouloir', 'aide', 'document'],
    grammarTargets: ['Modal verbs in simple present'],
    sampleTeach: ['Je peux venir demain.', 'Je dois envoyer le document.', 'Je veux un rendez-vous.'],
    mcqPrompt: 'Choose the best sentence expressing obligation.',
    mcqOptions: ['Je peux envoyer le document.', 'Je dois envoyer le document.', 'Je veux document.', 'Je suis envoyer.'],
    mcqCorrect: 1,
    mcqWrong: 'Devoir expresses obligation: je dois...',
    shortPrompt: 'Type the verb that means "to be able to".',
    shortAnswers: ['pouvoir'],
    productionMode: 'mixed',
    productionPrompt: 'Ask for help and explain one thing you need to do today.',
    productionExpected: ['je dois', 'je peux'],
    productionSample: "Bonjour, je peux avoir de l'aide ? Je dois remplir ce formulaire aujourd'hui.",
    testPrompt: 'Which sentence is the clearest practical request?',
    testOptions: ['Je veux aide.', "Je voudrais de l'aide, s'il vous plaît.", 'Aide document pouvoir.', 'Je suis besoin aide.'],
    testCorrect: 1,
    testWrong: 'Use a polite request structure with modal meaning.',
    writingPrompt: 'Write a short message about what you can do and what you must do today.',
    writingExpected: ['je peux', 'je dois'],
    writingSample: "Aujourd'hui, je peux aller à la banque, mais je dois travailler d'abord."
  },
  {
    lessonNumber: 4,
    title: 'Comparisons and Choices',
    focus: 'Comparatives for daily decisions',
    outcomes: ['Compare two options', 'Give a simple reason', 'Use basic comparative forms'],
    vocabularyTargets: ['plus', 'moins', 'aussi', 'cher', 'rapide'],
    grammarTargets: ['Comparatives'],
    sampleTeach: ['Le bus est plus rapide que le métro.', 'Cet appartement est moins cher.'],
    mcqPrompt: 'Choose the correct comparative sentence.',
    mcqOptions: ['Le bus est plus rapide que le métro.', 'Le bus est rapide plus.', 'Plus le bus rapide.', 'Le bus que métro plus.'],
    mcqCorrect: 0,
    mcqWrong: 'Use plus/moins + adjective + que.',
    shortPrompt: 'Type the word used for "more" in a comparison.',
    shortAnswers: ['plus'],
    productionMode: 'spoken',
    productionPrompt: 'Compare two options (transport, apartment, or schedule) and give one reason.',
    productionExpected: ['plus', 'que'],
    productionSample: 'Le bus est plus rapide que le train, parce que il est direct.',
    testPrompt: 'Which sentence compares price correctly?',
    testOptions: ['Cet appartement est moins cher.', 'Cet appartement moins est cher.', 'Appartement est cher moins.', 'Moins appartement cher.'],
    testCorrect: 0,
    testWrong: 'Use moins + adjective in correct order.',
    writingPrompt: 'Write 2-3 lines comparing two choices (home, transport, or class schedule).',
    writingExpected: ['plus', 'que'],
    writingSample: 'Le cours du matin est plus pratique que le cours du soir pour moi.'
  },
  {
    lessonNumber: 5,
    title: 'Service Problem Reporting',
    focus: 'Explain a simple problem and ask for help',
    outcomes: ['Describe a problem briefly', 'Ask for help politely', 'Understand service responses'],
    vocabularyTargets: ['problème', 'carte', 'ne marche pas', 'aide', 'service'],
    grammarTargets: ['Simple problem statements', 'Negation reinforcement'],
    sampleTeach: ['Ma carte ne marche pas.', "J'ai un problème avec mon compte."],
    mcqPrompt: 'Choose the best sentence to report a problem.',
    mcqOptions: ["J'ai un problème avec ma carte.", 'Bonjour merci au revoir.', 'Je suis carte problème.', 'Carte bonjour.'],
    mcqCorrect: 0,
    mcqWrong: 'Use j’ai un problème avec... to report a problem clearly.',
    shortPrompt: 'Type the French word for problem.',
    shortAnswers: ['problème', 'probleme'],
    productionMode: 'mixed',
    productionPrompt: 'Explain one service problem and ask for help politely.',
    productionExpected: ['problème', 'aide'],
    productionSample: "Bonjour, j'ai un problème avec ma carte. Pouvez-vous m'aider, s'il vous plaît ?",
    testPrompt: 'Which line is the best help request after a problem statement?',
    testOptions: ['Merci au revoir.', "Pouvez-vous m'aider, s'il vous plaît ?", 'Je suis aide.', 'Problème vous.'],
    testCorrect: 1,
    testWrong: 'Use a polite request: Pouvez-vous m’aider... ?',
    writingPrompt: 'Write a short message reporting a service problem and asking for help.',
    writingExpected: ['problème', 'aide'],
    writingSample: "Bonjour, j'ai un problème avec mon rendez-vous. Pouvez-vous m'aider ?"
  },
  {
    lessonNumber: 6,
    title: 'Housing and Landlord Messages',
    focus: 'Renting and housing communication',
    outcomes: ['Describe a housing issue', 'Contact a landlord', 'Request a repair/response'],
    vocabularyTargets: ['appartement', 'propriétaire', 'chauffage', 'réparer', 'fuite'],
    grammarTargets: ['Practical housing vocabulary in simple present/past'],
    sampleTeach: ["Le chauffage ne marche pas dans l'appartement.", "Je dois contacter le propriétaire."],
    mcqPrompt: 'Choose the best message about a housing problem.',
    mcqOptions: ["Le chauffage ne marche pas.", 'Bonjour appartement merci.', 'Je suis chauffage.', 'Réparer propriétaire bonjour.'],
    mcqCorrect: 0,
    mcqWrong: 'Use a clear subject + problem statement.',
    shortPrompt: 'Type the French word for landlord/owner.',
    shortAnswers: ['propriétaire', 'proprietaire'],
    productionMode: 'written',
    productionPrompt: 'Write a short message to a landlord about a problem in the apartment.',
    productionExpected: ['appartement', 'problème'],
    productionSample: "Bonjour, j'ai un problème dans l'appartement. Le chauffage ne marche pas.",
    testPrompt: 'Which is a clear repair request?',
    testOptions: ['Pouvez-vous réparer le chauffage ?', 'Chauffage réparer vous.', 'Je suis réparer chauffage.', 'Merci chauffage.'],
    testCorrect: 0,
    testWrong: 'Use pouvez-vous + infinitif for a clear request.',
    writingPrompt: 'Write a 2-3 line landlord message (problem + request).',
    writingExpected: ['chauffage', 'pouvez-vous'],
    writingSample: 'Bonjour, le chauffage ne marche pas. Pouvez-vous venir cette semaine ?'
  },
  {
    lessonNumber: 7,
    title: 'Healthcare and Pharmacy',
    focus: 'Basic healthcare communication',
    outcomes: ['Describe a simple symptom', 'Ask for a pharmacy item', 'Understand a simple instruction'],
    vocabularyTargets: ['mal', 'fièvre', 'pharmacie', 'médicament', 'ordonnance'],
    grammarTargets: ['Simple symptom statements'],
    sampleTeach: ["J'ai mal à la tête.", "Je cherche un médicament pour la toux."],
    mcqPrompt: 'Choose the sentence describing a symptom.',
    mcqOptions: ["J'ai mal à la tête.", 'Je m’appelle pharmacie.', 'Bonjour médicament merci.', 'Où problème prix.'],
    mcqCorrect: 0,
    mcqWrong: 'Use avoir mal à... for common symptoms.',
    shortPrompt: 'Type the French word for pharmacy.',
    shortAnswers: ['pharmacie'],
    productionMode: 'spoken',
    productionPrompt: 'Describe one symptom and ask for help at a pharmacy.',
    productionExpected: ['j’ai mal', 'pharmacie'],
    productionSample: "Bonjour, j'ai mal à la tête. Je suis à la pharmacie pour un médicament.",
    testPrompt: 'Which line asks for medicine?',
    testOptions: ['Je cherche un médicament.', 'Je suis médicament.', 'Médicament bonjour.', 'Au revoir pharmacie.'],
    testCorrect: 0,
    testWrong: 'Use chercher + item to request what you need.',
    writingPrompt: 'Write a short pharmacy request (symptom + what you need).',
    writingExpected: ['mal', 'médicament'],
    writingSample: "Bonjour, j'ai mal à la gorge. Je cherche un médicament."
  },
  {
    lessonNumber: 8,
    title: 'Work Schedules and Availability',
    focus: 'Discuss work times and availability',
    outcomes: ['Describe schedule', 'State availability', 'Ask to change times'],
    vocabularyTargets: ['horaire', 'disponible', 'quart', 'matin', 'soir'],
    grammarTargets: ['Schedule statements', 'Availability forms'],
    sampleTeach: ['Mon horaire change cette semaine.', 'Je suis disponible le soir.'],
    mcqPrompt: 'Choose the sentence about availability.',
    mcqOptions: ['Je suis disponible jeudi.', 'Je disponible jeudi suis.', 'Disponible je jeudi.', 'Jeudis bonjour disponibilité.'],
    mcqCorrect: 0,
    mcqWrong: 'Use être + disponible + time/day.',
    shortPrompt: 'Type the French word for schedule.',
    shortAnswers: ['horaire'],
    productionMode: 'mixed',
    productionPrompt: 'Explain your availability and request a time change.',
    productionExpected: ['disponible', 'horaire'],
    productionSample: 'Je suis disponible vendredi matin. Est-ce possible de changer mon horaire ?',
    testPrompt: 'Which sentence requests a schedule change politely?',
    testOptions: ['Changer horaire.', 'Je veux changer horaire.', 'Est-ce possible de changer mon horaire ?', 'Horaire possible changer je.'],
    testCorrect: 2,
    testWrong: 'Use est-ce possible... for a polite request.',
    writingPrompt: 'Write a short work message about availability and a schedule change request.',
    writingExpected: ['disponible', 'horaire'],
    writingSample: "Bonjour, je suis disponible mardi soir. Est-ce possible de changer mon horaire ?"
  },
  {
    lessonNumber: 9,
    title: 'Community and Government Services',
    focus: 'Ask for help in public service contexts',
    outcomes: ['Ask where to go', 'Describe what service you need', 'Understand service desk guidance'],
    vocabularyTargets: ['service', 'bureau', 'document', 'formulaire', 'aide'],
    grammarTargets: ['Practical service-desk questions'],
    sampleTeach: ['Je cherche le bureau des services.', "J'ai besoin d'aide pour ce formulaire."],
    mcqPrompt: 'Choose the sentence that explains a service need.',
    mcqOptions: ["J'ai besoin d'aide pour ce formulaire.", 'Bonjour formulaire merci.', 'Je suis document.', 'Service où bonjour merci.'],
    mcqCorrect: 0,
    mcqWrong: 'Use j’ai besoin de... to explain what help you need.',
    shortPrompt: 'Type the French word for form.',
    shortAnswers: ['formulaire'],
    productionMode: 'spoken',
    productionPrompt: 'Ask for help at a service office and explain what document/form you need.',
    productionExpected: ['aide', 'formulaire'],
    productionSample: "Bonjour, j'ai besoin d'aide pour ce formulaire. Où est le bon bureau ?",
    testPrompt: 'Which line asks where to go?',
    testOptions: ['Où est le bon bureau ?', 'Bonjour merci bureau.', 'Je suis bureau.', 'Bureau formulaire aide.'],
    testCorrect: 0,
    testWrong: 'Use Où est... ? for location/help desk navigation.',
    writingPrompt: 'Write a short message/request for help with a government or community form.',
    writingExpected: ['formulaire', 'aide'],
    writingSample: "Bonjour, j'ai besoin d'aide pour ce formulaire. Merci."
  },
  {
    lessonNumber: 10,
    title: 'Voicemail and Short Message Understanding',
    focus: 'Understand and respond to short service messages',
    outcomes: ['Identify main message purpose', 'Capture time/date details', 'Write a response message'],
    vocabularyTargets: ['message', 'rappel', 'confirmé', 'annuler', 'reporter'],
    grammarTargets: ['Short message response patterns'],
    sampleTeach: ['Votre rendez-vous est confirmé pour jeudi.', 'Veuillez rappeler demain matin.'],
    mcqPrompt: 'Choose the main meaning: "Votre rendez-vous est confirmé."',
    mcqOptions: ['Your appointment is cancelled', 'Your appointment is confirmed', 'You must pay today', 'You are late'],
    mcqCorrect: 1,
    mcqWrong: 'confirmé means confirmed.',
    shortPrompt: 'Type the French verb meaning "to cancel" (infinitive).',
    shortAnswers: ['annuler'],
    productionMode: 'written',
    productionPrompt: 'Write a short response to confirm or reschedule an appointment.',
    productionExpected: ['rendez-vous'],
    productionSample: 'Bonjour, je confirme mon rendez-vous de jeudi. Merci.',
    testPrompt: 'Which is a good callback response?',
    testOptions: ['Je confirme le rendez-vous.', 'Bonjour problème merci.', 'Rendez-vous bureau où ?', 'Je suis confirmé.'],
    testCorrect: 0,
    testWrong: 'A clear confirmation is a good A2 response.',
    writingPrompt: 'Write a short appointment reply (confirm or reschedule) with one detail.',
    writingExpected: ['rendez-vous', 'jeudi'],
    writingSample: "Bonjour, je confirme mon rendez-vous de jeudi à 14h."
  },
  {
    lessonNumber: 11,
    title: 'A2 Functional Email Writing',
    focus: 'Short practical emails (request/reschedule/explain)',
    outcomes: ['Write short practical emails', 'State purpose clearly', 'Add relevant details'],
    vocabularyTargets: ['bonjour', 'je vous écris', 'demande', 'rendez-vous', 'merci'],
    grammarTargets: ['Email openings and purpose statements'],
    sampleTeach: ['Bonjour, je vous écris pour demander un rendez-vous.', 'Merci pour votre aide.'],
    mcqPrompt: 'Choose the best opening for a practical email.',
    mcqOptions: ['Salut ça va', 'Bonjour, je vous écris pour...', 'Je suis email bonjour', 'Où rendez-vous email'],
    mcqCorrect: 1,
    mcqWrong: 'Use a clear formal opening for practical requests.',
    shortPrompt: 'Type the phrase that means "I am writing to you".',
    shortAnswers: ['je vous écris', 'je vous ecris'],
    productionMode: 'written',
    productionPrompt: 'Write a short email to request or reschedule an appointment (3-4 lines).',
    productionExpected: ['bonjour', 'rendez-vous', 'merci'],
    productionSample: "Bonjour, je vous écris pour demander un rendez-vous la semaine prochaine. Merci.",
    testPrompt: 'Which line clearly states email purpose?',
    testOptions: ['Je vous écris pour demander un rendez-vous.', 'Bonjour merci au revoir.', 'Je suis rendez-vous.', 'Demande bureau formulaire.'],
    testCorrect: 0,
    testWrong: 'State the purpose directly in the first line.',
    writingPrompt: 'Write a short practical email (request/reschedule/explain) with greeting and closing.',
    writingExpected: ['bonjour', 'merci'],
    writingSample: "Bonjour, je vous écris pour reporter mon rendez-vous. Merci de votre aide."
  },
  {
    lessonNumber: 12,
    title: 'A2 Integration and CLB 5 Bridge Check',
    focus: 'Integrated practical communication',
    outcomes: ['Combine listening, speaking, and writing for practical tasks', 'Perform an A2 benchmark-style session', 'Identify weak skill before CLB5 bridge'],
    vocabularyTargets: ['rendez-vous', 'horaire', 'problème', 'formulaire', 'aide'],
    grammarTargets: ['Integrated A2 functional patterns'],
    sampleTeach: ['A2 success = clear purpose + key details + polite language.', 'You do not need perfect grammar to complete the task.'],
    mcqPrompt: 'Choose the strongest A2 practical response.',
    mcqOptions: [
      "Bonjour, j'ai un problème avec mon rendez-vous. Pouvez-vous m'aider ?",
      'Bonjour merci au revoir',
      'Je suis problème rendez-vous',
      'Où formulaire prix'
    ],
    mcqCorrect: 0,
    mcqWrong: 'Best A2 responses include purpose + key detail + polite request.',
    shortPrompt: 'Type one key A2 practical noun you studied (appointment / problem / form).',
    shortAnswers: ['rendez-vous', 'probleme', 'problème', 'formulaire'],
    productionMode: 'mixed',
    productionPrompt: 'Complete a practical scenario: explain a problem, ask for help, and give one detail (time/day/document).',
    productionExpected: ['problème', 'aide'],
    productionSample: "Bonjour, j'ai un problème avec mon rendez-vous. Pouvez-vous m'aider ? Je suis disponible demain matin.",
    testPrompt: 'Which response is most complete for A2 practical communication?',
    testOptions: [
      "Bonjour, j'ai besoin d'aide pour ce formulaire.",
      'Formulaire aide.',
      'Bonjour merci.',
      'Où rendez-vous.'
    ],
    testCorrect: 0,
    testWrong: 'A complete A2 response names the issue and the need.',
    writingPrompt: 'Write a short practical message (3-4 lines) explaining a problem and requesting help.',
    writingExpected: ['problème', 'aide'],
    writingSample: "Bonjour, j'ai un problème avec mon horaire. J'ai besoin d'aide pour changer mon rendez-vous."
  }
];

const A2_GENERATED_TOPICS: Array<{
  title: string;
  focus: string;
  outcomes: string[];
  vocabularyTargets: string[];
  grammarTargets: string[];
  sampleTeach: string[];
  productionMode: 'spoken' | 'written' | 'mixed';
  productionPrompt: string;
  productionExpected: string[];
  productionSample: string;
  writingPrompt: string;
  writingExpected: string[];
  writingSample: string;
}> = [
  {
    title: 'Transit Delays and Commute Updates',
    focus: 'Explain delays and update schedules',
    outcomes: ['Report a delay clearly', 'Provide one timing detail', 'Request support or confirmation'],
    vocabularyTargets: ['retard', 'bus', 'métro', 'arriver', 'horaire'],
    grammarTargets: ['Passé composé + time markers'],
    sampleTeach: ['Le bus a eu un retard de vingt minutes.', "J'ai appelé mon travail pour prévenir."],
    productionMode: 'mixed',
    productionPrompt: 'Explain a transit delay and how you adapted your plan.',
    productionExpected: ['retard', "j'ai"],
    productionSample: "Ce matin, le bus a eu un retard. J'ai envoyé un message à mon superviseur.",
    writingPrompt: 'Write a short update to your supervisor about a commute delay.',
    writingExpected: ['retard', 'horaire'],
    writingSample: "Bonjour, j'ai eu un retard de bus ce matin. Je vais arriver à 9h20."
  },
  {
    title: 'School Communication with Teachers',
    focus: 'Ask questions and explain absences politely',
    outcomes: ['Write a short school message', 'Explain absence reason', 'Ask for next steps'],
    vocabularyTargets: ['professeur', 'cours', 'absence', 'devoir', 'demander'],
    grammarTargets: ['Polite requests with vouloir/pouvoir'],
    sampleTeach: ["Je voudrais expliquer mon absence d'hier.", 'Pouvez-vous partager les devoirs du cours ?'],
    productionMode: 'written',
    productionPrompt: 'Write a short message to a teacher about an absence and homework request.',
    productionExpected: ['absence', 'devoirs'],
    productionSample: "Bonjour, j'ai été absent hier. Pouvez-vous m'envoyer les devoirs du cours ?",
    writingPrompt: 'Write a 3-4 line school follow-up message.',
    writingExpected: ['bonjour', 'merci'],
    writingSample: "Bonjour Madame, j'ai été absent mardi. Je voudrais savoir les devoirs à faire. Merci."
  },
  {
    title: 'Banking and Bill Payment Questions',
    focus: 'Handle routine banking communication',
    outcomes: ['Ask about payment status', 'Explain an account issue', 'Confirm next action'],
    vocabularyTargets: ['compte', 'facture', 'paiement', 'vérifier', 'service client'],
    grammarTargets: ['Question forms and practical connectors'],
    sampleTeach: ['Je veux vérifier le paiement de ma facture.', "J'ai un problème avec mon compte."],
    productionMode: 'spoken',
    productionPrompt: 'Call customer service and explain a billing question.',
    productionExpected: ['facture', 'paiement'],
    productionSample: "Bonjour, je veux vérifier le paiement de ma facture d'électricité.",
    writingPrompt: 'Write a short service request about a payment issue.',
    writingExpected: ['compte', 'problème'],
    writingSample: "Bonjour, j'ai un problème avec mon compte. Je ne vois pas mon paiement."
  },
  {
    title: 'Family Appointments and Scheduling',
    focus: 'Coordinate family appointments',
    outcomes: ['Describe appointment needs', 'Ask for available times', 'Confirm schedule choices'],
    vocabularyTargets: ['enfant', 'rendez-vous', 'disponible', 'semaine', 'confirmer'],
    grammarTargets: ['Near future and time expressions'],
    sampleTeach: ['Je vais prendre un rendez-vous pour mon enfant.', 'Je suis disponible mardi après-midi.'],
    productionMode: 'mixed',
    productionPrompt: 'Ask for a family appointment and propose two time options.',
    productionExpected: ['rendez-vous', 'disponible'],
    productionSample: 'Bonjour, je veux un rendez-vous pour mon enfant. Je suis disponible mardi ou jeudi.',
    writingPrompt: 'Write a short appointment request for a family member.',
    writingExpected: ['mardi', 'jeudi'],
    writingSample: "Bonjour, je demande un rendez-vous pour ma fille. Je suis disponible mardi ou jeudi matin."
  },
  {
    title: 'Community Events and Volunteer Sign-Up',
    focus: 'Participate in local activities',
    outcomes: ['Ask for event details', 'Express interest', 'Confirm participation'],
    vocabularyTargets: ['événement', 'communauté', 'bénévole', 'inscription', 'participer'],
    grammarTargets: ['Modal verbs for intention and ability'],
    sampleTeach: ["Je veux participer à l'événement communautaire.", 'Je peux être bénévole samedi matin.'],
    productionMode: 'spoken',
    productionPrompt: 'Introduce yourself and volunteer for a community event.',
    productionExpected: ['participer', 'bénévole'],
    productionSample: "Bonjour, je veux participer à l'événement. Je peux être bénévole samedi.",
    writingPrompt: 'Write a short volunteer sign-up message.',
    writingExpected: ['bonjour', 'participer'],
    writingSample: "Bonjour, je voudrais participer comme bénévole à l'événement de dimanche."
  },
  {
    title: 'Weather Alerts and Daily Decisions',
    focus: 'Understand weather impact and plan changes',
    outcomes: ['Interpret weather alerts', 'Adjust plans', 'Inform others clearly'],
    vocabularyTargets: ['neige', 'tempête', 'annuler', 'reporter', 'sécurité'],
    grammarTargets: ['Cause and consequence with parce que/donc'],
    sampleTeach: ["Il y a une tempête, donc je vais reporter le rendez-vous.", 'Je reste à la maison pour la sécurité.'],
    productionMode: 'written',
    productionPrompt: 'Write a short weather-related schedule change message.',
    productionExpected: ['tempête', 'reporter'],
    productionSample: "Bonjour, il y a une tempête aujourd'hui, donc je dois reporter notre rendez-vous.",
    writingPrompt: 'Write a practical weather update to a classmate or coworker.',
    writingExpected: ['neige', 'sécurité'],
    writingSample: 'Il neige beaucoup aujourd’hui. Je vais partir plus tôt pour la sécurité.'
  },
  {
    title: 'Doctor Follow-Up and Instructions',
    focus: 'Clarify medical instructions',
    outcomes: ['Ask follow-up questions', 'Confirm understanding', 'Explain next steps'],
    vocabularyTargets: ['ordonnance', 'dose', 'suivi', 'question', 'clarifier'],
    grammarTargets: ['Question patterns for clarification'],
    sampleTeach: ['Je veux clarifier la dose du médicament.', 'Pouvez-vous répéter les instructions ?'],
    productionMode: 'mixed',
    productionPrompt: 'Ask follow-up questions after a clinic visit.',
    productionExpected: ['ordonnance', 'instructions'],
    productionSample: "J'ai une question sur l'ordonnance. Pouvez-vous expliquer les instructions encore ?",
    writingPrompt: 'Write a short follow-up message to a clinic.',
    writingExpected: ['question', 'suivi'],
    writingSample: "Bonjour, j'ai une question sur mon suivi. Pouvez-vous confirmer la prochaine date ?"
  },
  {
    title: 'Workplace Team Communication',
    focus: 'Share updates and coordinate tasks',
    outcomes: ['Give concise updates', 'Ask for clarification', 'Confirm responsibilities'],
    vocabularyTargets: ['équipe', 'tâche', 'responsable', 'mettre à jour', 'priorité'],
    grammarTargets: ['Simple sequencing with ensuite/puis'],
    sampleTeach: ["J'ai terminé la première tâche, ensuite je commence la deuxième.", 'Quelle est la priorité pour ce soir ?'],
    productionMode: 'spoken',
    productionPrompt: 'Give a brief team update and ask one clarification question.',
    productionExpected: ['équipe', 'priorité'],
    productionSample: "Bonjour équipe, j'ai terminé le rapport. Quelle est la prochaine priorité ?",
    writingPrompt: 'Write a short work update with one question.',
    writingExpected: ['tâche', 'question'],
    writingSample: "J'ai fini la tâche A. Est-ce que je commence la tâche B maintenant ?"
  },
  {
    title: 'Renting and Lease Clarification',
    focus: 'Discuss rent, lease dates, and apartment conditions',
    outcomes: ['Ask clear housing questions', 'Confirm lease details', 'Report one apartment issue politely'],
    vocabularyTargets: ['loyer', 'bail', 'appartement', 'réparation', 'propriétaire'],
    grammarTargets: ['Question frames with est-ce que', 'Polite requests'],
    sampleTeach: ['Est-ce que le loyer inclut le chauffage ?', "J'ai une question sur le bail."],
    productionMode: 'mixed',
    productionPrompt: 'Speak or write a short message to clarify one lease detail and one repair need.',
    productionExpected: ['loyer', 'bail'],
    productionSample: "Bonjour, j'ai une question sur le bail. Est-ce que le loyer inclut l'eau chaude ?",
    writingPrompt: 'Write a short landlord message about a housing issue.',
    writingExpected: ['réparation', 'appartement'],
    writingSample: "Bonjour, j'ai un problème dans l'appartement. Pouvez-vous faire une réparation cette semaine ?"
  },
  {
    title: 'Parent-Teacher Meeting Preparation',
    focus: 'Describe child progress and ask school questions',
    outcomes: ['Share one concern', 'Ask one follow-up question', 'Confirm next school step'],
    vocabularyTargets: ['enfant', 'école', 'progrès', 'devoirs', 'rencontre'],
    grammarTargets: ['Simple past + present detail mix'],
    sampleTeach: ['Mon enfant a eu des difficultés en lecture.', 'Quels devoirs faut-il faire cette semaine ?'],
    productionMode: 'spoken',
    productionPrompt: 'Prepare a short parent-teacher conversation with one concern and one question.',
    productionExpected: ['enfant', 'devoirs'],
    productionSample: "Bonjour, mon enfant a eu des difficultés en classe. Quels devoirs faut-il faire cette semaine ?",
    writingPrompt: 'Write a short message to the teacher before a meeting.',
    writingExpected: ['rencontre', 'école'],
    writingSample: "Bonjour, je veux confirmer la rencontre à l'école demain. J'ai une question sur les devoirs."
  },
  {
    title: 'Service Canada Document Follow-Up',
    focus: 'Ask about document status and next steps',
    outcomes: ['State request clearly', 'Provide one document detail', 'Ask about processing time'],
    vocabularyTargets: ['document', 'demande', 'traitement', 'numéro', 'statut'],
    grammarTargets: ['Functional information requests'],
    sampleTeach: ['Je veux vérifier le statut de ma demande.', 'Quel est le délai de traitement ?'],
    productionMode: 'written',
    productionPrompt: 'Write a short follow-up message about an immigration-related document.',
    productionExpected: ['statut', 'demande'],
    productionSample: "Bonjour, je veux vérifier le statut de ma demande. Mon numéro est 12345.",
    writingPrompt: 'Write a practical 3-line status request with one identifier.',
    writingExpected: ['numéro', 'document'],
    writingSample: "Bonjour, je demande une mise à jour sur mon document. Mon numéro de dossier est A-12345."
  },
  {
    title: 'Phone Calls and Voicemail Responses',
    focus: 'Understand voicemail purpose and respond clearly',
    outcomes: ['Identify key callback information', 'Leave a short message', 'Confirm availability'],
    vocabularyTargets: ['message', 'rappeler', 'disponible', 'numéro', 'voix'],
    grammarTargets: ['Near future for callbacks'],
    sampleTeach: ['Veuillez rappeler demain matin.', 'Je suis disponible après 15h.'],
    productionMode: 'spoken',
    productionPrompt: 'Record a short callback message with your availability.',
    productionExpected: ['rappeler', 'disponible'],
    productionSample: 'Bonjour, merci pour votre message. Je suis disponible demain après-midi pour rappeler.',
    writingPrompt: 'Write a short callback note from a voicemail.',
    writingExpected: ['message', 'numéro'],
    writingSample: "J'ai reçu votre message. Je vais rappeler au numéro indiqué demain matin."
  },
  {
    title: 'Grocery and Budget Planning',
    focus: 'Plan shopping with price comparison and quantities',
    outcomes: ['Ask price and quantity questions', 'Compare options', 'State a simple budget choice'],
    vocabularyTargets: ['prix', 'quantité', 'moins cher', 'budget', 'marché'],
    grammarTargets: ['Comparatives and practical number phrases'],
    sampleTeach: ['Ce produit est moins cher que celui-là.', 'Je prends deux kilos de pommes.'],
    productionMode: 'mixed',
    productionPrompt: 'Explain a simple shopping choice based on price and quantity.',
    productionExpected: ['moins cher', 'quantité'],
    productionSample: 'Je prends ce produit parce qu’il est moins cher et la quantité est suffisante.',
    writingPrompt: 'Write a short grocery list note with one comparison.',
    writingExpected: ['prix', 'budget'],
    writingSample: 'Je choisis le riz en promotion pour respecter mon budget cette semaine.'
  },
  {
    title: 'Clinic Appointment Changes',
    focus: 'Reschedule a medical appointment politely',
    outcomes: ['Explain why you need to reschedule', 'Propose new time options', 'Confirm response needed'],
    vocabularyTargets: ['reporter', 'rendez-vous', 'disponibilité', 'urgence', 'date'],
    grammarTargets: ['Cause + request structure'],
    sampleTeach: ['Je dois reporter mon rendez-vous pour une urgence.', 'Avez-vous une disponibilité mardi ?'],
    productionMode: 'written',
    productionPrompt: 'Write a short clinic message to reschedule and propose two options.',
    productionExpected: ['reporter', 'disponibilité'],
    productionSample: "Bonjour, je dois reporter mon rendez-vous. Avez-vous une disponibilité mardi ou mercredi ?",
    writingPrompt: 'Write a practical rescheduling request.',
    writingExpected: ['rendez-vous', 'date'],
    writingSample: "Bonjour, je veux changer la date du rendez-vous. Je suis disponible jeudi matin."
  },
  {
    title: 'Work Shift Swap Requests',
    focus: 'Request shift change with clear reason and timing',
    outcomes: ['State schedule conflict', 'Request a shift swap politely', 'Confirm final schedule'],
    vocabularyTargets: ['quart', 'horaire', 'échanger', 'disponible', 'confirmation'],
    grammarTargets: ['Polite workplace requests'],
    sampleTeach: ['Je voudrais échanger mon quart de vendredi.', 'Je suis disponible samedi matin.'],
    productionMode: 'spoken',
    productionPrompt: 'Make a short spoken shift-swap request to a supervisor.',
    productionExpected: ['quart', 'échanger'],
    productionSample: "Bonjour, je voudrais échanger mon quart de vendredi. Je suis disponible samedi matin.",
    writingPrompt: 'Write a short schedule-change request to your manager.',
    writingExpected: ['horaire', 'confirmation'],
    writingSample: 'Bonjour, je demande un changement d’horaire. Pouvez-vous confirmer mon nouveau quart ?'
  },
  {
    title: 'Bank Appointment Confirmation',
    focus: 'Confirm banking meeting and required documents',
    outcomes: ['Confirm appointment details', 'Ask about required documents', 'Restate next action'],
    vocabularyTargets: ['banque', 'confirmation', 'pièce d’identité', 'apporter', 'rendez-vous'],
    grammarTargets: ['Question + confirmation pattern'],
    sampleTeach: ['Je confirme mon rendez-vous à la banque.', "Quelles pièces d'identité dois-je apporter ?"],
    productionMode: 'mixed',
    productionPrompt: 'Confirm a bank appointment and ask one document question.',
    productionExpected: ['confirmation', 'pièce d’identité'],
    productionSample: "Bonjour, je confirme mon rendez-vous demain. Quelles pièces d'identité dois-je apporter ?",
    writingPrompt: 'Write a short confirmation email to a bank office.',
    writingExpected: ['banque', 'rendez-vous'],
    writingSample: 'Bonjour, je confirme mon rendez-vous à la banque mardi à 10h.'
  }
];

function normalizeTokenForShortAnswer(token: string): string {
  return token
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '');
}

function buildA2GeneratedMcqOptions(topic: (typeof A2_GENERATED_TOPICS)[number]): [string, string, string, string] {
  const correct = topic.sampleTeach[0] ?? "J'ai besoin d'aide.";
  const keywordA = topic.vocabularyTargets[0] ?? 'mot';
  const keywordB = topic.vocabularyTargets[1] ?? 'mot';
  return [correct, 'Bonjour, merci. Au revoir.', `${keywordA}, ${keywordB}.`, `Je suis ${keywordA}.`];
}

function buildA2GeneratedTestOptions(topic: (typeof A2_GENERATED_TOPICS)[number]): [string, string, string, string] {
  const combined = `${topic.sampleTeach[0] ?? ''} ${topic.sampleTeach[1] ?? ''}`.trim() || "J'ai besoin d'aide.";
  const keywordA = topic.vocabularyTargets[0] ?? 'mot';
  return [combined, 'Merci.', `${keywordA}.`, `Je veux aide.`];
}

function buildA2GeneratedShortAnswers(topic: (typeof A2_GENERATED_TOPICS)[number]): string[] {
  const base = topic.vocabularyTargets.slice(0, 4).map((item) => item.toLowerCase());
  const normalized = base.map(normalizeTokenForShortAnswer);
  return Array.from(new Set([...base, ...normalized]));
}

function makeGeneratedA2Spec(lessonNumber: number, topicIndex: number): A2Spec {
  const topic = A2_GENERATED_TOPICS[topicIndex % A2_GENERATED_TOPICS.length];
  return {
    lessonNumber,
    title: topic.title,
    focus: topic.focus,
    outcomes: topic.outcomes,
    vocabularyTargets: topic.vocabularyTargets,
    grammarTargets: topic.grammarTargets,
    sampleTeach: topic.sampleTeach,
    mcqPrompt: `Pick the best A2 sentence for: ${topic.focus.toLowerCase()}.`,
    mcqOptions: buildA2GeneratedMcqOptions(topic),
    mcqCorrect: 0,
    mcqWrong: 'Use a complete practical sentence with clear purpose.',
    shortPrompt: 'Type one key A2 word from this lesson.',
    shortAnswers: buildA2GeneratedShortAnswers(topic),
    productionMode: topic.productionMode,
    productionPrompt: topic.productionPrompt,
    productionExpected: topic.productionExpected,
    productionSample: topic.productionSample,
    testPrompt: 'Which response is the most complete and practical?',
    testOptions: buildA2GeneratedTestOptions(topic),
    testCorrect: 0,
    testWrong: 'At A2, include practical context plus one detail.',
    writingPrompt: topic.writingPrompt,
    writingExpected: topic.writingExpected,
    writingSample: topic.writingSample
  };
}

const A2_ALL_SPECS: A2Spec[] = [
  ...A2_SPECS,
  ...Array.from({ length: 28 }, (_, index) => makeGeneratedA2Spec(index + 13, index))
];

export const a2StructuredLessons: StructuredLessonContent[] = A2_ALL_SPECS.map(makeA2Lesson);
