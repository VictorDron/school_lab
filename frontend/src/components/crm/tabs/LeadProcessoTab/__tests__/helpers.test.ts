import { describe, it, expect, beforeEach } from 'vitest';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { statusConfig, stepLabels, buildApplicationLink } from '../helpers';

describe('statusConfig', () => {
  it('exposes a config for every event status', () => {
    expect(Object.keys(statusConfig).sort()).toEqual([
      'CANCELLED',
      'COMPLETED',
      'IN_PROGRESS',
      'NO_SHOW',
      'SCHEDULED',
    ]);
  });

  it('uses Clock for SCHEDULED and IN_PROGRESS', () => {
    expect(statusConfig.SCHEDULED.icon).toBe(Clock);
    expect(statusConfig.IN_PROGRESS.icon).toBe(Clock);
  });

  it('uses CheckCircle for COMPLETED and XCircle for terminal failures', () => {
    expect(statusConfig.COMPLETED.icon).toBe(CheckCircle);
    expect(statusConfig.CANCELLED.icon).toBe(XCircle);
    expect(statusConfig.NO_SHOW.icon).toBe(XCircle);
  });

  it('exposes pt-BR labels with correct accents', () => {
    expect(statusConfig.SCHEDULED.label).toBe('Agendado');
    expect(statusConfig.IN_PROGRESS.label).toBe('Em andamento');
    expect(statusConfig.COMPLETED.label).toBe('Concluído');
    expect(statusConfig.CANCELLED.label).toBe('Cancelado');
    expect(statusConfig.NO_SHOW.label).toBe('Não compareceu');
  });
});

describe('stepLabels', () => {
  it('returns pt-BR labels for the gate progression', () => {
    expect(stepLabels.NOT_STARTED).toBe('Início');
    expect(stepLabels.FORM_RECEIVED).toBe('Formulário Recebido');
    expect(stepLabels.VISIT_APPROVED).toBe('Visita Aprovada');
    expect(stepLabels.VIVENCIA_COMPLETED).toBe('Vivência Realizada');
    expect(stepLabels.FINANCIAL_APPROVED).toBe('Financeiro Aprovado');
  });

  it('does not include a label for unknown statuses', () => {
    expect(stepLabels['UNKNOWN_STATUS']).toBeUndefined();
  });
});

describe('buildApplicationLink', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { origin: 'https://app.example.com' },
    });
  });

  it('builds the admissions link when the token is present', () => {
    expect(buildApplicationLink('abc123')).toBe(
      'https://app.example.com/admissions/apply?token=abc123'
    );
  });

  it('returns null for null, undefined or empty token', () => {
    expect(buildApplicationLink(null)).toBeNull();
    expect(buildApplicationLink(undefined)).toBeNull();
    expect(buildApplicationLink('')).toBeNull();
  });
});
