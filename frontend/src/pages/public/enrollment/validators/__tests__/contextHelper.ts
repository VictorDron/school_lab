import { vi } from 'vitest';
import type { ValidatorContext } from '../types';

type DeepRecord = Record<string, unknown>;

/**
 * Builds a ValidatorContext suitable for unit testing the per-step
 * validators. `formValues` is consulted by both watch() and getValues();
 * tests pass any subset of the form they need.
 */
export function buildContext(
  overrides: {
    formValues?: DeepRecord;
    language?: 'pt' | 'en';
    enrollmentStudents?: ReadonlyArray<{ id?: string; fullName?: string }>;
    enrollmentData?: ValidatorContext['enrollmentData'];
    activeStudentTab?: number;
    watchFinancialResponsible?: ValidatorContext['watchFinancialResponsible'];
  } = {},
): ValidatorContext & { setFieldErrorsSpy: ReturnType<typeof vi.fn>; setActiveStudentTabSpy: ReturnType<typeof vi.fn> } {
  const formValues = overrides.formValues ?? {};

  const get = (path: string): unknown => {
    const segments = path.split('.');
    let current: unknown = formValues;
    for (const seg of segments) {
      if (current == null) return undefined;
      // Numeric indexes for array-style paths
      const idx = Number(seg);
      if (!Number.isNaN(idx) && Array.isArray(current)) {
        current = current[idx];
      } else if (typeof current === 'object') {
        current = (current as DeepRecord)[seg];
      } else {
        return undefined;
      }
    }
    return current;
  };

  const setFieldErrorsSpy = vi.fn();
  const setActiveStudentTabSpy = vi.fn();

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    watch: ((path?: string) => (path ? get(path) : formValues)) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue: vi.fn() as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getValues: ((path?: string) => (path ? get(path) : formValues)) as any,
    language: overrides.language ?? 'pt',
    enrollmentStudents: overrides.enrollmentStudents ?? [],
    enrollmentData: overrides.enrollmentData,
    activeStudentTab: overrides.activeStudentTab ?? 0,
    setActiveStudentTab: setActiveStudentTabSpy,
    setFieldErrors: setFieldErrorsSpy,
    watchFinancialResponsible: overrides.watchFinancialResponsible,
    setFieldErrorsSpy,
    setActiveStudentTabSpy,
  };
}
