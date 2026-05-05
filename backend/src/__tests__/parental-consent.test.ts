// SEC-05: Parental consent recording during enrollment submission
// Tests that submitEnrollmentForm captures consent after a successful transaction.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — vi.mock is hoisted; use vi.hoisted for shared references
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  parentalConsentCreate: vi.fn(),
  createAuditLog: vi.fn(),
  transaction: vi.fn(),
}));

// Simulates the result returned by the $transaction block
const TRANSACTION_RESULT = {
  lead: { id: 'lead-123', code: 'RIS-001', familyName: 'Silva', enrollmentSubmissionCount: 1 },
  studentName: 'Ana Silva',
  motherEmail: 'mae@example.com',
};

vi.mock('../config/database.js', () => ({
  prisma: {
    $transaction: mocks.transaction,
    parentalConsent: { create: mocks.parentalConsentCreate },
  },
}));

vi.mock('../services/audit.service.js', () => ({
  createAuditLog: mocks.createAuditLog,
}));

vi.mock('./admission-gate.service.js', () => ({
  transition: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./email.service.js', () => ({
  sendEnrollmentConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendEnrollmentLinkEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./notifications.service.js', () => ({
  notifyAdminsOfEnrollmentSubmission: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./formDraft.service.js', () => ({
  deleteDraft: vi.fn().mockResolvedValue(undefined),
  upsertDraft: vi.fn().mockResolvedValue(undefined),
  getDraft: vi.fn().mockResolvedValue(null),
}));

vi.mock('../config/supabase.js', () => ({
  deleteFile: vi.fn().mockResolvedValue(undefined),
  uploadFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../utils/notification-contacts.js', () => ({
  getNotificationRecipients: vi.fn().mockResolvedValue([]),
}));

vi.mock('../utils/formatters.js', () => ({
  normalizeCPF: vi.fn((v: string) => v),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks are set up)
// ---------------------------------------------------------------------------

import { submitEnrollmentForm } from '../services/enrollment.service.js';

// ---------------------------------------------------------------------------
// Minimal valid enrollment payload
// ---------------------------------------------------------------------------

const VALID_PAYLOAD = {
  enrollmentToken: 'token-abc',
  termsAccepted: true,
  children: [],
  emergencyContacts: [],
  financialResponsible: {
    responsibleType: 'MOTHER' as const,
    fullName: 'Maria Silva',
    cpf: '123.456.789-00',
    relationship: 'mother',
    email: 'mae@example.com',
    phone: '21999999999',
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // $transaction resolves with TRANSACTION_RESULT (simulates a successful submit)
  mocks.transaction.mockResolvedValue(TRANSACTION_RESULT);
  // parentalConsent.create resolves by default
  mocks.parentalConsentCreate.mockResolvedValue({ id: 'consent-1' });
  // createAuditLog resolves by default
  mocks.createAuditLog.mockResolvedValue(undefined);
});

describe('submitEnrollmentForm — parental consent capture (SEC-05)', () => {
  it('should create a ParentalConsent record when enrollment is submitted with termsAccepted=true', async () => {
    await submitEnrollmentForm(VALID_PAYLOAD, undefined, {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    });

    expect(mocks.parentalConsentCreate).toHaveBeenCalledWith({
      data: {
        leadId: TRANSACTION_RESULT.lead.id,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        consentTextVersion: 'v1.0',
      },
    });
  });

  it('should store ipAddress, userAgent, and consentTextVersion on ParentalConsent record', async () => {
    await submitEnrollmentForm(VALID_PAYLOAD, undefined, {
      ipAddress: '10.0.0.5',
      userAgent: 'MyApp/2.0',
    });

    const createCall = mocks.parentalConsentCreate.mock.calls[0][0];
    expect(createCall.data.ipAddress).toBe('10.0.0.5');
    expect(createCall.data.userAgent).toBe('MyApp/2.0');
    expect(createCall.data.consentTextVersion).toBe('v1.0');
    expect(createCall.data.leadId).toBe(TRANSACTION_RESULT.lead.id);
  });

  it('should emit AuditAction PARENTAL_CONSENT_RECORDED when consent is recorded', async () => {
    await submitEnrollmentForm(VALID_PAYLOAD, undefined, {
      ipAddress: '192.168.1.1',
    });

    const consentAuditCall = mocks.createAuditLog.mock.calls.find(
      (call: unknown[]) => (call[0] as { action: string }).action === 'PARENTAL_CONSENT_RECORDED',
    );

    expect(consentAuditCall).toBeDefined();
    expect(consentAuditCall![0]).toMatchObject({
      actorEmail: 'public-form',
      action: 'PARENTAL_CONSENT_RECORDED',
      entityType: 'LEAD',
      entityId: TRANSACTION_RESULT.lead.id,
      metadata: { consentTextVersion: 'v1.0', ipAddress: '192.168.1.1' },
    });
  });

  it('should handle missing metadata gracefully (ipAddress and userAgent are optional)', async () => {
    await submitEnrollmentForm(VALID_PAYLOAD, undefined, undefined);

    expect(mocks.parentalConsentCreate).toHaveBeenCalledWith({
      data: {
        leadId: TRANSACTION_RESULT.lead.id,
        ipAddress: null,
        userAgent: null,
        consentTextVersion: 'v1.0',
      },
    });
  });

  it('should still resolve the enrollment if parentalConsent.create throws (non-fatal)', async () => {
    mocks.parentalConsentCreate.mockRejectedValueOnce(new Error('DB connection lost'));

    const result = await submitEnrollmentForm(VALID_PAYLOAD, undefined, {
      ipAddress: '192.168.1.1',
    });

    // Enrollment must succeed even when consent persistence fails
    expect(result).toMatchObject({ success: true });
  });

  it('should return success:true and leadCode after successful submission', async () => {
    const result = await submitEnrollmentForm(VALID_PAYLOAD);

    expect(result.success).toBe(true);
    expect(result.leadCode).toBe(TRANSACTION_RESULT.lead.code);
  });
});
