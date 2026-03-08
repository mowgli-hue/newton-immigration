import * as Speech from 'expo-speech';

const DEFAULT_SPEECH_OPTIONS: Omit<Speech.SpeechOptions, 'language' | 'voice'> = {
  rate: 0.84,
  pitch: 1.0
};

type PlayPronunciationResult = {
  ok: boolean;
  message?: string;
};

async function pickFrenchVoice(): Promise<{ language?: string; voice?: string }> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    if (!voices?.length) {
      return { language: 'fr-FR' };
    }

    const normalize = (language?: string) => (language ?? '').toLowerCase().replace('_', '-');

    const preferred =
      voices.find((voice) => normalize(voice.language) === 'fr-ca') ??
      voices.find((voice) => normalize(voice.language) === 'fr-fr') ??
      voices.find((voice) => normalize(voice.language).startsWith('fr'));

    if (!preferred) {
      return { language: 'fr-FR' };
    }

    return {
      language: preferred.language,
      voice: preferred.identifier
    };
  } catch {
    return { language: 'fr-FR' };
  }
}

const FRENCH_LETTER_NAMES: Record<string, string> = {
  a: 'a',
  b: 'bé',
  c: 'cé',
  d: 'dé',
  e: 'e',
  f: 'effe',
  g: 'gé',
  h: 'ache',
  i: 'i',
  j: 'ji',
  k: 'ka',
  l: 'elle',
  m: 'aime',
  n: 'aine',
  o: 'o',
  p: 'pé',
  q: 'ku',
  r: 'aire',
  s: 'esse',
  t: 'té',
  u: 'u',
  v: 'vé',
  w: 'double vé',
  x: 'ix',
  y: 'igrec',
  z: 'zède'
};

const FRENCH_UNITS = [
  'zéro',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize'
] as const;

function numberToFrenchWords(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value > 99) {
    return String(value);
  }

  if (value <= 16) {
    return FRENCH_UNITS[value];
  }
  if (value < 20) {
    return `dix-${FRENCH_UNITS[value - 10]}`;
  }
  if (value === 20) return 'vingt';
  if (value < 30) return value === 21 ? 'vingt et un' : `vingt-${FRENCH_UNITS[value - 20]}`;
  if (value === 30) return 'trente';
  if (value < 40) return value === 31 ? 'trente et un' : `trente-${FRENCH_UNITS[value - 30]}`;
  if (value === 40) return 'quarante';
  if (value < 50) return value === 41 ? 'quarante et un' : `quarante-${FRENCH_UNITS[value - 40]}`;
  if (value === 50) return 'cinquante';
  if (value < 60) return value === 51 ? 'cinquante et un' : `cinquante-${FRENCH_UNITS[value - 50]}`;
  if (value === 60) return 'soixante';
  if (value < 70) return value === 61 ? 'soixante et un' : `soixante-${FRENCH_UNITS[value - 60]}`;
  if (value === 70) return 'soixante-dix';
  if (value < 80) return value === 71 ? 'soixante et onze' : `soixante-${numberToFrenchWords(value - 60)}`;
  if (value === 80) return 'quatre-vingts';
  if (value < 90) return `quatre-vingt-${FRENCH_UNITS[value - 80]}`;
  if (value === 90) return 'quatre-vingt-dix';
  return `quatre-vingt-${numberToFrenchWords(value - 80)}`;
}

function normalizeNumbersForFrenchTTS(text: string): string {
  let output = text.replace(/[–—]/g, '-');

  // Convert ranges like "0-20" into spoken French.
  output = output.replace(/\b(\d{1,2})\s*-\s*(\d{1,2})\b/g, (_, startRaw: string, endRaw: string) => {
    const start = Number.parseInt(startRaw, 10);
    const end = Number.parseInt(endRaw, 10);
    return `${numberToFrenchWords(start)} à ${numberToFrenchWords(end)}`;
  });

  // Convert basic time formats like "10h30".
  output = output.replace(/\b(\d{1,2})h(\d{1,2})\b/g, (_, hRaw: string, mRaw: string) => {
    const hour = Number.parseInt(hRaw, 10);
    const minute = Number.parseInt(mRaw, 10);
    return `${numberToFrenchWords(hour)} heures ${numberToFrenchWords(minute)}`;
  });

  // Convert standalone numbers.
  output = output.replace(/\b(\d{1,2})\b/g, (_, valueRaw: string) => {
    const value = Number.parseInt(valueRaw, 10);
    return numberToFrenchWords(value);
  });

  return output;
}

function normalizeTextForFrenchTTS(text: string): string {
  // Remove helper glosses like "(hello)" or "[formal]" so only French is spoken.
  const withoutGloss = text
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // If a line uses "French / English" format, keep only the French side.
  const slashSplit = withoutGloss.split('/');
  const cleaned = (slashSplit[0] ?? '').trim();
  if (!cleaned) return cleaned;

  // Improve letter pronunciation by speaking French letter names.
  if (/^[A-Za-z](\s*,\s*[A-Za-z])*$/.test(cleaned)) {
    return cleaned
      .split(',')
      .map((token) => token.trim().toLowerCase())
      .map((token) => FRENCH_LETTER_NAMES[token] ?? token)
      .join(', ');
  }

  return normalizeNumbersForFrenchTTS(cleaned);
}

export async function playPronunciation(text: string): Promise<PlayPronunciationResult> {
  try {
    const available = await Speech.isSpeakingAsync();

    if (available) {
      Speech.stop();
    }

    const voiceConfig = await pickFrenchVoice();
    const normalizedText = normalizeTextForFrenchTTS(text);

    Speech.speak(normalizedText, {
      ...DEFAULT_SPEECH_OPTIONS,
      ...voiceConfig
    });

    return {
      ok: true,
      message: voiceConfig.language ? `Playing (${voiceConfig.language})` : 'Playing audio'
    };
  } catch {
    return {
      ok: false,
      message: 'Audio is unavailable on this device right now. Continue with reading practice.'
    };
  }
}

export function stopPronunciation() {
  Speech.stop();
}
