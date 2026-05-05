import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  preReEnrollmentResponse: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
  reEnrollmentPeriod: {
    findUnique: vi.fn(),
  },
  student: {
    findMany: vi.fn(),
  },
  familyPriceException: {
    findUnique: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../config/database.js', () => ({
  prisma: mockPrisma,
}));

const mockSendPreReEnrollmentEmail = vi.hoisted(() => vi.fn());
const mockCreateInviteForStudent = vi.hoisted(() => vi.fn());

vi.mock('../services/email.service.js', () => ({
  sendPreReEnrollmentEmail: mockSendPreReEnrollmentEmail,
}));

vi.mock('../services/re-enrollment-invite.service.js', () => ({
  createInviteForStudent: mockCreateInviteForStudent,
  updateInviteStatus: vi.fn(),
}));

vi.mock('nanoid', () => ({
  nanoid: () => 'test-token-abc123',
}));

import {
  sendPreReEnrollmentEmails,
  recordResponse,
  registerNegotiation,
  getResponseData,
} from '../services/re-enrollment-communication.service.js';

// ── sendPreReEnrollmentEmails ──────────────────────────────────────

describe('sendPreReEnrollmentEmails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create PreReEnrollmentResponse records BEFORE sending emails', async () => {
    const callOrder: string[] = [];

    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue({
      id: 'period-1',
      name: 'Rematrícula 2027',
      adjustmentPercent: { toNumber: () => 10 },
      preReEnrollmentDeadline: new Date('2027-03-15'),
      preReEnrollmentEmailTemplate: 'Prezadas famílias,',
    });

    mockPrisma.student.findMany.mockResolvedValue([
      {
        id: 'student-1',
        fullName: 'João Silva',
        grade: '5º Ano',
        lead: {
          familyName: 'Silva',
          primaryContactEmail: 'silva@test.com',
          contracts: [{ totalAnnualValue: { toNumber: () => 50000 } }],
        },
        child: { fullName: 'João Silva' },
        familyPriceExceptions: [],
      },
    ]);

    mockPrisma.preReEnrollmentResponse.create.mockImplementation(async (args: unknown) => {
      callOrder.push('create_record');
      return { id: 'resp-1', token: 'test-token-abc123', ...(args as Record<string, unknown>) };
    });

    mockCreateInviteForStudent.mockImplementation(async () => {
      callOrder.push('create_invite');
      return { id: 'invite-1', token: 'invite-token-xyz' };
    });

    mockSendPreReEnrollmentEmail.mockImplementation(async () => {
      callOrder.push('send_email');
      return { success: true };
    });

    mockPrisma.preReEnrollmentResponse.update.mockResolvedValue({});

    const result = await sendPreReEnrollmentEmails({
      periodId: 'period-1',
      studentIds: ['student-1'],
      customBody: 'Prezadas famílias,',
      deadline: new Date('2027-03-15'),
      sentById: 'user-1',
    });

    expect(callOrder[0]).toBe('create_record');
    expect(callOrder[1]).toBe('create_invite');
    expect(callOrder[2]).toBe('send_email');
    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('should store snapshot values (communicatedAnnualValue, communicatedAdjustmentPercent) in response record', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue({
      id: 'period-1',
      name: 'Rematrícula 2027',
      adjustmentPercent: { toNumber: () => 8.5 },
      preReEnrollmentDeadline: new Date('2027-03-15'),
      preReEnrollmentEmailTemplate: 'Template',
    });

    mockPrisma.student.findMany.mockResolvedValue([
      {
        id: 'student-1',
        fullName: 'Maria Santos',
        grade: '3º Ano',
        lead: {
          familyName: 'Santos',
          primaryContactEmail: 'santos@test.com',
          contracts: [{ totalAnnualValue: { toNumber: () => 42000 } }],
        },
        child: { fullName: 'Maria Santos' },
        familyPriceExceptions: [],
      },
    ]);

    mockPrisma.preReEnrollmentResponse.create.mockResolvedValue({
      id: 'resp-1',
      token: 'test-token-abc123',
    });
    mockCreateInviteForStudent.mockResolvedValue({ id: 'invite-1', token: 'invite-token-xyz' });
    mockSendPreReEnrollmentEmail.mockResolvedValue({ success: true });
    mockPrisma.preReEnrollmentResponse.update.mockResolvedValue({});

    await sendPreReEnrollmentEmails({
      periodId: 'period-1',
      studentIds: ['student-1'],
      customBody: 'Olá',
      deadline: new Date('2027-03-15'),
      sentById: 'user-1',
    });

    const createCall = mockPrisma.preReEnrollmentResponse.create.mock.calls[0][0];
    expect(createCall.data.communicatedAnnualValue).toBe(45570); // 42000 * 1.085
    expect(createCall.data.communicatedAdjustmentPercent).toBe(8.5);
    expect(createCall.data.emailTo).toBe('santos@test.com');
    expect(createCall.data.token).toBeDefined();
  });
});

