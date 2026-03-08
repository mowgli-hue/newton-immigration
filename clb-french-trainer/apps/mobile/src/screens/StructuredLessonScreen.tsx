import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { File } from 'expo-file-system';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState
} from 'expo-audio';

import { AnimatedSuccess } from '../components/lesson/AnimatedSuccess';
import { PerformanceFeedbackPanel } from '../components/PerformanceFeedbackPanel';
import { LessonStepEngine } from '../components/lesson/LessonStepEngine';
import { MicroFeedback } from '../components/lesson/MicroFeedback';
import { OptionButton } from '../components/lesson/OptionButton';
import { PrimaryCTAButton } from '../components/lesson/PrimaryCTAButton';
import { InputField } from '../components/InputField';
import { useAuth } from '../context/AuthContext';
import { useCompanion } from '../context/CompanionContext';
import { useFocusSession } from '../context/FocusSessionContext';
import { useCurriculumProgress } from '../context/CurriculumProgressContext';
import { useLessonNotes } from '../context/LessonNotesContext';
import { resolveCanadianPhaseTemplate } from '../content/canada/canadianPhaseTemplates';
import { getStructuredLessonById } from '../content/structuredLessons';
import {
  applyExerciseSubmission,
  continueLesson,
  createLessonSessionState,
  evaluateExercise,
  getCurrentBlockExercises,
  getLessonScorePercent
} from '../engine/LessonRuntimeEngine';
import { assessPronunciation } from '../services/ai/PronunciationAssessmentService';
import { assessSpeakingResponse } from '../services/ai/SpeakingAssessmentService';
import { assessWritingResponse } from '../services/ai/WritingCorrectionService';
import { playPronunciation } from '../services/audio/pronunciationAudio';
import { loadUserOnboardingProfile } from '../navigation/routePersistence';
import type { Exercise, StructuredLessonContent, TeachingSegment } from '../types/LessonContentTypes';
import type { LessonStep } from '../types/LessonStepTypes';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = {
  lessonId: string;
  onComplete?: (payload: {
    passed: boolean;
    scorePercent: number;
    lesson: StructuredLessonContent;
    minorCorrection: boolean;
  }) => void;
};

type RuntimeStep = LessonStep & {
  segment?: TeachingSegment;
  exercise?: Exercise;
};

type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

type MemoryCard = {
  uid: string;
  pairId: string;
  label: string;
};

type PerformanceWeaknessKey = 'articles' | 'verbTense' | 'pronunciation' | 'wordOrder';

type CLBPerformanceFeedback = {
  estimatedClb: number;
  targetClb: 5 | 7;
  taskCompletionScore: number;
  grammarAccuracyScore: number;
  vocabularyRangeScore: number;
  coherenceScore: number;
  improvementAdvice: string;
  correctedSentence: string;
  improvedVersion: string;
  weaknesses: PerformanceWeaknessKey[];
};

type RetryCategory = 'articles' | 'verbTense' | 'wordOrder' | 'listening' | 'vocabulary';

