import { prisma } from '../config/database.js';
import { FinancialAnalysisStatus } from '@prisma/client';

export async function createAnalysis(data: {
  leadId: string;
  cpfAnalyzed?: string;
  analysisNotes?: string;
}) {
  const lead = await prisma.lead.findUnique({
    where: { id: data.leadId },
  });

  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  return prisma.financialAnalysis.create({
    data: {
      leadId: data.leadId,
      cpfAnalyzed: data.cpfAnalyzed ?? null,
      analysisNotes: data.analysisNotes ?? null,
    },
    include: {
      lead: true,
    },
  });
}

export async function updateAnalysis(
  id: string,
  data: {
    cpfAnalyzed?: string;
    cpfStatus?: string;
    analysisNotes?: string;
    negotiationNotes?: string;
  },
) {
  const existing = await prisma.financialAnalysis.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('ANALYSIS_NOT_FOUND');
  }

  return prisma.financialAnalysis.update({
    where: { id },
    data: {
      cpfAnalyzed: data.cpfAnalyzed ?? undefined,
      cpfStatus: data.cpfStatus ?? undefined,
      analysisNotes: data.analysisNotes ?? undefined,
      negotiationNotes: data.negotiationNotes ?? undefined,
    },
    include: {
      lead: true,
    },
  });
}

export async function approveAnalysis(
  id: string,
  status: FinancialAnalysisStatus,
) {
  const existing = await prisma.financialAnalysis.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('ANALYSIS_NOT_FOUND');
  }

  return prisma.financialAnalysis.update({
    where: { id },
    data: { status },
    include: {
      lead: true,
    },
  });
}

export async function findByLeadId(leadId: string) {
  return prisma.financialAnalysis.findUnique({
    where: { leadId },
    include: {
      lead: true,
    },
  });
}

export async function recordPayment(paymentId: string, paidAt?: string) {
  const payment = await prisma.contractPayment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new Error('PAYMENT_NOT_FOUND');
  }

  return prisma.contractPayment.update({
    where: { id: paymentId },
    data: {
      status: 'PAID',
      paidAt: paidAt ? new Date(paidAt) : new Date(),
    },
    include: {
      contract: true,
    },
  });
}
