import { describe, it, expect } from 'vitest';
import { formatPhone, formatCPF, formatPlate, formatDateBR, formatBRL } from '../formatters';

describe('formatPhone', () => {
  it('formats a 10-digit landline as (XX) XXXX-XXXX', () => {
    expect(formatPhone('2122223333')).toBe('(21) 2222-3333');
  });

  it('formats an 11-digit mobile as (XX) XXXXX-XXXX', () => {
    expect(formatPhone('21987654321')).toBe('(21) 98765-4321');
  });

  it('strips non-digits before formatting', () => {
    expect(formatPhone('(21) 98765-4321')).toBe('(21) 98765-4321');
  });

  it('caps at 15 characters even with overflow input', () => {
    expect(formatPhone('219876543210000')).toHaveLength(15);
  });

  it('returns an empty string for empty input', () => {
    expect(formatPhone('')).toBe('');
  });
});

describe('formatCPF', () => {
  it('formats 11 digits as XXX.XXX.XXX-XX', () => {
    expect(formatCPF('12345678900')).toBe('123.456.789-00');
  });

  it('formats partial input progressively', () => {
    expect(formatCPF('1234')).toBe('123.4');
    expect(formatCPF('1234567')).toBe('123.456.7');
  });

  it('strips non-digits and caps at 11 raw digits', () => {
    expect(formatCPF('123.456.789-00.99')).toBe('123.456.789-00');
  });
});

describe('formatPlate', () => {
  it('uppercases and inserts a hyphen between letters and digits', () => {
    expect(formatPlate('abc1234')).toBe('ABC-1234');
  });

  it('strips disallowed characters', () => {
    expect(formatPlate('abc-1234!@')).toBe('ABC-1234');
  });

  it('caps at 7 raw alphanumeric characters', () => {
    expect(formatPlate('ABCD12345')).toBe('ABCD123');
  });

  it('handles Mercosul-style plates with mixed letters', () => {
    expect(formatPlate('abc1d23')).toBe('ABC-1D23');
  });
});

describe('formatDateBR', () => {
  it('renders a datetime with explicit local time in pt-BR locale', () => {
    expect(formatDateBR('2026-05-03T12:00:00')).toBe('03/05/2026');
  });

  it('returns the em-dash placeholder for null', () => {
    expect(formatDateBR(null)).toBe('—');
  });

  it('returns the em-dash placeholder for undefined', () => {
    expect(formatDateBR(undefined)).toBe('—');
  });

  it('returns the original string when not parseable', () => {
    expect(formatDateBR('not-a-date')).toBe('not-a-date');
  });
});

describe('formatBRL', () => {
  it('formats a number as Brazilian currency', () => {
    expect(formatBRL(1234.5)).toBe('R$ 1.234,50');
  });

  it('renders zero as R$ 0,00', () => {
    expect(formatBRL(0)).toBe('R$ 0,00');
  });

  it('returns the em-dash placeholder for null', () => {
    expect(formatBRL(null)).toBe('—');
  });
});
