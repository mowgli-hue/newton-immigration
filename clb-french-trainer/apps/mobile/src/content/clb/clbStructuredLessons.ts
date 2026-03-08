import type { StructuredLessonContent } from '../../types/LessonContentTypes';

type ClbTrack = 'clb5' | 'clb7';

type Topic = {
  title: string;
  focus: string;
  vocabularyTargets: string[];
  grammarTargets: string[];
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
};

const CLB5_TOPICS: Topic[] = [
  {
    title: 'Service Request Calls',
    focus: 'Handle practical service requests under time pressure',
    vocabularyTargets: ['rendez-vous', 'service', 'demande', 'confirmation', 'horaire'],
    grammarTargets: ['Functional requests', 'polite modal forms'],
    scenarioTitle: 'Customer Service Phone Task',
    scenarioExplanation: 'CLB5 needs clear requests with one or two practical details.',
    scenarioExamples: ['Je voudrais confirmer mon rendez-vous de demain matin.'],
    listeningMessage: "Bonjour, je voudrais confirmer mon rendez-vous de demain à 9h30.",
    productionMode: 'spoken',
    productionPrompt: 'Call a service desk and complete a request with date/time details.',
    productionExpected: ['rendez-vous', 'demain'],
    productionSample: "Bonjour, je voudrais confirmer mon rendez-vous de demain matin à 9h30.",
    writingPrompt: 'Write a practical service request message.',
    writingExpected: ['demande', 'horaire'],
    writingSample: "Bonjour, j'ai une demande de changement d'horaire pour mon rendez-vous."
  },
  {
    title: 'Workplace Shift Communication',
    focus: 'Report schedule conflicts and propose solutions',
    vocabularyTargets: ['quart', 'disponible', 'retard', 'équipe', 'solution'],
    grammarTargets: ['Cause + solution patterns'],
    scenarioTitle: 'Shift Adjustment Communication',
    scenarioExplanation: 'CLB5 tasks require actionable communication in workplace settings.',
    scenarioExamples: ['Je serai en retard de 20 minutes, mais je peux rester plus tard.'],
    listeningMessage: "Je serai en retard ce matin, mais je peux rester jusqu'à 18h30.",
    productionMode: 'mixed',
    productionPrompt: 'Explain a shift issue and propose one practical solution.',
    productionExpected: ['retard', 'solution'],
    productionSample: "Je serai en retard à cause du transport. Je peux rester plus tard pour compenser.",
    writingPrompt: 'Write a short workplace schedule update.',
    writingExpected: ['quart', 'disponible'],
    writingSample: "Je suis disponible samedi matin pour remplacer le quart de vendredi."
  },
  {
    title: 'Housing Issue and Follow-Up',
    focus: 'Report housing problems and request action',
    vocabularyTargets: ['logement', 'réparation', 'fuite', 'propriétaire', 'urgence'],
    grammarTargets: ['Problem -> request structure'],
    scenarioTitle: 'Rental Problem Resolution',
    scenarioExplanation: 'CLB5 users should report practical housing issues in clear sequence.',
    scenarioExamples: ['Il y a une fuite dans la salle de bain depuis hier soir.'],
    listeningMessage: "Il y a une fuite dans la salle de bain et j'ai besoin d'une réparation rapide.",
    productionMode: 'written',
    productionPrompt: 'Write a clear housing issue report with requested action.',
    productionExpected: ['fuite', 'réparation'],
    productionSample: "Bonjour, il y a une fuite dans la salle de bain. Je demande une réparation dès que possible.",
    writingPrompt: 'Write a follow-up to your landlord after no response.',
    writingExpected: ['propriétaire', 'urgence'],
    writingSample: "Bonjour, je vous relance concernant la réparation urgente signalée hier."
  },
  {
    title: 'Public Service Form Assistance',
    focus: 'Ask for help with forms and required documents',
    vocabularyTargets: ['formulaire', 'document', 'pièce', 'bureau', 'vérifier'],
    grammarTargets: ['Question and clarification patterns'],
    scenarioTitle: 'Settlement Office Interaction',
    scenarioExplanation: 'CLB5 emphasizes real public-service interactions and clear information exchange.',
    scenarioExamples: ['Pouvez-vous vérifier si ce document est complet ?'],
    listeningMessage: "J'ai besoin d'aide pour remplir ce formulaire et vérifier mes documents.",
    productionMode: 'spoken',
    productionPrompt: 'Ask for form help and confirm required documents.',
    productionExpected: ['formulaire', 'document'],
    productionSample: "Bonjour, j'ai besoin d'aide pour ce formulaire. Pouvez-vous vérifier mes documents ?",
    writingPrompt: 'Write a short email asking for form support.',
    writingExpected: ['aide', 'vérifier'],
    writingSample: "Bonjour, je demande de l'aide pour vérifier mon formulaire avant le rendez-vous."
  },
  {
    title: 'Practical Opinion Tasks',
    focus: 'Give short practical opinions with one reason',
    vocabularyTargets: ['selon moi', 'important', 'raison', 'exemple', 'recommander'],
    grammarTargets: ['Opinion structure at CLB5'],
    scenarioTitle: 'Community Recommendation Prompt',
    scenarioExplanation: 'Learners present practical opinions in a simple structured format.',
    scenarioExamples: ['Selon moi, ce service est important parce qu’il aide les familles.'],
    listeningMessage: "Selon moi, ce programme est utile parce qu'il offre un soutien pratique.",
    productionMode: 'mixed',
    productionPrompt: 'Give a practical opinion and one reason about a community service.',
    productionExpected: ['selon moi', 'parce que'],
    productionSample: "Selon moi, ce service est utile parce qu'il aide les nouveaux arrivants rapidement.",
    writingPrompt: 'Write a short recommendation message.',
    writingExpected: ['recommander', 'raison'],
    writingSample: "Je recommande ce programme pour une raison simple: il facilite l'intégration."
  },
  {
    title: 'Transit Disruption Notification',
    focus: 'Report transit disruption and adjust commitment clearly',
    vocabularyTargets: ['retard', 'itinéraire', 'arriver', 'prévenir', 'confirmation'],
    grammarTargets: ['Cause-detail communication'],
    scenarioTitle: 'Commuter Update Task',
    scenarioExplanation: 'CLB5 users communicate delays with one concrete timing detail and next action.',
    scenarioExamples: ["Mon itinéraire est perturbé, j'arriverai vers 9h20."],
    listeningMessage: "Le métro est en panne sur ma ligne; j'arriverai en retard et je vous préviens immédiatement.",
    productionMode: 'spoken',
    productionPrompt: 'Leave a short voice update about a transit disruption and revised arrival time.',
    productionExpected: ['retard', 'arriver'],
    productionSample: "Bonjour, il y a un retard sur ma ligne de métro. J'arriverai vers 9h20 et je vous préviens dès maintenant.",
    writingPrompt: 'Write a practical delay update with revised time.',
    writingExpected: ['itinéraire', 'confirmation'],
    writingSample: "Mon itinéraire est perturbé ce matin. Merci de confirmer que l'horaire ajusté est acceptable."
  },
  {
    title: 'Childcare Pickup Coordination',
    focus: 'Coordinate childcare pickup with clear timing',
    vocabularyTargets: ['garderie', 'récupérer', 'horaire', 'retard', 'autorisation'],
    grammarTargets: ['Time + action messaging'],
    scenarioTitle: 'Daycare Coordination Call',
    scenarioExplanation: 'CLB5 learners should communicate pickup changes calmly and precisely.',
    scenarioExamples: ['Je vais récupérer mon enfant à 17h30 au lieu de 17h.'],
    listeningMessage: "Je serai en retard de trente minutes pour récupérer mon enfant à la garderie.",
    productionMode: 'mixed',
    productionPrompt: 'Explain a pickup change and confirm authorization details.',
    productionExpected: ['récupérer', 'retard'],
    productionSample: "Je vais récupérer mon enfant à 17h30. Je suis en retard de trente minutes aujourd'hui.",
    writingPrompt: 'Write a short childcare timing update.',
    writingExpected: ['garderie', 'horaire'],
    writingSample: "Bonjour, je serai en retard pour la garderie. Merci de confirmer le nouvel horaire de récupération."
  },
  {
    title: 'Pharmacy Clarification Request',
    focus: 'Ask for medication clarification with practical detail',
    vocabularyTargets: ['ordonnance', 'dose', 'pharmacie', 'clarifier', 'instruction'],
    grammarTargets: ['Clarification and confirmation patterns'],
    scenarioTitle: 'Pharmacy Counter Clarification',
    scenarioExplanation: 'CLB5 performance includes asking clear follow-up questions about medication use.',
    scenarioExamples: ['Pouvez-vous clarifier la dose pour ce médicament ?'],
    listeningMessage: "Je voudrais clarifier les instructions de cette ordonnance avant de commencer le traitement.",
    productionMode: 'spoken',
    productionPrompt: 'Ask a pharmacist to clarify dose and schedule instructions.',
    productionExpected: ['dose', 'instruction'],
    productionSample: "Bonjour, pouvez-vous clarifier la dose et les instructions pour ce médicament ?",
    writingPrompt: 'Write a short pharmacy follow-up message.',
    writingExpected: ['ordonnance', 'clarifier'],
    writingSample: "Bonjour, je souhaite clarifier les instructions de mon ordonnance. Merci pour votre aide."
  },
  {
    title: 'School Absence Explanation',
    focus: 'Explain absence and request next steps',
    vocabularyTargets: ['absence', 'cours', 'devoirs', 'rattraper', 'explication'],
    grammarTargets: ['Cause + request pattern'],
    scenarioTitle: 'Teacher Follow-Up Task',
    scenarioExplanation: 'CLB5 tasks often require concise school communication with practical next actions.',
    scenarioExamples: ["J'ai eu une absence mardi et je voudrais rattraper le cours."],
    listeningMessage: "J'ai été absent hier et je voudrais connaître les devoirs à faire pour rattraper.",
    productionMode: 'written',
    productionPrompt: 'Write a short school message explaining absence and asking for next steps.',
    productionExpected: ['absence', 'devoirs'],
    productionSample: "J'ai eu une absence mardi. Je voudrais rattraper le cours et recevoir les devoirs.",
    writingPrompt: 'Write a practical follow-up to your teacher.',
    writingExpected: ['rattraper', 'cours'],
    writingSample: "Bonjour, je veux rattraper le cours manqué. Merci de me confirmer les étapes à suivre."
  },
  {
    title: 'Bank Appointment Preparation',
    focus: 'Confirm appointment and required documents',
    vocabularyTargets: ['banque', 'rendez-vous', 'document', 'pièce d’identité', 'confirmer'],
    grammarTargets: ['Confirmation and request structures'],
    scenarioTitle: 'Bank Service Preparation',
    scenarioExplanation: 'CLB5 learners should confirm logistics before service appointments.',
    scenarioExamples: ["Je confirme mon rendez-vous et je vérifie les documents requis."],
    listeningMessage: "Je confirme mon rendez-vous à la banque et je voudrais vérifier les pièces d'identité à apporter.",
    productionMode: 'mixed',
    productionPrompt: 'Confirm a bank appointment and ask which documents are required.',
    productionExpected: ['confirmer', 'document'],
    productionSample: "Bonjour, je confirme mon rendez-vous de demain. Quels documents dois-je apporter ?",
    writingPrompt: 'Write a short bank confirmation request.',
    writingExpected: ['banque', 'pièce d’identité'],
    writingSample: "Bonjour, je confirme mon rendez-vous à la banque. Merci de préciser les pièces d'identité nécessaires."
  }
];

