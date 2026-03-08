import { a1Lessons, a2Lessons, b1Lessons, b2Lessons, foundationLessons } from '../modules';
import type { CEFRLevel, Lesson, LessonSummary } from '../types';

const lessonCatalog: Record<CEFRLevel, Lesson[]> = {
  Foundation: foundationLessons,
  A1: a1Lessons,
  A2: a2Lessons,
  B1: b1Lessons,
  B2: b2Lessons
};

export function getLessonsByLevel(level: CEFRLevel): Lesson[] {
  return lessonCatalog[level] ?? [];
}

export function getLessonById(lessonId: string): Lesson | undefined {
  const allLessons = Object.values(lessonCatalog).flat();
  return allLessons.find((lesson) => lesson.id === lessonId);
}

export function listLessonSummaries(level: CEFRLevel): LessonSummary[] {
  return getLessonsByLevel(level).map((lesson) => ({
    id: lesson.id,
    level: lesson.level,
    module: lesson.module,
    title: lesson.teachingContent[0]?.title ?? lesson.module,
    objectives: lesson.objectives
  }));
}

export function getNextLessonId(currentLessonId: string): string | undefined {
  const allLessons = Object.values(lessonCatalog).flat();
  const index = allLessons.findIndex((lesson) => lesson.id === currentLessonId);
  if (index < 0 || index + 1 >= allLessons.length) {
    return undefined;
  }

  return allLessons[index + 1].id;
}
