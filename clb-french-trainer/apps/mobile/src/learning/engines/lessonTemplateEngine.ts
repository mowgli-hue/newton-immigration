import type { FocusBlock, Lesson, LessonExercise } from '../types';

export function toSessionBlocks(lesson: Lesson): FocusBlock[] {
  return [
    {
      id: 'teaching',
      title: 'Teaching',
      description: lesson.objectives.join(' | '),
      completed: false
    },
    {
      id: 'practice',
      title: 'Practice',
      description: `${lesson.exercises.length} guided exercises`,
      completed: false
    },
    {
      id: 'production',
      title: 'Production',
      description: lesson.productionTask.prompt,
      completed: false
    },
    {
      id: 'miniTest',
      title: 'Mini Test',
      description: `${lesson.miniTest.length} checkpoint questions`,
      completed: false
    }
  ];
}

export function calculateExerciseScore(
  exercises: LessonExercise[],
  answers: Record<string, string | string[]>
): { correct: number; total: number; percent: number } {
  let correct = 0;

  exercises.forEach((exercise) => {
    const answer = answers[exercise.id];

    if (Array.isArray(exercise.correctAnswer)) {
      const expected = [...exercise.correctAnswer].sort().join('|');
      const actual = Array.isArray(answer) ? [...answer].sort().join('|') : '';
      if (expected === actual) {
        correct += 1;
      }
      return;
    }

    if (typeof answer === 'string' && answer.trim().toLowerCase() === exercise.correctAnswer.trim().toLowerCase()) {
      correct += 1;
    }
  });

  const total = exercises.length;
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);

  return { correct, total, percent };
}

export function hasMasteredLesson(lesson: Lesson, miniTestPercent: number): boolean {
  return miniTestPercent >= lesson.masteryThreshold;
}
