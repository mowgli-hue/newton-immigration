import { structuredLessons } from '../structuredLessons';
import { generateTeacherScript } from './teacherScriptGenerator';
import type { LevelId } from '../../types/CurriculumTypes';
import type { TeacherLessonScript } from '../../types/TeacherScriptTypes';

let cachedScripts: TeacherLessonScript[] | null = null;
const teacherScriptMap = new Map<string, TeacherLessonScript>();

function ensureScriptsLoaded(): TeacherLessonScript[] {
  if (cachedScripts) {
    return cachedScripts;
  }

  const generated = structuredLessons.map(generateTeacherScript);
  generated.forEach((script) => {
    teacherScriptMap.set(script.lessonId, script);
  });
  cachedScripts = generated;
  return generated;
}

export function getTeacherScriptByLessonId(lessonId: string): TeacherLessonScript | undefined {
  ensureScriptsLoaded();
  return teacherScriptMap.get(lessonId);
}

export function getTeacherScriptsByLevel(levelId: LevelId): TeacherLessonScript[] {
  return ensureScriptsLoaded().filter((script) => script.levelId === levelId);
}

export function getTeacherScriptsByLevelRange(levelIds: LevelId[]): TeacherLessonScript[] {
  const set = new Set(levelIds);
  return ensureScriptsLoaded().filter((script) => set.has(script.levelId));
}
