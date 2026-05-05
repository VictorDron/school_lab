import { vi, describe, it, expect, beforeEach } from 'vitest';

const { prismaMock, gateServiceMock } = vi.hoisted(() => {
  const prismaMock = {
    reEnrollmentInvite: {
      findUnique: vi.fn(),
    },
    leadEnrollmentDocument: {
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    studentHistory: {
      create: vi.fn().mockResolvedValue({}),
    },
  };
  const gateServiceMock = {
    transitionGate: vi.fn(),
  };
  return { prismaMock, gateServiceMock };
});

vi.mock('../config/database.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../services/re-enrollment-gate.service.js', () => ({
  transitionGate: gateServiceMock.transitionGate,
}));

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { reviewDocument } from '../services/re-enrollment-document.service.js';

const baseInvite = {
  id: 'invite-1',
  studentId: 'student-1',
  periodId: 'period-1',
  gateStatus: 'FORMULARIO_CONFIRMADO',
  student: { leadId: 'lead-1', fullName: 'Aluno Teste' },
};

const baseDoc = {
  id: 'doc-1',
  leadId: 'lead-1',
  documentType: 'BOLETIM',
  fileName: 'boletim.pdf',
  status: 'PENDING',
};

describe('reviewDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue(baseInvite);
    prismaMock.leadEnrollmentDocument.findFirst.mockResolvedValue(baseDoc);
    prismaMock.leadEnrollmentDocument.update.mockResolvedValue({
      ...baseDoc,
      status: 'APPROVED',
      rejectionReason: null,
    });
  });

  it('should auto-transition to DOCS_APROVADOS when approving the LAST pending document', async () => {
    prismaMock.leadEnrollmentDocument.count.mockResolvedValue(0);

    await reviewDocument({
      inviteId: 'invite-1',
      docId: 'doc-1',
      status: 'APPROVED',
      userId: 'user-1',
    });

    expect(prismaMock.leadEnrollmentDocument.update).toHaveBeenCalledWith({
      where: { id: 'doc-1' },
      data: expect.objectContaining({ status: 'APPROVED', rejectionReason: null, reviewedBy: 'user-1' }),
    });
    expect(prismaMock.leadEnrollmentDocument.count).toHaveBeenCalledWith({
      where: { leadId: 'lead-1', status: { in: ['PENDING', 'REJECTED'] } },
    });
    expect(gateServiceMock.transitionGate).toHaveBeenCalledWith('invite-1', 'DOCS_APROVADOS', 'user-1');
  });

  it('should NOT auto-transition when there are still pending documents', async () => {
    prismaMock.leadEnrollmentDocument.count.mockResolvedValue(2);

    await reviewDocument({
      inviteId: 'invite-1',
      docId: 'doc-1',
      status: 'APPROVED',
      userId: 'user-1',
    });

    expect(gateServiceMock.transitionGate).not.toHaveBeenCalled();
  });

  it('should NOT auto-transition when invite gate is no longer FORMULARIO_CONFIRMADO', async () => {
    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue({
      ...baseInvite,
      gateStatus: 'CONTRATO_PENDENTE',
    });
    prismaMock.leadEnrollmentDocument.count.mockResolvedValue(0);

    await reviewDocument({
      inviteId: 'invite-1',
      docId: 'doc-1',
      status: 'APPROVED',
      userId: 'user-1',
    });

    expect(gateServiceMock.transitionGate).not.toHaveBeenCalled();
    expect(prismaMock.leadEnrollmentDocument.count).not.toHaveBeenCalled();
  });

  it('should NEVER auto-transition when rejecting a document', async () => {
    prismaMock.leadEnrollmentDocument.update.mockResolvedValue({
      ...baseDoc,
      status: 'REJECTED',
      rejectionReason: 'Documento ilegível',
    });

    await reviewDocument({
      inviteId: 'invite-1',
      docId: 'doc-1',
      status: 'REJECTED',
      rejectionReason: 'Documento ilegível',
      userId: 'user-1',
    });

    expect(gateServiceMock.transitionGate).not.toHaveBeenCalled();
    expect(prismaMock.leadEnrollmentDocument.count).not.toHaveBeenCalled();
  });

  it('should NOT fail the review if the auto-transition throws', async () => {
    prismaMock.leadEnrollmentDocument.count.mockResolvedValue(0);
    gateServiceMock.transitionGate.mockRejectedValue(new Error('boom'));

    const result = await reviewDocument({
      inviteId: 'invite-1',
      docId: 'doc-1',
      status: 'APPROVED',
      userId: 'user-1',
    });

    expect(result.status).toBe('APPROVED');
  });

  it('should require rejection reason when rejecting', async () => {
    await expect(
      reviewDocument({
        inviteId: 'invite-1',
        docId: 'doc-1',
        status: 'REJECTED',
        userId: 'user-1',
      }),
    ).rejects.toThrow();
  });

  it('should throw INVITE_NOT_FOUND when invite does not exist', async () => {
    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue(null);

    await expect(
      reviewDocument({
        inviteId: 'invite-x',
        docId: 'doc-1',
        status: 'APPROVED',
        userId: 'user-1',
      }),
    ).rejects.toThrow();
  });

  it('should throw DOCUMENT_NOT_FOUND when doc is not from this invite lead', async () => {
    prismaMock.leadEnrollmentDocument.findFirst.mockResolvedValue(null);

    await expect(
      reviewDocument({
        inviteId: 'invite-1',
        docId: 'doc-x',
        status: 'APPROVED',
        userId: 'user-1',
      }),
    ).rejects.toThrow();
  });
});
