import type { LevelId } from '../../types/CurriculumTypes';

export type RoadmapSessionType =
  | 'core-teach-practice'
  | 'listening-shadowing'
  | 'speaking-drill'
  | 'writing-correction'
  | 'review-retrieval'
  | 'benchmark-test';

export type RoadmapSession = {
  id: string;
  globalDay: number;
  levelId: LevelId;
  levelTitle: string;
  levelDay: number;
  durationMinutes: 25;
  sessionType: RoadmapSessionType;
  moduleTitle: string;
  title: string;
  focusSummary: string;
  includesProductionTask: boolean;
  includesListening: boolean;
  includesSpeaking: boolean;
  includesWriting: boolean;
  includesReviewCycle: boolean;
  isBenchmark: boolean;
};

export type RoadmapProgress = {
  totalSessions: number;
  completedSessions: number;
  currentDay: number;
  today: RoadmapSession;
  next: RoadmapSession[];
};

type LevelRoadmapConfig = {
  levelId: LevelId;
  levelTitle: string;
  totalSessions: number;
  moduleTitle: string;
  coreFocuses: string[];
  listeningFocuses: string[];
  speakingFocuses: string[];
  writingFocuses: string[];
  reviewFocuses: string[];
  benchmarkFocuses: string[];
};

const levelRoadmapConfigs: LevelRoadmapConfig[] = [
  {
    levelId: 'foundation',
    levelTitle: 'Foundation',
    totalSessions: 30,
    moduleTitle: 'Module 0: Absolute Beginner Foundation',
    coreFocuses: [
      'Alphabet and sounds',
      'Basic greetings and politeness',
      'Introducing yourself',
      'Numbers 0-20',
      'Classroom and study language',
      'Time and date basics'
    ],
    listeningFocuses: ['Letter/sound discrimination', 'Greeting recognition', 'Numbers and time listening'],
    speakingFocuses: ['Greeting repetition', 'Self-introduction speaking', 'Numbers and spelling drills'],
    writingFocuses: ['Copying and dictation', 'Simple forms', '1-2 sentence introductions'],
    reviewFocuses: ['Foundation retrieval mix', 'Error-log review', 'Pronunciation review loop'],
    benchmarkFocuses: ['Foundation readiness checkpoint']
  },
  {
    levelId: 'a1',
    levelTitle: 'A1',
    totalSessions: 40,
    moduleTitle: 'A1 Core Module 1: Daily Communication Starter',
    coreFocuses: [
      'Pronouns + être',
      'Articles and gender',
      '-ER verbs',
      'Questions and question words',
      'Daily routine',
      'Time and schedules',
      'Directions and places',
      'Shopping and prices',
      'Appointments and requests',
      'Module integration'
    ],
    listeningFocuses: ['Service dialogues', 'Classroom instructions', 'Short announcements', 'Question comprehension'],
    speakingFocuses: ['Self-introductions', 'Question drills', 'Service interactions', 'Routine speaking'],
    writingFocuses: ['Short messages', 'Polite requests', 'Routine paragraphs', 'Form completion'],
    reviewFocuses: ['A1 mixed retrieval', 'Weak-skill review', 'Production repair session'],
    benchmarkFocuses: ['A1 benchmark mini test', 'A1 module checkpoint']
  },
  {
    levelId: 'a2',
    levelTitle: 'A2',
    totalSessions: 40,
    moduleTitle: 'A2 Bridge: Everyday Independence',
    coreFocuses: [
      'Past events (passe compose intro)',
      'Future plans and intentions',
      'Modal verbs in daily situations',
      'Comparisons',
      'Service problem reporting',
      'Housing and landlord communication',
      'Healthcare and pharmacy',
      'Work and schedules',
      'Community services',
      'A2 integration'
    ],
    listeningFocuses: ['Voicemail-style messages', 'Transit and service announcements', 'Workplace updates'],
    speakingFocuses: ['Problem explanation', 'Help requests', 'Comparing options', 'Short opinions'],
    writingFocuses: ['Reschedule emails', 'Request messages', 'Experience paragraphs'],
    reviewFocuses: ['A2 retrieval review', 'Tense contrast review', 'Error-log rewrite'],
    benchmarkFocuses: ['A2 benchmark test', 'CLB5 bridge readiness check']
  },
  {
    levelId: 'b1',
    levelTitle: 'B1',
    totalSessions: 40,
    moduleTitle: 'B1 Functional Independence',
    coreFocuses: [
      'Past narration coherence',
      'Future and conditionnel basics',
      'Workplace communication',
      'Housing and tenancy issues',
      'Healthcare navigation',
      'Education and training communication',
      'Reading strategy for longer texts',
      'Opinion support and organization',
      'Formal/informal register basics',
      'B1 integration'
    ],
    listeningFocuses: ['Longer dialogues', 'Intent and attitude detection', 'Sequencing key details'],
    speakingFocuses: ['Problem-solution speaking', 'Role-play simulations', 'Short opinion responses'],
    writingFocuses: ['Complaint/request emails', 'Short opinion texts', 'Process explanations'],
    reviewFocuses: ['B1 retrieval cycle', 'Speaking repair session', 'Writing rewrite session'],
    benchmarkFocuses: ['B1 benchmark test', 'CLB5 target baseline']
  },
  {
    levelId: 'clb5',
    levelTitle: 'CLB 5',
    totalSessions: 40,
    moduleTitle: 'CLB 5 Target Module',
    coreFocuses: [
      'Functional service tasks',
      'Workplace scheduling and requests',
      'Housing practical communication',
      'Public services and forms',
      'Customer-service style speaking',
      'Listening detail extraction',
      'Reading practical documents',
      'Functional email tasks',
      'Timed practical responses',
      'CLB5 integration'
    ],
    listeningFocuses: ['Practical announcements', 'Instruction-heavy dialogues', 'Detail note capture'],
    speakingFocuses: ['Service interaction simulation', 'Information request drills', 'Daily problem reporting'],
    writingFocuses: ['Functional emails', 'Confirm/reschedule messages', 'Short practical explanations'],
    reviewFocuses: ['CLB5 retrieval cycle', 'Timed-task review', 'Weakest-skill reinforcement'],
    benchmarkFocuses: ['CLB5 benchmark', 'TEF bridge practical checkpoint']
  },
  {
    levelId: 'clb7',
    levelTitle: 'CLB 7',
    totalSessions: 40,
    moduleTitle: 'CLB 7 Target Module',
    coreFocuses: [
      'Structured opinion speaking',
      'Argument development',
      'Formal email and complaint writing',
      'Workplace policy communication',
      'Community and civic topics',
      'Longer listening comprehension',
      'Reading fact vs opinion',
      'Register and tone control',
      'Timed response planning',
      'CLB7 integration'
    ],
    listeningFocuses: ['Inference and attitude', 'Multi-point content summaries', 'Argument tracking'],
    speakingFocuses: ['Decision justification', 'Comparison with criteria', 'Monologue + follow-up'],
    writingFocuses: ['Formal requests', 'Opinion essays', 'Recommendation texts'],
    reviewFocuses: ['CLB7 retrieval cycle', 'Argument repair session', 'Writing refinement review'],
    benchmarkFocuses: ['CLB7 benchmark', 'TEF simulation readiness checkpoint']
  }
];

