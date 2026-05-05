import { describe, it, expect } from 'vitest';

import { GRADE_ORDER, getNextGrade } from '../services/grade-progression.js';

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
});
