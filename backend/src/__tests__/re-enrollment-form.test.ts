import { vi, describe, it, expect, beforeEach } from 'vitest';

const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    lead: {
      findUnique: vi.fn(),
    },
    leadChildHealth: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    leadChildTransport: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    leadEmergencyContact: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    leadFinancialResponsible: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    leadHealthPlan: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    parentalConsent: {
      create: vi.fn(),
    },
    reEnrollmentInvite: {
      update: vi.fn(),
    },
    leadEnrollmentDocument: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    preReEnrollmentResponse: {
      findFirst: vi.fn().mockResolvedValue(null),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  };
  return { prismaMock };
});

const { inviteServiceMock, gateServiceMock, auditMock, gradeMock } = vi.hoisted(() => {
  const inviteServiceMock = {
    findByToken: vi.fn(),
    updateStatus: vi.fn(),
  };
  const gateServiceMock = {
    transitionGate: vi.fn(),
  };
  const auditMock = {
    createAuditLog: vi.fn(),
  };
  const gradeMock = {
    getNextGrade: vi.fn(),
  };
  return { inviteServiceMock, gateServiceMock, auditMock, gradeMock };
});

vi.mock('../config/database.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../services/re-enrollment-invite.service.js', () => ({
  ...inviteServiceMock,
  findInviteByToken: inviteServiceMock.findByToken,
  updateInviteStatus: inviteServiceMock.updateStatus,
}));
vi.mock('../services/re-enrollment-gate.service.js', () => ({
  ...gateServiceMock,
}));
vi.mock('../services/audit.service.js', () => auditMock);
vi.mock('../services/grade-progression.js', () => gradeMock);
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getFormData, submitForm } from '../services/re-enrollment-form.service.js';

// Note: form service imports findInviteByToken, updateInviteStatus, transitionGate from core

// ---------- Shared fixtures ----------

function makeMockInvite(overrides: Record<string, any> = {}) {
  return {
    id: 'invite-1',
    token: 'valid-token',
    status: 'SENT',
    gateStatus: 'CONVITE_ENVIADO',
    periodId: 'period-1',
    notes: null,
    student: {
      id: 'student-1',
      leadId: 'lead-1',
      leadChildId: 'child-1',
      fullName: 'Maria Silva',
      grade: '5th Grade',
      dateOfBirth: new Date('2015-03-15'),
      code: 'STU-001',
    },
    period: {
      id: 'period-1',
      name: 'Rematricula 2027',
      targetYear: 2027,
      status: 'OPEN',
      endDate: new Date('2026-12-31'),
      eligibleGrades: ['5th Grade', '6th Grade'],
    },
    ...overrides,
  };
}

function makeMockLead() {
  return {
    id: 'lead-1',
    familyName: 'Silva',
    primaryContactEmail: 'silva@email.com',
    children: [
      { id: 'child-1', fullName: 'Maria Silva', dateOfBirth: new Date('2015-03-15') },
    ],
    parents: [
      { id: 'parent-1', fullName: 'Ana Silva', parentType: 'MOTHER', email: 'ana@email.com' },
    ],
    address: { id: 'addr-1', country: 'Brasil', city: 'Rio de Janeiro', street: 'Rua X', number: '100' },
    childrenHealth: [
      { id: 'health-1', childId: 'child-1', leadId: 'lead-1', weight: '30kg', bloodType: 'O+' },
    ],
    childrenTransport: [
      { id: 'transport-1', childId: 'child-1', leadId: 'lead-1', transportMethod: 'CAR', canLeaveAlone: false, isAthlete: false },
    ],
    emergencyContacts: [
      { id: 'ec-1', leadId: 'lead-1', name: 'Tia Rosa', phone: '21999990000', isPrimary: true },
    ],
    financialResponsible: {
      id: 'fin-1', leadId: 'lead-1', responsibleType: 'MOTHER', fullName: 'Ana Silva',
    },
    healthPlan: {
      id: 'hp-1', leadId: 'lead-1', operator: 'Unimed', beneficiaryCode: '123', planType: 'Individual', preferredHospital: 'Hospital Barra',
    },
  };
}