const CLB7_TOPICS: Topic[] = [
  {
    title: 'Policy Discussion and Recommendation',
    focus: 'Analyze policy and present a reasoned recommendation',
    vocabularyTargets: ['politique', 'impact', 'analyse', 'recommandation', 'priorité'],
    grammarTargets: ['Conditionnel for nuance', 'advanced connectors'],
    scenarioTitle: 'Workplace Policy Advisory Task',
    scenarioExplanation: 'CLB7 expects clear analysis, balanced reasoning, and practical recommendation.',
    scenarioExamples: ['Cette politique est utile, cependant elle doit être ajustée pour les nouveaux employés.'],
    listeningMessage: "La politique actuelle améliore l'efficacité, mais elle crée aussi des difficultés pour certains employés.",
    productionMode: 'spoken',
    productionPrompt: 'Present a recommendation on a workplace policy with two supporting points.',
    productionExpected: ['cependant', 'je recommande'],
    productionSample: "Cette politique est utile. Cependant, je recommande une mise en œuvre progressive pour réduire les risques.",
    writingPrompt: 'Write a short policy recommendation note.',
    writingExpected: ['analyse', 'recommandation'],
    writingSample: "Après analyse, je recommande d'adapter la politique pour améliorer l'accès aux services."
  },
  {
    title: 'Complex Service Complaint',
    focus: 'Write high-quality complaint with evidence and proposed resolution',
    vocabularyTargets: ['réclamation', 'preuve', 'préjudice', 'résolution', 'délai'],
    grammarTargets: ['Register control', 'cohesive formal writing'],
    scenarioTitle: 'Formal Complaint Escalation',
    scenarioExplanation: 'CLB7 complaints require coherence, factual evidence, and professional tone.',
    scenarioExamples: ['Je joins les preuves des échanges précédents et je demande une résolution sous cinq jours.'],
    listeningMessage: "Je vous contacte pour une réclamation formelle, avec preuves à l'appui et demande de résolution rapide.",
    productionMode: 'written',
    productionPrompt: 'Draft a formal complaint with evidence, impact, and requested resolution timeline.',
    productionExpected: ['réclamation', 'preuve'],
    productionSample: "Je soumets une réclamation formelle. Vous trouverez les preuves en pièce jointe. Je demande une résolution sous cinq jours ouvrables.",
    writingPrompt: 'Write a formal escalation follow-up.',
    writingExpected: ['délai', 'résolution'],
    writingSample: "Merci de confirmer le délai de résolution prévu pour cette réclamation."
  },
  {
    title: 'Structured Argument Monologue',
    focus: 'Deliver opinion monologue with logic and examples',
    vocabularyTargets: ['thèse', 'argument', 'contre-argument', 'exemple', 'conclusion'],
    grammarTargets: ['Complex connectors and stance markers'],
    scenarioTitle: 'CLB7 Speaking Benchmark Task',
    scenarioExplanation: 'Learners practice argument structure for speaking benchmarks and TEF-style tasks.',
    scenarioExamples: ["D'une part..., d'autre part..., en conclusion..."],
    listeningMessage: "D'une part, cette mesure est efficace; d'autre part, elle peut exclure certains groupes.",
    productionMode: 'spoken',
    productionPrompt: 'Deliver a 60-90 second argument with thesis, support, and conclusion.',
    productionExpected: ['d’une part', 'en conclusion'],
    productionSample: "D'une part, cette solution réduit les coûts. D'autre part, elle demande plus de formation. En conclusion, elle reste avantageuse avec un bon accompagnement.",
    writingPrompt: 'Write a short argumentative paragraph with concession.',
    writingExpected: ['cependant', 'conclusion'],
    writingSample: "Cette initiative est prometteuse; cependant, elle nécessite un plan d'accompagnement clair. En conclusion, je la soutiens avec conditions."
  },
  {
    title: 'Inference in Listening and Summarization',
    focus: 'Extract intent and summarize multi-point messages',
    vocabularyTargets: ['intention', 'implication', 'résumer', 'point clé', 'attitude'],
    grammarTargets: ['Summary framing and neutral reporting'],
    scenarioTitle: 'Advanced Listening Summary Task',
    scenarioExplanation: 'CLB7 learners should capture implicit meaning and summarize efficiently.',
    scenarioExamples: ['Le locuteur semble préoccupé par les délais plutôt que par le coût.'],
    listeningMessage: "Le locuteur insiste sur les délais, mais laisse entendre une préoccupation secondaire liée à la qualité.",
    productionMode: 'mixed',
    productionPrompt: 'Summarize a message with the speaker’s main intent and two key points.',
    productionExpected: ['intention', 'point clé'],
    productionSample: "L'intention principale est de réduire les délais. Les points clés concernent la qualité et la coordination.",
    writingPrompt: 'Write a concise summary of an audio-style message.',
    writingExpected: ['résumé', 'attitude'],
    writingSample: "Résumé: le message met l'accent sur l'efficacité. L'attitude reste constructive mais exigeante."
  },
  {
    title: 'Decision Justification in Professional Context',
    focus: 'Justify decisions using criteria and trade-offs',
    vocabularyTargets: ['critère', 'prioriser', 'compromis', 'justifier', 'option'],
    grammarTargets: ['Conditionnel and comparative argument'],
    scenarioTitle: 'Professional Decision Brief',
    scenarioExplanation: 'CLB7 decisions should be justified with explicit criteria and trade-offs.',
    scenarioExamples: ['Je privilégierais cette option en raison du coût et du délai.'],
    listeningMessage: "Nous devons choisir entre trois options en tenant compte du budget, du délai et de la qualité.",
    productionMode: 'written',
    productionPrompt: 'Write a decision brief selecting one option with criteria and trade-offs.',
    productionExpected: ['critère', 'justifier'],
    productionSample: "Je privilégierais l'option B. Les critères principaux sont le coût et le délai, avec un compromis acceptable sur la flexibilité.",
    writingPrompt: 'Write a recommendation memo with explicit criteria.',
    writingExpected: ['option', 'compromis'],
    writingSample: "Je recommande l'option A pour sa stabilité, malgré un compromis sur la rapidité d'exécution."
  },
  {
    title: 'Program Evaluation Brief',
    focus: 'Evaluate a public program with strengths, gaps, and recommendations',
    vocabularyTargets: ['évaluation', 'impact', 'lacune', 'priorité', 'amélioration'],
    grammarTargets: ['Analytical framing connectors'],
    scenarioTitle: 'Settlement Program Evaluation',
    scenarioExplanation: 'CLB7 requires concise analysis that balances achievements and limitations.',
    scenarioExamples: ["Le programme a un impact positif, mais il présente une lacune sur l'accès en soirée."],
    listeningMessage: "Le programme répond à plusieurs besoins, toutefois l'accès reste limité pour les personnes qui travaillent tard.",
    productionMode: 'written',
    productionPrompt: 'Write an evaluation brief with one strength, one gap, and one recommendation.',
    productionExpected: ['impact', 'recommandation'],
    productionSample: "Le programme a un impact positif sur l'intégration. Cependant, il manque des services en soirée. Je recommande d'ajouter des plages horaires flexibles.",
    writingPrompt: 'Write a concise evaluation memo.',
    writingExpected: ['évaluation', 'amélioration'],
    writingSample: "Après évaluation, je recommande une amélioration des horaires et de la communication multilingue."
  },
  {
    title: 'Incident Report and Corrective Action',
    focus: 'Document an incident and justify corrective actions',
    vocabularyTargets: ['incident', 'constat', 'mesure', 'prévention', 'suivi'],
    grammarTargets: ['Formal reporting sequence'],
    scenarioTitle: 'Workplace Incident Review',
    scenarioExplanation: 'CLB7 tasks expect factual reporting plus rationale for preventive measures.',
    scenarioExamples: ["L'incident s'est produit à 14h et a entraîné un retard opérationnel."],
    listeningMessage: "Suite à l'incident de mardi, nous proposons des mesures de prévention et un suivi hebdomadaire.",
    productionMode: 'mixed',
    productionPrompt: 'Present an incident summary and propose two corrective actions.',
    productionExpected: ['incident', 'prévention'],
    productionSample: "L'incident a causé un retard important. Je propose une vérification quotidienne et une formation ciblée pour la prévention.",
    writingPrompt: 'Write a formal incident follow-up note.',
    writingExpected: ['mesure', 'suivi'],
    writingSample: "Nous proposons deux mesures correctives immédiates et un suivi mensuel pour prévenir la répétition de l'incident."
  },
  {
    title: 'Stakeholder Meeting Summary',
    focus: 'Summarize meeting outcomes and unresolved risks',
    vocabularyTargets: ['compte rendu', 'enjeu', 'risque', 'décision', 'prochaine étape'],
    grammarTargets: ['Summary + risk articulation'],
    scenarioTitle: 'Multi-Party Meeting Debrief',
    scenarioExplanation: 'CLB7 summaries should identify decisions and remaining risks clearly.',
    scenarioExamples: ['La décision principale est adoptée, mais deux enjeux restent ouverts.'],
    listeningMessage: "La réunion a permis de valider le budget, cependant les risques liés au calendrier demeurent.",
    productionMode: 'written',
    productionPrompt: 'Write a concise meeting summary with decisions and unresolved risks.',
    productionExpected: ['décision', 'risque'],
    productionSample: "La décision budgétaire est confirmée. Toutefois, le risque principal concerne le calendrier de mise en œuvre.",
    writingPrompt: 'Write a stakeholder update memo.',
    writingExpected: ['enjeu', 'prochaine étape'],
    writingSample: "Deux enjeux restent à traiter avant la prochaine étape: la coordination interéquipes et la validation des délais."
  },
  {
    title: 'Comparative Recommendation Under Constraints',
    focus: 'Compare options using weighted criteria and constraints',
    vocabularyTargets: ['contrainte', 'pondérer', 'cohérence', 'efficience', 'arbitrage'],
    grammarTargets: ['Nuanced recommendation language'],
    scenarioTitle: 'Operational Choice Under Limits',
    scenarioExplanation: 'CLB7 decisions often require balancing cost, quality, and timeline constraints.',
    scenarioExamples: ["Compte tenu des contraintes, l'option B demeure la plus cohérente."],
    listeningMessage: "Nous devons arbitrer entre efficacité immédiate et qualité durable dans un contexte de contraintes budgétaires.",
    productionMode: 'spoken',
    productionPrompt: 'Recommend one option under constraints and justify the trade-off.',
    productionExpected: ['contrainte', 'arbitrage'],
    productionSample: "Compte tenu des contraintes, je recommande l'option B. L'arbitrage sur le délai est acceptable pour maintenir la qualité.",
    writingPrompt: 'Write a weighted recommendation note.',
    writingExpected: ['efficience', 'cohérence'],
    writingSample: "L'option retenue offre la meilleure efficience tout en conservant une cohérence avec nos objectifs stratégiques."
  },
  {
    title: 'Formal Request Rejection and Alternative Proposal',
    focus: 'Decline a request diplomatically and propose alternatives',
    vocabularyTargets: ['refus', 'motif', 'alternative', 'viable', 'proposition'],
    grammarTargets: ['Diplomatic refusal register'],
    scenarioTitle: 'Professional Response to Unfeasible Request',
    scenarioExplanation: 'CLB7 requires tactful refusal while preserving collaboration.',
    scenarioExamples: ['Nous ne pouvons pas accepter cette demande dans sa forme actuelle.'],
    listeningMessage: "Votre demande ne peut pas être acceptée actuellement, mais nous proposons une alternative viable.",
    productionMode: 'mixed',
    productionPrompt: 'Deliver a diplomatic refusal with clear rationale and one alternative.',
    productionExpected: ['refus', 'alternative'],
    productionSample: "Nous ne pouvons pas accepter cette demande actuellement. Cependant, nous proposons une alternative viable à court terme.",
    writingPrompt: 'Write a formal refusal with alternative option.',
    writingExpected: ['motif', 'proposition'],
    writingSample: "Le refus est motivé par des contraintes de capacité. Nous formulons une proposition alternative pour le mois prochain."
  },
  {
    title: 'Public Consultation Response',
    focus: 'Respond to consultation feedback with synthesis and positioning',
    vocabularyTargets: ['consultation', 'synthèse', 'position', 'préoccupation', 'ajustement'],
    grammarTargets: ['Synthesis and stance language'],
    scenarioTitle: 'Community Feedback Integration',
    scenarioExplanation: 'CLB7 responses should synthesize multiple viewpoints and present a coherent position.',
    scenarioExamples: ['La synthèse révèle des préoccupations sur l’accessibilité et la transparence.'],
    listeningMessage: "La consultation montre un soutien général, mais des préoccupations récurrentes sur la mise en œuvre.",
    productionMode: 'written',
    productionPrompt: 'Write a consultation response summarizing concerns and proposing adjustments.',
    productionExpected: ['synthèse', 'ajustement'],
    productionSample: "La synthèse indique deux préoccupations majeures. Je propose des ajustements ciblés sur l'accessibilité et la communication.",
    writingPrompt: 'Write a concise consultation position note.',
    writingExpected: ['position', 'préoccupation'],
    writingSample: "Notre position tient compte des préoccupations exprimées et prévoit des ajustements progressifs."
  }
];