// ── recordResponse ─────────────────────────────────────────────────

describe('recordResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should transition PENDING -> AGREED with respondedAt timestamp', async () => {
    mockPrisma.preReEnrollmentResponse.findFirst.mockResolvedValue({
      id: 'resp-1',
      token: 'valid-token',
      status: 'PENDING',
      periodId: 'period-1',
      studentId: 'student-1',
    });

    mockPrisma.preReEnrollmentResponse.update.mockResolvedValue({
      id: 'resp-1',
      status: 'AGREED',
      periodId: 'period-1',
      studentId: 'student-1',
    });

    const result = await recordResponse('valid-token', 'AGREED');

    expect(result.status).toBe('AGREED');
    expect(result.periodId).toBe('period-1');
    expect(result.studentId).toBe('student-1');

    const updateCall = mockPrisma.preReEnrollmentResponse.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe('AGREED');
    expect(updateCall.data.respondedAt).toBeInstanceOf(Date);
  });

  it('should transition PENDING -> DISAGREED with respondedAt and disagreementReason', async () => {
    mockPrisma.preReEnrollmentResponse.findFirst.mockResolvedValue({
      id: 'resp-2',
      token: 'valid-token-2',
      status: 'PENDING',
      periodId: 'period-1',
      studentId: 'student-2',
    });

    mockPrisma.preReEnrollmentResponse.update.mockResolvedValue({
      id: 'resp-2',
      status: 'DISAGREED',
      periodId: 'period-1',
      studentId: 'student-2',
    });

    const result = await recordResponse('valid-token-2', 'DISAGREED', 'Valor muito alto');

    expect(result.status).toBe('DISAGREED');

    const updateCall = mockPrisma.preReEnrollmentResponse.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe('DISAGREED');
    expect(updateCall.data.disagreementReason).toBe('Valor muito alto');
    expect(updateCall.data.respondedAt).toBeInstanceOf(Date);
  });

  it('should throw ALREADY_RESPONDED for non-PENDING token', async () => {
    mockPrisma.preReEnrollmentResponse.findFirst.mockResolvedValue({
      id: 'resp-3',
      token: 'already-responded-token',
      status: 'AGREED',
      periodId: 'period-1',
      studentId: 'student-1',
    });

    await expect(
      recordResponse('already-responded-token', 'DISAGREED'),
    ).rejects.toThrow('ALREADY_RESPONDED');
  });

  it('should throw RESPONSE_NOT_FOUND for invalid token', async () => {
    mockPrisma.preReEnrollmentResponse.findFirst.mockResolvedValue(null);

    await expect(
      recordResponse('invalid-token', 'AGREED'),
    ).rejects.toThrow('RESPONSE_NOT_FOUND');
  });
});

// ── registerNegotiation ────────────────────────────────────────────

