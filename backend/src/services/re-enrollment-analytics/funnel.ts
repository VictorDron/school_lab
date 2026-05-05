import { differenceInDays } from 'date-fns';
import { prisma } from '../../config/database.js';
import {
  GATE_LABELS,
  avgDaysBetween,
  countAtOrBeyondGate,
  countExactGate,
  safePercentage,
} from './shared.js';
import type {
  BottleneckAnalysis,
  BottleneckStage,
  FunnelData,
  FunnelStage,
  OverdueInvite,
} from './types.js';

/**
 * Six-stage re-enrollment funnel. Pre-rematrícula counts come from the
 * PreReEnrollmentResponse table; the remaining four stages are
 * cumulative gate counts on ReEnrollmentInvite (e.g. "Contrato assinado"
 * includes everyone who has paid the fee or finished). Only the
 * cadastro stage carries an avg-days metric — the others would need
 * timestamp tracking we don't yet persist.
 */
export async function getFunnelData(periodId: string): Promise<FunnelData> {
  const [
    preRespondedCount,
    prePendingCount,
    gateDistribution,
    totalInvites,
    invitesWithTimestamps,
  ] = await Promise.all([
    prisma.preReEnrollmentResponse.count({
      where: { periodId, status: { in: ['AGREED', 'NEGOTIATED'] } },
    }),
    prisma.preReEnrollmentResponse.count({
      where: { periodId, status: 'PENDING' },
    }),
    prisma.reEnrollmentInvite.groupBy({
      by: ['gateStatus'],
      where: { periodId },
      _count: { _all: true },
    }),
    prisma.reEnrollmentInvite.count({ where: { periodId } }),
    prisma.reEnrollmentInvite.findMany({
      where: { periodId, confirmedAt: { not: null } },
      select: {
        sentAt: true,
        confirmedAt: true,
        gateStatus: true,
        feePayment: { select: { createdAt: true } },
      },
    }),
  ]);

  const cadastroCount = countAtOrBeyondGate(gateDistribution, 'FORMULARIO_CONFIRMADO');
  const contratoCount = countAtOrBeyondGate(gateDistribution, 'CONTRATO_ASSINADO');
  const taxaCount = countAtOrBeyondGate(gateDistribution, 'TAXA_PAGA');
  const concluidoCount = countExactGate(gateDistribution, 'REMATRICULADO');

  const avgDaysCadastro = avgDaysBetween(
    invitesWithTimestamps as unknown as Array<Record<string, unknown>>,
    'sentAt',
    'confirmedAt',
  );

  const funnelStages: FunnelStage[] = [
    {
      name: 'Pré-rematrícula (responderam)',
      key: 'pre_responded',
      count: preRespondedCount,
      percentage: safePercentage(preRespondedCount, totalInvites),
      avgDaysInStage: null,
    },
    {
      name: 'Pré-rematrícula (não responderam)',
      key: 'pre_pending',
      count: prePendingCount,
      percentage: safePercentage(prePendingCount, totalInvites),
      avgDaysInStage: null,
    },
    {
      name: 'Cadastro atualizado',
      key: 'cadastro',
      count: cadastroCount,
      percentage: safePercentage(cadastroCount, totalInvites),
      avgDaysInStage: avgDaysCadastro,
    },
    {
      name: 'Contrato assinado',
      key: 'contrato',
      count: contratoCount,
      percentage: safePercentage(contratoCount, totalInvites),
      avgDaysInStage: null,
    },
    {
      name: 'Taxa paga',
      key: 'taxa',
      count: taxaCount,
      percentage: safePercentage(taxaCount, totalInvites),
      avgDaysInStage: null,
    },
    {
      name: 'Concluído',
      key: 'concluido',
      count: concluidoCount,
      percentage: safePercentage(concluidoCount, totalInvites),
      avgDaysInStage: null,
    },
  ];

  return { funnelStages, totalInvites };
}

/**
 * Bottleneck = a non-terminal gate holding more than 40% of the active
 * invites. The overdue list is only computed after the period's
 * endDate; before that, every invite is in-window even if extended.
 */
export async function getBottleneckAnalysis(periodId: string): Promise<BottleneckAnalysis> {
  const [gateDistribution, period] = await Promise.all([
    prisma.reEnrollmentInvite.groupBy({
      by: ['gateStatus'],
      where: { periodId },
      _count: { _all: true },
    }),
    prisma.reEnrollmentPeriod.findUnique({
      where: { id: periodId },
      select: { id: true, endDate: true },
    }),
  ]);

  let activeTotal = 0;
  const activeDistribution: Array<{ gateStatus: string; count: number }> = [];

  for (const entry of gateDistribution) {
    if (entry.gateStatus !== 'REMATRICULADO') {
      activeTotal += entry._count._all;
      activeDistribution.push({
        gateStatus: entry.gateStatus,
        count: entry._count._all,
      });
    }
  }

  const bottlenecks: BottleneckStage[] = activeDistribution.map((entry) => {
    const pct = safePercentage(entry.count, activeTotal);
    return {
      stageName: GATE_LABELS[entry.gateStatus] || entry.gateStatus,
      key: entry.gateStatus.toLowerCase(),
      count: entry.count,
      percentage: pct,
      isBottleneck: pct > 40,
    };
  });

  let overdueInvites: OverdueInvite[] = [];

  if (period && new Date() > new Date(period.endDate)) {
    const overdue = await prisma.reEnrollmentInvite.findMany({
      where: {
        periodId,
        gateStatus: { not: 'REMATRICULADO' },
      },
      select: {
        id: true,
        gateStatus: true,
        extendedDeadline: true,
        student: {
          select: {
            child: { select: { fullName: true } },
            grade: true,
          },
        },
      },
    });

    const now = new Date();

    overdueInvites = overdue
      .filter((inv) => {
        const deadline = inv.extendedDeadline ?? period.endDate;
        return now > new Date(deadline);
      })
      .map((inv) => ({
        studentName: inv.student?.child?.fullName ?? 'N/A',
        grade: inv.student?.grade ?? 'N/A',
        currentStage: inv.gateStatus,
        currentStageName: GATE_LABELS[inv.gateStatus] || inv.gateStatus,
        daysOverdue: differenceInDays(
          now,
          new Date(inv.extendedDeadline ?? period.endDate),
        ),
      }));
  }

  return { bottlenecks, overdueInvites };
}
