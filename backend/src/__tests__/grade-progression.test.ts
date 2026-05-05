import { describe, it, expect, vi } from 'vitest';

vi.mock('../config/database.js', () => ({ prisma: {} }));

import {
  DEFAULT_GRADE_ORDER,
  GRADE_ORDER,
  VALID_GRADES,
  getNextGrade,
  isValidGrade,
} from '../services/grade-progression.js';

describe('GRADE_ORDER', () => {
  it('should have exactly 16 entries', () => {
    expect(GRADE_ORDER).toHaveLength(16);
  });

  it('should start with Nursery and end with 12th Grade', () => {
    expect(GRADE_ORDER[0]).toBe('Nursery');
    expect(GRADE_ORDER[15]).toBe('12th Grade');
  });
});

describe('getNextGrade', () => {
  it('should return Pre-K3 for Nursery', () => {
    expect(getNextGrade('Nursery')).toBe('Pre-K3');
  });

  it('should return Pre-K4 for Pre-K3', () => {
    expect(getNextGrade('Pre-K3')).toBe('Pre-K4');
  });

  it('should return 6th Grade for 5th Grade', () => {
    expect(getNextGrade('5th Grade')).toBe('6th Grade');
  });

  it('should return 12th Grade for 11th Grade', () => {
    expect(getNextGrade('11th Grade')).toBe('12th Grade');
  });

  it('should return null for 12th Grade (terminal)', () => {
    expect(getNextGrade('12th Grade')).toBeNull();
  });

  it('should return null for unrecognized grade', () => {
    expect(getNextGrade('Unknown Grade')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(getNextGrade('')).toBeNull();
  });

  it('honors a custom gradeOrder when provided', () => {
    const brOrder = ['Maternal', 'Jardim I', 'Jardim II', '1º ano EF'];
    expect(getNextGrade('Jardim I', brOrder)).toBe('Jardim II');
    expect(getNextGrade('1º ano EF', brOrder)).toBeNull();
    // Default progression's "Pre-K3" doesn't exist in the BR order
    expect(getNextGrade('Pre-K3', brOrder)).toBeNull();
  });
});

describe('DEFAULT_GRADE_ORDER / GRADE_ORDER alias', () => {
  it('exports the same readonly array under both names', () => {
    expect(GRADE_ORDER).toBe(DEFAULT_GRADE_ORDER);
  });
});

describe('isValidGrade', () => {
  it('returns true for grades in the default progression', () => {
    expect(isValidGrade('5th Grade')).toBe(true);
    expect(isValidGrade('Nursery')).toBe(true);
  });

  it('returns false for an unknown grade', () => {
    expect(isValidGrade('Unknown')).toBe(false);
    expect(isValidGrade('')).toBe(false);
  });

  it('honors a custom gradeOrder when provided', () => {
    const brOrder = ['Maternal', 'Jardim I', 'Jardim II'];
    expect(isValidGrade('Jardim I', brOrder)).toBe(true);
    expect(isValidGrade('5th Grade', brOrder)).toBe(false);
  });

  it('matches the legacy VALID_GRADES set for the default progression', () => {
    for (const grade of DEFAULT_GRADE_ORDER) {
      expect(VALID_GRADES.has(grade)).toBe(true);
      expect(isValidGrade(grade)).toBe(true);
    }
  });
});
