import { differenceInDays } from 'date-fns';

export const GATE_ORDER = [
  'CONVITE_ENVIADO',
  'FORMULARIO_CONFIRMADO',
  'CONTRATO_PENDENTE',
  'CONTRATO_ASSINADO',
  'TAXA_PAGA',
  'REMATRICULADO',
] as const;

export const GATE_LABELS: Record<string, string> = {
  CONVITE_ENVIADO: 'Convite Enviado',
  FORMULARIO_CONFIRMADO: 'Formulário Confirmado',
  CONTRATO_PENDENTE: 'Contrato Pendente',
  CONTRATO_ASSINADO: 'Contrato Assinado',
  TAXA_PAGA: 'Entrada Paga',
  REMATRICULADO: 'Rematriculado',
  RECUSADO: 'Recusado',
};

export const NON_RESPONDED_STATUSES = ['PENDING', 'SENT', 'OPENED'];

export function gateIndex(status: string): number {
  return GATE_ORDER.indexOf(status as (typeof GATE_ORDER)[number]);
}

/**
 * Cumulative count: invites that have reached `targetGate` or moved
 * past it. The funnel uses this so "Contrato assinado" naturally
 * includes anyone who already paid the fee or finished the flow.
 */
export function countAtOrBeyondGate(
  distribution: Array<{ gateStatus: string; _count: { _all: number } }>,
  targetGate: string,
): number {
  const targetIdx = gateIndex(targetGate);
  let total = 0;
  for (const entry of distribution) {
    if (gateIndex(entry.gateStatus) >= targetIdx) {
      total += entry._count._all;
    }
  }
  return total;
}

export function countExactGate(
  distribution: Array<{ gateStatus: string; _count: { _all: number } }>,
  targetGate: string,
): number {
  const entry = distribution.find((d) => d.gateStatus === targetGate);
  return entry?._count._all ?? 0;
}

/** Two-decimal percentage, safe for empty totals. */
export function safePercentage(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 10000) / 100;
}

/**
 * Average whole-day distance between two date fields across a list of
 * invites. Returns null when no invite has both fields populated — the
 * funnel renders "—" instead of 0 in that case.
 */
export function avgDaysBetween(
  invites: Array<Record<string, unknown>>,
  startField: string,
  endField: string,
): number | null {
  const diffs: number[] = [];

  for (const inv of invites) {
    const start = inv[startField] as Date | null;
    const end = inv[endField] as Date | null;
    if (start && end) {
      diffs.push(differenceInDays(end, start));
    }
  }

  if (diffs.length === 0) return null;
  return Math.round(diffs.reduce((sum, d) => sum + d, 0) / diffs.length);
}

/**
 * Coerce a Prisma Decimal / unknown numeric to a plain number, or null.
 * Decimals expose `toNumber()`; everything else gets a `Number(...)`
 * round-trip that nulls on NaN.
 */
export function toNumReport(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null && 'toNumber' in val) {
    return (val as { toNumber: () => number }).toNumber();
  }
  return Number(val) || null;
}

export function countByStatus(responses: Array<{ status: string }>) {
  let agreed = 0;
  let disagreed = 0;
  let noResponse = 0;
  let negotiating = 0;
  let negotiated = 0;

  for (const r of responses) {
    switch (r.status) {
      case 'AGREED':
        agreed++;
        break;
      case 'DISAGREED':
        disagreed++;
        break;
      case 'PENDING':
        noResponse++;
        break;
      case 'NEGOTIATING':
        negotiating++;
        break;
      case 'NEGOTIATED':
        negotiated++;
        break;
    }
  }

  return { agreed, disagreed, noResponse, negotiating, negotiated };
}
