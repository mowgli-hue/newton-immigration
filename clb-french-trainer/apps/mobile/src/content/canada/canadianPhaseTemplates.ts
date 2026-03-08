import type { StructuredLessonContent } from '../../types/LessonContentTypes';

export type CanadianPhaseTemplate = {
  id: string;
  tag: 'service-office' | 'housing' | 'transit' | 'healthcare' | 'workplace' | 'general';
  objective: string;
  context: string;
  pronunciationFocus: string;
  commonMistake: string;
  functionalTask: string;
  avatarRecap: string;
};

const templates: CanadianPhaseTemplate[] = [
  {
    id: 'service-office',
    tag: 'service-office',
    objective: 'Handle formal service requests with clarity and politeness.',
    context: 'At Service Canada or immigration office: asking for appointment, form help, and confirmation.',
    pronunciationFocus: 'Polite request rhythm: "Je voudrais...", "S’il vous plaît..." with clear liaison.',
    commonMistake: 'Using informal register (salut/tu) in formal government interactions.',
    functionalTask: 'Make a concise request, clarify one detail, and confirm next step.',
    avatarRecap: 'Use formal tone, short clear sentences, and confirmation language.'
  },
  {
    id: 'housing',
    tag: 'housing',
    objective: 'Report housing issues and negotiate practical solutions.',
    context: 'Calling landlord/property manager about repairs, deadlines, and urgency.',
    pronunciationFocus: 'Problem + request structures with clear stress on action words.',
    commonMistake: 'Describing issue without asking explicitly for timeline/action.',
    functionalTask: 'State issue, request solution, and confirm expected date.',
    avatarRecap: 'Describe, request, confirm: this 3-step pattern is your housing script.'
  },
  {
    id: 'transit',
    tag: 'transit',
    objective: 'Ask and answer transit questions quickly under real conditions.',
    context: 'Bus/skytrain delays, route confirmation, platform changes, transfer questions.',
    pronunciationFocus: 'Time and number clarity: hours, platform numbers, route identifiers.',
    commonMistake: 'Missing key detail words (time/location) during fast listening.',
    functionalTask: 'Ask direction/time question and restate answer to confirm.',
    avatarRecap: 'Prioritize key details: where, when, and platform/line.'
  },
  {
    id: 'healthcare',
    tag: 'healthcare',
    objective: 'Communicate symptoms and follow instructions in clinic settings.',
    context: 'Describing symptoms, booking visit, understanding treatment steps.',
    pronunciationFocus: 'Body/symptom vocabulary with slow, precise articulation.',
    commonMistake: 'Overly complex sentences instead of short symptom statements.',
    functionalTask: 'State symptom duration, intensity, and one follow-up question.',
    avatarRecap: 'Be concise and precise: symptom, duration, severity, question.'
  },
  {
    id: 'workplace',
    tag: 'workplace',
    objective: 'Manage shifts, delays, and teamwork communication professionally.',
    context: 'Shift updates, meeting clarification, role responsibility and timelines.',
    pronunciationFocus: 'Linking words for cause/solution: "parce que", "donc", "pour".',
    commonMistake: 'Giving a problem statement without proposing a solution option.',
    functionalTask: 'Explain issue, propose solution, ask confirmation.',
    avatarRecap: 'In workplace French: problem + solution + confirmation.'
  },
  {
    id: 'general',
    tag: 'general',
    objective: 'Build usable French for daily Canadian life and CLB progression.',
    context: 'Everyday interactions in public spaces, services, and phone calls.',
    pronunciationFocus: 'Core sentence rhythm with clear vowel endings.',
    commonMistake: 'Memorizing isolated words without functional sentence use.',
    functionalTask: 'Use target vocabulary in short real-life response.',
    avatarRecap: 'Use language functionally, not just as isolated vocabulary.'
  }
];

function includesAny(haystack: string, keys: string[]): boolean {
  return keys.some((k) => haystack.includes(k));
}

export function resolveCanadianPhaseTemplate(lesson: StructuredLessonContent): CanadianPhaseTemplate {
  const text = `${lesson.title} ${lesson.moduleId} ${lesson.outcomes.join(' ')} ${lesson.vocabularyTargets.join(' ')} ${lesson.grammarTargets.join(' ')}`.toLowerCase();

  if (includesAny(text, ['service canada', 'immigration', 'formulaire', 'document', 'bureau', 'service'])) {
    return templates.find((t) => t.id === 'service-office')!;
  }
  if (includesAny(text, ['housing', 'logement', 'landlord', 'propriétaire', 'repair', 'réparation', 'rent'])) {
    return templates.find((t) => t.id === 'housing')!;
  }
  if (includesAny(text, ['transit', 'bus', 'metro', 'skytrain', 'station', 'platform', 'route'])) {
    return templates.find((t) => t.id === 'transit')!;
  }
  if (includesAny(text, ['health', 'clinic', 'doctor', 'santé', 'symptom', 'rdv médical'])) {
    return templates.find((t) => t.id === 'healthcare')!;
  }
  if (includesAny(text, ['work', 'office', 'shift', 'équipe', 'meeting', 'job'])) {
    return templates.find((t) => t.id === 'workplace')!;
  }

  return templates.find((t) => t.id === 'general')!;
}