function cyclePick<T>(items: T[], index: number): T {
  return items[index % items.length];
}

function titleForSessionType(type: RoadmapSessionType): string {
  switch (type) {
    case 'core-teach-practice':
      return 'Core Teaching Session';
    case 'listening-shadowing':
      return 'Listening + Shadowing Session';
    case 'speaking-drill':
      return 'Speaking Drill Session';
    case 'writing-correction':
      return 'Writing + Correction Session';
    case 'review-retrieval':
      return 'Review / Retrieval Session';
    case 'benchmark-test':
      return 'Benchmark Session';
  }
}

function buildSessionTypeSequence(levelDay: number, totalSessions: number): RoadmapSessionType {
  const isFinalDay = levelDay === totalSessions;
  if (isFinalDay) return 'benchmark-test';
  if (levelDay % 10 === 0) return 'benchmark-test';
  if (levelDay % 7 === 0) return 'review-retrieval';
  if (levelDay % 5 === 0) return 'writing-correction';
  if (levelDay % 4 === 0) return 'speaking-drill';
  if (levelDay % 3 === 0) return 'listening-shadowing';
  return 'core-teach-practice';
}

function buildFocusSummary(config: LevelRoadmapConfig, sessionType: RoadmapSessionType, levelDay: number): string {
  const index = levelDay - 1;
  switch (sessionType) {
    case 'core-teach-practice':
      return cyclePick(config.coreFocuses, index);
    case 'listening-shadowing':
      return cyclePick(config.listeningFocuses, index);
    case 'speaking-drill':
      return cyclePick(config.speakingFocuses, index);
    case 'writing-correction':
      return cyclePick(config.writingFocuses, index);
    case 'review-retrieval':
      return cyclePick(config.reviewFocuses, index);
    case 'benchmark-test':
      return cyclePick(config.benchmarkFocuses, index);
  }
}

