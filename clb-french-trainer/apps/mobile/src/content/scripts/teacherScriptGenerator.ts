import type {
  Exercise,
  LessonBlock,
  MultipleChoiceExercise,
  ProductionTask,
  StructuredLessonContent
} from '../../types/LessonContentTypes';
import type {
  ScriptExercisePlan,
  ScriptStep,
  TeacherLessonScript,
  TeacherScriptVideoSegment
} from '../../types/TeacherScriptTypes';

function formatMinutes(totalMinutes: number): string {
  const safe = Math.max(0, totalMinutes);
  const m = Math.floor(safe);
  const s = Math.floor((safe - m) * 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function describeMultipleChoice(exercise: MultipleChoiceExercise): string {
  const expected = exercise.options[exercise.correctOptionIndex] ?? 'Correct option';
  return expected;
}

function describeProduction(task: ProductionTask): ScriptExercisePlan {
  if (task.exercise.kind === 'speakingPrompt') {
    return {
      id: task.exercise.id,
      prompt: task.exercise.prompt,
      expectedAnswer: `Include patterns: ${task.exercise.expectedPatterns.join(', ')}`,
      teacherExplanation: `Evaluate using rubric: ${task.exercise.rubricFocus.join(', ')}.`,
      remediationPrompt: 'Model one correct response and ask learner to repeat with one added detail.',
      points: task.exercise.points
    };
  }

  return {
    id: task.exercise.id,
    prompt: task.exercise.prompt,
    expectedAnswer: `Include elements: ${task.exercise.expectedElements.join(', ')}`,
    teacherExplanation: `Evaluate using rubric: ${task.exercise.rubricFocus.join(', ')}.`,
    remediationPrompt: 'Show a model sentence, then ask learner to rewrite with clearer structure.',
    points: task.exercise.points
  };
}

function describeExercise(exercise: Exercise): ScriptExercisePlan {
  switch (exercise.kind) {
    case 'multipleChoice':
    case 'listeningPrompt':
    case 'readingComprehension':
      return {
        id: exercise.id,
        prompt: exercise.prompt,
        expectedAnswer: describeMultipleChoice(exercise),
        teacherExplanation: exercise.explanationOnWrong,
        remediationPrompt: exercise.hint?.message,
        points: exercise.points
      };
    case 'shortAnswer':
      return {
        id: exercise.id,
        prompt: exercise.prompt,
        expectedAnswer: exercise.acceptedAnswers.join(' / '),
        teacherExplanation: exercise.explanationOnWrong,
        remediationPrompt: exercise.hint?.message,
        points: exercise.points
      };
    case 'sentenceOrderPuzzle':
      return {
        id: exercise.id,
        prompt: exercise.prompt,
        expectedAnswer: exercise.correctOrder.join(' '),
        teacherExplanation: exercise.explanationOnWrong,
        remediationPrompt: exercise.hint?.message,
        points: exercise.points
      };
    case 'matchingPairs':
      return {
        id: exercise.id,
        prompt: exercise.prompt,
        expectedAnswer: exercise.correctPairs.map((pair) => `${pair.leftId} -> ${pair.rightId}`).join(', '),
        teacherExplanation: exercise.explanationOnWrong,
        remediationPrompt: exercise.hint?.message,
        points: exercise.points
      };
    case 'memoryMatch':
      return {
        id: exercise.id,
        prompt: exercise.prompt,
        expectedAnswer: exercise.pairs.map((pair) => `${pair.left} = ${pair.right}`).join(' | '),
        teacherExplanation: exercise.explanationOnWrong,
        remediationPrompt: exercise.hint?.message,
        points: exercise.points
      };
    case 'quickClassification':
      return {
        id: exercise.id,
        prompt: exercise.prompt,
        expectedAnswer: exercise.items
          .map((item) => `${item.label} -> ${exercise.categories.find((cat) => cat.id === item.correctCategoryId)?.label ?? item.correctCategoryId}`)
          .join(' | '),
        teacherExplanation: exercise.explanationOnWrong,
        remediationPrompt: exercise.hint?.message,
        points: exercise.points
      };
    case 'speakingPrompt':
      return {
        id: exercise.id,
        prompt: exercise.prompt,
        expectedAnswer: `Patterns: ${exercise.expectedPatterns.join(', ')}`,
        teacherExplanation: `Scoring focus: ${exercise.rubricFocus.join(', ')}`,
        remediationPrompt: 'Coach with one model response, then ask for improved retry.',
        points: exercise.points
      };
    case 'writingPrompt':
      return {
        id: exercise.id,
        prompt: exercise.prompt,
        expectedAnswer: `Elements: ${exercise.expectedElements.join(', ')}`,
        teacherExplanation: `Scoring focus: ${exercise.rubricFocus.join(', ')}`,
        remediationPrompt: 'Provide correction hints and ask learner to rewrite.',
        points: exercise.points
      };
  }
}

function buildStepFromBlock(block: LessonBlock): ScriptStep {
  if (block.type === 'teach') {
    const talkTrack = (block.teachingSegments ?? []).flatMap((segment) => [
      `${segment.title}: ${segment.explanation}`,
      ...segment.examples.map((example) => `Example: ${example}`),
      segment.companionTip ? `Coach Tip: ${segment.companionTip}` : ''
    ]).filter(Boolean);

    return {
      id: block.id,
      stepType: 'teach',
      title: block.title,
      durationMinutes: block.targetMinutes,
      teacherTalkTrack: talkTrack,
      learnerActions: ['Read examples aloud', 'Repeat key lines', 'Ask one clarification question']
    };
  }

  if (block.type === 'practice') {
    return {
      id: block.id,
      stepType: 'practice',
      title: block.title,
      durationMinutes: block.targetMinutes,
      teacherTalkTrack: [
        'Guide the learner through each item one by one.',
        'For wrong answers, explain briefly and queue retry later.'
      ],
      learnerActions: ['Complete each practice item', 'Listen to correction', 'Retry missed patterns'],
      exercises: (block.exercises ?? []).map(describeExercise)
    };
  }

  if (block.type === 'production' && block.productionTask) {
    return {
      id: block.id,
      stepType: 'production',
      title: block.title,
      durationMinutes: block.targetMinutes,
      teacherTalkTrack: [
        block.productionTask.instructions,
        'Require complete output before moving forward.'
      ],
      learnerActions: ['Produce full response', 'Review feedback', 'Retry for clearer output if needed'],
      exercises: [describeProduction(block.productionTask)]
    };
  }

  return {
    id: block.id,
    stepType: 'miniTest',
    title: block.title,
    durationMinutes: block.targetMinutes,
    teacherTalkTrack: [
      'Run this as an independent check with minimal hints.',
      'Score against task completion, clarity, and accuracy.'
    ],
    learnerActions: ['Complete checkpoint independently', 'Review score and weak points'],
    exercises: (block.exercises ?? []).map(describeExercise)
  };
}

function buildVideoOutline(scriptSteps: ScriptStep[]): TeacherScriptVideoSegment[] {
  let minuteCursor = 0;
  return scriptSteps.map((step) => {
    const start = minuteCursor;
    const end = start + step.durationMinutes;
    minuteCursor = end;
    return {
      title: step.title,
      timestampStart: formatMinutes(start),
      timestampEnd: formatMinutes(end),
      objective: step.learnerActions[0] ?? 'Complete this step'
    };
  });
}

function collectMistakes(lesson: StructuredLessonContent): string[] {
  const mistakes = lesson.blocks.flatMap((block) =>
    (block.exercises ?? []).map((exercise) =>
      `Exercise ${exercise.id}: ${
        exercise.kind === 'multipleChoice' || exercise.kind === 'listeningPrompt' || exercise.kind === 'readingComprehension'
          ? exercise.explanationOnWrong
          : 'Use guided correction and retry with structured support.'
      }`
    )
  );

  if (!mistakes.length) {
    mistakes.push('Watch for incomplete responses and missing required elements.');
  }

  return mistakes.slice(0, 10);
}

export function generateTeacherScript(lesson: StructuredLessonContent): TeacherLessonScript {
  const introStep: ScriptStep = {
    id: `${lesson.id}-intro`,
    stepType: 'intro',
    title: 'Lesson Opening',
    durationMinutes: 1,
    teacherTalkTrack: [
      `Today we focus on: ${lesson.outcomes[0] ?? 'target communication skill'}.`,
      `Success criteria: ${lesson.assessment.masteryThresholdPercent}% with production completed.`
    ],
    learnerActions: ['Listen to lesson goal', 'Prepare notebook', 'Repeat key objective']
  };

  const contentSteps = lesson.blocks.map(buildStepFromBlock);
  const wrapUpStep: ScriptStep = {
    id: `${lesson.id}-wrap`,
    stepType: 'wrapUp',
    title: 'Lesson Wrap-Up',
    durationMinutes: 1,
    teacherTalkTrack: [
      'Summarize one grammar point and one functional phrase.',
      'Assign quick review and retry items for mistakes.'
    ],
    learnerActions: ['Record 3 new words', 'Write one corrected sentence', 'Set next lesson target']
  };

  const allSteps = [introStep, ...contentSteps, wrapUpStep];
  const checkpointRubric = [
    'Task completion: response includes purpose + key details',
    'Accuracy: grammar supports clear meaning',
    'Coherence: ideas are logically ordered',
    'Production requirement completed before unlock'
  ];

  return {
    lessonId: lesson.curriculumLessonId ?? lesson.id,
    lessonTitle: lesson.title,
    levelId: lesson.levelId,
    targetMinutes: lesson.estimatedMinutes,
    teachingObjective: lesson.outcomes[0] ?? lesson.title,
    scriptSteps: allSteps,
    masteryThresholdPercent: lesson.assessment.masteryThresholdPercent,
    retryPolicy: lesson.assessment.retryIncorrectLater
      ? 'Re-teach missed pattern briefly, then replay missed items in retry round.'
      : 'Retry is optional for this lesson.',
    commonMistakesToCoach: collectMistakes(lesson),
    checkpointRubric,
    youtubeRecordingOutline: buildVideoOutline(allSteps)
  };
}

