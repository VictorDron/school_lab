import { describe, it, expect } from 'vitest';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { statusConfig } from '../helpers';

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
