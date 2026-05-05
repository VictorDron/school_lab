/**
 * Grade progression map for Rio International School.
 * 16 grades in order, matching frontend gradeOptions values.
 */
export const GRADE_ORDER: readonly string[] = [
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

/** Allowlist of valid grade values — shared across all student creation/update paths. */
export const VALID_GRADES: ReadonlySet<string> = new Set(GRADE_ORDER);

/**
 * Returns the next grade in the progression, or null for terminal / unrecognized grades.
 */
export function getNextGrade(currentGrade: string): string | null {
  const idx = GRADE_ORDER.indexOf(currentGrade);
  if (idx === -1 || idx === GRADE_ORDER.length - 1) {
    return null;
  }
  return GRADE_ORDER[idx + 1];
}
