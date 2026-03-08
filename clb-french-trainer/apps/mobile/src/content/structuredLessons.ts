import type { StructuredLessonContent } from '../types/LessonContentTypes';
import { a1StructuredLessons } from './a1/a1StructuredLessons';
import { a2StructuredLessons } from './a2/a2StructuredLessons';
import { b1StructuredLessons } from './b1/b1StructuredLessons';
import { clb5StructuredLessons, clb7StructuredLessons } from './clb/clbStructuredLessons';
import { foundationStructuredLessons } from './foundation/foundationStructuredLessons';

export const structuredLessons: StructuredLessonContent[] = [
  ...foundationStructuredLessons,
  ...a1StructuredLessons,
  ...a2StructuredLessons,
  ...b1StructuredLessons,
  ...clb5StructuredLessons,
  ...clb7StructuredLessons
];

export function getStructuredLessonById(lessonId: string): StructuredLessonContent | undefined {
  return structuredLessons.find((lesson) => lesson.id === lessonId || lesson.curriculumLessonId === lessonId);
}