function makeRoadmapSession(config: LevelRoadmapConfig, globalDay: number, levelDay: number): RoadmapSession {
  const sessionType = buildSessionTypeSequence(levelDay, config.totalSessions);
  const focusSummary = buildFocusSummary(config, sessionType, levelDay);
  return {
    id: `${config.levelId}-day-${levelDay}`,
    globalDay,
    levelId: config.levelId,
    levelTitle: config.levelTitle,
    levelDay,
    durationMinutes: 25,
    sessionType,
    moduleTitle: config.moduleTitle,
    title: titleForSessionType(sessionType),
    focusSummary,
    includesProductionTask:
      sessionType === 'core-teach-practice' ||
      sessionType === 'speaking-drill' ||
      sessionType === 'writing-correction',
    includesListening:
      sessionType === 'listening-shadowing' ||
      sessionType === 'core-teach-practice' ||
      sessionType === 'benchmark-test',
    includesSpeaking:
      sessionType === 'speaking-drill' ||
      sessionType === 'core-teach-practice' ||
      sessionType === 'benchmark-test',
    includesWriting:
      sessionType === 'writing-correction' ||
      sessionType === 'core-teach-practice' ||
      sessionType === 'benchmark-test',
    includesReviewCycle: sessionType === 'review-retrieval',
    isBenchmark: sessionType === 'benchmark-test'
  };
}

function buildFullRoadmap(): RoadmapSession[] {
  const sessions: RoadmapSession[] = [];
  let globalDay = 1;

  for (const config of levelRoadmapConfigs) {
    for (let levelDay = 1; levelDay <= config.totalSessions; levelDay += 1) {
      sessions.push(makeRoadmapSession(config, globalDay, levelDay));
      globalDay += 1;
    }
  }

  return sessions;
}

export const SESSION_ROADMAP_8_MONTH = buildFullRoadmap();
export const TOTAL_ROADMAP_SESSIONS = SESSION_ROADMAP_8_MONTH.length; // should be 230

export function countCompletedCurriculumLessonsAsSessions(
  levels: Record<string, { lessonRecords: Record<string, { passed?: boolean }> }>
): number {
  return Object.values(levels).reduce((total, level) => {
    const passedCount = Object.values(level.lessonRecords).filter((record) => record?.passed).length;
    return total + passedCount;
  }, 0);
}

export function getRoadmapProgressFromCompletedSessions(completedSessions: number): RoadmapProgress {
  const totalSessions = TOTAL_ROADMAP_SESSIONS;
  const safeCompleted = Math.max(0, Math.min(completedSessions, totalSessions));
  const currentDay = Math.min(totalSessions, safeCompleted + 1);
  const today = SESSION_ROADMAP_8_MONTH[currentDay - 1] ?? SESSION_ROADMAP_8_MONTH[totalSessions - 1];
  const next = SESSION_ROADMAP_8_MONTH.slice(currentDay, currentDay + 3);

  return {
    totalSessions,
    completedSessions: safeCompleted,
    currentDay,
    today,
    next
  };
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function getRoadmapProgressFromCalendarDay(
  journeyStartedAt: number,
  completedSessions: number
): RoadmapProgress {
  const totalSessions = TOTAL_ROADMAP_SESSIONS;
  const safeCompleted = Math.max(0, Math.min(completedSessions, totalSessions));
  const started = Number.isFinite(journeyStartedAt) ? journeyStartedAt : Date.now();
  const daysSinceStart = Math.floor((startOfDay(Date.now()) - startOfDay(started)) / (1000 * 60 * 60 * 24));
  const calendarDay = Math.max(1, daysSinceStart + 1);
  const currentDay = Math.min(totalSessions, calendarDay);
  const today = SESSION_ROADMAP_8_MONTH[currentDay - 1] ?? SESSION_ROADMAP_8_MONTH[totalSessions - 1];
  const next = SESSION_ROADMAP_8_MONTH.slice(currentDay, currentDay + 3);

  return {
    totalSessions,
    completedSessions: safeCompleted,
    currentDay,
    today,
    next
  };
}
