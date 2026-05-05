import { vi, describe, it, expect, beforeEach } from 'vitest';

const { prismaMock, gateServiceMock, studentsServiceMock, supabaseMock, emailServiceMock } = vi.hoisted(() => {
  const prismaMock = {
    reEnrollmentInvite: {
      findUnique: vi.fn(),
    },
    enrollmentFeePayment: {
      create: vi.fn(),
    },
    lead: {
      findUnique: vi.fn(),
    },
  };
  const gateServiceMock = {
    transitionGate: vi.fn(),
  };
  const studentsServiceMock = {
    createStudentFromReEnrollment: vi.fn(),
  };
  const supabaseMock = {
    uploadFile: vi.fn(),
  };
  const emailServiceMock = {
    sendReEnrollmentWelcomeEmail: vi.fn(),
  };
  return { prismaMock, gateServiceMock, studentsServiceMock, supabaseMock, emailServiceMock };
});

vi.mock('../config/database.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../services/re-enrollment-gate.service.js', () => ({
  transitionGate: gateServiceMock.transitionGate,
  canTransitionGate: vi.fn(),
}));
vi.mock('../services/students/index.js', () => studentsServiceMock);
vi.mock('../config/supabase.js', () => supabaseMock);
vi.mock('../services/email.service.js', () => emailServiceMock);
vi.mock('../services/grade-progression.js', () => ({
  getNextGrade: vi.fn((grade: string) => grade === '5th Grade' ? '6th Grade' : 'Unknown'),
}));
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { registerFeePayment } from '../services/re-enrollment-financial.service.js';

const baseInvite = {
  id: 'invite-1',
  gateStatus: 'CONTRATO_ASSINADO',
  feePayment: null,
  student: {
    id: 'student-1',
    fullName: 'João Silva',
    grade: '5th Grade',
    leadId: 'lead-1',
  },
  period: {
    id: 'period-1',
    targetYear: 2027,
  },
};

const basePaymentData = {
  amountPaid: 1400,
  paymentDate: '2026-04-03T10:00:00Z',
  paymentMethod: 'PIX',
};

describe('registerFeePayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create EnrollmentFeePayment record when invite is at CONTRATO_ASSINADO', async () => {
    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue(baseInvite);
    prismaMock.enrollmentFeePayment.create.mockResolvedValue({ id: 'payment-1', ...basePaymentData });
    gateServiceMock.transitionGate.mockResolvedValue(undefined);
    studentsServiceMock.createStudentFromReEnrollment.mockResolvedValue({ id: 'new-student-1' });
    prismaMock.lead.findUnique.mockResolvedValue(null);

    const result = await registerFeePayment('invite-1', basePaymentData, 'user-1');

    expect(prismaMock.enrollmentFeePayment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        inviteId: 'invite-1',
        amountPaid: 1400,
        paymentMethod: 'PIX',
        registeredById: 'user-1',
      }),
    });
    expect(result).toEqual(expect.objectContaining({ id: 'payment-1' }));
  });

  it('should throw error when invite is NOT at CONTRATO_ASSINADO', async () => {
    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue({
      ...baseInvite,
      gateStatus: 'FORMULARIO_CONFIRMADO',
    });

    await expect(registerFeePayment('invite-1', basePaymentData, 'user-1'))
      .rejects.toThrow();

    expect(prismaMock.enrollmentFeePayment.create).not.toHaveBeenCalled();
  });

  it('should transition gate CONTRATO_ASSINADO -> TAXA_PAGA -> REMATRICULADO', async () => {
    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue(baseInvite);
    prismaMock.enrollmentFeePayment.create.mockResolvedValue({ id: 'payment-1' });
    gateServiceMock.transitionGate.mockResolvedValue(undefined);
    studentsServiceMock.createStudentFromReEnrollment.mockResolvedValue({ id: 'new-student-1' });
    prismaMock.lead.findUnique.mockResolvedValue(null);

    await registerFeePayment('invite-1', basePaymentData, 'user-1');

    expect(gateServiceMock.transitionGate).toHaveBeenCalledTimes(2);
    expect(gateServiceMock.transitionGate).toHaveBeenNthCalledWith(1, 'invite-1', 'TAXA_PAGA', 'user-1');
    expect(gateServiceMock.transitionGate).toHaveBeenNthCalledWith(2, 'invite-1', 'REMATRICULADO', 'user-1');
  });

  it('should call createStudentFromReEnrollment before final transition', async () => {
    const callOrder: string[] = [];
    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue(baseInvite);
    prismaMock.enrollmentFeePayment.create.mockResolvedValue({ id: 'payment-1' });
    gateServiceMock.transitionGate.mockImplementation(async (_id: string, status: string) => {
      callOrder.push(`gate:${status}`);
    });
    studentsServiceMock.createStudentFromReEnrollment.mockImplementation(async () => {
      callOrder.push('createStudent');
      return { id: 'new-student-1' };
    });
    prismaMock.lead.findUnique.mockResolvedValue(null);

    await registerFeePayment('invite-1', basePaymentData, 'user-1');

    expect(callOrder).toEqual(['gate:TAXA_PAGA', 'createStudent', 'gate:REMATRICULADO']);
    expect(studentsServiceMock.createStudentFromReEnrollment).toHaveBeenCalledWith(
      baseInvite.student,
      2027,
      '6th Grade',
    );
  });

  it('should handle optional receipt upload and store receiptUrl', async () => {
    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue(baseInvite);
    prismaMock.enrollmentFeePayment.create.mockResolvedValue({ id: 'payment-1' });
    gateServiceMock.transitionGate.mockResolvedValue(undefined);
    studentsServiceMock.createStudentFromReEnrollment.mockResolvedValue({ id: 'new-student-1' });
    supabaseMock.uploadFile.mockResolvedValue('https://storage.example.com/receipt.pdf');
    prismaMock.lead.findUnique.mockResolvedValue(null);

    const dataWithReceipt = {
      ...basePaymentData,
      receipt: {
        buffer: Buffer.from('fake-pdf'),
        originalname: 'comprovante.pdf',
        mimetype: 'application/pdf',
      },
    };

    await registerFeePayment('invite-1', dataWithReceipt, 'user-1');

    expect(supabaseMock.uploadFile).toHaveBeenCalledWith(
      dataWithReceipt.receipt.buffer,
      expect.stringContaining('re-enrollment/receipts/invite-1/'),
      'application/pdf',
    );
    expect(prismaMock.enrollmentFeePayment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        receiptUrl: 'https://storage.example.com/receipt.pdf',
      }),
    });
  });

  it('should throw if invite already has a fee payment (unique constraint)', async () => {
    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue({
      ...baseInvite,
      feePayment: { id: 'existing-payment' },
    });

    await expect(registerFeePayment('invite-1', basePaymentData, 'user-1'))
      .rejects.toThrow();

    expect(prismaMock.enrollmentFeePayment.create).not.toHaveBeenCalled();
    expect(gateServiceMock.transitionGate).not.toHaveBeenCalled();
  });
});
