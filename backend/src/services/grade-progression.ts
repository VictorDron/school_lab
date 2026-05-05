/**
 * Grade progression — the canonical ordered list of grades a student walks
 * through during their schooling.
 *
 * The default below is the K-12 American grade progression, which is what
 * bilingual / international schools commonly use. A tenant whose curriculum
 * follows a different sequence (e.g. a Brazilian EF/EM school using
 * "Maternal / Jardim / 1º ano EF / ... / 3ª série EM") can override the
 * full list via SystemSettings.gradeProgression.
 *
 * The pure helpers below (`getNextGrade`, `isValidGrade`) accept an optional
 * `gradeOrder` argument so they can be called from sync code paths with the
 * tenant's order pre-fetched. `getTenantGradeOrder()` is the async
 * convenience wrapper that reads settings and falls back to the default.
 */

import { getOrCreateSettings } from './settings.service.js';
import { getDefaultTenant } from './tenant.service.js';

export const DEFAULT_GRADE_ORDER: readonly string[] = [
  'Nursery',
  'Pre-K3',
  'Pre-K4',
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
] as const;

/**
 * Backwards-compatible alias for the default progression. New code should
 * read this via `getTenantGradeOrder()` so per-tenant overrides apply.
 */
export const GRADE_ORDER = DEFAULT_GRADE_ORDER;

/**
 * Allowlist set built from the default progression. Same caveat as
 * GRADE_ORDER — prefer `isValidGrade(grade, await getTenantGradeOrder())`
 * in code paths that should honor per-tenant overrides.
 */
export const VALID_GRADES: ReadonlySet<string> = new Set(DEFAULT_GRADE_ORDER);

/**
 * Returns the next grade in the progression, or null for the terminal
 * grade and for grades not present in `gradeOrder`.
 */
export function getNextGrade(
  currentGrade: string,
  gradeOrder: readonly string[] = DEFAULT_GRADE_ORDER,
): string | null {
  const idx = gradeOrder.indexOf(currentGrade);
  if (idx === -1 || idx === gradeOrder.length - 1) {
    return null;
  }
  return gradeOrder[idx + 1];
}

/** Convenience predicate matching the `VALID_GRADES.has(grade)` pattern. */
export function isValidGrade(
  grade: string,
  gradeOrder: readonly string[] = DEFAULT_GRADE_ORDER,
): boolean {
  return gradeOrder.includes(grade);
}

/**
 * Read the operator's configured grade progression, falling back to the
 * system default when no override is set. Read this once at the top of a
 * request and pass the result down to the sync helpers above.
 */
export async function getTenantGradeOrder(): Promise<readonly string[]> {
  const { id: tenantId } = await getDefaultTenant();
  const settings = await getOrCreateSettings(tenantId);
  if (settings.gradeProgression && settings.gradeProgression.length > 0) {
    return settings.gradeProgression;
  }
  return DEFAULT_GRADE_ORDER;
}
