// The canonical course catalog. These ids are the exact `course_id` values the
// backend grants into `user_courses` and checks in getMyCourses / CheckUserCourseAccess
// (see api-gateway user.resolvers.go `programModules`). Keep this list in sync with it.
export interface Course {
  id: string;
  name: string;
}

export const COURSES: Course[] = [
  { id: '1', name: 'Java Development' },
  { id: '2', name: 'Front-End Technologies' },
  { id: '3', name: 'Mastering SQL' },
  { id: '4', name: 'Golang' },
  { id: '5', name: 'Full Stack Development' },
  { id: 'genai', name: 'GenAI & Forward Deployed Engineering' },
  { id: 'seo', name: 'SEO' },
  { id: 'digital-marketing', name: 'Digital Marketing' },
  { id: 'testing', name: 'Software Testing' },
];

export const courseName = (id: string): string =>
  COURSES.find((c) => c.id === id)?.name ?? id;

// Accepts a free-text cell from an Excel import ("1", "Java", "java development",
// "genai") and resolves it to a known course id, or null if unrecognized.
export function resolveCourseId(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  const byId = COURSES.find((c) => c.id.toLowerCase() === v);
  if (byId) return byId.id;
  const byName = COURSES.find((c) => c.name.toLowerCase() === v);
  if (byName) return byName.id;
  // loose contains match, e.g. "java" -> Java Development
  const loose = COURSES.find(
    (c) => c.name.toLowerCase().includes(v) || v.includes(c.id.toLowerCase()),
  );
  return loose ? loose.id : null;
}


// ─── Live catalog store ──────────────────────────────────────────────────────
// COURSES above is the static fallback (and the source for excel parsing). At
// runtime we refresh it from GET /api/admin/courses so the UI never drifts from
// the backend. Components read via useCourses(); non-React code reads COURSES.

import { useEffect, useState } from 'react';
import { fetchCourses } from './api';

let catalog: Course[] = COURSES;
let loaded = false;
const listeners = new Set<() => void>();

export function currentCourses(): Course[] {
  return catalog;
}

export async function loadCourses(): Promise<void> {
  if (loaded) return;
  try {
    const res = await fetchCourses();
    if (res.courses?.length) {
      catalog = res.courses;
      // Keep the static array in sync for excel.ts / resolveCourseId.
      COURSES.length = 0;
      COURSES.push(...res.courses);
    }
  } catch {
    // keep fallback
  } finally {
    loaded = true;
    listeners.forEach((l) => l());
  }
}

export function useCourses(): Course[] {
  const [, setV] = useState(0);
  useEffect(() => {
    const l = () => setV((n) => n + 1);
    listeners.add(l);
    loadCourses();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return catalog;
}
