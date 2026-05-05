import { describe, it, expect } from 'vitest';
import { getDueDateStyle } from '../helpers';

const futureIso = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
const pastIso = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

describe('getDueDateStyle', () => {
  it('returns empty string when card has no due date', () => {
    expect(getDueDateStyle({ dueDate: undefined, status: 'OPEN' })).toBe('');
    expect(getDueDateStyle({ dueDate: null, status: 'OPEN' })).toBe('');
    expect(getDueDateStyle(undefined)).toBe('');
    expect(getDueDateStyle(null)).toBe('');
  });

  it('returns green when card is completed regardless of due date', () => {
    expect(getDueDateStyle({ dueDate: pastIso(5), status: 'COMPLETED' })).toBe('text-green-600');
    expect(getDueDateStyle({ dueDate: futureIso(5), status: 'COMPLETED' })).toBe('text-green-600');
  });

  it('returns red for past due dates that are not today', () => {
    expect(getDueDateStyle({ dueDate: pastIso(2), status: 'OPEN' })).toBe('text-red-600');
  });

  it('returns yellow when due date is today', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    expect(getDueDateStyle({ dueDate: today.toISOString(), status: 'OPEN' })).toBe('text-yellow-600');
  });

  it('returns neutral for future due dates', () => {
    expect(getDueDateStyle({ dueDate: futureIso(3), status: 'OPEN' })).toBe('text-neutral-600');
  });
});
