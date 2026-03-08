import type { DiagnosticQuestion as EngineDiagnosticQuestion, DiagnosticTier } from '../learning/types';

export type DifficultyTier = DiagnosticTier;
export type DiagnosticCategory = 'grammar' | 'vocabulary' | 'reading' | 'listening';

export type DiagnosticQuestion = EngineDiagnosticQuestion;

export const DIAGNOSTIC_FUTURE_SECTIONS: DiagnosticCategory[] = ['listening'];

export const difficultyOrder: DifficultyTier[] = ['A1', 'A2', 'B1', 'B2'];

export const diagnosticQuestionsByDifficulty: Record<DifficultyTier, DiagnosticQuestion[]> = {
  A1: [
    {
      id: 'a1-g1',
      tier: 'A1',
      domain: 'grammar',
      prompt: 'Complete: Je ___ Marie.',
      options: ['suis', 'es', 'est', 'sommes'],
      correctOption: 0
    },
    {
      id: 'a1-v1',
      tier: 'A1',
      domain: 'vocabulary',
      prompt: 'The French word "bonjour" means:',
      options: ['Goodbye', 'Hello', 'Thank you', 'Please'],
      correctOption: 1
    },
    {
      id: 'a1-r1',
      tier: 'A1',
      domain: 'reading',
      passage: 'Lundi: cours de français à 18 h.',
      prompt: 'When is the class?',
      options: ['Monday at 18:00', 'Tuesday at 18:00', 'Monday at 8:00', 'Friday at 18:00'],
      correctOption: 0
    },
    {
      id: 'a1-g2',
      tier: 'A1',
      domain: 'grammar',
      prompt: 'Choose the correct article: ___ livre est sur la table.',
      options: ['Le', 'La', 'Les', 'Unes'],
      correctOption: 0
    },
    {
      id: 'a1-v2',
      tier: 'A1',
      domain: 'vocabulary',
      prompt: 'Select the color: "bleu".',
      options: ['Red', 'Blue', 'Green', 'Black'],
      correctOption: 1
    },
    {
      id: 'a1-g3',
      tier: 'A1',
      domain: 'grammar',
      prompt: 'Choose the correct sentence.',
      options: ['Nous est ici.', 'Tu es à la maison.', 'Je est étudiant.', 'Elles est prêtes.'],
      correctOption: 1
    },
    {
      id: 'a1-v3',
      tier: 'A1',
      domain: 'vocabulary',
      prompt: 'What does "merci" mean?',
      options: ['Please', 'Sorry', 'Thank you', 'Good night'],
      correctOption: 2
    },
    {
      id: 'a1-r2',
      tier: 'A1',
      domain: 'reading',
      passage: 'Je travaille le matin. Le soir, j’étudie le français.',
      prompt: 'When does the person study French?',
      options: ['In the morning', 'At noon', 'In the evening', 'On Monday only'],
      correctOption: 2
    }
  ],
  A2: [
    {
      id: 'a2-g1',
      tier: 'A2',
      domain: 'grammar',
      prompt: 'Complete: Nous ___ au parc ce soir.',
      options: ['allons', 'vais', 'va', 'allez'],
      correctOption: 0
    },
    {
      id: 'a2-v1',
      tier: 'A2',
      domain: 'vocabulary',
      prompt: 'Choose the best word: Je prends le ___ pour aller au travail.',
      options: ['bus', 'bureau', 'repas', 'stylo'],
      correctOption: 0
    },
    {
      id: 'a2-r1',
      tier: 'A2',
      domain: 'reading',
      passage: 'La réunion commence à 9 h. Apportez vos notes et votre badge.',
      prompt: 'What should you bring?',
      options: ['Passport only', 'Notebook and badge', 'Lunch', 'Laptop charger only'],
      correctOption: 1
    },
    {
      id: 'a2-g2',
      tier: 'A2',
      domain: 'grammar',
      prompt: 'Choose the grammatically correct passé composé sentence.',
      options: [
        'Ils ont visité Montréal.',
        'Ils a visité Montréal.',
        'Ils ont visiter Montréal.',
        'Ils visite Montréal.'
      ],
      correctOption: 0
    },
    {
      id: 'a2-v2',
      tier: 'A2',
      domain: 'vocabulary',
      prompt: 'Opposite of "chaud" is:',
      options: ['froid', 'lent', 'petit', 'fort'],
      correctOption: 0
    },
    {
      id: 'a2-g3',
      tier: 'A2',
      domain: 'grammar',
      prompt: 'Complete: Je ___ prendre un rendez-vous demain.',
      options: ['vais', 'va', 'allez', 'allons'],
      correctOption: 0
    },
    {
      id: 'a2-v3',
      tier: 'A2',
      domain: 'vocabulary',
      prompt: 'Choose the best word: Je dois remplir un ___.',
      options: ['formulaire', 'quartier', 'trajet', 'repas'],
      correctOption: 0
    },
    {
      id: 'a2-r2',
      tier: 'A2',
      domain: 'reading',
      passage: 'Bonjour, je ne peux pas venir mardi. Je suis disponible jeudi après-midi.',
      prompt: 'When is the person available?',
      options: ['Tuesday morning', 'Thursday afternoon', 'Wednesday evening', 'Friday afternoon'],
      correctOption: 1
    }
  ],
  B1: [
    {
      id: 'b1-g1',
      tier: 'B1',
      domain: 'grammar',
      prompt: 'Complete: Si j\'avais plus de temps, je ___ plus souvent.',
      options: ['voyage', 'voyagerais', 'voyager', 'voyageais'],
      correctOption: 1
    },
    {
      id: 'b1-v1',
      tier: 'B1',
      domain: 'vocabulary',
      prompt: 'Choose the closest meaning of "soutenir".',
      options: ['abandonner', 'appuyer', 'eviter', 'retarder'],
      correctOption: 1
    },
    {
      id: 'b1-r1',
      tier: 'B1',
      domain: 'reading',
      passage:
        'Le service client répond aux courriels en 48 heures. Pour les demandes urgentes, utilisez le téléphone.',
      prompt: 'What should you do for urgent requests?',
      options: ['Send another email', 'Use the phone', 'Wait 48 hours', 'Visit in person only'],
      correctOption: 1
    },
    {
      id: 'b1-g2',
      tier: 'B1',
      domain: 'grammar',
      prompt: 'Pick the correct form: Bien qu\'il ___ fatigué, il continue.',
      options: ['est', 'soit', 'sera', 'était'],
      correctOption: 1
    },
    {
      id: 'b1-v2',
      tier: 'B1',
      domain: 'vocabulary',
      prompt: 'The term "démarche" is best translated as:',
      options: ['step/process', 'transport', 'housing', 'salary'],
      correctOption: 0
    },
    {
      id: 'b1-g3',
      tier: 'B1',
      domain: 'grammar',
      prompt: 'Choose the best connector: Il pleuvait, ___ nous avons pris le bus.',
      options: ['donc', 'mais', 'où', 'ni'],
      correctOption: 0
    },
    {
      id: 'b1-v3',
      tier: 'B1',
      domain: 'vocabulary',
      prompt: 'Closest meaning of "délai":',
      options: ['deadline/period', 'salary bonus', 'neighborhood', 'passport office'],
      correctOption: 0
    },
    {
      id: 'b1-r2',
      tier: 'B1',
      domain: 'reading',
      passage: 'Le service est fermé le lundi. Pour les urgences, appelez le numéro indiqué sur le site.',
      prompt: 'What should users do in urgent situations?',
      options: ['Wait until Tuesday', 'Visit without appointment', 'Call the listed number', 'Send a letter'],
      correctOption: 2
    }
  ],
  B2: [
    {
      id: 'b2-g1',
      tier: 'B2',
      domain: 'grammar',
      prompt: 'Choose the most appropriate connector: Il a réussi, ___ il avait peu de temps.',
      options: ['parce que', 'donc', 'bien que', 'puisque'],
      correctOption: 2
    },
    {
      id: 'b2-v1',
      tier: 'B2',
      domain: 'vocabulary',
      prompt: 'Select the closest meaning of "pertinent" in context.',
      options: ['irrelevant', 'appropriate', 'delayed', 'mandatory'],
      correctOption: 1
    },
    {
      id: 'b2-r1',
      tier: 'B2',
      domain: 'reading',
      passage:
        'Afin d\'optimiser les services, l\'organisme mettra en œuvre une plateforme numérique permettant un suivi personnalisé des dossiers.',
      prompt: 'What is the main purpose of the new platform?',
      options: [
        'Reduce staff salaries',
        'Provide personalized case tracking',
        'Replace all in-person services',
        'Eliminate client communication'
      ],
      correctOption: 1
    },
    {
      id: 'b2-g2',
      tier: 'B2',
      domain: 'grammar',
      prompt: 'Select the sentence with fully correct agreement and accents.',
      options: [
        'Les mesures prises auraient dû être annoncées plus tôt.',
        'Les mesures pris auraient dû être annoncées plus tôt.',
        'Les mesures prises aurait dû être annoncées plus tôt.',
        'Les mesures prise auraient dû être annoncées plus tôt.'
      ],
      correctOption: 0
    },
    {
      id: 'b2-v2',
      tier: 'B2',
      domain: 'vocabulary',
      prompt: '"Mettre en œuvre" means:',
      options: ['to postpone', 'to implement', 'to summarize', 'to negotiate'],
      correctOption: 1
    },
    {
      id: 'b2-g3',
      tier: 'B2',
      domain: 'grammar',
      prompt: 'Select the most natural formal phrasing.',
      options: [
        'Je veux une réponse tout de suite.',
        'Je vous serais reconnaissant de bien vouloir confirmer ce point.',
        'Répondez rapidement.',
        'Dis-moi ça maintenant.'
      ],
      correctOption: 1
    },
    {
      id: 'b2-v3',
      tier: 'B2',
      domain: 'vocabulary',
      prompt: 'Closest meaning of "enjeu" in professional context:',
      options: ['stake/issue', 'salary slip', 'meeting room', 'transport stop'],
      correctOption: 0
    },
    {
      id: 'b2-r2',
      tier: 'B2',
      domain: 'reading',
      passage:
        'Le rapport recommande une mise en œuvre progressive afin de limiter les risques opérationnels et de garantir une adoption durable.',
      prompt: 'Why is progressive implementation recommended?',
      options: [
        'To reduce operational risk',
        'To avoid documentation',
        'To shorten all training to one day',
        'To replace managers immediately'
      ],
      correctOption: 0
    }
  ]
};
