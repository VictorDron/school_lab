// Grades with Brazilian equivalents
export interface GradeOption {
  value: string;
  en: string;
  pt: string;
  brazilianEquivalent: string;
  isFirstSchool: boolean; // true if this grade is always the first school experience (Nursery, Pre-K3, Pre-K4)
  mayBeFirstSchool: boolean; // true if child may not have a school transcript yet (Kinder, 1st Grade)
}

export const gradeOptions: GradeOption[] = [
  {
    value: 'Nursery',
    en: 'Nursery (18 meses até 3 anos)',
    pt: 'Nursery (18 meses até 3 anos)',
    brazilianEquivalent: '18 meses até 3 anos',
    isFirstSchool: true,
    mayBeFirstSchool: false,
  },
  {
    value: 'Pre-K3',
    en: 'Pre-K3 (3-4 anos)',
    pt: 'Pre-K3 (3-4 anos)',
    brazilianEquivalent: '3-4 anos',
    isFirstSchool: true,
    mayBeFirstSchool: false,
  },
  {
    value: 'Pre-K4',
    en: 'Pre-K4 (4-5 anos)',
    pt: 'Pre-K4 (4-5 anos)',
    brazilianEquivalent: '4-5 anos',
    isFirstSchool: true,
    mayBeFirstSchool: false,
  },
  {
    value: 'Kindergarten',
    en: 'Kinder (5-6 anos)',
    pt: 'Kinder (5-6 anos)',
    brazilianEquivalent: '5-6 anos',
    isFirstSchool: false,
    mayBeFirstSchool: true,
  },
  {
    value: '1st Grade',
    en: '1st Grade (6-7 anos)',
    pt: '1st Grade (6-7 anos)',
    brazilianEquivalent: '6-7 anos',
    isFirstSchool: false,
    mayBeFirstSchool: true,
  },
  {
    value: '2nd Grade',
    en: '2nd Grade',
    pt: '2nd Grade',
    brazilianEquivalent: '2º Ano EF',
    isFirstSchool: false,
    mayBeFirstSchool: false,
  },
  {
    value: '3rd Grade',
    en: '3rd Grade',
    pt: '3rd Grade',
    brazilianEquivalent: '3º Ano EF',
    isFirstSchool: false,
    mayBeFirstSchool: false,
  },
  {
    value: '4th Grade',
    en: '4th Grade',
    pt: '4th Grade',
    brazilianEquivalent: '4º Ano EF',
    isFirstSchool: false,
    mayBeFirstSchool: false,
  },
  {
    value: '5th Grade',
    en: '5th Grade',
    pt: '5th Grade',
    brazilianEquivalent: '5º Ano EF',
    isFirstSchool: false,
    mayBeFirstSchool: false,
  },
  {
    value: '6th Grade',
    en: '6th Grade',
    pt: '6th Grade',
    brazilianEquivalent: '6º Ano EF',
    isFirstSchool: false,
    mayBeFirstSchool: false,
  },
  {
    value: '7th Grade',
    en: '7th Grade',
    pt: '7th Grade',
    brazilianEquivalent: '7º Ano EF',
    isFirstSchool: false,
    mayBeFirstSchool: false,
  },
  {
    value: '8th Grade',
    en: '8th Grade',
    pt: '8th Grade',
    brazilianEquivalent: '8º Ano EF',
    isFirstSchool: false,
    mayBeFirstSchool: false,
  },
  {
    value: '9th Grade',
    en: '9th Grade',
    pt: '9th Grade',
    brazilianEquivalent: '9º Ano EF',
    isFirstSchool: false,
    mayBeFirstSchool: false,
  },
  {
    value: '10th Grade',
    en: '10th Grade',
    pt: '10th Grade',
    brazilianEquivalent: '1º Ano EM',
    isFirstSchool: false,
    mayBeFirstSchool: false,
  },
  {
    value: '11th Grade',
    en: '11th Grade',
    pt: '11th Grade',
    brazilianEquivalent: '2º Ano EM',
    isFirstSchool: false,
    mayBeFirstSchool: false,
  },
  {
    value: '12th Grade',
    en: '12th Grade',
    pt: '12th Grade',
    brazilianEquivalent: '3º Ano EM',
    isFirstSchool: false,
    mayBeFirstSchool: false,
  },
];

// Simple string array for CRM components that need string[] (dropdown labels)
export const gradeLabels: string[] = gradeOptions.map((g) => g.en);

// Helper to check if a grade is always the first school experience (Nursery, Pre-K3, Pre-K4)
export function isFirstSchoolGrade(gradeValue: string): boolean {
  const grade = gradeOptions.find((g) => g.value === gradeValue);
  return grade?.isFirstSchool ?? false;
}

// Helper to check if a grade may be the first school experience (Kinder, 1st Grade)
export function isMayBeFirstSchoolGrade(gradeValue: string): boolean {
  const grade = gradeOptions.find((g) => g.value === gradeValue);
  return grade?.mayBeFirstSchool ?? false;
}

/**
 * Returns the next grade in the progression sequence.
 * Returns null for 12th Grade (terminal) or unrecognized grades.
 */
export function getNextGrade(currentGrade: string): string | null {
  const idx = gradeOptions.findIndex((g) => g.value === currentGrade);
  if (idx === -1 || idx === gradeOptions.length - 1) return null;
  return gradeOptions[idx + 1].value;
}

// Helper to get grade display name with Brazilian equivalent
export function getGradeDisplayName(
  gradeValue: string,
  language: 'en' | 'pt',
  showEquivalent: boolean = true
): string {
  const grade = gradeOptions.find((g) => g.value === gradeValue);
  if (!grade) return gradeValue;

  const name = language === 'pt' ? grade.pt : grade.en;
  if (showEquivalent && grade.brazilianEquivalent) {
    return `${name} (${grade.brazilianEquivalent})`;
  }
  return name;
}
