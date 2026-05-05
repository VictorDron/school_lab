import { vi, describe, it, expect, beforeEach } from 'vitest';

const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    reEnrollmentInvite: {
      findUnique: vi.fn(),
    },
    contract: {
      findFirst: vi.fn(),
    },
    leadEnrollmentDocument: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    preReEnrollmentResponse: {
      findUnique: vi.fn(),
    },
    familyPriceException: {
      findUnique: vi.fn(),
    },
    periodPriceTable: {
      findUnique: vi.fn(),
    },
  };
  return { prismaMock };
});

vi.mock('../config/database.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getInviteDetail } from '../services/re-enrollment-detail.service.js';

const baseInvite = {
  id: 'invite-1',
  periodId: 'period-1',
  studentId: 'student-1',
  token: 'tok',
  status: 'PENDING',
  gateStatus: 'FORMULARIO_CONFIRMADO',
  sentAt: null,
  openedAt: null,
  confirmedAt: null,
  declinedAt: null,
  expiredAt: null,
  declineReason: null,
  notes: null,
  emailStatus: null,
  emailError: null,
  emailSentAt: null,
  optOutReminders: false,
  extendedDeadline: null,
  rematriculadoAt: null,
  createdAt: new Date('2026-04-01'),
  updatedAt: new Date('2026-04-01'),
  period: {
    id: 'period-1',
    name: '2027 Renewal',
    targetYear: 2027,
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-06-30'),
    status: 'OPEN',
    eligibleGrades: ['5th Grade'],
    adjustmentPercent: 8,
  },
  student: {
    id: 'student-1',
    code: 'S-001',
    fullName: 'Aluno Teste',
    grade: '5th Grade',
    dateOfBirth: new Date('2015-05-12'),
    cpf: null,
    gender: null,
    nationality: null,
    leadId: 'lead-1',
    leadChildId: null,
    lead: {
      id: 'lead-1',
      code: 'L-001',
      familyName: 'Silva',
      primaryContactName: 'Maria',
      primaryContactEmail: 'maria@example.com',
      primaryContactPhone: null,
      secondaryContactName: null,
      secondaryContactEmail: null,
      secondaryContactPhone: null,
      notificationPreference: 'EMAIL',
      notes: null,
      createdAt: new Date('2024-01-01'),
      address: null,
      parents: [],
      children: [],
    },
  },
  feePayment: null,
};

describe('getInviteDetail — pricing block', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue(baseInvite);
    prismaMock.contract.findFirst.mockResolvedValue(null);
    prismaMock.leadEnrollmentDocument.findMany.mockResolvedValue([]);
    prismaMock.preReEnrollmentResponse.findUnique.mockResolvedValue(null);
    prismaMock.familyPriceException.findUnique.mockResolvedValue(null);
    prismaMock.periodPriceTable.findUnique.mockResolvedValue({
      baseAnnualValue: 10_000,
      enrollmentFee: 1000,
      discountPercent: null,
    });
  });

  it('should return SEM_CONTRATO + base*adjust when no exception/preResponse/contract', async () => {
    const result = await getInviteDetail('invite-1');

    expect(result.pricing.financialStatus).toBe('SEM_CONTRATO');
    expect(result.pricing.exception).toBeNull();
    expect(result.pricing.preResponse).toBeNull();
    expect(result.pricing.computed.adjustmentPercent).toBe(8);
    expect(result.pricing.computed.proposedValue).toBe(10_800);
    expect(result.pricing.computed.finalValue).toBe(10_800);
    expect(result.pricing.computed.monthlyValue).toBe(900);
    expect(result.pricing.priceTableEntry).toEqual({
      baseAnnualValue: 10_000,
      enrollmentFee: 1000,
      discountPercent: null,
    });
  });

  it('should apply approved overrideDiscountPercent=15 to finalValue', async () => {
    prismaMock.familyPriceException.findUnique.mockResolvedValue({
      id: 'exc-1',
      overrideAnnualValue: null,
      overrideDiscountPercent: 15,
      justification: 'Bolsa parcial',
      approvalStatus: 'APPROVED',
      approvedById: 'user-1',
      approvalDecidedAt: new Date('2026-04-02'),
      approvalNotes: null,
    });

    const result = await getInviteDetail('invite-1');

    expect(result.pricing.exception?.overrideDiscountPercent).toBe(15);
    expect(result.pricing.computed.proposedValue).toBe(10_800);
    expect(result.pricing.computed.finalValue).toBe(9180);
    expect(result.pricing.computed.monthlyValue).toBe(765);
  });

  it('should NOT apply exception that is still PENDING approval', async () => {
    prismaMock.familyPriceException.findUnique.mockResolvedValue({
      id: 'exc-1',
      overrideAnnualValue: null,
      overrideDiscountPercent: 30,
      justification: 'Aguardando aprovação',
      approvalStatus: 'PENDING',
      approvedById: null,
      approvalDecidedAt: null,
      approvalNotes: null,
    });

    const result = await getInviteDetail('invite-1');

    expect(result.pricing.exception?.approvalStatus).toBe('PENDING');
    expect(result.pricing.computed.finalValue).toBe(10_800);
  });

  it('should surface DISAGREED preResponse with disagreementReason', async () => {
    prismaMock.preReEnrollmentResponse.findUnique.mockResolvedValue({
      id: 'pre-1',
      status: 'DISAGREED',
      communicatedAnnualValue: 10_800,
      communicatedAdjustmentPercent: 8,
      disagreementReason: 'Reajuste muito alto este ano',
      negotiatedDiscountPercent: null,
      negotiatedFinalValue: null,
      negotiationJustification: null,
      respondedAt: new Date('2026-04-03'),
      emailSentAt: new Date('2026-04-01'),
      emailTo: 'maria@example.com',
    });

    const result = await getInviteDetail('invite-1');

    expect(result.pricing.preResponse?.status).toBe('DISAGREED');
    expect(result.pricing.preResponse?.disagreementReason).toBe('Reajuste muito alto este ano');
  });

  it('should compute INADIMPLENTE when contract has any OVERDUE payment', async () => {
    prismaMock.contract.findFirst.mockResolvedValue({
      id: 'contract-1',
      status: 'SIGNED',
      enrollmentType: 'RENEWAL',
      totalAnnualValue: 10_800,
      installments: 12,
      discountPercent: null,
      enrollmentFee: 1000,
      templateVersion: 1,
      createdAt: new Date('2026-04-05'),
      updatedAt: new Date('2026-04-05'),
      sentAt: new Date('2026-04-05'),
      signedAt: new Date('2026-04-08'),
      signers: [],
      payments: [{ id: 'p1', status: 'PAID' }, { id: 'p2', status: 'OVERDUE' }],
    });

    const result = await getInviteDetail('invite-1');

    expect(result.pricing.financialStatus).toBe('INADIMPLENTE');
    expect((result.contract as any)?.payments).toBeUndefined();
  });

  it('should compute null pricing when student has no grade in price table', async () => {
    prismaMock.periodPriceTable.findUnique.mockResolvedValue(null);

    const result = await getInviteDetail('invite-1');

    expect(result.pricing.priceTableEntry).toBeNull();
    expect(result.pricing.computed.proposedValue).toBeNull();
    expect(result.pricing.computed.finalValue).toBeNull();
  });
});