function makeSubmitData(overrides: Record<string, any> = {}) {
  return {
    health: { weight: '32kg', bloodType: 'O+' },
    transport: { transportMethod: 'SCHOOL_BUS', canLeaveAlone: false, isAthlete: false },
    emergencyContacts: [
      { name: 'Tia Rosa', phone: '21999990000', isPrimary: true },
      { name: 'Tio Joao', phone: '21888880000', isPrimary: false },
    ],
    financialResponsible: { responsibleType: 'MOTHER', fullName: 'Ana Silva' },
    healthPlan: { operator: 'Unimed', beneficiaryCode: '456', planType: 'Familiar', preferredHospital: 'Hospital Barra' },
    lgpdConsent: true,
    ...overrides,
  };
}

const metadata = { ipAddress: '127.0.0.1', userAgent: 'TestBrowser/1.0' };

// ---------- getFormData ----------

describe('getFormData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load invite, student, period, and all Lead relations by token', async () => {
    const mockInvite = makeMockInvite();
    const mockLead = makeMockLead();

    inviteServiceMock.findByToken.mockResolvedValue(mockInvite);
    prismaMock.lead.findUnique.mockResolvedValue(mockLead);
    gradeMock.getNextGrade.mockReturnValue('6th Grade');

    const result = await getFormData('valid-token');

    expect(inviteServiceMock.findByToken).toHaveBeenCalledWith('valid-token');
    expect(prismaMock.lead.findUnique).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      include: {
        children: true,
        parents: true,
        address: true,
        childrenHealth: true,
        childrenTransport: true,
        emergencyContacts: true,
        financialResponsible: true,
        healthPlan: true,
      },
    });
    expect(result.invite.id).toBe('invite-1');
    expect(result.student.fullName).toBe('Maria Silva');
    expect(result.period.name).toBe('Rematricula 2027');
  });

  it('should transition invite status to OPENED on first access when status is SENT', async () => {
    const mockInvite = makeMockInvite({ status: 'SENT' });
    const mockLead = makeMockLead();

    inviteServiceMock.findByToken.mockResolvedValue(mockInvite);
    prismaMock.lead.findUnique.mockResolvedValue(mockLead);
    gradeMock.getNextGrade.mockReturnValue('6th Grade');

    await getFormData('valid-token');

    expect(inviteServiceMock.updateStatus).toHaveBeenCalledWith('invite-1', 'OPENED');
  });

  it('should NOT transition status if already OPENED or CONFIRMED', async () => {
    const mockInvite = makeMockInvite({ status: 'OPENED' });
    const mockLead = makeMockLead();

    inviteServiceMock.findByToken.mockResolvedValue(mockInvite);
    prismaMock.lead.findUnique.mockResolvedValue(mockLead);
    gradeMock.getNextGrade.mockReturnValue('6th Grade');

    await getFormData('valid-token');

    expect(inviteServiceMock.updateStatus).not.toHaveBeenCalled();
  });

  it('should throw INVITE_NOT_FOUND for invalid token', async () => {
    inviteServiceMock.findByToken.mockRejectedValue(
      Object.assign(new Error('Convite de rematrícula não encontrado.'), { statusCode: 404, code: 'INVITE_NOT_FOUND' })
    );

    await expect(getFormData('invalid-token')).rejects.toThrow('Convite de rematrícula não encontrado.');
  });

  it('should throw FORM_PERIOD_CLOSED if period status is not OPEN', async () => {
    const mockInvite = makeMockInvite({
      period: { id: 'period-1', name: 'Rematricula 2027', targetYear: 2027, status: 'CLOSED', endDate: new Date(), eligibleGrades: [] },
    });

    inviteServiceMock.findByToken.mockResolvedValue(mockInvite);

    await expect(getFormData('valid-token')).rejects.toThrow('A campanha de rematrícula foi encerrada.');
  });

  it('should return suggestedGrade from getNextGrade', async () => {
    const mockInvite = makeMockInvite();
    const mockLead = makeMockLead();

    inviteServiceMock.findByToken.mockResolvedValue(mockInvite);
    prismaMock.lead.findUnique.mockResolvedValue(mockLead);
    gradeMock.getNextGrade.mockReturnValue('6th Grade');

    const result = await getFormData('valid-token');

    expect(gradeMock.getNextGrade).toHaveBeenCalledWith('5th Grade');
    expect(result.suggestedGrade).toBe('6th Grade');
  });

  it('should return personalData (child, parents, address) as read-only', async () => {
    const mockInvite = makeMockInvite();
    const mockLead = makeMockLead();

    inviteServiceMock.findByToken.mockResolvedValue(mockInvite);
    prismaMock.lead.findUnique.mockResolvedValue(mockLead);
    gradeMock.getNextGrade.mockReturnValue('6th Grade');

    const result = await getFormData('valid-token');

    expect(result.personalData).toBeDefined();
    expect(result.personalData.child).toEqual(mockLead.children[0]);
    expect(result.personalData.parents).toEqual(mockLead.parents);
    expect(result.personalData.address).toEqual(mockLead.address);
  });

  it('should return editableSections (health, transport, emergencyContacts, financialResponsible, healthPlan)', async () => {
    const mockInvite = makeMockInvite();
    const mockLead = makeMockLead();

    inviteServiceMock.findByToken.mockResolvedValue(mockInvite);
    prismaMock.lead.findUnique.mockResolvedValue(mockLead);
    gradeMock.getNextGrade.mockReturnValue('6th Grade');

    const result = await getFormData('valid-token');

    expect(result.editableSections).toBeDefined();
    expect(result.editableSections.health).toEqual(mockLead.childrenHealth[0]);
    expect(result.editableSections.transport).toEqual(mockLead.childrenTransport[0]);
    expect(result.editableSections.emergencyContacts).toEqual(mockLead.emergencyContacts);
    expect(result.editableSections.financialResponsible).toEqual(mockLead.financialResponsible);
    expect(result.editableSections.healthPlan).toEqual(mockLead.healthPlan);
  });
});