describe('registerNegotiation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should transition DISAGREED -> NEGOTIATED with negotiation fields', async () => {
    mockPrisma.preReEnrollmentResponse.findUnique.mockResolvedValue({
      id: 'resp-4',
      status: 'DISAGREED',
      periodId: 'period-1',
      studentId: 'student-1',
      communicatedAnnualValue: { toNumber: () => 55000 },
    });

    mockPrisma.preReEnrollmentResponse.update.mockResolvedValue({
      id: 'resp-4',
      status: 'NEGOTIATED',
      periodId: 'period-1',
      studentId: 'student-1',
    });

    const result = await registerNegotiation({
      responseId: 'resp-4',
      discountPercent: 5,
      finalValue: 52250,
      justification: 'Família com múltiplos filhos',
      approvedById: 'admin-1',
    });

    expect(result.periodId).toBe('period-1');
    expect(result.studentId).toBe('student-1');

    const updateCall = mockPrisma.preReEnrollmentResponse.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe('NEGOTIATED');
    expect(updateCall.data.negotiatedDiscountPercent).toBe(5);
    expect(updateCall.data.negotiatedFinalValue).toBe(52250);
    expect(updateCall.data.negotiationJustification).toBe('Família com múltiplos filhos');
    expect(updateCall.data.negotiationApprovedById).toBe('admin-1');
    expect(updateCall.data.negotiationCompletedAt).toBeInstanceOf(Date);
  });

  it('should throw INVALID_NEGOTIATION_STATUS for non-DISAGREED status', async () => {
    mockPrisma.preReEnrollmentResponse.findUnique.mockResolvedValue({
      id: 'resp-5',
      status: 'AGREED',
      periodId: 'period-1',
      studentId: 'student-1',
    });

    await expect(
      registerNegotiation({
        responseId: 'resp-5',
        discountPercent: 5,
        finalValue: 52250,
        justification: 'Teste',
        approvedById: 'admin-1',
      }),
    ).rejects.toThrow('INVALID_NEGOTIATION_STATUS');
  });

  it('should throw RESPONSE_NOT_FOUND for invalid responseId', async () => {
    mockPrisma.preReEnrollmentResponse.findUnique.mockResolvedValue(null);

    await expect(
      registerNegotiation({
        responseId: 'invalid-id',
        discountPercent: 5,
        finalValue: 52250,
        justification: 'Teste',
        approvedById: 'admin-1',
      }),
    ).rejects.toThrow('RESPONSE_NOT_FOUND');
  });

  it('should allow NEGOTIATING -> NEGOTIATED transition', async () => {
    mockPrisma.preReEnrollmentResponse.findUnique.mockResolvedValue({
      id: 'resp-6',
      status: 'NEGOTIATING',
      periodId: 'period-1',
      studentId: 'student-1',
      communicatedAnnualValue: { toNumber: () => 55000 },
    });

    mockPrisma.preReEnrollmentResponse.update.mockResolvedValue({
      id: 'resp-6',
      status: 'NEGOTIATED',
      periodId: 'period-1',
      studentId: 'student-1',
    });

    const result = await registerNegotiation({
      responseId: 'resp-6',
      discountPercent: 3,
      finalValue: 53350,
      justification: 'Acordo parcial',
      approvedById: 'admin-1',
    });

    expect(result.periodId).toBe('period-1');
    expect(result.studentId).toBe('student-1');
  });
});

// ── getResponseData ────────────────────────────────────────────────

describe('getResponseData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load response with student and pricing info', async () => {
    mockPrisma.preReEnrollmentResponse.findFirst.mockResolvedValue({
      id: 'resp-1',
      token: 'data-token',
      status: 'PENDING',
      periodId: 'period-1',
      studentId: 'student-1',
      communicatedAnnualValue: { toNumber: () => 55000 },
      communicatedAdjustmentPercent: { toNumber: () => 10 },
      student: {
        fullName: 'João Silva',
        grade: '5º Ano',
        child: { fullName: 'João Silva' },
      },
      period: {
        name: 'Rematrícula 2027',
        preReEnrollmentDeadline: new Date('2027-03-15'),
      },
    });

    const result = await getResponseData('data-token');

    expect(result.studentName).toBe('João Silva');
    expect(result.grade).toBe('5º Ano');
    expect(result.communicatedAnnualValue).toBe(55000);
    expect(result.communicatedAdjustmentPercent).toBe(10);
    expect(result.status).toBe('PENDING');
    expect(result.periodName).toBe('Rematrícula 2027');
  });

  it('should throw RESPONSE_NOT_FOUND for invalid token', async () => {
    mockPrisma.preReEnrollmentResponse.findFirst.mockResolvedValue(null);

    await expect(getResponseData('invalid')).rejects.toThrow('RESPONSE_NOT_FOUND');
  });
});
