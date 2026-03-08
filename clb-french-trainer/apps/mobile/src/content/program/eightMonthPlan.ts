import type { GeneratedDailyTrackPlan } from '../../types/LessonContentTypes';
import type { LevelId } from '../../types/CurriculumTypes';

type StartLevelKey = 'foundation' | 'a1' | 'a2' | 'b1';

const basePlans: Record<StartLevelKey, GeneratedDailyTrackPlan> = {
  foundation: {
    startLevel: 'foundation',
    durationMonths: 8,
    minimumDailySessions: 1,
    phases: [
      {
        monthRange: 'Month 1',
        focusLevel: 'Foundation -> A1 Entry',
        goals: ['Alphabet + sounds', 'Survival greetings', 'Self-introduction basics', 'Numbers/time'],
        expectedMilestones: ['Complete Foundation Module 0', 'Pass A1 readiness checkpoint']
      },
      {
        monthRange: 'Month 2',
        focusLevel: 'A1 Core',
        goals: ['Subject pronouns + etre', 'Articles/gender', '-ER verbs', 'Basic questions'],
        expectedMilestones: ['Handle basic daily interactions', 'Short spoken self-introduction']
      },
      {
        monthRange: 'Month 3',
        focusLevel: 'A1 -> A2 Transition',
        goals: ['Routine descriptions', 'Simple past exposure', 'Appointments and shopping'],
        expectedMilestones: ['A1 mastery', 'A2 entry diagnostic pass']
      },
      {
        monthRange: 'Month 4',
        focusLevel: 'A2 Core',
        goals: ['Service dialogues', 'Past/future plans', 'Community vocabulary (Canada)'],
        expectedMilestones: ['A2 functional messages', 'CLB5 bridge listening drills start']
      },
      {
        monthRange: 'Month 5',
        focusLevel: 'A2 Mastery + B1 Entry',
        goals: ['Problem explanation', 'Short opinions', 'Workplace and housing scenarios'],
        expectedMilestones: ['A2 completion', 'B1 structured speaking start']
      },
      {
        monthRange: 'Month 6',
        focusLevel: 'B1 Core + CLB5 Target',
        goals: ['Coherent speaking', 'Functional writing', 'Timed task exposure'],
        expectedMilestones: ['CLB5-target mock tasks (baseline)', 'B1 unit tests >=80%']
      },
      {
        monthRange: 'Month 7',
        focusLevel: 'CLB7 Preparation',
        goals: ['Argumentation basics', 'Formal email structure', 'Longer listening and reading'],
        expectedMilestones: ['CLB7 target drills begin', 'Speaking rubric average >=4/5']
      },
      {
        monthRange: 'Month 8',
        focusLevel: 'TEF Canada Simulation Lab',
        goals: ['Timed simulations', 'Weak-skill remediation', 'Exam strategy and pacing'],
        expectedMilestones: ['3 full simulation cycles', 'Exam-ready decision by skill']
      }
    ]
  },
  a1: {
    startLevel: 'a1',
    durationMonths: 8,
    minimumDailySessions: 1,
    phases: [
      {
        monthRange: 'Month 1',
        focusLevel: 'A1 Core',
        goals: ['Core grammar and pronunciation', 'Daily routines', 'Questions and requests'],
        expectedMilestones: ['A1 Module 1-2 completion']
      },
      {
        monthRange: 'Month 2',
        focusLevel: 'A1 Mastery',
        goals: ['Shopping, transport, appointments', 'Short messages and emails'],
        expectedMilestones: ['A1 mastery assessment passed']
      },
      {
        monthRange: 'Month 3',
        focusLevel: 'A2 Entry',
        goals: ['Past events', 'Comparisons', 'Service interactions'],
        expectedMilestones: ['A2 core lessons started']
      },
      {
        monthRange: 'Month 4',
        focusLevel: 'A2 Core',
        goals: ['Work/housing communication', 'Voicemail and announcements'],
        expectedMilestones: ['A2 module tests >=75%']
      },
      {
        monthRange: 'Month 5',
        focusLevel: 'A2 Mastery + B1 Entry',
        goals: ['Opinion support', 'Problem/solution speaking', 'Short structured writing'],
        expectedMilestones: ['A2 completion']
      },
      {
        monthRange: 'Month 6',
        focusLevel: 'B1 + CLB5 Target',
        goals: ['Functional independence tasks', 'Timed practical TEF-style tasks'],
        expectedMilestones: ['CLB5 target module midpoint']
      },
      {
        monthRange: 'Month 7',
        focusLevel: 'CLB7 Target',
        goals: ['Argumentation and formal register', 'Longer responses'],
        expectedMilestones: ['CLB7 readiness checkpoint']
      },
      {
        monthRange: 'Month 8',
        focusLevel: 'TEF Simulation Lab',
        goals: ['Exam simulations', 'Skill-by-skill remediation'],
        expectedMilestones: ['Simulation average at target band']
      }
    ]
  },
  a2: {
    startLevel: 'a2',
    durationMonths: 8,
    minimumDailySessions: 1,
    phases: [
      { monthRange: 'Month 1', focusLevel: 'A2 Core', goals: ['A2 consolidation', 'Service/life scenarios'], expectedMilestones: ['A2 baseline + remediation'] },
      { monthRange: 'Month 2', focusLevel: 'A2 Mastery', goals: ['Past/future control', 'functional writing'], expectedMilestones: ['A2 completion'] },
      { monthRange: 'Month 3', focusLevel: 'B1 Entry', goals: ['Narration and coherence', 'workplace communication'], expectedMilestones: ['B1 module 1 complete'] },
      { monthRange: 'Month 4', focusLevel: 'B1 Core', goals: ['Speaking organization', 'reading strategies'], expectedMilestones: ['B1 skill scores >=75%'] },
      { monthRange: 'Month 5', focusLevel: 'CLB5 Target', goals: ['TEF practical tasks', 'timed listening/reading'], expectedMilestones: ['CLB5-target passing mocks'] },
      { monthRange: 'Month 6', focusLevel: 'B1/CLB5 Mastery', goals: ['Writing and speaking upgrades'], expectedMilestones: ['CLB5 stable performance'] },
      { monthRange: 'Month 7', focusLevel: 'CLB7 Target Entry', goals: ['Argumentation', 'formal writing'], expectedMilestones: ['CLB7 prep started'] },
      { monthRange: 'Month 8', focusLevel: 'TEF Simulation Lab', goals: ['Simulation and remediation'], expectedMilestones: ['Exam-ready by weakest-skill rule'] }
    ]
  },
  b1: {
    startLevel: 'b1',
    durationMonths: 8,
    minimumDailySessions: 1,
    phases: [
      { monthRange: 'Month 1', focusLevel: 'B1 Consolidation', goals: ['Coherence and grammar control'], expectedMilestones: ['B1 gap analysis complete'] },
      { monthRange: 'Month 2', focusLevel: 'CLB5 Target', goals: ['Functional task speed and accuracy'], expectedMilestones: ['CLB5 target stable'] },
      { monthRange: 'Month 3', focusLevel: 'CLB5 -> CLB7 Bridge', goals: ['Longer speaking turns', 'formal/informal register'], expectedMilestones: ['Bridge unit tests'] },
      { monthRange: 'Month 4', focusLevel: 'CLB7 Target Core', goals: ['Argumentation', 'multi-step listening'], expectedMilestones: ['CLB7 skill baseline'] },
      { monthRange: 'Month 5', focusLevel: 'CLB7 Target Core', goals: ['Writing tasks and timed performance'], expectedMilestones: ['CLB7 writing/speaking upgrade'] },
      { monthRange: 'Month 6', focusLevel: 'TEF Format Training', goals: ['Task strategy and timing'], expectedMilestones: ['Timed task consistency'] },
      { monthRange: 'Month 7', focusLevel: 'TEF Simulation Lab', goals: ['Full simulations + remediation'], expectedMilestones: ['3 simulation average trending up'] },
      { monthRange: 'Month 8', focusLevel: 'Exam Readiness', goals: ['Final weak-skill repair', 'exam pacing'], expectedMilestones: ['Go/no-go exam decision'] }
    ]
  }
};

export function generateEightMonthTrackPlan(startLevel: LevelId): GeneratedDailyTrackPlan {
  const key: StartLevelKey =
    startLevel === 'foundation' || startLevel === 'a1' || startLevel === 'a2' || startLevel === 'b1'
      ? startLevel
      : 'b1';

  return basePlans[key];
}
