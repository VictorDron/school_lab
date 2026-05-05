import { prisma } from '../../config/database.js';
import { pct } from './shared.js';
import type { FinancialStats } from './types.js';

/**
 * Contract pipeline + payment collection. SIGNED + ACTIVE both count toward
 * "signed" rate — a SIGNED contract that has flipped to ACTIVE didn't lose
 * its signature, just moved past it.
 */
export async function fetchFinancial(): Promise<FinancialStats> {
  const [byStatus, aggregate, payments] = await Promise.all([
    prisma.contract.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.contract.aggregate({
      _sum: { totalAnnualValue: true, enrollmentFee: true },
      _avg: { discountPercent: true, totalAnnualValue: true },
      where: { status: { notIn: ['CANCELLED'] } },
    }),
    prisma.contractPayment.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ]);

  const cMap = new Map(byStatus.map((r) => [r.status, r._count.id]));
  const totalContracts = byStatus.reduce((sum, r) => sum + r._count.id, 0);
  const signed = cMap.get('SIGNED') ?? 0;
  const active = cMap.get('ACTIVE') ?? 0;
  const cancelled = cMap.get('CANCELLED') ?? 0;
  const pending =
    (cMap.get('DRAFT') ?? 0) +
    (cMap.get('PENDING_LEGAL') ?? 0) +
    (cMap.get('PENDING_FINANCIAL') ?? 0) +
    (cMap.get('SENT') ?? 0);

  const pMap = new Map(payments.map((r) => [r.status, r._count.id]));
  const payTotal = payments.reduce((sum, r) => sum + r._count.id, 0);
  const payPaid = pMap.get('PAID') ?? 0;
  const payOverdue = pMap.get('OVERDUE') ?? 0;
  const payPending = pMap.get('PENDING') ?? 0;

  return {
    totalContracts,
    signed,
    active,
    cancelled,
    pending,
    signatureRate: pct(signed + active, totalContracts),
    projectedRevenue: Number(aggregate._sum.totalAnnualValue ?? 0),
    averageTicket: Number(aggregate._avg.totalAnnualValue ?? 0),
    averageDiscount: Number(aggregate._avg.discountPercent ?? 0),
    totalEnrollmentFees: Number(aggregate._sum.enrollmentFee ?? 0),
    payments: {
      total: payTotal,
      paid: payPaid,
      overdue: payOverdue,
      pending: payPending,
      collectionRate: pct(payPaid, payTotal),
    },
  };
}