// ---------- submitForm ----------

describe('submitForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupSubmitMocks(inviteOverrides: Record<string, any> = {}) {
    const invite = makeMockInvite({ status: 'OPENED', ...inviteOverrides });
    inviteServiceMock.findByToken.mockResolvedValue(invite);
    inviteServiceMock.updateStatus.mockResolvedValue({});
    gateServiceMock.transitionGate.mockResolvedValue(undefined);
    auditMock.createAuditLog.mockResolvedValue(undefined);
    prismaMock.lead.findUnique.mockResolvedValue({ primaryContactEmail: 'silva@email.com' });
    prismaMock.leadChildHealth.findUnique.mockResolvedValue(null);
    prismaMock.leadChildHealth.update.mockResolvedValue({});
    prismaMock.leadChildHealth.create.mockResolvedValue({});
    prismaMock.leadChildTransport.findUnique.mockResolvedValue(null);
    prismaMock.leadChildTransport.update.mockResolvedValue({});
    prismaMock.leadChildTransport.create.mockResolvedValue({});
    prismaMock.leadEmergencyContact.findMany.mockResolvedValue([]);
    prismaMock.leadEmergencyContact.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.leadEmergencyContact.createMany.mockResolvedValue({ count: 2 });
    prismaMock.leadFinancialResponsible.findUnique.mockResolvedValue(null);
    prismaMock.leadFinancialResponsible.update.mockResolvedValue({});
    prismaMock.leadFinancialResponsible.create.mockResolvedValue({});
    prismaMock.leadHealthPlan.findUnique.mockResolvedValue(null);
    prismaMock.leadHealthPlan.update.mockResolvedValue({});
    prismaMock.leadHealthPlan.create.mockResolvedValue({});
    prismaMock.parentalConsent.create.mockResolvedValue({});
    prismaMock.reEnrollmentInvite.update.mockResolvedValue({});
    return invite;
  }

  it('should upsert LeadChildHealth with submitted health data', async () => {
    setupSubmitMocks();
    const data = makeSubmitData();

    await submitForm('valid-token', data, metadata);

    // No existing record → create path
    expect(prismaMock.leadChildHealth.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ...data.health, leadId: 'lead-1', childId: 'child-1' }),
    });
  });

  it('should upsert LeadChildTransport with submitted transport data', async () => {
    setupSubmitMocks();
    const data = makeSubmitData();

    await submitForm('valid-token', data, metadata);

    // No existing record → create path (transportMethod present)
    expect(prismaMock.leadChildTransport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ...data.transport, leadId: 'lead-1', childId: 'child-1' }),
    });
  });

  it('should delete old emergency contacts and create new ones', async () => {
    setupSubmitMocks();
    const data = makeSubmitData();

    await submitForm('valid-token', data, metadata);

    expect(prismaMock.leadEmergencyContact.deleteMany).toHaveBeenCalledWith({
      where: { leadId: 'lead-1' },
    });
    expect(prismaMock.leadEmergencyContact.createMany).toHaveBeenCalledWith({
      data: data.emergencyContacts!.map(c => ({ ...c, leadId: 'lead-1' })),
    });
  });

  it('should upsert LeadFinancialResponsible with submitted data', async () => {
    setupSubmitMocks();
    const data = makeSubmitData();

    await submitForm('valid-token', data, metadata);

    // No existing record → create path (responsibleType present)
    expect(prismaMock.leadFinancialResponsible.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ...data.financialResponsible, leadId: 'lead-1' }),
    });
  });

  it('should upsert LeadHealthPlan with submitted data', async () => {
    setupSubmitMocks();
    const data = makeSubmitData();

    await submitForm('valid-token', data, metadata);

    // No existing record → create path (operator present)
    expect(prismaMock.leadHealthPlan.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ...data.healthPlan, leadId: 'lead-1' }),
    });
  });

  it('should create ParentalConsent record with consentTextVersion RE_ENROLLMENT_V1', async () => {
    setupSubmitMocks();
    const data = makeSubmitData();

    await submitForm('valid-token', data, metadata);

    expect(prismaMock.parentalConsent.create).toHaveBeenCalledWith({
      data: {
        leadId: 'lead-1',
        ipAddress: '127.0.0.1',
        userAgent: 'TestBrowser/1.0',
        consentTextVersion: 'RE_ENROLLMENT_V1',
      },
    });
  });

  it('should transition invite to CONFIRMED', async () => {
    setupSubmitMocks();
    const data = makeSubmitData();

    await submitForm('valid-token', data, metadata);

    expect(inviteServiceMock.updateStatus).toHaveBeenCalledWith('invite-1', 'CONFIRMED');
  });

  it('should transition gate to FORMULARIO_CONFIRMADO', async () => {
    setupSubmitMocks();
    const data = makeSubmitData();

    await submitForm('valid-token', data, metadata);

    expect(gateServiceMock.transitionGate).toHaveBeenCalledWith('invite-1', 'FORMULARIO_CONFIRMADO');
  });

  it('should create audit log with RE_ENROLLMENT_FORM_SUBMITTED action and change diff', async () => {
    setupSubmitMocks();
    const data = makeSubmitData();

    await submitForm('valid-token', data, metadata);

    expect(auditMock.createAuditLog).toHaveBeenCalledWith({
      actorEmail: 'silva@email.com',
      action: 'RE_ENROLLMENT_FORM_SUBMITTED',
      entityType: 'LEAD',
      entityId: 'lead-1',
      metadata: expect.objectContaining({
        inviteId: 'invite-1',
        source: 'RE_ENROLLMENT_FORM',
        changes: expect.any(Object),
      }),
    });
  });

  it('should reject submission without lgpdConsent=true via FORM_LGPD_REQUIRED', async () => {
    const data = makeSubmitData({ lgpdConsent: false });

    await expect(submitForm('valid-token', data, metadata)).rejects.toThrow(
      'Você deve aceitar os termos LGPD para prosseguir.'
    );
  });

  it('should reject submission if period is not OPEN via FORM_PERIOD_CLOSED', async () => {
    setupSubmitMocks({
      period: { id: 'period-1', name: 'Rematricula 2027', targetYear: 2027, status: 'CLOSED', endDate: new Date(), eligibleGrades: [] },
    });
    const data = makeSubmitData();

    await expect(submitForm('valid-token', data, metadata)).rejects.toThrow(
      'A campanha de rematrícula foi encerrada.'
    );
  });

  it('should reject submission if invite already CONFIRMED via FORM_ALREADY_CONFIRMED', async () => {
    setupSubmitMocks({ status: 'CONFIRMED' });
    const data = makeSubmitData();

    await expect(submitForm('valid-token', data, metadata)).rejects.toThrow(
      'Este formulário já foi confirmado.'
    );
  });

  it('should store correctionNotes in invite.notes field', async () => {
    setupSubmitMocks();
    const data = makeSubmitData({ correctionNotes: 'Endereco atualizado' });

    await submitForm('valid-token', data, metadata);

    expect(prismaMock.reEnrollmentInvite.update).toHaveBeenCalledWith({
      where: { id: 'invite-1' },
      data: { notes: 'Endereco atualizado' },
    });
  });
});