function normalizeClbToken(token: string): string {
  return token
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '');
}

function buildClbOptions(topic: Topic): [string, string, string, string] {
  const strongest = topic.scenarioExamples[0] ?? topic.productionSample;
  const keywordA = topic.vocabularyTargets[0] ?? 'mot';
  return [strongest, 'Bonjour, merci.', `${keywordA}.`, 'Je suis aide.'];
}

function makeClbLesson(track: ClbTrack, lessonNumber: number, topic: Topic): StructuredLessonContent {
  const idb = `${track}l${lessonNumber}`;
  const titlePrefix = track === 'clb5' ? 'CLB 5' : 'CLB 7';
  const masteryThresholdPercent = track === 'clb5' ? 82 : 85;
  const writingMinWords = track === 'clb5' ? 28 : 42;
  const speakingMinWords = track === 'clb5' ? 20 : 28;
  return {
    id: `${track}-structured-${lessonNumber}`,
    curriculumLessonId: `${track}-lesson-${lessonNumber}`,
    levelId: track,
    moduleId: `${track}-target-module-1`,
    title: `${titlePrefix} Lesson ${lessonNumber}: ${topic.title}`,
    estimatedMinutes: 25,
    mode: 'exam-bridge',
    outcomes: [
      `Build ${titlePrefix} task realism with benchmark expectations`,
      'Use practical communication under mild time pressure',
      'Prepare for TEF-style functional performance'
    ],
    vocabularyTargets: topic.vocabularyTargets,
    grammarTargets: topic.grammarTargets,
    blocks: [
      {
        id: `${idb}-teach`,
        type: 'teach',
        title: `Teach: ${topic.focus}`,
        targetMinutes: 5,
        objectives: [topic.focus],
        teachingSegments: [
          {
            id: `${idb}-seg1`,
            title: topic.scenarioTitle,
            explanation: topic.scenarioExplanation,
            examples: topic.scenarioExamples,
            companionTip: 'Focus on task purpose, then add precise details.'
          }
        ],
        requiresCompletionToAdvance: true
      },
      {
        id: `${idb}-practice`,
        type: 'practice',
        title: 'Practice: Benchmark-aligned drills',
        targetMinutes: 8,
        objectives: ['Perform with clarity under time pressure'],
        exercises: [
          {
            id: `${idb}-p1`,
            kind: 'multipleChoice',
            prompt: `Pick the best ${titlePrefix} response for this scenario.`,
            options: buildClbOptions(topic),
            correctOptionIndex: 0,
            explanationOnWrong: 'Benchmark responses require context plus actionable detail.',
            skillFocus: 'reading',
            points: 8
          },
          {
            id: `${idb}-p2`,
            kind: 'shortAnswer',
            prompt: 'Type one key functional term from this task.',
            acceptedAnswers: Array.from(
              new Set([
                ...topic.vocabularyTargets.slice(0, 4).map((item) => item.toLowerCase()),
                ...topic.vocabularyTargets.slice(0, 4).map((item) => normalizeClbToken(item))
              ])
            ),
            normalizeAccents: true,
            explanationOnWrong: 'Use one of the high-frequency task words from this lesson.',
            skillFocus: 'writing',
            points: 6
          },
          {
            id: `${idb}-p3`,
            kind: 'listeningPrompt',
            prompt: 'What is the speaker’s main purpose?',
            options: ['Greeting only', 'Request/analysis with practical detail', 'Casual conversation', 'Ending call'],
            correctOptionIndex: 1,
            explanationOnWrong: 'Identify purpose first, then details.',
            skillFocus: 'listening',
            points: 10,
            audioText: topic.listeningMessage
          },
          {
            id: `${idb}-p4`,
            kind: 'quickClassification',
            prompt: 'Classify each line by task function.',
            instructions: 'Choose category, then assign each statement.',
            categories: [
              { id: 'context', label: 'Context' },
              { id: 'action', label: 'Action / Request' },
              { id: 'support', label: 'Support / Detail' }
            ],
            items: [
              { id: 'i1', label: topic.scenarioExamples[0] ?? topic.productionSample, correctCategoryId: 'context' },
              { id: 'i2', label: topic.productionPrompt, correctCategoryId: 'action' },
              { id: 'i3', label: topic.productionSample, correctCategoryId: 'support' }
            ],
            explanationOnWrong: 'Strong benchmark responses are structured by function.',
            skillFocus: 'reading',
            points: 8
          }
        ],
        requiresCompletionToAdvance: true
      },
      {
        id: `${idb}-production`,
        type: 'production',
        title: 'Production: Timed performance task',
        targetMinutes: 6,
        objectives: ['Produce complete task response with benchmark quality'],
        productionTask: {
          id: `${idb}-prod`,
          title: `${titlePrefix} Performance Task`,
          instructions: 'Complete the full task in structured order: context, action, support.',
          mode: topic.productionMode,
          mandatory: true,
          targetMinutes: 6,
          exercise:
            topic.productionMode === 'spoken'
              ? {
                  id: `${idb}-prod-ex`,
                  kind: 'speakingPrompt',
                  prompt: topic.productionPrompt,
                  expectedPatterns: topic.productionExpected,
                  minWords: speakingMinWords,
                  rubricFocus: ['taskCompletion', 'fluency', 'grammar', 'pronunciation'],
                  sampleAnswer: topic.productionSample,
                  fallbackTextEvaluationAllowed: true,
                  skillFocus: 'speaking',
                  points: 24
                }
              : {
                  id: `${idb}-prod-ex`,
                  kind: 'writingPrompt',
                  prompt: topic.productionPrompt,
                  expectedElements: topic.productionExpected,
                  minWords: writingMinWords,
                  rubricFocus: ['taskCompletion', 'grammar', 'coherence', 'vocabulary'],
                  sampleAnswer: topic.productionSample,
                  skillFocus: 'writing',
                  points: 24
                }
        },
        requiresCompletionToAdvance: true
      },
      {
        id: `${idb}-test`,
        type: 'miniTest',
        title: 'Mini Test: Benchmark rubric check',
        targetMinutes: 6,
        objectives: ['Confirm readiness against benchmark expectations'],
        exercises: [
          {
            id: `${idb}-t1`,
            kind: 'multipleChoice',
            prompt: 'Pick the response that best meets clarity, detail, and task purpose.',
            options: [topic.productionSample, 'Merci.', `${topic.vocabularyTargets[0] ?? 'mot'}.`, 'Je veux aide.'],
            correctOptionIndex: 0,
            explanationOnWrong: 'Benchmark scoring rewards complete task response, not isolated phrases.',
            skillFocus: 'reading',
            points: 8
          },
          {
            id: `${idb}-t2`,
            kind: 'writingPrompt',
            prompt: topic.writingPrompt,
            expectedElements: topic.writingExpected,
            minWords: writingMinWords,
            rubricFocus: ['taskCompletion', 'grammar', 'coherence', 'vocabulary'],
            sampleAnswer: topic.writingSample,
            skillFocus: 'writing',
            points: 24
          }
        ],
        requiresCompletionToAdvance: true
      }
    ],
    assessment: {
      masteryThresholdPercent,
      productionRequired: true,
      retryIncorrectLater: true,
      strictSequential: true
    },
    aiHooks: {
      companionPersonaHookId: `${track}-coach`,
      speakingAssessmentHookId: 'speaking-v1',
      writingCorrectionHookId: 'writing-v1',
      dynamicExplanationHookId: `${track}-lesson-${lessonNumber}-benchmark-explainer`
    }
  };
}

function buildTrack(track: ClbTrack, topics: Topic[]): StructuredLessonContent[] {
  return Array.from({ length: 40 }, (_, index) => {
    const lessonNumber = index + 1;
    const topic = topics[index % topics.length];
    return makeClbLesson(track, lessonNumber, topic);
  });
}

export const clb5StructuredLessons: StructuredLessonContent[] = buildTrack('clb5', CLB5_TOPICS);
export const clb7StructuredLessons: StructuredLessonContent[] = buildTrack('clb7', CLB7_TOPICS);
