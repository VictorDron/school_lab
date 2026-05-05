import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getInitials,
  buildApplicationLink,
  buildEnrollmentLink,
  isEnrollmentEligible,
  getApplicationStatusLabel,
  formatAddressLine,
  hasFormData,
  ENROLLMENT_ELIGIBLE_STATUSES,
} from '../helpers';
import type { Lead } from '@/types/crm';

describe('getInitials', () => {
  it('returns the first letters of the first two words', () => {
    expect(getInitials('Maria Silva')).toBe('MS');
    expect(getInitials('joão pedro alves')).toBe('JP');
  });

  it('returns a single letter for single-word names', () => {
    expect(getInitials('Maria')).toBe('M');
  });

  it('returns an empty string for an empty input', () => {
    expect(getInitials('')).toBe('');
  });

  it('skips extra whitespace', () => {
    expect(getInitials('  Ana   Beatriz  ')).toBe('AB');
  });
});

describe('buildApplicationLink', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { origin: 'https://app.example.com' },
    });
  });

  it('builds the admissions link when token is present', () => {
    expect(buildApplicationLink('abc123')).toBe(
      'https://app.example.com/admissions/apply?token=abc123'
    );
  });

  it('returns null when token is null, undefined or empty', () => {
    expect(buildApplicationLink(null)).toBeNull();
    expect(buildApplicationLink(undefined)).toBeNull();
    expect(buildApplicationLink('')).toBeNull();
  });
});

describe('buildEnrollmentLink', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { origin: 'https://app.example.com' },
    });
  });

  it('builds the enrollment link when token is present', () => {
    expect(buildEnrollmentLink('xyz789')).toBe(
      'https://app.example.com/enrollment/apply?token=xyz789'
    );
  });

  it('returns null when token is missing', () => {
    expect(buildEnrollmentLink(null)).toBeNull();
    expect(buildEnrollmentLink(undefined)).toBeNull();
    expect(buildEnrollmentLink('')).toBeNull();
  });
});

describe('isEnrollmentEligible', () => {
  it('returns true for every eligible status', () => {
    for (const status of ENROLLMENT_ELIGIBLE_STATUSES) {
      expect(isEnrollmentEligible(status)).toBe(true);
    }
  });

  it('returns false for non-eligible statuses', () => {
    expect(isEnrollmentEligible('LEAD_QUALIFIED')).toBe(false);
    expect(isEnrollmentEligible('REJECTED')).toBe(false);
  });

  it('returns false for null and undefined', () => {
    expect(isEnrollmentEligible(null)).toBe(false);
    expect(isEnrollmentEligible(undefined)).toBe(false);
    expect(isEnrollmentEligible('')).toBe(false);
  });
});

describe('getApplicationStatusLabel', () => {
  it('returns the pt-BR label for each known status', () => {
    expect(getApplicationStatusLabel('PENDING')).toBe('Aguardando Envio');
    expect(getApplicationStatusLabel('LINK_SENT')).toBe('Link Enviado');
    expect(getApplicationStatusLabel('FORM_RECEIVED')).toBe('Formulário Recebido');
    expect(getApplicationStatusLabel('NOT_REQUIRED')).toBe('Completo');
  });

  it('returns null for unknown or empty values', () => {
    expect(getApplicationStatusLabel('SOMETHING_ELSE')).toBeNull();
    expect(getApplicationStatusLabel(null)).toBeNull();
    expect(getApplicationStatusLabel(undefined)).toBeNull();
    expect(getApplicationStatusLabel('')).toBeNull();
  });
});

describe('formatAddressLine', () => {
  it('formats a complete address', () => {
    const address: Lead['address'] = {
      id: 'a1',
      leadId: 'l1',
      country: 'BR',
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: '20000-000',
    };
    expect(formatAddressLine(address)).toBe(
      'Rua das Flores, 123 - Centro - Rio de Janeiro/RJ (20000-000)'
    );
  });

  it('omits missing parts gracefully', () => {
    const address: Lead['address'] = {
      id: 'a1',
      leadId: 'l1',
      country: 'BR',
      street: 'Rua das Flores',
      city: 'Rio de Janeiro',
    } as Lead['address'];
    expect(formatAddressLine(address)).toBe('Rua das Flores - Rio de Janeiro');
  });

  it('returns just the city when only city is present', () => {
    const address: Lead['address'] = {
      id: 'a1',
      leadId: 'l1',
      country: 'BR',
      city: 'São Paulo',
    } as Lead['address'];
    expect(formatAddressLine(address)).toBe(' - São Paulo');
  });

  it('returns empty string when address is null or undefined', () => {
    expect(formatAddressLine(null as unknown as Lead['address'])).toBe('');
    expect(formatAddressLine(undefined)).toBe('');
  });
});

describe('hasFormData', () => {
  const baseLead = { id: 'l1' } as Lead;

  it('returns true when at least one form field is populated', () => {
    expect(hasFormData({ ...baseLead, parents: [{ id: 'p1' }] as Lead['parents'] })).toBe(true);
    expect(hasFormData({ ...baseLead, address: { id: 'a1' } as Lead['address'] })).toBe(true);
    expect(hasFormData({ ...baseLead, additionalInfo: {} as Lead['additionalInfo'] })).toBe(true);
    expect(
      hasFormData({ ...baseLead, educationHistory: [{ id: 'e1' }] as Lead['educationHistory'] })
    ).toBe(true);
  });

  it('returns false when no form data is present', () => {
    expect(hasFormData(baseLead)).toBe(false);
    expect(hasFormData({ ...baseLead, parents: [] as Lead['parents'] })).toBe(false);
    expect(hasFormData({ ...baseLead, educationHistory: [] as Lead['educationHistory'] })).toBe(
      false
    );
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