const frenchNumberMap: Record<string, string> = {
  '0': 'zero',
  '1': 'un',
  '2': 'deux',
  '3': 'trois',
  '4': 'quatre',
  '5': 'cinq',
  '6': 'six',
  '7': 'sept',
  '8': 'huit',
  '9': 'neuf',
  '10': 'dix',
  '11': 'onze',
  '12': 'douze',
  '13': 'treize',
  '14': 'quatorze',
  '15': 'quinze',
  '16': 'seize',
  '17': 'dix-sept',
  '18': 'dix-huit',
  '19': 'dix-neuf',
  '20': 'vingt'
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function inferAudioContentTypeFromUri(uri: string): string {
  const normalized = uri.toLowerCase();
  if (normalized.endsWith('.m4a')) return 'audio/mp4';
  if (normalized.endsWith('.mp4')) return 'audio/mp4';
  if (normalized.endsWith('.wav')) return 'audio/wav; codecs=audio/pcm; samplerate=16000';
  if (normalized.endsWith('.webm')) return 'audio/webm';
  return 'audio/mp4';
}

function estimateClbFromScore(score: number): number {
  if (score < 40) return 3;
  if (score < 55) return 4;
  if (score < 68) return 5;
  if (score < 78) return 6;
  if (score < 88) return 7;
  return 8;
}

function buildGapMessage(estimatedClb: number, targetClb: 5 | 7): string {
  if (estimatedClb >= targetClb) {
    return `You are meeting CLB ${targetClb}. Focus on consistency and fluency under time pressure.`;
  }
  if (targetClb === 5) {
    return `To reach CLB 5, add more detail and basic connectors like "et", "mais", "parce que".`;
  }
  return `To reach CLB 7, improve precision, varied connectors, and clearer argument flow in each response.`;
}

function detectWeaknesses(input: {
  grammarScore: number;
  coherenceScore: number;
  pronunciationScore?: number;
  text?: string;
}): PerformanceWeaknessKey[] {
  const weaknesses: PerformanceWeaknessKey[] = [];
  const normalized = (input.text ?? '').toLowerCase();

  if (input.grammarScore < 70) {
    if (/\b(le|la|les|un|une|des)\b/.test(normalized) === false) {
      weaknesses.push('articles');
    }
    weaknesses.push('verbTense');
  }
  if (input.coherenceScore < 70) {
    weaknesses.push('wordOrder');
  }
  if (typeof input.pronunciationScore === 'number' && input.pronunciationScore < 70) {
    weaknesses.push('pronunciation');
  }

  return Array.from(new Set(weaknesses));
}

function buildMemoryCards(exercise: Extract<Exercise, { kind: 'memoryMatch' }>): MemoryCard[] {
  return exercise.pairs.flatMap((pair) => [
    { uid: `${pair.id}-l`, pairId: pair.id, label: pair.left },
    { uid: `${pair.id}-r`, pairId: pair.id, label: pair.right }
  ]);
}

function phaseForExercise(exercise: Exercise): LessonStep['phase'] {
  if (exercise.kind === 'listeningPrompt') return 'listen';
  if (exercise.kind === 'speakingPrompt') return 'speak';
  if (exercise.kind === 'readingComprehension') return 'review';
  return 'practice';
}

function rotateArray<T>(items: T[], offset: number): T[] {
  if (!items.length) return items;
  const normalized = ((offset % items.length) + items.length) % items.length;
  if (normalized === 0) return [...items];
  return [...items.slice(normalized), ...items.slice(0, normalized)];
}

function inferRetryCategory(exercise: Exercise, lesson: StructuredLessonContent): RetryCategory {
  const lowerPrompt = exercise.prompt.toLowerCase();
  const lowerGrammar = lesson.grammarTargets.join(' ').toLowerCase();
  const remediation = (exercise.remediationTag ?? '').toLowerCase();

  if (exercise.kind === 'listeningPrompt' || exercise.skillFocus === 'listening') {
    return 'listening';
  }
  if (
    remediation.includes('article') ||
    lowerPrompt.includes('article') ||
    lowerGrammar.includes('article') ||
    lowerGrammar.includes('gender')
  ) {
    return 'articles';
  }
  if (
    remediation.includes('tense') ||
    remediation.includes('verb') ||
    lowerPrompt.includes('verb') ||
    lowerPrompt.includes('conjug') ||
    lowerGrammar.includes('tense') ||
    lowerGrammar.includes('présent') ||
    lowerGrammar.includes('passe') ||
    lowerGrammar.includes('passé') ||
    lowerGrammar.includes('être')
  ) {
    return 'verbTense';
  }
  if (
    remediation.includes('order') ||
    lowerPrompt.includes('order') ||
    lowerPrompt.includes('rebuild') ||
    lowerPrompt.includes('classify') ||
    exercise.kind === 'sentenceOrderPuzzle' ||
    exercise.kind === 'quickClassification'
  ) {
    return 'wordOrder';
  }
  return 'vocabulary';
}

function buildAdaptiveRetryVariant(
  exercise: Exercise,
  lesson: StructuredLessonContent,
  category: RetryCategory,
  attemptNumber: number
): Exercise {
  const label = `Retry Drill ${Math.max(1, attemptNumber)}`;
  const categoryLabel =
    category === 'articles'
      ? 'Articles'
      : category === 'verbTense'
        ? 'Verb Form'
        : category === 'wordOrder'
          ? 'Word Order'
          : category === 'listening'
            ? 'Listening'
            : 'Vocabulary';

  if (
    exercise.kind === 'multipleChoice' ||
    exercise.kind === 'listeningPrompt' ||
    exercise.kind === 'readingComprehension'
  ) {
    const optionMeta = exercise.options.map((text, index) => ({ text, isCorrect: index === exercise.correctOptionIndex }));
    const rotated = rotateArray(optionMeta, Math.max(1, attemptNumber));
    const newCorrectIndex = rotated.findIndex((item) => item.isCorrect);
    return {
      ...exercise,
      prompt: `${label} (${categoryLabel}): ${exercise.prompt}`,
      options: rotated.map((item) => item.text),
      correctOptionIndex: Math.max(0, newCorrectIndex)
    };
  }

  if (exercise.kind === 'shortAnswer') {
    const articleAnswers = ['le', 'la', 'les', 'un', 'une', 'des'];
    const verbAnswers = ['suis', 'es', 'est', 'sommes', 'êtes', 'sont', 'vais', 'va', 'allons', 'allez', 'vont'];
    const fallbackAnchor = lesson.vocabularyTargets[0] ?? exercise.acceptedAnswers[0] ?? 'the key expression';
    const acceptedAnswers =
      category === 'articles'
        ? Array.from(new Set([...exercise.acceptedAnswers, ...articleAnswers]))
        : category === 'verbTense'
          ? Array.from(new Set([...exercise.acceptedAnswers, ...verbAnswers]))
          : exercise.acceptedAnswers;
    const anchor = acceptedAnswers[0] ?? fallbackAnchor;
    return {
      ...exercise,
      acceptedAnswers,
      prompt:
        category === 'articles'
          ? `${label} (${categoryLabel}): Type one correct article (ex: le, la, un, une).`
          : category === 'verbTense'
            ? `${label} (${categoryLabel}): ${exercise.prompt} (Use the correct conjugated verb form.)`
            : `${label} (${categoryLabel}): ${exercise.prompt} (Include: ${anchor})`
    };
  }

  if (exercise.kind === 'sentenceOrderPuzzle') {
    return {
      ...exercise,
      prompt: `${label} (${categoryLabel}): ${exercise.prompt}`,
      tokens: rotateArray(exercise.tokens, Math.max(1, attemptNumber))
    };
  }

  if (exercise.kind === 'quickClassification') {
    return {
      ...exercise,
      prompt: `${label} (${categoryLabel}): ${exercise.prompt}`,
      items: rotateArray(exercise.items, Math.max(1, attemptNumber))
    };
  }

  if (exercise.kind === 'matchingPairs') {
    return {
      ...exercise,
      prompt: `${label} (${categoryLabel}): ${exercise.prompt}`,
      rightItems: rotateArray(exercise.rightItems, Math.max(1, attemptNumber))
    };
  }

  if (exercise.kind === 'memoryMatch') {
    return {
      ...exercise,
      prompt: `${label} (${categoryLabel}): ${exercise.prompt}`,
      pairs: rotateArray(exercise.pairs, Math.max(1, attemptNumber))
    };
  }

  if (exercise.kind === 'speakingPrompt' || exercise.kind === 'writingPrompt') {
    return {
      ...exercise,
      prompt: `${label} (${categoryLabel}): ${exercise.prompt}`
    };
  }

  return exercise;
}

function getCueDisplay(cue: string): { primary: string; secondary?: string } {
  const key = cue.trim();
  const translated = frenchNumberMap[key];
  if (translated) {
    return { primary: key, secondary: translated };
  }
  return { primary: cue };
}

function buildActivationQuestions(lesson: StructuredLessonContent): QuizQuestion[] {
  const vocabA = lesson.vocabularyTargets[0] ?? 'bonjour';
  const vocabB = lesson.vocabularyTargets[1] ?? 'merci';
  const grammarA = lesson.grammarTargets[0] ?? 'je suis';

  if (lesson.levelId === 'foundation') {
    const foundationKey = lesson.curriculumLessonId ?? lesson.id;
    if (foundationKey.includes('alphabet')) {
      return [
        {
          id: 'activation-1',
          prompt: 'Choose the French greeting word.',
          options: ['Bonjour', 'Hello', 'Good evening', 'Thanks'],
          correctIndex: 0
        },
        {
          id: 'activation-2',
          prompt: 'Choose the fruit word in French.',
          options: ['pomme', 'apple', 'orange juice', 'banana bread'],
          correctIndex: 0
        },
        {
          id: 'activation-3',
          prompt: 'Choose a common French sound group.',
          options: ['ou', 'kr', 'pt', 'zx'],
          correctIndex: 0
        }
      ];
    }
    if (foundationKey.includes('greetings')) {
      return [
        {
          id: 'activation-1',
          prompt: 'You meet someone in daytime. Choose the best greeting.',
          options: ['Bonjour', 'Bonsoir', 'Merci', 'Au revoir'],
          correctIndex: 0
        },
        {
          id: 'activation-2',
          prompt: 'Choose the word for "thank you".',
          options: ['Merci', 'Bonjour', "S'il vous plaît", 'Pardon'],
          correctIndex: 0
        },
        {
          id: 'activation-3',
          prompt: 'Choose the polite phrase for "please".',
          options: ["S'il vous plaît", 'Merci', 'Bonjour', 'Salut'],
          correctIndex: 0
        }
      ];
    }
    if (foundationKey.includes('introducing')) {
      return [
        {
          id: 'activation-1',
          prompt: 'Choose the phrase to say your name.',
          options: ["Je m'appelle", 'Je suis de', 'Merci beaucoup', 'Au revoir'],
          correctIndex: 0
        },
        {
          id: 'activation-2',
          prompt: 'Choose the phrase to say where you are from.',
          options: ['Je viens de', "Je m'appelle", 'Je parle', 'Je vais'],
          correctIndex: 0
        },
        {
          id: 'activation-3',
          prompt: 'Choose a simple self-introduction opening.',
          options: ['Bonjour', 'Numéro', 'Dix-sept', 'Bonsoir merci'],
          correctIndex: 0
        }
      ];
    }
    if (foundationKey.includes('numbers')) {
      return [
        {
          id: 'activation-1',
          prompt: 'Choose the French word for 10.',
          options: ['dix', 'douze', 'vingt', 'deux'],
          correctIndex: 0
        },
        {
          id: 'activation-2',
          prompt: 'Choose the French word for 20.',
          options: ['vingt', 'dix-sept', 'neuf', 'onze'],
          correctIndex: 0
        },
        {
          id: 'activation-3',
          prompt: 'Choose the French word for 17.',
          options: ['dix-sept', 'sept-dix', 'seize', 'vingt'],
          correctIndex: 0
        }
      ];
    }

    return [
      {
        id: 'activation-1',
        prompt: 'Warm-up: choose the French word.',
        options: [vocabA, 'hello', 'teacher', 'airport'],
        correctIndex: 0
      },
      {
        id: 'activation-2',
        prompt: 'Warm-up: choose the common polite French expression.',
        options: [vocabB, 'good morning', 'thank you very much', 'see you tomorrow'],
        correctIndex: 0
      },
      {
        id: 'activation-3',
        prompt: 'Warm-up: choose the correct French structure.',
        options: [grammarA, 'Je est à Montréal.', 'Tu suis à la maison.', 'Nous est en classe.'],
        correctIndex: 0
      }
    ];
  }

  return [
    {
      id: 'activation-1',
      prompt: 'Warm-up: pick a French expression from this lesson.',
      options: [vocabA, 'thank you', 'good night', 'good afternoon'],
      correctIndex: 0
    },
    {
      id: 'activation-2',
      prompt: 'Warm-up: choose the most grammatically correct form.',
      options: [grammarA, 'je est', 'tu suis', 'nous est'],
      correctIndex: 0
    },
    {
      id: 'activation-3',
      prompt: 'Warm-up listening recall: identify a target word.',
      options: [vocabB, 'window', 'airport', 'building'],
      correctIndex: 0
    }
  ];
}

function buildMasteryQuestions(lesson: StructuredLessonContent): QuizQuestion[] {
  const vocab = lesson.vocabularyTargets.slice(0, 5);
  while (vocab.length < 5) vocab.push('bonjour');
  const grammar = lesson.grammarTargets.slice(0, 3);
  while (grammar.length < 3) grammar.push('je suis');

  if (lesson.levelId === 'foundation') {
    const foundationKey = lesson.curriculumLessonId ?? lesson.id;
    if (foundationKey.includes('alphabet')) {
      return [
        {
          id: 'mastery-1',
          prompt: 'Choose the French greeting.',
          options: ['Bonjour', 'Good night', 'Welcome', 'Please'],
          correctIndex: 0
        },
        {
          id: 'mastery-2',
          prompt: 'Choose the French fruit word.',
          options: ['pomme', 'fruit', 'apple', 'banana milk'],
          correctIndex: 0
        },
        {
          id: 'mastery-3',
          prompt: 'Choose a common French sound group.',
          options: ['ai', 'kr', 'pt', 'xt'],
          correctIndex: 0
        },
        {
          id: 'mastery-4',
          prompt: 'How many letters are in the French alphabet?',
          options: ['26', '24', '25', '27'],
          correctIndex: 0
        },
        {
          id: 'mastery-5',
          prompt: 'Choose another common French sound group.',
          options: ['ou', 'zb', 'kk', 'tt'],
          correctIndex: 0
        }
      ];
    }
    if (foundationKey.includes('greetings')) {
      return [
        {
          id: 'mastery-1',
          prompt: 'Choose the daytime greeting.',
          options: ['Bonjour', 'Bonsoir', 'Merci', 'Au revoir'],
          correctIndex: 0
        },
        {
          id: 'mastery-2',
          prompt: 'Choose the evening greeting.',
          options: ['Bonsoir', 'Bonjour', 'Merci', "S'il vous plaît"],
          correctIndex: 0
        },
        {
          id: 'mastery-3',
          prompt: 'Choose the phrase for "thank you".',
          options: ['Merci', 'Bonjour', 'Au revoir', 'Salut'],
          correctIndex: 0
        },
        {
          id: 'mastery-4',
          prompt: 'Choose the phrase for "please".',
          options: ["S'il vous plaît", 'Merci', 'Bonsoir', 'Pardon'],
          correctIndex: 0
        },
        {
          id: 'mastery-5',
          prompt: 'Choose a polite closing phrase.',
          options: ['Au revoir', 'Merci', 'Bonjour', 'Suis'],
          correctIndex: 0
        }
      ];
    }
    if (foundationKey.includes('introducing')) {
      return [
        {
          id: 'mastery-1',
          prompt: 'Choose the phrase for "My name is...".',
          options: ["Je m'appelle", 'Je viens de', 'Je parle', 'Je vais'],
          correctIndex: 0
        },
        {
          id: 'mastery-2',
          prompt: 'Choose the phrase for "I am from...".',
          options: ['Je viens de', "Je m'appelle", 'Je suis de', 'Je parle de'],
          correctIndex: 0
        },
        {
          id: 'mastery-3',
          prompt: 'Choose a correct intro sentence.',
          options: ["Je m'appelle Lina.", 'Je appelle Lina.', 'Je suis appelle Lina.', 'Mon nom appelle Lina.'],
          correctIndex: 0
        },
        {
          id: 'mastery-4',
          prompt: 'Choose a correct origin sentence.',
          options: ['Je viens du Canada.', 'Je suis Canada.', 'Je vais Canada.', 'Je parle Canada.'],
          correctIndex: 0
        },
        {
          id: 'mastery-5',
          prompt: 'Choose the best opening for introduction.',
          options: ['Bonjour', 'Vingt', 'Numéro', 'Merci revoir'],
          correctIndex: 0
        }
      ];
    }
    if (foundationKey.includes('numbers')) {
      return [
        {
          id: 'mastery-1',
          prompt: 'Choose the French word for 10.',
          options: ['dix', 'douze', 'deux', 'vingt'],
          correctIndex: 0
        },
        {
          id: 'mastery-2',
          prompt: 'Choose the French word for 12.',
          options: ['douze', 'dix', 'onze', 'seize'],
          correctIndex: 0
        },
        {
          id: 'mastery-3',
          prompt: 'Choose the French word for 17.',
          options: ['dix-sept', 'sept-dix', 'quinze', 'vingt'],
          correctIndex: 0
        },
        {
          id: 'mastery-4',
          prompt: 'Choose the French word for 20.',
          options: ['vingt', 'dix-huit', 'treize', 'neuf'],
          correctIndex: 0
        },
        {
          id: 'mastery-5',
          prompt: 'Which one is a French number word?',
          options: ['onze', 'twelve', 'seventeen', 'twenty'],
          correctIndex: 0
        }
      ];
    }

    return [
      {
        id: 'mastery-1',
        prompt: 'Choose the French word.',
        options: [vocab[0], 'book', 'street', 'computer'],
        correctIndex: 0
      },
      {
        id: 'mastery-2',
        prompt: 'Choose a French expression from this lesson.',
        options: [vocab[1], 'good morning', 'my classroom', 'next week'],
        correctIndex: 0
      },
      {
        id: 'mastery-3',
        prompt: 'Choose the correct beginner French pattern.',
        options: [grammar[0], 'Je est ici.', 'Tu suis au travail.', 'Nous est prêts.'],
        correctIndex: 0
      },
      {
        id: 'mastery-4',
        prompt: 'Choose another French item.',
        options: [vocab[2], 'airport', 'customer', 'receipt'],
        correctIndex: 0
      },
      {
        id: 'mastery-5',
        prompt: 'Choose the correct French item again.',
        options: [vocab[3], 'office table', 'my ticket', 'daily schedule'],
        correctIndex: 0
      }
    ];
  }

  return [
    {
      id: 'mastery-1',
      prompt: 'Select a valid lesson expression.',
      options: [vocab[0], 'good evening', 'thank you now', 'next week'],
      correctIndex: 0
    },
    {
      id: 'mastery-2',
      prompt: 'Choose the correct grammar pattern.',
      options: [grammar[0], 'je est', 'nous suis', 'tu sommes'],
      correctIndex: 0
    },
    {
      id: 'mastery-3',
      prompt: 'Pick the best formal phrase.',
      options: [vocab[1], 'yo', 'later', 'ok bye'],
      correctIndex: 0
    },
    {
      id: 'mastery-4',
      prompt: 'Choose the most functional sentence start.',
      options: [grammar[1], 'Je est', 'Tu suis', 'Nous est'],
      correctIndex: 0
    },
    {
      id: 'mastery-5',
      prompt: 'Identify a useful daily-use French word.',
      options: [vocab[2], 'quickly', 'window', 'carefully'],
      correctIndex: 0
    }
  ];
}

function buildRetryMasteryQuestions(
  questions: QuizQuestion[],
  selections: Record<string, number>,
  attemptRound: number
): QuizQuestion[] {
  return questions
    .filter((question) => selections[question.id] !== question.correctIndex)
    .map((question, index) => {
      const optionMeta = question.options.map((option, optionIndex) => ({
        option,
        isCorrect: optionIndex === question.correctIndex
      }));
      const rotated = rotateArray(optionMeta, attemptRound + index + 1);
      const nextCorrectIndex = rotated.findIndex((item) => item.isCorrect);
      return {
        id: `${question.id}-retry-${attemptRound}-${index}`,
        prompt: `Retry (${attemptRound}) - ${question.prompt}`,
        options: rotated.map((item) => item.option),
        correctIndex: Math.max(0, nextCorrectIndex)
      };
    });
}

function derivePreviousLessonId(lesson: StructuredLessonContent): string | null {
  const currentId = lesson.curriculumLessonId ?? lesson.id;
  const foundationOrder = ['alphabet-sounds', 'basic-greetings', 'introducing-yourself', 'numbers-0-20'];
  const foundationIndex = foundationOrder.indexOf(currentId);
  if (foundationIndex > 0) {
    return foundationOrder[foundationIndex - 1] ?? null;
  }

  const numbered = currentId.match(/^(a1|a2|b1|clb5|clb7)-lesson-(\d+)$/);
  if (numbered) {
    const track = numbered[1];
    const lessonNum = Number(numbered[2]);
    if (Number.isFinite(lessonNum) && lessonNum > 1) {
      return `${track}-lesson-${lessonNum - 1}`;
    }
  }

  return null;
}

function createSteps(lesson: StructuredLessonContent): RuntimeStep[] {
  const steps: RuntimeStep[] = [
    {
      id: `${lesson.id}-activation`,
      kind: 'activation',
      phase: 'review',
      title: 'Phase 1 - Activation (3 min)',
      subtitle: 'Quick recall from your previous learning.'
    },
    {
      id: `${lesson.id}-intro`,
      kind: 'intro',
      phase: 'learn',
      title: 'Phase 2 - Core Teaching (6 min)',
      subtitle: 'One rule, clear examples, immediate listening and speaking.'
    }
  ];

  lesson.blocks.forEach((block, blockIndex) => {
    (block.teachingSegments ?? []).forEach((segment) => {
      steps.push({
        id: `${block.id}-${segment.id}`,
        kind: 'learn_segment',
        phase: 'learn',
        title: segment.title,
        subtitle: segment.explanation,
        blockIndex,
        segmentId: segment.id,
        segment
      });
    });

    const blockExercises: Exercise[] = [
      ...(block.exercises ?? []),
      ...(block.productionTask ? [block.productionTask.exercise] : [])
    ];

    blockExercises.forEach((exercise) => {
      steps.push({
        id: `${block.id}-${exercise.id}`,
        kind: 'exercise',
        phase: block.type === 'production' ? 'speak' : phaseForExercise(exercise),
        title: exercise.prompt,
        subtitle:
          block.type === 'practice'
            ? 'Phase 3 - Controlled Practice (7 min)'
            : block.type === 'production'
              ? 'Phase 4 - Production (6 min)'
              : block.type === 'miniTest'
                ? 'Phase 5 - Mastery Check (3 min)'
                : undefined,
        blockIndex,
        exerciseId: exercise.id,
        exercise
      });
    });
  });

  steps.push({
    id: `${lesson.id}-mastery`,
    kind: 'review_block',
    phase: 'review',
    title: 'Phase 5 - Mastery Check (3 min)',
    subtitle: 'Fast pressure check before completion.'
  });

  steps.push({
    id: `${lesson.id}-completion`,
    kind: 'completion',
    phase: 'review',
    title: 'Session Complete',
    subtitle: 'Submit your 25-minute performance session.'
  });

  return steps;
}

export function StructuredLessonScreen({ lessonId, onComplete }: Props) {
  const lesson = useMemo(() => getStructuredLessonById(lessonId), [lessonId]);
  const { user } = useAuth();
  const { selectedCompanion } = useCompanion();
  const { ensureFocusStarted } = useFocusSession();
  const { recordPerformanceFeedback } = useCurriculumProgress();
  const { markLessonVisit, markLessonComplete, recordError } = useLessonNotes();

  const [session, setSession] = useState(() => (lesson ? createLessonSessionState(lesson) : null));
  const [stepIndex, setStepIndex] = useState(0);
  const [choiceSelections, setChoiceSelections] = useState<Record<string, number>>({});
  const [textInputs, setTextInputs] = useState<Record<string, string>>({});
  const [matchingSelectedLeft, setMatchingSelectedLeft] = useState<Record<string, string | null>>({});
  const [matchingPairMaps, setMatchingPairMaps] = useState<Record<string, Record<string, string>>>({});
  const [sentenceOrderedTokens, setSentenceOrderedTokens] = useState<Record<string, string[]>>({});
  const [sentenceUsedIndexes, setSentenceUsedIndexes] = useState<Record<string, number[]>>({});
  const [quickSelectedCategory, setQuickSelectedCategory] = useState<Record<string, string | null>>({});
  const [quickAssignments, setQuickAssignments] = useState<Record<string, Record<string, string>>>({});
  const [memoryRevealedIds, setMemoryRevealedIds] = useState<Record<string, string[]>>({});
  const [memoryMatchedPairIds, setMemoryMatchedPairIds] = useState<Record<string, string[]>>({});
  const [memoryCompletedPairs, setMemoryCompletedPairs] = useState<Record<string, Array<{ leftId: string; rightId: string }>>>({});
  const [submittedSteps, setSubmittedSteps] = useState<Record<string, boolean>>({});
  const [interactedSteps, setInteractedSteps] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'warning' | 'neutral'; message: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [aiCheckLoading, setAiCheckLoading] = useState(false);
  const [recordingUriByExercise, setRecordingUriByExercise] = useState<Record<string, string>>({});
  const [recordingBase64ByExercise, setRecordingBase64ByExercise] = useState<Record<string, string>>({});
  const [aiSummaryByExercise, setAiSummaryByExercise] = useState<Record<string, string>>({});
  const [targetClb, setTargetClb] = useState<5 | 7>(5);
  const [performanceFeedbackByExercise, setPerformanceFeedbackByExercise] = useState<Record<string, CLBPerformanceFeedback>>({});

  const activationSourceLesson = useMemo(() => {
    if (!lesson) return null;
    const previousLessonId = derivePreviousLessonId(lesson);
    if (!previousLessonId) return lesson;
    return getStructuredLessonById(previousLessonId) ?? lesson;
  }, [lesson]);

  const activationQuestions = useMemo(
    () => (activationSourceLesson ? buildActivationQuestions(activationSourceLesson) : []),
    [activationSourceLesson]
  );
  const [activationSelections, setActivationSelections] = useState<Record<string, number>>({});
  const [activationChecked, setActivationChecked] = useState(false);
  const [activationQuestionIndex, setActivationQuestionIndex] = useState(0);

  const masteryQuestions = useMemo(() => (lesson ? buildMasteryQuestions(lesson) : []), [lesson]);
  const [masterySelections, setMasterySelections] = useState<Record<string, number>>({});
  const [masteryChecked, setMasteryChecked] = useState(false);
  const [masteryScore, setMasteryScore] = useState(0);
  const [masteryQuestionIndex, setMasteryQuestionIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState<'mastery' | 'retry'>('mastery');
  const [reviewAttemptRound, setReviewAttemptRound] = useState(0);
  const [retryQuestions, setRetryQuestions] = useState<QuizQuestion[]>([]);
  const [retrySelections, setRetrySelections] = useState<Record<string, number>>({});
  const [retryChecked, setRetryChecked] = useState(false);
  const [retryQuestionIndex, setRetryQuestionIndex] = useState(0);
  const [retryExerciseVariants, setRetryExerciseVariants] = useState<Record<string, Exercise>>({});
  const [practiceRecoveryQueue, setPracticeRecoveryQueue] = useState<string[]>([]);
  const [practiceRecoveryCursor, setPracticeRecoveryCursor] = useState(0);
  const [practiceRecoveryActive, setPracticeRecoveryActive] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const webMediaRecorderRef = useRef<any>(null);
  const webMediaStreamRef = useRef<any>(null);
  const webChunksRef = useRef<any[]>([]);
  const [webRecordingExerciseId, setWebRecordingExerciseId] = useState<string | null>(null);
  const autoPlayedSegmentSteps = useRef<Record<string, boolean>>({});
  const coachPulse = useRef(new Animated.Value(1)).current;

  const steps = useMemo(() => (lesson ? createSteps(lesson) : []), [lesson]);
  const canadaTemplate = useMemo(() => (lesson ? resolveCanadianPhaseTemplate(lesson) : null), [lesson]);
  const currentStep = steps[Math.min(stepIndex, Math.max(0, steps.length - 1))];
  const exerciseStepIndexByExerciseId = useMemo(() => {
    const map: Record<string, number> = {};
    steps.forEach((step, index) => {
      if (step.kind === 'exercise' && step.exerciseId) {
        map[step.exerciseId] = index;
      }
    });
    return map;
  }, [steps]);

  useEffect(() => {
    if (!lesson) return;
    ensureFocusStarted();
    markLessonVisit({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      levelId: lesson.levelId,
      objectives: lesson.outcomes,
      grammarTargets: lesson.grammarTargets,
      vocabulary: lesson.vocabularyTargets
    });
  }, [ensureFocusStarted, lesson, markLessonVisit]);

  useEffect(() => {
    let mounted = true;
    if (!user?.uid) return () => undefined;

    void (async () => {
      const profile = await loadUserOnboardingProfile(user.uid);
      if (!mounted) return;
      if (profile?.targetClb === 5 || profile?.targetClb === 7) {
        setTargetClb(profile.targetClb);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  useEffect(() => {
    void setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(coachPulse, { toValue: 1.04, duration: 850, useNativeDriver: true }),
        Animated.timing(coachPulse, { toValue: 1, duration: 850, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [coachPulse]);

  if (!lesson || !session || !currentStep) {
    return (
      <View style={styles.fallbackWrap}>
        <Text style={styles.fallbackText}>Lesson not found.</Text>
      </View>
    );
  }

  const baseExercise = currentStep.exercise;
  const currentExercise = baseExercise ? retryExerciseVariants[baseExercise.id] ?? baseExercise : undefined;
  const currentStepSubmitted = submittedSteps[currentStep.id] === true;

  const alignSessionToCurrentExercise = (input: typeof session) => {
    if (!currentStep.exercise || currentStep.blockIndex == null) {
      return input;
    }

    const blockExercises = getCurrentBlockExercises(lesson, currentStep.blockIndex);
    const exerciseIndex = blockExercises.findIndex((item) => item.id === currentStep.exercise?.id);
    if (exerciseIndex < 0) {
      return input;
    }

    return {
      ...input,
      blockIndex: currentStep.blockIndex,
      exerciseIndex
    };
  };

  const triggerSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 420);
  };

  const advanceStep = () => {
    setFeedback(null);
    setShowSuccess(false);
    setStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const submitExercise = (
    submission: Parameters<typeof applyExerciseSubmission>[2],
    options?: { feedbackOverride?: string; toneOverride?: 'success' | 'warning' | 'neutral' }
  ) => {
    const alignedSession = alignSessionToCurrentExercise(session);
    const result = applyExerciseSubmission(lesson, alignedSession, submission, {
      exerciseOverride: currentExercise
    });
    setSession(result.next);

    const attempts = currentStep.exercise?.id ? result.next.exerciseStates[currentStep.exercise.id]?.attempts ?? 1 : 1;
    const currentBlockType = currentStep.blockIndex != null ? lesson.blocks[currentStep.blockIndex]?.type : undefined;
    const practiceHardGate = currentBlockType === 'practice' && !result.evaluation.correct && attempts < 2;

    if (!result.evaluation.correct) {
      recordError({
        lessonId: lesson.id,
        exerciseId: result.currentExercise?.id ?? currentStep.id,
        prompt: result.currentExercise?.prompt ?? currentStep.title,
        message: result.evaluation.feedback
      });
    }

    if (!practiceHardGate) {
      setSubmittedSteps((prev) => ({ ...prev, [currentStep.id]: true }));
    }

    setFeedback({
      tone: options?.toneOverride ?? (result.evaluation.correct ? 'success' : 'warning'),
      message:
        options?.feedbackOverride ??
        (practiceHardGate
          ? `${selectedCompanion.name}: ${result.evaluation.companionHint ?? 'A new retry drill is generated for this mistake. Solve it to lock this pattern.'}`
          : result.evaluation.correct
            ? result.evaluation.feedback
            : attempts >= 2 && currentStep.phase === 'practice'
              ? `${selectedCompanion.name}: We will continue, and this item is saved for retry. ${result.evaluation.companionHint ?? result.evaluation.feedback}`
              : `${selectedCompanion.name}: ${result.evaluation.companionHint ?? result.evaluation.feedback}`)
    });

    if (result.evaluation.correct) {
      if (currentStep.exercise?.id) {
        setRetryExerciseVariants((prev) => {
          if (!prev[currentStep.exercise!.id]) return prev;
          const next = { ...prev };
          delete next[currentStep.exercise!.id];
          return next;
        });
      }
      triggerSuccess();
    } else if (practiceHardGate && currentExercise && currentStep.exercise?.id) {
      const category = inferRetryCategory(currentExercise, lesson);
      const variant = buildAdaptiveRetryVariant(currentExercise, lesson, category, attempts + 1);
      setRetryExerciseVariants((prev) => ({ ...prev, [currentStep.exercise!.id]: variant }));
    }
  };

  const startRecording = async (exerciseId: string) => {
    if (Platform.OS === 'web') {
      try {
        const mediaDevices = (globalThis as any)?.navigator?.mediaDevices;
        const MediaRecorderCtor = (globalThis as any)?.MediaRecorder;
        if (!mediaDevices?.getUserMedia || !MediaRecorderCtor) {
          setFeedback({ tone: 'warning', message: 'Browser recording is not available on this device/browser.' });
          return;
        }

        const stream = await mediaDevices.getUserMedia({ audio: true });
        webMediaStreamRef.current = stream;
        webChunksRef.current = [];

        const mediaRecorder = new MediaRecorderCtor(stream);
        webMediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (event: any) => {
          if (event?.data && event.data.size > 0) {
            webChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const BlobCtor = (globalThis as any).Blob;
          const URLApi = (globalThis as any).URL;
          const blob = new BlobCtor(webChunksRef.current, { type: mimeType });
          const blobUrl = URLApi.createObjectURL(blob);
          setRecordingUriByExercise((prev) => ({ ...prev, [exerciseId]: blobUrl }));

          const FileReaderCtor = (globalThis as any).FileReader;
          const reader = new FileReaderCtor();
          reader.onloadend = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            const base64 = result.includes(',') ? result.split(',')[1] ?? '' : '';
            setRecordingBase64ByExercise((prev) => ({ ...prev, [exerciseId]: base64 }));
            setAiSummaryByExercise((prev) => ({
              ...prev,
              [exerciseId]: 'Recording captured (web). Press Check Answer for AI speaking analysis.'
            }));
          };
          reader.readAsDataURL(blob);

          if (webMediaStreamRef.current) {
            const tracks = webMediaStreamRef.current.getTracks?.() ?? [];
            tracks.forEach((track: any) => track.stop?.());
            webMediaStreamRef.current = null;
          }
          setWebRecordingExerciseId(null);
        };

        mediaRecorder.start();
        setWebRecordingExerciseId(exerciseId);
        setAiSummaryByExercise((prev) => ({ ...prev, [exerciseId]: 'Recording in progress (web)...' }));
      } catch {
        setFeedback({ tone: 'warning', message: 'Could not start browser recording. Check microphone permission.' });
      }
      return;
    }

    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setFeedback({ tone: 'warning', message: 'Microphone permission is required for speaking checks.' });
      return;
    }

    await recorder.prepareToRecordAsync();
    recorder.record();
    setAiSummaryByExercise((prev) => ({ ...prev, [exerciseId]: 'Recording in progress...' }));
  };

  const stopRecording = async (exerciseId: string) => {
    if (Platform.OS === 'web') {
      const rec = webMediaRecorderRef.current;
      if (rec && rec.state !== 'inactive') {
        rec.stop();
      } else {
        setWebRecordingExerciseId(null);
      }
      return;
    }

    await recorder.stop();
    const status = recorder.getStatus();
    const uri = status.url ?? recorderState.url;
    if (!uri) {
      setFeedback({ tone: 'warning', message: 'Recording save failed. Please try again.' });
      return;
    }

    setRecordingUriByExercise((prev) => ({ ...prev, [exerciseId]: uri }));
    setAiSummaryByExercise((prev) => ({ ...prev, [exerciseId]: 'Recording captured. Press Check Answer for AI speaking analysis.' }));
  };

  const onContinueAfterExercise = () => {
    if (practiceRecoveryActive && currentExercise?.id) {
      const currentCorrect = session.exerciseStates[currentExercise.id]?.correct === true;
      if (!currentCorrect) {
        setFeedback({
          tone: 'warning',
          message: `${selectedCompanion.name}: This item is still incorrect. Review the hint and try it again.`
        });
        return;
      }

      const nextCursor = practiceRecoveryCursor + 1;
      if (nextCursor < practiceRecoveryQueue.length) {
        const nextExerciseId = practiceRecoveryQueue[nextCursor];
        const nextStepIndex = nextExerciseId ? exerciseStepIndexByExerciseId[nextExerciseId] : undefined;
        setPracticeRecoveryCursor(nextCursor);
        if (typeof nextStepIndex === 'number') {
          setStepIndex(nextStepIndex);
          setFeedback({
            tone: 'success',
            message: `${selectedCompanion.name}: Good correction. Continue with the next missed question.`
          });
          return;
        }
      }

      setPracticeRecoveryActive(false);
      setPracticeRecoveryQueue([]);
      setPracticeRecoveryCursor(0);
      const completionIndex = steps.findIndex((step) => step.kind === 'completion');
      setStepIndex(completionIndex >= 0 ? completionIndex : steps.length - 1);
      setFeedback({
        tone: 'success',
        message: `${selectedCompanion.name}: Reinforcement round complete. Submit your session result.`
      });
      return;
    }

    const alignedSession = alignSessionToCurrentExercise(session);
    const progressed = continueLesson(lesson, alignedSession);
    setSession(progressed);
    advanceStep();
  };

  const practiceExerciseIds = useMemo(
    () =>
      steps
        .filter((s) => s.kind === 'exercise' && s.phase === 'practice' && s.exerciseId)
        .map((s) => s.exerciseId as string),
    [steps]
  );

  const practicePercent = useMemo(() => {
    if (!practiceExerciseIds.length) return 100;
    const correct = practiceExerciseIds.reduce((acc, id) => acc + (session.exerciseStates[id]?.correct ? 1 : 0), 0);
    return Math.round((correct / practiceExerciseIds.length) * 100);
  }, [practiceExerciseIds, session.exerciseStates]);

  const exercisePromptById = useMemo(() => {
    const map: Record<string, string> = {};
    steps.forEach((step) => {
      if (step.kind === 'exercise' && step.exerciseId && step.exercise?.prompt) {
        map[step.exerciseId] = step.exercise.prompt;
      }
    });
    return map;
  }, [steps]);

  const practiceSummaryItems = useMemo(
    () =>
      practiceExerciseIds.map((id) => {
        const prompt = exercisePromptById[id] ?? id;
        const state = session.exerciseStates[id];
        return {
          id,
          prompt: prompt.length > 88 ? `${prompt.slice(0, 88)}...` : prompt,
          correct: state?.correct === true,
          attempts: state?.attempts ?? 0
        };
      }),
    [exercisePromptById, practiceExerciseIds, session.exerciseStates]
  );

  const practiceCorrectCount = useMemo(
    () => practiceSummaryItems.reduce((acc, item) => acc + (item.correct ? 1 : 0), 0),
    [practiceSummaryItems]
  );

  const finishLesson = () => {
    const scorePercent = getLessonScorePercent(session);
    const masteryPercent = masteryQuestions.length ? Math.round((masteryScore / masteryQuestions.length) * 100) : 100;
    const blended = Math.round(scorePercent * 0.7 + masteryPercent * 0.3);
    const productionOk = !lesson.assessment.productionRequired || session.productionCompleted;
    const practiceOk = practicePercent >= 70;
    const passed = blended >= lesson.assessment.masteryThresholdPercent && productionOk && practiceOk;

    if (!passed) {
      if (practiceRecoveryActive) {
        setFeedback({
          tone: 'warning',
          message: `${selectedCompanion.name}: Complete the reinforcement questions before finishing this lesson.`
        });
        return;
      }

      if (!productionOk) {
        setFeedback({
          tone: 'warning',
          message: `${selectedCompanion.name}: Complete the production task (speaking or writing) before finishing this lesson.`
        });
        return;
      }

      const importantRetryIds = steps
        .filter((step) => step.kind === 'exercise' && step.exerciseId)
        .map((step) => step.exerciseId as string)
        .filter((id) => {
          const state = session.exerciseStates[id];
          return state?.attempts > 0 && state.correct !== true;
        })
        .slice(0, 6);

      if (importantRetryIds.length > 0) {
        setPracticeRecoveryActive(true);
        setPracticeRecoveryQueue(importantRetryIds);
        setPracticeRecoveryCursor(0);

        setSubmittedSteps((prev) => {
          const next = { ...prev };
          importantRetryIds.forEach((exerciseId) => {
            const stepIndexForExercise = exerciseStepIndexByExerciseId[exerciseId];
            if (typeof stepIndexForExercise === 'number') {
              const step = steps[stepIndexForExercise];
              if (step?.id) delete next[step.id];
            }
          });
          return next;
        });

        const firstMissedExerciseId = importantRetryIds[0];
        const firstMissedStepIndex =
          firstMissedExerciseId != null ? exerciseStepIndexByExerciseId[firstMissedExerciseId] : undefined;

        if (typeof firstMissedStepIndex === 'number') {
          setStepIndex(firstMissedStepIndex);
        }

        setFeedback({
          tone: 'warning',
          message:
            practiceOk
              ? `${selectedCompanion.name}: You are close. Retry only important missed parts now.`
              : `${selectedCompanion.name}: Practice is ${practicePercent}%. Retry only important missed parts to reach 70%+.`
        });
        return;
      }
    }

    const evaluatedExerciseStates = Object.values(session.exerciseStates).filter((state) => state.attempts > 0);
    const missedCount = evaluatedExerciseStates.filter((state) => !state.correct).length;
    const minorCorrection = passed && missedCount <= 1;

    if (passed) {
      markLessonComplete({ lessonId: lesson.id });
    }

    onComplete?.({ passed, scorePercent: blended, lesson, minorCorrection });
  };

  const downloadLessonNotes = () => {
    if (Platform.OS !== 'web') return;
    const text = [
      `Lesson: ${lesson.title}`,
      `Level: ${lesson.levelId.toUpperCase()}`,
      '',
      'Objectives:',
      ...lesson.outcomes.map((item) => `- ${item}`),
      '',
      'Vocabulary:',
      ...lesson.vocabularyTargets.map((item) => `- ${item}`),
      '',
      'Grammar Targets:',
      ...lesson.grammarTargets.map((item) => `- ${item}`)
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${lesson.id}-notes.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const renderStepContent = () => {
    if (currentStep.kind === 'activation') {
      const currentQuestion = activationQuestions[activationQuestionIndex];
      if (!currentQuestion) return null;
      const selected = activationSelections[currentQuestion.id];

      return (
        <View style={styles.centeredStep}>
          <Text style={styles.questionCounter}>Question {activationQuestionIndex + 1} / {activationQuestions.length}</Text>
          <View style={styles.reviewQuestionWrap}>
            <Text style={styles.reviewPrompt}>{currentQuestion.prompt}</Text>
            <View style={styles.optionsWrap}>
              {currentQuestion.options.map((option, idx) => {
                let correctness: 'correct' | 'wrong' | null = null;
                if (activationChecked && idx === currentQuestion.correctIndex) correctness = 'correct';
                if (activationChecked && idx === selected && idx !== currentQuestion.correctIndex) correctness = 'wrong';
                return (
                  <OptionButton
                    key={`${currentQuestion.id}-${idx}`}
                    label={option}
                    selected={selected === idx}
                    disabled={activationChecked}
                    correctness={correctness}
                    onPress={() => {
                      setActivationSelections((prev) => ({ ...prev, [currentQuestion.id]: idx }));
                    }}
                  />
                );
              })}
            </View>
          </View>
          <View style={styles.inlineActions}>
            <Pressable
              onPress={() => setActivationQuestionIndex((prev) => Math.max(0, prev - 1))}
              style={styles.inlineBtn}
              disabled={activationQuestionIndex === 0}
            >
              <Text style={styles.inlineBtnText}>Previous</Text>
            </Pressable>
            <Pressable
              onPress={() => setActivationQuestionIndex((prev) => Math.min(activationQuestions.length - 1, prev + 1))}
              style={styles.inlineBtn}
              disabled={activationQuestionIndex >= activationQuestions.length - 1}
            >
              <Text style={styles.inlineBtnText}>Next</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (currentStep.kind === 'intro') {
      return (
        <View style={styles.centeredStep}>
          <Text style={styles.bigTitle}>{lesson.title}</Text>
          <Text style={styles.bodyText}>This session follows 25-minute performance rhythm: Activation, Core, Practice, Production, Mastery.</Text>
          {canadaTemplate ? (
            <View style={styles.contextCard}>
              <Text style={styles.contextTitle}>Real-Life Context</Text>
              <Text style={styles.contextLine}>Objective: {canadaTemplate.objective}</Text>
              <Text style={styles.contextLine}>Scenario: {canadaTemplate.context}</Text>
              <Text style={styles.contextLine}>Pronunciation focus: {canadaTemplate.pronunciationFocus}</Text>
              <Text style={styles.contextLine}>Common mistake: {canadaTemplate.commonMistake}</Text>
            </View>
          ) : null}
          <View style={styles.targetsWrap}>
            {lesson.outcomes.slice(0, 3).map((item) => (
              <View key={item} style={styles.targetChip}><Text style={styles.targetChipText}>{item}</Text></View>
            ))}
          </View>
        </View>
      );
    }

    if (currentStep.kind === 'learn_segment' && currentStep.segment) {
      const segment = currentStep.segment;
      const interacted = interactedSteps[currentStep.id] === true;
      const cues = segment.pronunciationCues?.slice(0, 9) ?? [];
      if (!autoPlayedSegmentSteps.current[currentStep.id]) {
        autoPlayedSegmentSteps.current[currentStep.id] = true;
        const spoken = segment.examples[0] ?? segment.pronunciationCues?.[0] ?? segment.title;
        void playPronunciation(spoken);
      }
      return (
        <View style={styles.centeredStep}>
          <Text style={styles.bigTitle}>{segment.title}</Text>
          <Text style={styles.bodyText}>{segment.explanation}</Text>
          {!!segment.funFact ? <Text style={styles.hintText}>Fun Fact: {segment.funFact}</Text> : null}
          {cues.length ? (
            <View style={styles.cueGrid}>
              {cues.map((cue) => {
                const display = getCueDisplay(cue);
                return (
                  <Pressable
                    key={`${currentStep.id}-${cue}`}
                    onPress={() => {
                      setInteractedSteps((prev) => ({ ...prev, [currentStep.id]: true }));
                      void playPronunciation(display.secondary ?? cue);
                    }}
                    style={styles.cueChip}
                  >
                    <Text style={styles.cueChipText}>{display.primary}</Text>
                    {display.secondary ? <Text style={styles.cueChipSubText}>{display.secondary}</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <View style={styles.examplesWrap}>
            {segment.examples.slice(0, 2).map((example) => (
              <Pressable
                key={example}
                onPress={() => {
                  setInteractedSteps((prev) => ({ ...prev, [currentStep.id]: true }));
                  void playPronunciation(example);
                }}
                style={styles.exampleBtn}
              >
                <Text style={styles.exampleText}>{example}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() => {
              setInteractedSteps((prev) => ({ ...prev, [currentStep.id]: true }));
              const spoken = segment.examples[0] ?? segment.title;
              void playPronunciation(spoken);
              setFeedback({ tone: 'neutral', message: 'Listen and repeat once before continue.' });
            }}
            style={styles.audioBtn}
          >
            <Text style={styles.audioText}>Play Audio</Text>
          </Pressable>
          {canadaTemplate ? <Text style={styles.hintText}>Functional task: {canadaTemplate.functionalTask}</Text> : null}
          {segment.companionTip ? <Text style={styles.tipText}>{selectedCompanion.emoji} {segment.companionTip}</Text> : null}
          {!interacted ? <Text style={styles.hintText}>Tap an example or audio to unlock continue.</Text> : null}
        </View>
      );
    }

    if (currentStep.kind === 'exercise' && currentExercise) {
      const selectedIndex = choiceSelections[currentExercise.id];
      const textValue = textInputs[currentExercise.id] ?? '';

      if (
        currentExercise.kind === 'multipleChoice' ||
        currentExercise.kind === 'listeningPrompt' ||
        currentExercise.kind === 'readingComprehension'
      ) {
        return (
          <View style={styles.interactiveStep}>
            {currentExercise.readingPassage ? <Text style={styles.passage}>{currentExercise.readingPassage}</Text> : null}
            <View style={styles.optionsWrap}>
              {currentExercise.options.map((option, idx) => {
                let correctness: 'correct' | 'wrong' | null = null;
                if (currentStepSubmitted && idx === currentExercise.correctOptionIndex) correctness = 'correct';
                if (currentStepSubmitted && idx === selectedIndex && idx !== currentExercise.correctOptionIndex) correctness = 'wrong';
                return (
                  <OptionButton
                    key={`${currentExercise.id}-${idx}`}
                    label={option}
                    selected={selectedIndex === idx}
                    correctness={correctness}
                    disabled={currentStepSubmitted}
                    onPress={() => {
                      setChoiceSelections((prev) => ({ ...prev, [currentExercise.id]: idx }));
                    }}
                  />
                );
              })}
            </View>
            {currentExercise.kind === 'listeningPrompt' ? (
              <Pressable
                onPress={() => {
                  void playPronunciation(currentExercise.audioText ?? currentExercise.prompt);
                }}
                style={styles.audioBtn}
              >
                <Text style={styles.audioText}>Play Listening Audio</Text>
              </Pressable>
            ) : null}
          </View>
        );
      }

      if (currentExercise.kind === 'matchingPairs') {
        const pairMap = matchingPairMaps[currentExercise.id] ?? {};
        const nextUnmatchedLeft = currentExercise.leftItems.find((item) => !pairMap[item.id]) ?? null;

        return (
          <View style={styles.interactiveStep}>
            {currentExercise.instructions ? <Text style={styles.hintText}>{currentExercise.instructions}</Text> : null}
            <Text style={styles.questionCounter}>
              Pair {Math.min(Object.keys(pairMap).length + 1, currentExercise.correctPairs.length)} / {currentExercise.correctPairs.length}
            </Text>
            {nextUnmatchedLeft ? (
              <View style={styles.promptCard}>
                <Text style={styles.miniLabel}>Match this item</Text>
                <Text style={styles.promptCardText}>{nextUnmatchedLeft.label}</Text>
              </View>
            ) : (
              <Text style={styles.hintText}>All pairs selected. Press Check Answer.</Text>
            )}
            <View style={styles.optionsWrap}>
              {currentExercise.rightItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (currentStepSubmitted || !nextUnmatchedLeft) return;
                    setMatchingPairMaps((prev) => ({
                      ...prev,
                      [currentExercise.id]: { ...(prev[currentExercise.id] ?? {}), [nextUnmatchedLeft.id]: item.id }
                    }));
                  }}
                  style={styles.matchChip}
                >
                  <Text style={styles.matchChipText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.inlineActions}>
              <Pressable
                onPress={() => {
                  const entries = Object.entries(pairMap);
                  if (!entries.length) return;
                  const next = { ...pairMap };
                  const lastKey = entries[entries.length - 1]?.[0];
                  if (lastKey) delete next[lastKey];
                  setMatchingPairMaps((prev) => ({ ...prev, [currentExercise.id]: next }));
                }}
                style={styles.inlineBtn}
              >
                <Text style={styles.inlineBtnText}>Undo Pair</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setMatchingPairMaps((prev) => ({ ...prev, [currentExercise.id]: {} }));
                  setMatchingSelectedLeft((prev) => ({ ...prev, [currentExercise.id]: null }));
                }}
                style={styles.inlineBtn}
              >
                <Text style={styles.inlineBtnText}>Reset</Text>
              </Pressable>
            </View>
            <Text style={styles.hintText}>
              Matched {Object.keys(pairMap).length}/{currentExercise.correctPairs.length}
            </Text>
          </View>
        );
      }

      if (currentExercise.kind === 'sentenceOrderPuzzle') {
        const ordered = sentenceOrderedTokens[currentExercise.id] ?? [];
        const used = sentenceUsedIndexes[currentExercise.id] ?? [];
        const usedSet = new Set(used);

        return (
          <View style={styles.interactiveStep}>
            {currentExercise.instructions ? <Text style={styles.hintText}>{currentExercise.instructions}</Text> : null}
            <View style={styles.answerBox}>
              {ordered.length ? (
                ordered.map((token, idx) => (
                  <View key={`${token}-${idx}`} style={styles.answerToken}>
                    <Text style={styles.answerTokenText}>{token}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.hintText}>Tap words in order to build the sentence.</Text>
              )}
            </View>
            <View style={styles.tokenWrap}>
              {currentExercise.tokens.map((token, idx) => (
                <Pressable
                  key={`${currentExercise.id}-${token}-${idx}`}
                  disabled={currentStepSubmitted || usedSet.has(idx)}
                  onPress={() => {
                    setSentenceOrderedTokens((prev) => ({ ...prev, [currentExercise.id]: [...(prev[currentExercise.id] ?? []), token] }));
                    setSentenceUsedIndexes((prev) => ({ ...prev, [currentExercise.id]: [...(prev[currentExercise.id] ?? []), idx] }));
                  }}
                  style={[styles.tokenChip, usedSet.has(idx) && styles.matchChipUsed]}
                >
                  <Text style={styles.tokenText}>{token}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.inlineActions}>
              <Pressable
                onPress={() => {
                  const nextTokens = [...ordered];
                  nextTokens.pop();
                  const nextUsed = [...used];
                  nextUsed.pop();
                  setSentenceOrderedTokens((prev) => ({ ...prev, [currentExercise.id]: nextTokens }));
                  setSentenceUsedIndexes((prev) => ({ ...prev, [currentExercise.id]: nextUsed }));
                }}
                style={styles.inlineBtn}
              >
                <Text style={styles.inlineBtnText}>Undo</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSentenceOrderedTokens((prev) => ({ ...prev, [currentExercise.id]: [] }));
                  setSentenceUsedIndexes((prev) => ({ ...prev, [currentExercise.id]: [] }));
                }}
                style={styles.inlineBtn}
              >
                <Text style={styles.inlineBtnText}>Reset</Text>
              </Pressable>
            </View>
          </View>
        );
      }

      if (currentExercise.kind === 'quickClassification') {
        const selectedCategory = quickSelectedCategory[currentExercise.id] ?? currentExercise.categories[0]?.id ?? null;
        const assignmentsMap = quickAssignments[currentExercise.id] ?? {};

        return (
          <View style={styles.interactiveStep}>
            {currentExercise.instructions ? <Text style={styles.hintText}>{currentExercise.instructions}</Text> : null}
            <View style={styles.tokenWrap}>
              {currentExercise.categories.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => setQuickSelectedCategory((prev) => ({ ...prev, [currentExercise.id]: category.id }))}
                  style={[styles.tokenChip, selectedCategory === category.id && styles.matchChipSelected]}
                >
                  <Text style={styles.tokenText}>{category.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.classifyWrap}>
              {currentExercise.items.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (currentStepSubmitted || !selectedCategory) return;
                    setQuickAssignments((prev) => ({
                      ...prev,
                      [currentExercise.id]: { ...(prev[currentExercise.id] ?? {}), [item.id]: selectedCategory }
                    }));
                  }}
                  style={styles.classifyRow}
                >
                  <Text style={styles.classifyItem}>{item.label}</Text>
                  <Text style={styles.classifyBadge}>
                    {currentExercise.categories.find((c) => c.id === assignmentsMap[item.id])?.label ?? 'Unassigned'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      }

      if (currentExercise.kind === 'memoryMatch') {
        const cards = buildMemoryCards(currentExercise);
        const revealed = memoryRevealedIds[currentExercise.id] ?? [];
        const matchedPairIds = memoryMatchedPairIds[currentExercise.id] ?? [];
        const completedPairs = memoryCompletedPairs[currentExercise.id] ?? [];

        const isMatched = (card: MemoryCard) => matchedPairIds.includes(card.pairId);
        const isRevealed = (card: MemoryCard) => isMatched(card) || revealed.includes(card.uid);

        return (
          <View style={styles.interactiveStep}>
            {currentExercise.instructions ? <Text style={styles.hintText}>{currentExercise.instructions}</Text> : null}
            <View style={styles.memoryGrid}>
              {cards.map((card) => (
                <Pressable
                  key={card.uid}
                  onPress={() => {
                    if (currentStepSubmitted || isMatched(card) || revealed.includes(card.uid)) return;
                    const nextRevealed = [...revealed, card.uid];
                    setMemoryRevealedIds((prev) => ({ ...prev, [currentExercise.id]: nextRevealed }));
                    if (nextRevealed.length < 2) return;
                    const selectedCards = nextRevealed
                      .map((id) => cards.find((c) => c.uid === id))
                      .filter(Boolean) as MemoryCard[];
                    const [a, b] = selectedCards;
                    if (!a || !b) {
                      setMemoryRevealedIds((prev) => ({ ...prev, [currentExercise.id]: [] }));
                      return;
                    }
                    if (a.pairId === b.pairId && a.uid !== b.uid) {
                      setMemoryMatchedPairIds((prev) => ({ ...prev, [currentExercise.id]: [...(prev[currentExercise.id] ?? []), a.pairId] }));
                      setMemoryCompletedPairs((prev) => ({
                        ...prev,
                        [currentExercise.id]: [...(prev[currentExercise.id] ?? []), { leftId: a.pairId, rightId: b.pairId }]
                      }));
                      setFeedback({ tone: 'success', message: 'Match found.' });
                    } else {
                      setFeedback({ tone: 'warning', message: 'Not a match. Try again.' });
                    }
                    setTimeout(() => {
                      setMemoryRevealedIds((prev) => ({ ...prev, [currentExercise.id]: [] }));
                    }, 500);
                  }}
                  style={[styles.memoryTile, isRevealed(card) && styles.matchChipSelected, isMatched(card) && styles.memoryTileMatched]}
                >
                  <Text style={styles.memoryText}>{isRevealed(card) ? card.label : '?'}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.hintText}>Matches {completedPairs.length}/{currentExercise.pairs.length}</Text>
          </View>
        );
      }

      if (currentExercise.kind === 'speakingPrompt') {
        const recordingUri = recordingUriByExercise[currentExercise.id];
        const isRecording = Platform.OS === 'web' ? webRecordingExerciseId === currentExercise.id : recorderState.isRecording;
        const durationSec = Math.round((recorderState.durationMillis ?? 0) / 1000);
        const aiSummary = aiSummaryByExercise[currentExercise.id];
        const performanceFeedback = performanceFeedbackByExercise[currentExercise.id];
        const needsPronunciationRetry = performanceFeedback?.weaknesses.includes('pronunciation') ?? false;

        return (
          <View style={styles.interactiveStep}>
            <InputField
              label="What you said (transcript)"
              value={textValue}
              onChangeText={(value) => setTextInputs((prev) => ({ ...prev, [currentExercise.id]: value }))}
              placeholder="Type what you said in French..."
              autoCorrect={false}
              autoCapitalize="sentences"
              multiline
              style={styles.multiInput}
            />
            <View style={styles.inlineActions}>
              <Pressable
                onPress={() => {
                  void playPronunciation(currentExercise.sampleAnswer);
                  setFeedback({ tone: 'neutral', message: 'Model pronunciation played. Listen, then repeat and record.' });
                }}
                style={styles.inlineBtn}
              >
                <Text style={styles.inlineBtnText}>Play Model Audio</Text>
              </Pressable>
              {!isRecording ? (
                <Pressable onPress={() => void startRecording(currentExercise.id)} style={styles.inlineBtn}>
                  <Text style={styles.inlineBtnText}>Start Recording</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => void stopRecording(currentExercise.id)} style={styles.inlineBtn}>
                  <Text style={styles.inlineBtnText}>
                    {Platform.OS === 'web' ? 'Stop Recording' : `Stop (${durationSec}s)`}
                  </Text>
                </Pressable>
              )}
              {recordingUri ? (
                <View style={styles.recordedBadge}>
                  <Text style={styles.recordedBadgeText}>Audio Ready</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.hintText}>Record first for pronunciation score, then press Check Answer.</Text>
            {needsPronunciationRetry ? (
              <Pressable
                onPress={() => {
                  setSubmittedSteps((prev) => ({ ...prev, [currentStep.id]: false }));
                  setRecordingUriByExercise((prev) => {
                    const next = { ...prev };
                    delete next[currentExercise.id];
                    return next;
                  });
                  setRecordingBase64ByExercise((prev) => {
                    const next = { ...prev };
                    delete next[currentExercise.id];
                    return next;
                  });
                  setAiSummaryByExercise((prev) => ({
                    ...prev,
                    [currentExercise.id]:
                      'Pronunciation needs improvement. Play model audio, then record again slowly.'
                  }));
                  setFeedback({
                    tone: 'warning',
                    message: `${selectedCompanion.name}: Slow down and keep syllables clear. Try again now.`
                  });
                }}
                style={styles.inlineBtn}
              >
                <Text style={styles.inlineBtnText}>Retry Pronunciation</Text>
              </Pressable>
            ) : null}
            {aiSummary ? <Text style={styles.hintText}>{aiSummary}</Text> : null}
            {performanceFeedback ? (
              <PerformanceFeedbackPanel
                estimatedClb={performanceFeedback.estimatedClb}
                targetClb={performanceFeedback.targetClb}
                gapMessage={buildGapMessage(performanceFeedback.estimatedClb, performanceFeedback.targetClb)}
                taskCompletionScore={performanceFeedback.taskCompletionScore}
                grammarAccuracyScore={performanceFeedback.grammarAccuracyScore}
                vocabularyRangeScore={performanceFeedback.vocabularyRangeScore}
                coherenceScore={performanceFeedback.coherenceScore}
                correctedSentence={performanceFeedback.correctedSentence}
                improvedVersion={performanceFeedback.improvedVersion}
              />
            ) : null}
          </View>
        );
      }

      if (currentExercise.kind === 'writingPrompt') {
        const wordCount = textValue.trim() ? textValue.trim().split(/\s+/).length : 0;
        const aiSummary = aiSummaryByExercise[currentExercise.id];
        const performanceFeedback = performanceFeedbackByExercise[currentExercise.id];
        return (
          <View style={styles.interactiveStep}>
            <InputField
              label="Write your answer"
              value={textValue}
              onChangeText={(value) => setTextInputs((prev) => ({ ...prev, [currentExercise.id]: value }))}
              placeholder="Write 4-6 sentences..."
              autoCorrect={false}
              autoCapitalize="sentences"
              multiline
              style={styles.multiInput}
            />
            <Text style={styles.acceptedExamples}>Word count: {wordCount}</Text>
            <Text style={styles.hintText}>Target: at least {currentExercise.minWords} words.</Text>
            {aiSummary ? <Text style={styles.hintText}>{aiSummary}</Text> : null}
            {performanceFeedback ? (
              <PerformanceFeedbackPanel
                estimatedClb={performanceFeedback.estimatedClb}
                targetClb={performanceFeedback.targetClb}
                gapMessage={buildGapMessage(performanceFeedback.estimatedClb, performanceFeedback.targetClb)}
                taskCompletionScore={performanceFeedback.taskCompletionScore}
                grammarAccuracyScore={performanceFeedback.grammarAccuracyScore}
                vocabularyRangeScore={performanceFeedback.vocabularyRangeScore}
                coherenceScore={performanceFeedback.coherenceScore}
                correctedSentence={performanceFeedback.correctedSentence}
                improvedVersion={performanceFeedback.improvedVersion}
              />
            ) : null}
          </View>
        );
      }

      return (
        <View style={styles.interactiveStep}>
          <InputField
            label="Write your answer"
            value={textValue}
            onChangeText={(value) => setTextInputs((prev) => ({ ...prev, [currentExercise.id]: value }))}
            placeholder="Type your response..."
            autoCorrect={false}
            autoCapitalize="sentences"
            multiline={currentExercise.kind !== 'shortAnswer'}
            style={currentExercise.kind !== 'shortAnswer' ? styles.multiInput : undefined}
          />
          {currentExercise.kind === 'shortAnswer' ? (
            <Text style={styles.acceptedExamples}>Accepted: {currentExercise.acceptedAnswers.slice(0, 3).join(' • ')}</Text>
          ) : null}
        </View>
      );
    }

    if (currentStep.kind === 'review_block') {
      const activeQuestions = reviewMode === 'retry' ? retryQuestions : masteryQuestions;
      const currentQuestionIndex = reviewMode === 'retry' ? retryQuestionIndex : masteryQuestionIndex;
      const checked = reviewMode === 'retry' ? retryChecked : masteryChecked;
      const selections = reviewMode === 'retry' ? retrySelections : masterySelections;
      const currentQuestion = activeQuestions[currentQuestionIndex];
      if (!currentQuestion) return null;
      const selected = selections[currentQuestion.id];

      return (
        <View style={styles.centeredStep}>
          <Text style={styles.questionCounter}>
            {reviewMode === 'retry' ? `Retry Round ${reviewAttemptRound}` : 'Mastery Check'} • Question {currentQuestionIndex + 1} / {activeQuestions.length}
          </Text>
          <View style={styles.reviewQuestionWrap}>
            <Text style={styles.reviewPrompt}>{currentQuestion.prompt}</Text>
            <View style={styles.optionsWrap}>
              {currentQuestion.options.map((option, idx) => {
                let correctness: 'correct' | 'wrong' | null = null;
                if (checked && idx === currentQuestion.correctIndex) correctness = 'correct';
                if (checked && idx === selected && idx !== currentQuestion.correctIndex) correctness = 'wrong';
                return (
                  <OptionButton
                    key={`${currentQuestion.id}-${idx}`}
                    label={option}
                    selected={selected === idx}
                    disabled={checked}
                    correctness={correctness}
                    onPress={() => {
                      if (reviewMode === 'retry') {
                        setRetrySelections((prev) => ({ ...prev, [currentQuestion.id]: idx }));
                      } else {
                        setMasterySelections((prev) => ({ ...prev, [currentQuestion.id]: idx }));
                      }
                    }}
                  />
                );
              })}
            </View>
          </View>
          <View style={styles.inlineActions}>
            <Pressable
              onPress={() => {
                if (reviewMode === 'retry') {
                  setRetryQuestionIndex((prev) => Math.max(0, prev - 1));
                } else {
                  setMasteryQuestionIndex((prev) => Math.max(0, prev - 1));
                }
              }}
              style={styles.inlineBtn}
              disabled={currentQuestionIndex === 0}
            >
              <Text style={styles.inlineBtnText}>Previous</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (reviewMode === 'retry') {
                  setRetryQuestionIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1));
                } else {
                  setMasteryQuestionIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1));
                }
              }}
              style={styles.inlineBtn}
              disabled={currentQuestionIndex >= activeQuestions.length - 1}
            >
              <Text style={styles.inlineBtnText}>Next</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.centeredStep}>
        <Text style={styles.bigTitle}>Ready to finish</Text>
        <Text style={styles.bodyText}>Practice: {practicePercent}%  •  Mastery check complete. Submit session result.</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Session Summary</Text>
          <Text style={styles.summaryMeta}>
            Practice correct: {practiceCorrectCount}/{practiceSummaryItems.length} • Mastery: {masteryScore}/{masteryQuestions.length}
          </Text>
          <Pressable onPress={() => setShowSessionSummary((prev) => !prev)} style={styles.summaryToggleBtn}>
            <Text style={styles.summaryToggleText}>{showSessionSummary ? 'Hide detailed results' : 'Show detailed results'}</Text>
          </Pressable>

          {showSessionSummary ? (
            <View style={styles.summaryList}>
              {practiceSummaryItems.map((item, index) => (
                <View key={item.id} style={styles.summaryRow}>
                  <Text style={styles.summaryRowIndex}>{index + 1}.</Text>
                  <Text style={styles.summaryRowPrompt}>{item.prompt}</Text>
                  <Text style={[styles.summaryRowStatus, item.correct ? styles.summaryRowStatusGood : styles.summaryRowStatusBad]}>
                    {item.correct ? 'Correct' : 'Wrong'}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        {Platform.OS === 'web' ? (
          <Pressable onPress={downloadLessonNotes} style={styles.downloadBtn}>
            <Text style={styles.downloadBtnText}>Download Lesson Notes</Text>
          </Pressable>
        ) : null}
        {canadaTemplate ? (
          <View style={styles.contextCard}>
            <Text style={styles.contextTitle}>Avatar Recap</Text>
            <Text style={styles.contextLine}>{selectedCompanion.emoji} {canadaTemplate.avatarRecap}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const canGoBack = stepIndex > 0;

  const ctaLabel = (() => {
    if (currentStep.kind === 'activation') return activationChecked ? 'Continue' : 'Check Warm-up';
    if (currentStep.kind === 'intro') return 'Continue';
    if (currentStep.kind === 'learn_segment') return 'Continue';
    if (currentStep.kind === 'exercise') return currentStepSubmitted ? 'Continue' : 'Check Answer';
    if (currentStep.kind === 'review_block') {
      if (reviewMode === 'retry') return retryChecked ? 'Continue' : 'Check Retry Round';
      return masteryChecked ? 'Continue' : 'Check Mastery';
    }
    return 'Finish Block';
  })();

  const ctaDisabled = (() => {
    if (currentStep.kind === 'activation') {
      if (activationChecked) return false;
      return activationQuestions.some((q) => activationSelections[q.id] == null);
    }
    if (currentStep.kind === 'intro') return false;
    if (currentStep.kind === 'learn_segment') return interactedSteps[currentStep.id] !== true;
    if (currentStep.kind === 'exercise' && currentExercise) {
      if (currentStepSubmitted) return false;
      if (
        currentExercise.kind === 'multipleChoice' ||
        currentExercise.kind === 'listeningPrompt' ||
        currentExercise.kind === 'readingComprehension'
      ) {
        return choiceSelections[currentExercise.id] == null;
      }
      if (currentExercise.kind === 'matchingPairs') {
        const pairMap = matchingPairMaps[currentExercise.id] ?? {};
        return Object.keys(pairMap).length !== currentExercise.correctPairs.length;
      }
      if (currentExercise.kind === 'sentenceOrderPuzzle') {
        const ordered = sentenceOrderedTokens[currentExercise.id] ?? [];
        return ordered.length !== currentExercise.correctOrder.length;
      }
      if (currentExercise.kind === 'quickClassification') {
        const assignments = quickAssignments[currentExercise.id] ?? {};
        return Object.keys(assignments).length !== currentExercise.items.length;
      }
      if (currentExercise.kind === 'memoryMatch') {
        const completed = memoryCompletedPairs[currentExercise.id] ?? [];
        return completed.length !== currentExercise.pairs.length;
      }
      if (currentExercise.kind === 'speakingPrompt') {
        const hasText = Boolean((textInputs[currentExercise.id] ?? '').trim());
        const hasRecording = Boolean(recordingUriByExercise[currentExercise.id]);
        return !hasText && !hasRecording;
      }
      return !(textInputs[currentExercise.id] ?? '').trim();
    }
    if (currentStep.kind === 'review_block') {
      if (reviewMode === 'retry') {
        if (retryChecked) return false;
        return retryQuestions.some((q) => retrySelections[q.id] == null);
      }
      if (masteryChecked) return false;
      return masteryQuestions.some((q) => masterySelections[q.id] == null);
    }
    return false;
  })();

  const onPrimaryPress = () => {
    Keyboard.dismiss();
    setFeedback(null);

    if (currentStep.kind === 'activation') {
      if (!activationChecked) {
        const correct = activationQuestions.reduce((acc, q) => acc + (activationSelections[q.id] === q.correctIndex ? 1 : 0), 0);
        setActivationChecked(true);
        setFeedback({
          tone: correct >= 2 ? 'success' : 'warning',
          message: correct >= 2 ? 'Activation complete. Memory warm-up done.' : `${selectedCompanion.name}: Good start. Keep attention high for core teaching.`
        });
        if (correct >= 2) triggerSuccess();
        return;
      }
      advanceStep();
      return;
    }

    if (currentStep.kind === 'intro') {
      advanceStep();
      return;
    }

    if (currentStep.kind === 'learn_segment') {
      advanceStep();
      return;
    }

    if (currentStep.kind === 'exercise' && currentExercise) {
      if (currentStepSubmitted) {
        onContinueAfterExercise();
        return;
      }

      if (
        currentExercise.kind === 'multipleChoice' ||
        currentExercise.kind === 'listeningPrompt' ||
        currentExercise.kind === 'readingComprehension'
      ) {
        submitExercise({ kind: 'choice', selectedIndex: choiceSelections[currentExercise.id] ?? -1 });
        return;
      }

      if (currentExercise.kind === 'shortAnswer') {
        submitExercise({ kind: 'shortText', text: textInputs[currentExercise.id] ?? '' });
        return;
      }

      if (currentExercise.kind === 'matchingPairs') {
        const pairMap = matchingPairMaps[currentExercise.id] ?? {};
        submitExercise({
          kind: 'matching',
          pairs: Object.entries(pairMap).map(([leftId, rightId]) => ({ leftId, rightId }))
        });
        return;
      }

      if (currentExercise.kind === 'sentenceOrderPuzzle') {
        submitExercise({
          kind: 'sentenceOrder',
          orderedTokens: sentenceOrderedTokens[currentExercise.id] ?? []
        });
        return;
      }

      if (currentExercise.kind === 'quickClassification') {
        const assignments = quickAssignments[currentExercise.id] ?? {};
        submitExercise({
          kind: 'quickClassification',
          assignments: Object.entries(assignments).map(([itemId, categoryId]) => ({ itemId, categoryId }))
        });
        return;
      }

      if (currentExercise.kind === 'memoryMatch') {
        submitExercise({
          kind: 'memoryMatch',
          pairs: memoryCompletedPairs[currentExercise.id] ?? []
        });
        return;
      }

      if (currentExercise.kind === 'writingPrompt') {
        const text = textInputs[currentExercise.id] ?? '';
        void (async () => {
          setAiCheckLoading(true);
          try {
            const ai = await assessWritingResponse({
              prompt: currentExercise.prompt,
              text,
              targetClbLevel: targetClb,
              taskType: 'writing',
              expectedElements: currentExercise.expectedElements,
              minWords: currentExercise.minWords,
              rubricFocus: currentExercise.rubricFocus
            });
            const summary =
              `AI writing check: ${ai.scorePercent}% (${ai.passed ? 'pass' : 'needs work'}). ` +
              `Grammar ${ai.rubric.grammar}, Coherence ${ai.rubric.coherence}, Vocabulary ${ai.rubric.vocabulary}, Task ${ai.rubric.taskCompletion}.`;
            setAiSummaryByExercise((prev) => ({ ...prev, [currentExercise.id]: summary }));

            const estimatedClb = estimateClbFromScore(ai.scorePercent);
            const weaknesses = detectWeaknesses({
              grammarScore: ai.rubric.grammar,
              coherenceScore: ai.rubric.coherence,
              text
            });
            const panel: CLBPerformanceFeedback = {
              estimatedClb,
              targetClb,
              taskCompletionScore: clamp(ai.rubric.taskCompletion, 0, 100),
              grammarAccuracyScore: clamp(ai.rubric.grammar, 0, 100),
              vocabularyRangeScore: clamp(ai.rubric.vocabulary, 0, 100),
              coherenceScore: clamp(ai.rubric.coherence, 0, 100),
              improvementAdvice: ai.feedback,
              correctedSentence: ai.improvedModel,
              improvedVersion:
                estimatedClb < targetClb
                  ? `${ai.improvedModel} Ensuite, ajoute un connecteur logique (par exemple: "parce que", "cependant", "donc").`
                  : ai.improvedModel,
              weaknesses
            };
            setPerformanceFeedbackByExercise((prev) => ({ ...prev, [currentExercise.id]: panel }));
            recordPerformanceFeedback({
              estimatedClb,
              targetClb,
              weaknesses,
              advice: ai.feedback
            });
            submitExercise(
              { kind: 'writtenText', text },
              {
                feedbackOverride: `${summary}\n${ai.feedback}\n${ai.corrections.slice(0, 2).join(' ')}`,
                toneOverride: ai.passed ? 'success' : 'warning'
              }
            );
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Writing analysis failed.';
            submitExercise(
              { kind: 'writtenText', text },
              { feedbackOverride: `Writing AI check failed: ${message}`, toneOverride: 'warning' }
            );
          } finally {
            setAiCheckLoading(false);
          }
        })();
        return;
      }

      if (currentExercise.kind === 'speakingPrompt') {
        const manualTranscript = (textInputs[currentExercise.id] ?? '').trim();
        const recordingUri = recordingUriByExercise[currentExercise.id];
        const recordingBase64 = recordingBase64ByExercise[currentExercise.id];
        void (async () => {
          setAiCheckLoading(true);
          try {
            let transcript = manualTranscript;
            let pronunciationSummary = 'No recording used; transcript-only speaking check.';

            if (recordingUri) {
              try {
                const audioBase64 =
                  Platform.OS === 'web'
                    ? recordingBase64 ?? ''
                    : await new File(recordingUri).base64();

                if (!audioBase64) {
                  throw new Error('No audio data found for analysis.');
                }
                const pronunciation = await assessPronunciation({
                  audioBase64,
                  language: 'fr-CA',
                  referenceText: currentExercise.sampleAnswer,
                  contentType: Platform.OS === 'web' ? 'audio/webm' : inferAudioContentTypeFromUri(recordingUri)
                });
                transcript = (pronunciation.transcriptText ?? '').trim() || transcript;
                if (transcript) {
                  setTextInputs((prev) => ({ ...prev, [currentExercise.id]: transcript }));
                }
                const pScore = pronunciation.pronunciation?.pronunciationScore;
                pronunciationSummary = pScore != null ? `Pronunciation score: ${Math.round(pScore)}.` : 'Pronunciation analyzed.';
              } catch (error) {
                pronunciationSummary = `Pronunciation analysis failed: ${error instanceof Error ? error.message : 'unknown error'}`;
              }
            }

            const speaking = await assessSpeakingResponse({
              prompt: currentExercise.prompt,
              transcriptText: transcript,
              targetClbLevel: targetClb,
              taskType: 'speaking',
              expectedPatterns: currentExercise.expectedPatterns,
              rubricFocus: currentExercise.rubricFocus,
              audioUri: recordingUri
            });
            const summary =
              `AI speaking check: ${speaking.scorePercent}% (${speaking.passed ? 'pass' : 'needs work'}). ` +
              `Pronunciation ${speaking.rubric.pronunciation}, Fluency ${speaking.rubric.fluency}, Grammar ${speaking.rubric.grammar}, Task ${speaking.rubric.taskCompletion}.`;
            setAiSummaryByExercise((prev) => ({ ...prev, [currentExercise.id]: `${summary} ${pronunciationSummary}` }));

            const estimatedClb = estimateClbFromScore(speaking.scorePercent);
            const coherenceFromFluency = clamp(speaking.rubric.fluency, 0, 100);
            const weaknesses = detectWeaknesses({
              grammarScore: speaking.rubric.grammar,
              coherenceScore: coherenceFromFluency,
              pronunciationScore: speaking.rubric.pronunciation,
              text: transcript
            });
            const panel: CLBPerformanceFeedback = {
              estimatedClb,
              targetClb,
              taskCompletionScore: clamp(speaking.rubric.taskCompletion, 0, 100),
              grammarAccuracyScore: clamp(speaking.rubric.grammar, 0, 100),
              vocabularyRangeScore: clamp(Math.round((speaking.rubric.fluency + speaking.rubric.taskCompletion) / 2), 0, 100),
              coherenceScore: coherenceFromFluency,
              improvementAdvice: speaking.feedback,
              correctedSentence: speaking.correctionModel,
              improvedVersion:
                estimatedClb < targetClb
                  ? `${speaking.correctionModel} Ensuite, ajoute un détail concret et un connecteur.`
                  : speaking.correctionModel,
              weaknesses
            };
            setPerformanceFeedbackByExercise((prev) => ({ ...prev, [currentExercise.id]: panel }));
            recordPerformanceFeedback({
              estimatedClb,
              targetClb,
              weaknesses,
              advice: speaking.feedback
            });

            submitExercise(
              { kind: 'spokenText', transcript: transcript || manualTranscript },
              {
                feedbackOverride: `${summary}\n${pronunciationSummary}\n${speaking.feedback}`,
                toneOverride: speaking.passed ? 'success' : 'warning'
              }
            );
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Speaking analysis failed.';
            submitExercise(
              { kind: 'spokenText', transcript: manualTranscript },
              { feedbackOverride: `Speaking AI check failed: ${message}`, toneOverride: 'warning' }
            );
          } finally {
            setAiCheckLoading(false);
          }
        })();
        return;
      }

      const fallback = evaluateExercise(currentExercise as any, {
        kind: 'shortText',
        text: textInputs[currentExercise.id] ?? ''
      } as any);
      if (fallback.correct) {
        setSubmittedSteps((prev) => ({ ...prev, [currentStep.id]: true }));
        triggerSuccess();
      }
      setFeedback({ tone: fallback.correct ? 'success' : 'warning', message: fallback.feedback });
      return;
    }

    if (currentStep.kind === 'review_block') {
      if (reviewMode === 'retry') {
        if (!retryChecked) {
          const retryCorrect = retryQuestions.reduce(
            (acc, q) => acc + (retrySelections[q.id] === q.correctIndex ? 1 : 0),
            0
          );
          const masteryBaseCorrect = masteryQuestions.reduce(
            (acc, q) => acc + (masterySelections[q.id] === q.correctIndex ? 1 : 0),
            0
          );
          const combinedCorrect = masteryBaseCorrect + retryCorrect;
          const combinedPercent = Math.round((combinedCorrect / masteryQuestions.length) * 100);
          setMasteryScore(combinedCorrect);

          if (combinedPercent >= 75) {
            setRetryChecked(true);
            setMasteryChecked(true);
            setReviewMode('mastery');
            setFeedback({ tone: 'success', message: `Mastery check passed at ${combinedPercent}% after retry.` });
            triggerSuccess();
            return;
          }

          const nextRound = reviewAttemptRound + 1;
          const reroutedRetryQuestions = buildRetryMasteryQuestions(retryQuestions, retrySelections, nextRound);
          setReviewAttemptRound(nextRound);
          setRetryQuestions(reroutedRetryQuestions);
          setRetrySelections({});
          setRetryChecked(false);
          setRetryQuestionIndex(0);
          const sampleRetry = reroutedRetryQuestions[0];
          const answerHint = sampleRetry ? sampleRetry.options[sampleRetry.correctIndex] : '';
          setFeedback({
            tone: 'warning',
            message: `${selectedCompanion.name}: Still below 75% (${combinedPercent}%). Focus on the correction pattern. Suggested answer style: ${answerHint}`
          });
          return;
        }
        advanceStep();
        return;
      }

      if (!masteryChecked) {
        const correct = masteryQuestions.reduce((acc, q) => acc + (masterySelections[q.id] === q.correctIndex ? 1 : 0), 0);
        const percent = Math.round((correct / masteryQuestions.length) * 100);
        setMasteryScore(correct);

        if (percent >= 75) {
          setMasteryChecked(true);
          setFeedback({ tone: 'success', message: `Mastery check passed at ${percent}%.` });
          triggerSuccess();
          return;
        }

        const nextRound = reviewAttemptRound + 1;
        const retryRoundQuestions = buildRetryMasteryQuestions(masteryQuestions, masterySelections, nextRound);
        setReviewAttemptRound(nextRound);
        setReviewMode('retry');
        setRetryQuestions(retryRoundQuestions);
        setRetrySelections({});
        setRetryChecked(false);
        setRetryQuestionIndex(0);
        const sampleRetry = retryRoundQuestions[0];
        const answerHint = sampleRetry ? sampleRetry.options[sampleRetry.correctIndex] : '';
        setFeedback({
          tone: 'warning',
          message: `${selectedCompanion.name}: You are at ${percent}%. Retry only missed questions now. Tip: ${answerHint}`
        });
        return;
      }

      advanceStep();
      return;
    }

    finishLesson();
  };

  const title = currentStep.kind === 'exercise' ? currentStep.exercise?.prompt : currentStep.title;
  const subtitle = currentStep.subtitle;
  const coachMessage =
    currentStep.kind === 'learn_segment'
      ? 'Listen once, repeat once, then continue.'
      : currentStep.kind === 'exercise'
        ? 'Answer clearly. You will get instant correction.'
        : currentStep.kind === 'review_block'
          ? 'Focus and finish strong.'
          : 'Stay consistent. One step at a time.';

  return (
    <LessonStepEngine
      step={currentStep}
      stepIndex={stepIndex}
      totalSteps={steps.length}
      title={title}
      subtitle={subtitle}
      onBack={canGoBack ? () => {
        Keyboard.dismiss();
        setStepIndex((prev) => Math.max(0, prev - 1));
      } : undefined}
      footer={
        <View style={styles.footerWrap}>
          {feedback ? <MicroFeedback message={feedback.message} tone={feedback.tone} /> : null}
          <PrimaryCTAButton
            label={aiCheckLoading ? 'Checking...' : ctaLabel}
            onPress={onPrimaryPress}
            disabled={ctaDisabled || aiCheckLoading}
          />
        </View>
      }
    >
      <AnimatedSuccess visible={showSuccess} />
      <Animated.View style={[styles.coachBubble, { transform: [{ scale: coachPulse }] }]}>
        <Text style={styles.coachTitle}>{selectedCompanion.emoji} AI Coach</Text>
        <Text style={styles.coachText}>{coachMessage}</Text>
      </Animated.View>
      {renderStepContent()}
    </LessonStepEngine>
  );
}

const styles = StyleSheet.create({
  fallbackWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  fallbackText: {
    ...typography.bodyStrong,
    color: colors.textPrimary
  },
  centeredStep: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: spacing.xs,
    gap: spacing.md
  },
  coachBubble: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm
  },
  coachTitle: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700'
  },
  coachText: {
    ...typography.caption,
    color: colors.textSecondary
  },
  interactiveStep: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: spacing.sm,
    gap: spacing.md
  },
  bigTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: '#0F172A'
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#334155'
  },
  targetsWrap: {
    gap: 10
  },
  targetChip: {
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  targetChipText: {
    color: '#1D4ED8',
    fontWeight: '600'
  },
  contextCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    padding: 10,
    gap: 4
  },
  contextTitle: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '700'
  },
  contextLine: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    padding: 12,
    gap: 8
  },
  summaryTitle: {
    ...typography.bodyStrong,
    color: colors.primary
  },
  summaryMeta: {
    ...typography.caption,
    color: '#334155'
  },
  summaryToggleBtn: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#93C5FD',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  summaryToggleText: {
    ...typography.caption,
    color: '#1D4ED8',
    fontWeight: '600'
  },
  summaryList: {
    gap: 6
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  summaryRowIndex: {
    width: 22,
    ...typography.caption,
    color: '#475569'
  },
  summaryRowPrompt: {
    flex: 1,
    ...typography.caption,
    color: '#0F172A',
    marginRight: 8
  },
  summaryRowStatus: {
    ...typography.caption,
    fontWeight: '700'
  },
  summaryRowStatusGood: {
    color: '#047857'
  },
  summaryRowStatusBad: {
    color: '#B91C1C'
  },
  examplesWrap: {
    gap: 10
  },
  cueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  cueChip: {
    width: '31%',
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm
  },
  cueChipText: {
    ...typography.bodyStrong,
    color: colors.primary,
    textAlign: 'center'
  },
  cueChipSubText: {
    ...typography.caption,
    color: '#1E40AF',
    textAlign: 'center',
    marginTop: 2
  },
  downloadBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingVertical: spacing.sm,
    alignItems: 'center'
  },
  downloadBtnText: {
    ...typography.bodyStrong,
    color: colors.primary
  },
  exampleBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  exampleText: {
    fontSize: 16,
    color: '#1D4ED8',
    fontWeight: '600'
  },
  audioBtn: {
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48
  },
  audioText: {
    color: '#1D4ED8',
    fontSize: 15,
    fontWeight: '700'
  },
  tipText: {
    fontSize: 14,
    color: '#334155',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10
  },
  hintText: {
    fontSize: 13,
    color: '#64748B'
  },
  questionCounter: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700'
  },
  optionsWrap: {
    gap: 10
  },
  promptCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    padding: spacing.md,
    gap: spacing.xs
  },
  promptCardText: {
    ...typography.bodyStrong,
    color: colors.primary
  },
  matchingColumns: {
    flexDirection: 'row',
    gap: 10
  },
  matchingCol: {
    flex: 1,
    gap: 8
  },
  miniLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700'
  },
  matchChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  matchChipSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF'
  },
  matchChipUsed: {
    opacity: 0.55
  },
  matchChipText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500'
  },
  answerBox: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  answerToken: {
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  answerTokenText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 12
  },
  tokenWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tokenChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  tokenText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600'
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 10
  },
  inlineBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  inlineBtnText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600'
  },
  recordedBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  recordedBadgeText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '700'
  },
  classifyWrap: {
    gap: 8
  },
  classifyRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    minHeight: 48,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  classifyItem: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A'
  },
  classifyBadge: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '700'
  },
  memoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  memoryTile: {
    width: '47%',
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8
  },
  memoryTileMatched: {
    borderColor: '#22C55E',
    backgroundColor: '#ECFDF5'
  },
  memoryText: {
    fontSize: 14,
    color: '#0F172A',
    textAlign: 'center'
  },
  passage: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#334155',
    padding: 10,
    fontSize: 14
  },
  acceptedExamples: {
    fontSize: 12,
    color: '#64748B'
  },
  multiInput: {
    minHeight: 120
  },
  reviewQuestionWrap: {
    gap: 8,
    marginBottom: 10
  },
  reviewPrompt: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600'
  },
  footerWrap: {
    gap: 10
  }
});
