import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  genderLabels,
  studentTypeLabels,
  calculateAge,
  formatAge,
  langLabel,
} from '../helpers';

describe('genderLabels', () => {
  it('exposes pt-BR labels for the three gender codes', () => {
    expect(genderLabels.M).toBe('Masculino');
    expect(genderLabels.F).toBe('Feminino');
    expect(genderLabels.O).toBe('Outro');
  });

  it('returns undefined for unknown codes', () => {
    expect(genderLabels.X).toBeUndefined();
  });
});

describe('studentTypeLabels', () => {
  it('exposes pt-BR labels with badge colors for each type', () => {
    expect(studentTypeLabels.NEW.label).toBe('Novo Aluno');
    expect(studentTypeLabels.NEW.color).toContain('green');
    expect(studentTypeLabels.RETURNING.label).toBe('Aluno Retornando');
    expect(studentTypeLabels.RETURNING.color).toContain('blue');
    expect(studentTypeLabels.CURRENT.label).toBe('Aluno Atual');
    expect(studentTypeLabels.CURRENT.color).toContain('purple');
  });
});

describe('calculateAge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-03T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns whole years and zero months on a birthday match', () => {
    expect(calculateAge('2020-05-03')).toEqual({ years: 6, months: 0 });
  });

  it('returns months when birth was earlier in the same year', () => {
    expect(calculateAge('2020-01-01').years).toBe(6);
    expect(calculateAge('2020-01-01').months).toBeGreaterThanOrEqual(3);
  });

  it('rolls back the year when the birthday has not yet happened this year', () => {
    expect(calculateAge('2020-12-31').years).toBe(5);
  });
});

describe('formatAge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-03T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the singular for 1 ano', () => {
    expect(formatAge('2025-05-03')).toBe('1 ano');
  });

  it('uses the plural for multiple anos', () => {
    expect(formatAge('2020-05-03')).toBe('6 anos');
  });

  it('formats months only when the child is under one year', () => {
    expect(formatAge('2026-04-03')).toBe('1 mês');
    expect(formatAge('2026-02-03')).toBe('3 meses');
  });

  it('combines anos e meses when both are non-zero', () => {
    expect(formatAge('2024-02-03')).toMatch(/anos? e \d+ (mês|meses)/);
  });

  it('falls back to em-dash for impossible (future) dates', () => {
    expect(formatAge('2030-01-01')).toBe('—');
  });
});

describe('langLabel', () => {
  it('resolves a known language code to its pt-BR display name', () => {
    expect(langLabel('pt')).toBe('Português');
    expect(langLabel('en')).toBe('Inglês');
  });

  it('returns the code itself when no match is found', () => {
    expect(langLabel('xx-unknown')).toBe('xx-unknown');
  });
});
