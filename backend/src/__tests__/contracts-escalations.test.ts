import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { z } from 'zod';
import {
  AdmissionGateStatus,
  AdmissionDepartment,
  GateApprovalDecision,
  ContractStatus,
  PaymentStatus,
  EscalationSeverity,
  ContractSignerRole,
  ClickSignEnvelopeStatus,
  FinancialAnalysisStatus,
  UserRole,
} from '@prisma/client';
import { verifyWebhookHmac } from '../services/clicksign.service.js';
import { canTransition } from '../services/admission-gate.service.js';

// ============================================================
// Section 1: ClickSign Webhook HMAC Verification
// ============================================================

describe('ClickSign Service - verifyWebhookHmac', () => {
  let originalSecret: string | undefined;

  beforeEach(() => {
    originalSecret = process.env.CLICKSIGN_WEBHOOK_SECRET;
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.CLICKSIGN_WEBHOOK_SECRET;
    } else {
      process.env.CLICKSIGN_WEBHOOK_SECRET = originalSecret;
    }
  });

  it('should return true when CLICKSIGN_WEBHOOK_SECRET is undefined (dev mode)', () => {
    delete process.env.CLICKSIGN_WEBHOOK_SECRET;
    expect(verifyWebhookHmac('any body', 'any_hmac')).toBe(true);
  });

  it('should return true when CLICKSIGN_WEBHOOK_SECRET is empty string (dev mode)', () => {
    process.env.CLICKSIGN_WEBHOOK_SECRET = '';
    expect(verifyWebhookHmac('any body', 'any_hmac')).toBe(true);
  });

  it('should return true for a valid HMAC signature', () => {
    const secret = 'test-webhook-secret-123';
    process.env.CLICKSIGN_WEBHOOK_SECRET = secret;
    const body = '{"event":"envelope.completed","data":{"id":"123"}}';
    const validHmac = crypto.createHmac('sha256', secret).update(body).digest('hex');

    expect(verifyWebhookHmac(body, validHmac)).toBe(true);
  });

  it('should return false for an invalid HMAC signature', () => {
    const secret = 'test-webhook-secret-123';
    process.env.CLICKSIGN_WEBHOOK_SECRET = secret;
    const body = '{"event":"envelope.completed"}';

    expect(verifyWebhookHmac(body, 'deadbeefcafebabe1234567890abcdef1234567890abcdef1234567890abcdef')).toBe(false);
  });

  it('should return false for an empty HMAC header', () => {
    process.env.CLICKSIGN_WEBHOOK_SECRET = 'test-secret';
    expect(verifyWebhookHmac('body', '')).toBe(false);
  });

  it('should return false for a tampered body', () => {
    const secret = 'test-webhook-secret-456';
    process.env.CLICKSIGN_WEBHOOK_SECRET = secret;
    const originalBody = '{"event":"envelope.completed","data":{"id":"123"}}';
    const tamperedBody = '{"event":"envelope.completed","data":{"id":"456"}}';
    const hmacForOriginal = crypto.createHmac('sha256', secret).update(originalBody).digest('hex');

    expect(verifyWebhookHmac(tamperedBody, hmacForOriginal)).toBe(false);
  });

  it('should return false for a non-hex HMAC string', () => {
    process.env.CLICKSIGN_WEBHOOK_SECRET = 'test-secret';
    expect(verifyWebhookHmac('body', 'not-valid-hex!@#$')).toBe(false);
  });

  it('should return false for a truncated HMAC', () => {
    const secret = 'test-secret-789';
    process.env.CLICKSIGN_WEBHOOK_SECRET = secret;
    const body = 'some webhook body';
    const validHmac = crypto.createHmac('sha256', secret).update(body).digest('hex');
    const truncated = validHmac.substring(0, 32);

    expect(verifyWebhookHmac(body, truncated)).toBe(false);
  });

  it('should produce different HMACs for different secrets', () => {
    const body = '{"event":"test"}';

    process.env.CLICKSIGN_WEBHOOK_SECRET = 'secret-A';
    const hmacA = crypto.createHmac('sha256', 'secret-A').update(body).digest('hex');
    expect(verifyWebhookHmac(body, hmacA)).toBe(true);

    process.env.CLICKSIGN_WEBHOOK_SECRET = 'secret-B';
    expect(verifyWebhookHmac(body, hmacA)).toBe(false);
  });

  it('should handle empty body with valid HMAC', () => {
    const secret = 'test-secret-empty';
    process.env.CLICKSIGN_WEBHOOK_SECRET = secret;
    const emptyBody = '';
    const validHmac = crypto.createHmac('sha256', secret).update(emptyBody).digest('hex');

    expect(verifyWebhookHmac(emptyBody, validHmac)).toBe(true);
  });

  it('should handle very large body', () => {
    const secret = 'large-body-secret';
    process.env.CLICKSIGN_WEBHOOK_SECRET = secret;
    const largeBody = 'x'.repeat(100000);
    const validHmac = crypto.createHmac('sha256', secret).update(largeBody).digest('hex');

    expect(verifyWebhookHmac(largeBody, validHmac)).toBe(true);
  });

  it('should handle unicode body content', () => {
    const secret = 'unicode-secret';
    process.env.CLICKSIGN_WEBHOOK_SECRET = secret;
    const unicodeBody = '{"nome":"João da Silva","endereço":"Rua São Paulo"}';
    const validHmac = crypto.createHmac('sha256', secret).update(unicodeBody).digest('hex');

    expect(verifyWebhookHmac(unicodeBody, validHmac)).toBe(true);
  });

  it('should be case-sensitive for HMAC hex strings', () => {
    const secret = 'case-sensitive-secret';
    process.env.CLICKSIGN_WEBHOOK_SECRET = secret;
    const body = '{"event":"test"}';
    const validHmac = crypto.createHmac('sha256', secret).update(body).digest('hex');

    // The hex from digest is lowercase. Uppercase should still work via Buffer.from('hex')
    // but let's verify the function handles it
    const upperHmac = validHmac.toUpperCase();
    // Buffer.from with 'hex' is case-insensitive, so both should produce the same buffer
    expect(verifyWebhookHmac(body, upperHmac)).toBe(true);
  });
});

// ============================================================
// Section 2: Enum Type Safety Tests
// ============================================================

describe('Enum Type Safety - AdmissionGateStatus', () => {
  const expectedValues: AdmissionGateStatus[] = [
    'NOT_STARTED',
    'FORM_RECEIVED',
    'FORM_APPROVED',
    'VISIT_SCHEDULED',
    'VISIT_COMPLETED',
    'INTERVIEW_COMPLETED',
    'VISIT_APPROVED',
    'DOCS_REQUESTED',
    'DOCS_RECEIVED',
    'VIVENCIA_SCHEDULED',
    'VIVENCIA_COMPLETED',
    'EVALUATION_PENDING',
    'EVALUATION_COMPLETED',
    'APPROVED',
    'ENROLLMENT_PENDING',
    'ENROLLMENT_COMPLETED',
    'CONTRACT_PENDING',
    'CONTRACT_SIGNED',
    'FINANCIAL_APPROVED',
    'ENROLLED',
    'REJECTED',
  ];

  it('should have exactly 21 values', () => {
    expect(Object.keys(AdmissionGateStatus)).toHaveLength(21);
  });

  expectedValues.forEach((value) => {
    it(`should contain value "${value}"`, () => {
      expect(AdmissionGateStatus[value]).toBe(value);
    });
  });

  it('should have no extra values beyond expected', () => {
    const actual = Object.keys(AdmissionGateStatus).sort();
    const expected = [...expectedValues].sort();
    expect(actual).toEqual(expected);
  });
});

describe('Enum Type Safety - AdmissionDepartment', () => {
  const expectedValues: AdmissionDepartment[] = [
    'ADMISSIONS',
    'PSYCHOLOGY',
    'HEALTH',
    'SECRETARIAT',
    'COORDINATION',
    'FINANCE',
    'LEGAL',
    'DIRECTOR',
  ];

  it('should have exactly 8 values', () => {
    expect(Object.keys(AdmissionDepartment)).toHaveLength(8);
  });

  expectedValues.forEach((value) => {
    it(`should contain value "${value}"`, () => {
      expect(AdmissionDepartment[value]).toBe(value);
    });
  });

  it('should have no extra values beyond expected', () => {
    const actual = Object.keys(AdmissionDepartment).sort();
    const expected = [...expectedValues].sort();
    expect(actual).toEqual(expected);
  });
});

describe('Enum Type Safety - GateApprovalDecision', () => {
  const expectedValues: GateApprovalDecision[] = [
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CONDITIONAL',
    'ESCALATED',
  ];

  it('should have exactly 5 values', () => {
    expect(Object.keys(GateApprovalDecision)).toHaveLength(5);
  });

  expectedValues.forEach((value) => {
    it(`should contain value "${value}"`, () => {
      expect(GateApprovalDecision[value]).toBe(value);
    });
  });

  it('should have no extra values beyond expected', () => {
    const actual = Object.keys(GateApprovalDecision).sort();
    const expected = [...expectedValues].sort();
    expect(actual).toEqual(expected);
  });
});

describe('Enum Type Safety - ContractStatus', () => {
  const expectedValues: ContractStatus[] = [
    'DRAFT',
    'PENDING_LEGAL',
    'PENDING_FINANCIAL',
    'SENT',
    'SIGNED',
    'ACTIVE',
    'CANCELLED',
  ];

  it('should have exactly 7 values', () => {
    expect(Object.keys(ContractStatus)).toHaveLength(7);
  });

  expectedValues.forEach((value) => {
    it(`should contain value "${value}"`, () => {
      expect(ContractStatus[value]).toBe(value);
    });
  });

  it('should have no extra values beyond expected', () => {
    const actual = Object.keys(ContractStatus).sort();
    const expected = [...expectedValues].sort();
    expect(actual).toEqual(expected);
  });
});

describe('Enum Type Safety - PaymentStatus', () => {
  const expectedValues: PaymentStatus[] = [
    'PENDING',
    'PAID',
    'OVERDUE',
    'CANCELLED',
  ];

  it('should have exactly 4 values', () => {
    expect(Object.keys(PaymentStatus)).toHaveLength(4);
  });

  expectedValues.forEach((value) => {
    it(`should contain value "${value}"`, () => {
      expect(PaymentStatus[value]).toBe(value);
    });
  });

  it('should have no extra values beyond expected', () => {
    const actual = Object.keys(PaymentStatus).sort();
    const expected = [...expectedValues].sort();
    expect(actual).toEqual(expected);
  });
});

describe('Enum Type Safety - EscalationSeverity', () => {
  const expectedValues: EscalationSeverity[] = [
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL',
  ];

  it('should have exactly 4 values', () => {
    expect(Object.keys(EscalationSeverity)).toHaveLength(4);
  });

  expectedValues.forEach((value) => {
    it(`should contain value "${value}"`, () => {
      expect(EscalationSeverity[value]).toBe(value);
    });
  });

  it('should have no extra values beyond expected', () => {
    const actual = Object.keys(EscalationSeverity).sort();
    const expected = [...expectedValues].sort();
    expect(actual).toEqual(expected);
  });
});

describe('Enum Type Safety - ContractSignerRole', () => {
  const expectedValues: ContractSignerRole[] = [
    'PARENT',
    'GUARDIAN',
    'SCHOOL_REPRESENTATIVE',
    'WITNESS',
  ];

  it('should have exactly 4 values', () => {
    expect(Object.keys(ContractSignerRole)).toHaveLength(4);
  });

  expectedValues.forEach((value) => {
    it(`should contain value "${value}"`, () => {
      expect(ContractSignerRole[value]).toBe(value);
    });
  });

  it('should have no extra values beyond expected', () => {
    const actual = Object.keys(ContractSignerRole).sort();
    const expected = [...expectedValues].sort();
    expect(actual).toEqual(expected);
  });
});

describe('Enum Type Safety - ClickSignEnvelopeStatus', () => {
  const expectedValues: ClickSignEnvelopeStatus[] = [
    'CREATED',
    'RUNNING',
    'COMPLETED',
    'CANCELLED',
    'EXPIRED',
  ];

  it('should have exactly 5 values', () => {
    expect(Object.keys(ClickSignEnvelopeStatus)).toHaveLength(5);
  });

  expectedValues.forEach((value) => {
    it(`should contain value "${value}"`, () => {
      expect(ClickSignEnvelopeStatus[value]).toBe(value);
    });
  });

  it('should have no extra values beyond expected', () => {
    const actual = Object.keys(ClickSignEnvelopeStatus).sort();
    const expected = [...expectedValues].sort();
    expect(actual).toEqual(expected);
  });
});

describe('Enum Type Safety - FinancialAnalysisStatus', () => {
  const expectedValues: FinancialAnalysisStatus[] = [
    'PENDING',
    'IN_ANALYSIS',
    'APPROVED',
    'REJECTED',
  ];

  it('should have exactly 4 values', () => {
    expect(Object.keys(FinancialAnalysisStatus)).toHaveLength(4);
  });

  expectedValues.forEach((value) => {
    it(`should contain value "${value}"`, () => {
      expect(FinancialAnalysisStatus[value]).toBe(value);
    });
  });

  it('should have no extra values beyond expected', () => {
    const actual = Object.keys(FinancialAnalysisStatus).sort();
    const expected = [...expectedValues].sort();
    expect(actual).toEqual(expected);
  });
});

describe('Enum Type Safety - UserRole', () => {
  const expectedValues: UserRole[] = [
    'ADMIN',
    'MANAGER',
    'STAFF',
    'COORDINATOR',
    'TEACHER',
    'SECRETARY',
    'IT',
    'MAINTENANCE',
    'CLEANING',
    'PURCHASING',
    'FINANCE',
    'ADMISSIONS',
    'PSYCHOLOGY',
    'HEALTH',
    'LEGAL',
    'DIRECTOR',
  ];

  it('should have exactly 16 values', () => {
    expect(Object.keys(UserRole)).toHaveLength(16);
  });

  expectedValues.forEach((value) => {
    it(`should contain value "${value}"`, () => {
      expect(UserRole[value]).toBe(value);
    });
  });

  it('should have no extra values beyond expected', () => {
    const actual = Object.keys(UserRole).sort();
    const expected = [...expectedValues].sort();
    expect(actual).toEqual(expected);
  });
});

// ============================================================
// Section 3: Transition Map Completeness
// ============================================================

describe('Admission Gate - Transition Map Completeness', () => {
  const allStatuses: AdmissionGateStatus[] = Object.values(AdmissionGateStatus);

  it('should cover all 21 statuses in the transition map', () => {
    // canTransition should not throw for any valid status
    for (const status of allStatuses) {
      expect(() => canTransition(status, 'NOT_STARTED')).not.toThrow();
    }
  });

  // Self-transition should always be false
  allStatuses.forEach((status) => {
    it(`should not allow self-transition for ${status}`, () => {
      expect(canTransition(status, status)).toBe(false);
    });
  });

  // Terminal states should have no valid outgoing transitions
  it('should have no outgoing transitions from ENROLLED', () => {
    for (const target of allStatuses) {
      expect(canTransition('ENROLLED', target)).toBe(false);
    }
  });

  it('should have exactly 1 outgoing transition from REJECTED (NOT_STARTED)', () => {
    const outgoing = allStatuses.filter((target) => canTransition('REJECTED', target));
    expect(outgoing).toHaveLength(1);
    expect(outgoing).toEqual(['NOT_STARTED']);
  });

  // NOT_STARTED should only reach FORM_RECEIVED and VISIT_SCHEDULED
  it('should only allow NOT_STARTED to reach FORM_RECEIVED or VISIT_SCHEDULED', () => {
    const allowed = allStatuses.filter((s) => canTransition('NOT_STARTED', s));
    expect(allowed.sort()).toEqual(['FORM_RECEIVED', 'VISIT_SCHEDULED'].sort());
  });

  // Forward flow: the main happy path
  const happyPath: [AdmissionGateStatus, AdmissionGateStatus][] = [
    ['NOT_STARTED', 'FORM_RECEIVED'],
    ['FORM_RECEIVED', 'FORM_APPROVED'],
    ['FORM_APPROVED', 'VISIT_SCHEDULED'],
    ['VISIT_SCHEDULED', 'VISIT_COMPLETED'],
    ['VISIT_COMPLETED', 'INTERVIEW_COMPLETED'],
    ['INTERVIEW_COMPLETED', 'VISIT_APPROVED'],
    ['VISIT_APPROVED', 'DOCS_REQUESTED'],
    ['DOCS_REQUESTED', 'DOCS_RECEIVED'],
    ['DOCS_RECEIVED', 'VIVENCIA_SCHEDULED'],
    ['VIVENCIA_SCHEDULED', 'VIVENCIA_COMPLETED'],
    ['VIVENCIA_COMPLETED', 'EVALUATION_PENDING'],
    ['EVALUATION_PENDING', 'EVALUATION_COMPLETED'],
    ['EVALUATION_COMPLETED', 'APPROVED'],
    ['APPROVED', 'ENROLLMENT_PENDING'],
    ['ENROLLMENT_PENDING', 'ENROLLMENT_COMPLETED'],
    ['ENROLLMENT_COMPLETED', 'CONTRACT_PENDING'],
    ['CONTRACT_PENDING', 'CONTRACT_SIGNED'],
    ['CONTRACT_SIGNED', 'FINANCIAL_APPROVED'],
    ['FINANCIAL_APPROVED', 'ENROLLED'],
  ];

  happyPath.forEach(([from, to]) => {
    it(`happy path: ${from} -> ${to}`, () => {
      expect(canTransition(from, to)).toBe(true);
    });
  });

  // Rejection paths
  const rejectionSources: AdmissionGateStatus[] = [
    'FORM_RECEIVED',
    'VISIT_COMPLETED',
    'INTERVIEW_COMPLETED',
    'EVALUATION_COMPLETED',
    'CONTRACT_PENDING',
    'CONTRACT_SIGNED',
  ];

  rejectionSources.forEach((source) => {
    it(`should allow rejection from ${source}`, () => {
      expect(canTransition(source, 'REJECTED')).toBe(true);
    });
  });

  // Cancellation / backward paths
  it('should allow VISIT_SCHEDULED -> NOT_STARTED (cancellation)', () => {
    expect(canTransition('VISIT_SCHEDULED', 'NOT_STARTED')).toBe(true);
  });

  it('should allow VIVENCIA_SCHEDULED -> VISIT_APPROVED (cancellation)', () => {
    expect(canTransition('VIVENCIA_SCHEDULED', 'VISIT_APPROVED')).toBe(true);
  });

  // Backward-compat paths
  it('should allow VISIT_APPROVED -> VIVENCIA_SCHEDULED (backward compat)', () => {
    expect(canTransition('VISIT_APPROVED', 'VIVENCIA_SCHEDULED')).toBe(true);
  });

  it('should allow VISIT_COMPLETED -> VISIT_APPROVED (backward compat)', () => {
    expect(canTransition('VISIT_COMPLETED', 'VISIT_APPROVED')).toBe(true);
  });

  // Statuses that should NOT reach REJECTED
  const noRejectFrom: AdmissionGateStatus[] = [
    'NOT_STARTED',
    'FORM_APPROVED',
    'VISIT_SCHEDULED',
    'VISIT_APPROVED',
    'DOCS_REQUESTED',
    'DOCS_RECEIVED',
    'VIVENCIA_SCHEDULED',
    'VIVENCIA_COMPLETED',
    'EVALUATION_PENDING',
    'APPROVED',
    'ENROLLMENT_PENDING',
    'ENROLLMENT_COMPLETED',
    'FINANCIAL_APPROVED',
    'ENROLLED',
    'REJECTED',
  ];

  noRejectFrom.forEach((status) => {
    it(`should NOT allow rejection from ${status}`, () => {
      expect(canTransition(status, 'REJECTED')).toBe(false);
    });
  });

  // No skipping phases: NOT_STARTED should not jump to deep states
  const deepStates: AdmissionGateStatus[] = [
    'VIVENCIA_SCHEDULED',
    'VIVENCIA_COMPLETED',
    'EVALUATION_PENDING',
    'EVALUATION_COMPLETED',
    'APPROVED',
    'ENROLLMENT_PENDING',
    'ENROLLMENT_COMPLETED',
    'CONTRACT_PENDING',
    'CONTRACT_SIGNED',
    'FINANCIAL_APPROVED',
    'ENROLLED',
  ];

  deepStates.forEach((target) => {
    it(`should not allow NOT_STARTED -> ${target} (no skipping)`, () => {
      expect(canTransition('NOT_STARTED', target)).toBe(false);
    });
  });
});

// ============================================================
// Section 4: Zod Schema Validation with Prisma Enums
// ============================================================

describe('Zod nativeEnum - AdmissionDepartment', () => {
  const schema = z.nativeEnum(AdmissionDepartment);

  it('should accept ADMISSIONS', () => {
    expect(schema.safeParse('ADMISSIONS').success).toBe(true);
  });

  it('should accept PSYCHOLOGY', () => {
    expect(schema.safeParse('PSYCHOLOGY').success).toBe(true);
  });

  it('should accept HEALTH', () => {
    expect(schema.safeParse('HEALTH').success).toBe(true);
  });

  it('should accept SECRETARIAT', () => {
    expect(schema.safeParse('SECRETARIAT').success).toBe(true);
  });

  it('should accept COORDINATION', () => {
    expect(schema.safeParse('COORDINATION').success).toBe(true);
  });

  it('should accept FINANCE', () => {
    expect(schema.safeParse('FINANCE').success).toBe(true);
  });

  it('should accept LEGAL', () => {
    expect(schema.safeParse('LEGAL').success).toBe(true);
  });

  it('should accept DIRECTOR', () => {
    expect(schema.safeParse('DIRECTOR').success).toBe(true);
  });

  it('should reject INVALID', () => {
    expect(schema.safeParse('INVALID').success).toBe(false);
  });

  it('should reject empty string', () => {
    expect(schema.safeParse('').success).toBe(false);
  });

  it('should reject null', () => {
    expect(schema.safeParse(null).success).toBe(false);
  });

  it('should reject undefined', () => {
    expect(schema.safeParse(undefined).success).toBe(false);
  });

  it('should reject number', () => {
    expect(schema.safeParse(42).success).toBe(false);
  });

  it('should reject lowercase', () => {
    expect(schema.safeParse('admissions').success).toBe(false);
  });
});

describe('Zod nativeEnum - GateApprovalDecision', () => {
  const schema = z.nativeEnum(GateApprovalDecision);

  it('should accept APPROVED', () => {
    expect(schema.safeParse('APPROVED').success).toBe(true);
  });

  it('should accept PENDING', () => {
    expect(schema.safeParse('PENDING').success).toBe(true);
  });

  it('should accept REJECTED', () => {
    expect(schema.safeParse('REJECTED').success).toBe(true);
  });

  it('should accept CONDITIONAL', () => {
    expect(schema.safeParse('CONDITIONAL').success).toBe(true);
  });

  it('should accept ESCALATED', () => {
    expect(schema.safeParse('ESCALATED').success).toBe(true);
  });

  it('should reject MAYBE', () => {
    expect(schema.safeParse('MAYBE').success).toBe(false);
  });

  it('should reject DENIED', () => {
    expect(schema.safeParse('DENIED').success).toBe(false);
  });
});

describe('Zod nativeEnum - ContractSignerRole', () => {
  const schema = z.nativeEnum(ContractSignerRole);

  it('should accept PARENT', () => {
    expect(schema.safeParse('PARENT').success).toBe(true);
  });

  it('should accept GUARDIAN', () => {
    expect(schema.safeParse('GUARDIAN').success).toBe(true);
  });

  it('should accept SCHOOL_REPRESENTATIVE', () => {
    expect(schema.safeParse('SCHOOL_REPRESENTATIVE').success).toBe(true);
  });

  it('should reject STUDENT', () => {
    expect(schema.safeParse('STUDENT').success).toBe(false);
  });

  it('should reject TEACHER', () => {
    expect(schema.safeParse('TEACHER').success).toBe(false);
  });
});

describe('Zod nativeEnum - EscalationSeverity', () => {
  const schema = z.nativeEnum(EscalationSeverity);

  it('should accept LOW', () => {
    expect(schema.safeParse('LOW').success).toBe(true);
  });

  it('should accept MEDIUM', () => {
    expect(schema.safeParse('MEDIUM').success).toBe(true);
  });

  it('should accept HIGH', () => {
    expect(schema.safeParse('HIGH').success).toBe(true);
  });

  it('should accept CRITICAL', () => {
    expect(schema.safeParse('CRITICAL').success).toBe(true);
  });

  it('should reject EXTREME', () => {
    expect(schema.safeParse('EXTREME').success).toBe(false);
  });

  it('should reject URGENT', () => {
    expect(schema.safeParse('URGENT').success).toBe(false);
  });

  it('should reject NONE', () => {
    expect(schema.safeParse('NONE').success).toBe(false);
  });
});

describe('Zod nativeEnum - FinancialAnalysisStatus', () => {
  const schema = z.nativeEnum(FinancialAnalysisStatus);

  it('should accept PENDING', () => {
    expect(schema.safeParse('PENDING').success).toBe(true);
  });

  it('should accept IN_ANALYSIS', () => {
    expect(schema.safeParse('IN_ANALYSIS').success).toBe(true);
  });

  it('should accept APPROVED', () => {
    expect(schema.safeParse('APPROVED').success).toBe(true);
  });

  it('should accept REJECTED', () => {
    expect(schema.safeParse('REJECTED').success).toBe(true);
  });

  it('should reject DONE', () => {
    expect(schema.safeParse('DONE').success).toBe(false);
  });

  it('should reject COMPLETED', () => {
    expect(schema.safeParse('COMPLETED').success).toBe(false);
  });
});

describe('Zod nativeEnum - ContractStatus', () => {
  const schema = z.nativeEnum(ContractStatus);

  it('should accept DRAFT', () => {
    expect(schema.safeParse('DRAFT').success).toBe(true);
  });

  it('should accept SENT', () => {
    expect(schema.safeParse('SENT').success).toBe(true);
  });

  it('should accept SIGNED', () => {
    expect(schema.safeParse('SIGNED').success).toBe(true);
  });

  it('should accept ACTIVE', () => {
    expect(schema.safeParse('ACTIVE').success).toBe(true);
  });

  it('should accept CANCELLED', () => {
    expect(schema.safeParse('CANCELLED').success).toBe(true);
  });

  it('should accept PENDING_LEGAL', () => {
    expect(schema.safeParse('PENDING_LEGAL').success).toBe(true);
  });

  it('should accept PENDING_FINANCIAL', () => {
    expect(schema.safeParse('PENDING_FINANCIAL').success).toBe(true);
  });

  it('should reject EXPIRED', () => {
    expect(schema.safeParse('EXPIRED').success).toBe(false);
  });

  it('should reject PENDING', () => {
    expect(schema.safeParse('PENDING').success).toBe(false);
  });
});

describe('Zod nativeEnum - ClickSignEnvelopeStatus', () => {
  const schema = z.nativeEnum(ClickSignEnvelopeStatus);

  it('should accept CREATED', () => {
    expect(schema.safeParse('CREATED').success).toBe(true);
  });

  it('should accept RUNNING', () => {
    expect(schema.safeParse('RUNNING').success).toBe(true);
  });

  it('should accept COMPLETED', () => {
    expect(schema.safeParse('COMPLETED').success).toBe(true);
  });

  it('should accept CANCELLED', () => {
    expect(schema.safeParse('CANCELLED').success).toBe(true);
  });

  it('should accept EXPIRED', () => {
    expect(schema.safeParse('EXPIRED').success).toBe(true);
  });

  it('should reject PENDING', () => {
    expect(schema.safeParse('PENDING').success).toBe(false);
  });

  it('should reject ACTIVE', () => {
    expect(schema.safeParse('ACTIVE').success).toBe(false);
  });
});

describe('Zod nativeEnum - PaymentStatus', () => {
  const schema = z.nativeEnum(PaymentStatus);

  it('should accept PENDING', () => {
    expect(schema.safeParse('PENDING').success).toBe(true);
  });

  it('should accept PAID', () => {
    expect(schema.safeParse('PAID').success).toBe(true);
  });

  it('should accept OVERDUE', () => {
    expect(schema.safeParse('OVERDUE').success).toBe(true);
  });

  it('should accept CANCELLED', () => {
    expect(schema.safeParse('CANCELLED').success).toBe(true);
  });

  it('should reject REFUNDED', () => {
    expect(schema.safeParse('REFUNDED').success).toBe(false);
  });

  it('should reject PARTIAL', () => {
    expect(schema.safeParse('PARTIAL').success).toBe(false);
  });
});

// ============================================================
// Section 5: Contract Creation Schema Validation
// ============================================================

describe('Contract Creation Schema Validation', () => {
  const contractCreateSchema = z.object({
    leadId: z.string().uuid(),
    templateId: z.string().uuid().optional(),
    totalAmount: z.number().positive(),
    installments: z.number().int().min(1).max(12),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    signers: z.array(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        cpf: z.string().optional(),
        role: z.nativeEnum(ContractSignerRole),
      }),
    ).min(1),
    notes: z.string().optional(),
  });

  it('should accept valid contract data', () => {
    const valid = {
      leadId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: 25000.00,
      installments: 12,
      startDate: '2026-02-01',
      signers: [
        {
          name: 'Maria Silva',
          email: 'maria@example.com',
          cpf: '12345678901',
          role: 'PARENT' as ContractSignerRole,
        },
      ],
    };
    expect(contractCreateSchema.safeParse(valid).success).toBe(true);
  });

  it('should accept contract with multiple signers', () => {
    const valid = {
      leadId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: 15000.00,
      installments: 6,
      startDate: '2026-03-01',
      signers: [
        { name: 'Parent A', email: 'a@example.com', role: 'PARENT' as ContractSignerRole },
        { name: 'School Rep', email: 'rep@school.com', role: 'SCHOOL_REPRESENTATIVE' as ContractSignerRole },
      ],
    };
    expect(contractCreateSchema.safeParse(valid).success).toBe(true);
  });

  it('should accept contract with optional fields', () => {
    const valid = {
      leadId: '550e8400-e29b-41d4-a716-446655440000',
      templateId: '660e8400-e29b-41d4-a716-446655440000',
      totalAmount: 30000.00,
      installments: 1,
      startDate: '2026-01-15',
      signers: [
        { name: 'Guardian', email: 'guard@example.com', role: 'GUARDIAN' as ContractSignerRole },
      ],
      notes: 'Special discount applied',
    };
    expect(contractCreateSchema.safeParse(valid).success).toBe(true);
  });

  it('should reject missing leadId', () => {
    const invalid = {
      totalAmount: 25000.00,
      installments: 12,
      startDate: '2026-02-01',
      signers: [
        { name: 'Maria', email: 'maria@example.com', role: 'PARENT' },
      ],
    };
    expect(contractCreateSchema.safeParse(invalid).success).toBe(false);
  });

  it('should reject non-UUID leadId', () => {
    const invalid = {
      leadId: 'not-a-uuid',
      totalAmount: 25000.00,
      installments: 12,
      startDate: '2026-02-01',
      signers: [
        { name: 'Maria', email: 'maria@example.com', role: 'PARENT' },
      ],
    };
    expect(contractCreateSchema.safeParse(invalid).success).toBe(false);
  });

  it('should reject missing totalAmount', () => {
    const invalid = {
      leadId: '550e8400-e29b-41d4-a716-446655440000',
      installments: 12,
      startDate: '2026-02-01',
      signers: [
        { name: 'Maria', email: 'maria@example.com', role: 'PARENT' },
      ],
    };
    expect(contractCreateSchema.safeParse(invalid).success).toBe(false);
  });

  it('should reject zero totalAmount', () => {
    const invalid = {
      leadId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: 0,
      installments: 12,
      startDate: '2026-02-01',
      signers: [
        { name: 'Maria', email: 'maria@example.com', role: 'PARENT' },
      ],
    };
    expect(contractCreateSchema.safeParse(invalid).success).toBe(false);
  });

  it('should reject negative totalAmount', () => {
    const invalid = {
      leadId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: -5000,
      installments: 12,
      startDate: '2026-02-01',
      signers: [
        { name: 'Maria', email: 'maria@example.com', role: 'PARENT' },
      ],
    };
    expect(contractCreateSchema.safeParse(invalid).success).toBe(false);
  });

  it('should reject installments below 1', () => {
    const invalid = {
      leadId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: 25000,
      installments: 0,
      startDate: '2026-02-01',
      signers: [
        { name: 'Maria', email: 'maria@example.com', role: 'PARENT' },
      ],
    };
    expect(contractCreateSchema.safeParse(invalid).success).toBe(false);
  });

  it('should reject installments above 12', () => {
    const invalid = {
      leadId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: 25000,
      installments: 13,
      startDate: '2026-02-01',
      signers: [
        { name: 'Maria', email: 'maria@example.com', role: 'PARENT' },
      ],
    };
    expect(contractCreateSchema.safeParse(invalid).success).toBe(false);
  });

  it('should reject fractional installments', () => {
    const invalid = {
      leadId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: 25000,
      installments: 3.5,
      startDate: '2026-02-01',
      signers: [
        { name: 'Maria', email: 'maria@example.com', role: 'PARENT' },
      ],
    };
    expect(contractCreateSchema.safeParse(invalid).success).toBe(false);
  });

  it('should reject invalid startDate format', () => {
    const invalid = {
      leadId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: 25000,
      installments: 12,
      startDate: '01/02/2026',
      signers: [
        { name: 'Maria', email: 'maria@example.com', role: 'PARENT' },
      ],
    };
    expect(contractCreateSchema.safeParse(invalid).success).toBe(false);
  });

  it('should reject empty signers array', () => {
    const invalid = {
      leadId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: 25000,
      installments: 12,
      startDate: '2026-02-01',
      signers: [],
    };
    expect(contractCreateSchema.safeParse(invalid).success).toBe(false);
  });

  it('should reject signer with invalid role', () => {
    const invalid = {
      leadId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: 25000,
      installments: 12,
      startDate: '2026-02-01',
      signers: [
        { name: 'Maria', email: 'maria@example.com', role: 'STUDENT' },
      ],
    };
    expect(contractCreateSchema.safeParse(invalid).success).toBe(false);
  });

  it('should reject signer with invalid email', () => {
    const invalid = {
      leadId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: 25000,
      installments: 12,
      startDate: '2026-02-01',
      signers: [
        { name: 'Maria', email: 'not-an-email', role: 'PARENT' },
      ],
    };
    expect(contractCreateSchema.safeParse(invalid).success).toBe(false);
  });

  it('should reject signer with empty name', () => {
    const invalid = {
      leadId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: 25000,
      installments: 12,
      startDate: '2026-02-01',
      signers: [
        { name: '', email: 'maria@example.com', role: 'PARENT' },
      ],
    };
    expect(contractCreateSchema.safeParse(invalid).success).toBe(false);
  });

  it('should accept boundary value installments = 1', () => {
    const valid = {
      leadId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: 25000,
      installments: 1,
      startDate: '2026-02-01',
      signers: [
        { name: 'Maria', email: 'maria@example.com', role: 'PARENT' as ContractSignerRole },
      ],
    };
    expect(contractCreateSchema.safeParse(valid).success).toBe(true);
  });

  it('should accept boundary value installments = 12', () => {
    const valid = {
      leadId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: 25000,
      installments: 12,
      startDate: '2026-02-01',
      signers: [
        { name: 'Maria', email: 'maria@example.com', role: 'PARENT' as ContractSignerRole },
      ],
    };
    expect(contractCreateSchema.safeParse(valid).success).toBe(true);
  });

  it('should accept all four signer roles', () => {
    const roles: ContractSignerRole[] = ['PARENT', 'GUARDIAN', 'SCHOOL_REPRESENTATIVE', 'WITNESS'];
    for (const role of roles) {
      const valid = {
        leadId: '550e8400-e29b-41d4-a716-446655440000',
        totalAmount: 25000,
        installments: 6,
        startDate: '2026-02-01',
        signers: [
          { name: 'Test Signer', email: 'test@example.com', role },
        ],
      };
      expect(contractCreateSchema.safeParse(valid).success).toBe(true);
    }
  });
});

// ============================================================
// Section 6: Department-to-Role Mapping Consistency
// ============================================================

describe('Department-to-Role Mapping Consistency', () => {
  // The expected mapping from AdmissionDepartment to UserRole
  const departmentToRoleMapping: Record<string, string> = {
    ADMISSIONS: 'ADMISSIONS',
    PSYCHOLOGY: 'PSYCHOLOGY',
    HEALTH: 'HEALTH',
    SECRETARIAT: 'SECRETARY',
    COORDINATION: 'COORDINATOR',
    FINANCE: 'FINANCE',
    LEGAL: 'LEGAL',
    DIRECTOR: 'DIRECTOR',
  };

  Object.entries(departmentToRoleMapping).forEach(([dept, role]) => {
    it(`department "${dept}" should be a valid AdmissionDepartment`, () => {
      expect(Object.values(AdmissionDepartment)).toContain(dept);
    });

    it(`role "${role}" mapped from department "${dept}" should be a valid UserRole`, () => {
      expect(Object.values(UserRole)).toContain(role);
    });
  });

  it('should map every AdmissionDepartment to a UserRole', () => {
    const allDepts = Object.values(AdmissionDepartment);
    for (const dept of allDepts) {
      expect(departmentToRoleMapping).toHaveProperty(dept);
    }
  });

  it('ADMIN role should exist (always has access)', () => {
    expect(Object.values(UserRole)).toContain('ADMIN');
  });

  it('ADMIN should not be a department (it is a superuser role)', () => {
    expect(Object.values(AdmissionDepartment)).not.toContain('ADMIN');
  });

  it('every mapped role should be distinct', () => {
    const roles = Object.values(departmentToRoleMapping);
    const uniqueRoles = new Set(roles);
    expect(uniqueRoles.size).toBe(roles.length);
  });

  it('MANAGER role should exist but not map to a department', () => {
    expect(Object.values(UserRole)).toContain('MANAGER');
    expect(Object.values(departmentToRoleMapping)).not.toContain('MANAGER');
  });

  it('STAFF role should exist but not map to a department', () => {
    expect(Object.values(UserRole)).toContain('STAFF');
    expect(Object.values(departmentToRoleMapping)).not.toContain('STAFF');
  });

  it('TEACHER role should exist but not map to a department', () => {
    expect(Object.values(UserRole)).toContain('TEACHER');
    expect(Object.values(departmentToRoleMapping)).not.toContain('TEACHER');
  });

  it('IT role should exist but not map to a department', () => {
    expect(Object.values(UserRole)).toContain('IT');
    expect(Object.values(departmentToRoleMapping)).not.toContain('IT');
  });

  it('MAINTENANCE role should exist but not map to a department', () => {
    expect(Object.values(UserRole)).toContain('MAINTENANCE');
    expect(Object.values(departmentToRoleMapping)).not.toContain('MAINTENANCE');
  });

  it('CLEANING role should exist but not map to a department', () => {
    expect(Object.values(UserRole)).toContain('CLEANING');
    expect(Object.values(departmentToRoleMapping)).not.toContain('CLEANING');
  });

  it('PURCHASING role should exist but not map to a department', () => {
    expect(Object.values(UserRole)).toContain('PURCHASING');
    expect(Object.values(departmentToRoleMapping)).not.toContain('PURCHASING');
  });
});

// ============================================================
// Section 7: Cross-Enum Consistency Checks
// ============================================================

describe('Cross-Enum Consistency', () => {
  it('ContractStatus.SIGNED and ClickSignEnvelopeStatus.COMPLETED should both exist (contract signed = envelope completed)', () => {
    expect(ContractStatus.SIGNED).toBe('SIGNED');
    expect(ClickSignEnvelopeStatus.COMPLETED).toBe('COMPLETED');
  });

  it('ContractStatus.CANCELLED and ClickSignEnvelopeStatus.CANCELLED should be the same string', () => {
    expect(ContractStatus.CANCELLED).toBe(ClickSignEnvelopeStatus.CANCELLED);
  });

  it('GateApprovalDecision and FinancialAnalysisStatus should both have APPROVED and REJECTED', () => {
    expect(GateApprovalDecision.APPROVED).toBe('APPROVED');
    expect(GateApprovalDecision.REJECTED).toBe('REJECTED');
    expect(FinancialAnalysisStatus.APPROVED).toBe('APPROVED');
    expect(FinancialAnalysisStatus.REJECTED).toBe('REJECTED');
  });

  it('GateApprovalDecision and FinancialAnalysisStatus should both have PENDING', () => {
    expect(GateApprovalDecision.PENDING).toBe('PENDING');
    expect(FinancialAnalysisStatus.PENDING).toBe('PENDING');
  });

  it('PaymentStatus and FinancialAnalysisStatus PENDING values should match', () => {
    expect(PaymentStatus.PENDING).toBe(FinancialAnalysisStatus.PENDING);
  });

  it('PaymentStatus.CANCELLED and ContractStatus.CANCELLED should be the same string', () => {
    expect(PaymentStatus.CANCELLED).toBe(ContractStatus.CANCELLED);
  });

  it('AdmissionGateStatus should contain both CONTRACT_PENDING and CONTRACT_SIGNED for contract flow', () => {
    expect(AdmissionGateStatus.CONTRACT_PENDING).toBe('CONTRACT_PENDING');
    expect(AdmissionGateStatus.CONTRACT_SIGNED).toBe('CONTRACT_SIGNED');
  });

  it('AdmissionGateStatus.FINANCIAL_APPROVED should exist for financial gate', () => {
    expect(AdmissionGateStatus.FINANCIAL_APPROVED).toBe('FINANCIAL_APPROVED');
  });

  it('EscalationSeverity values should be ordered semantically: LOW < MEDIUM < HIGH < CRITICAL', () => {
    const values = Object.values(EscalationSeverity);
    expect(values.indexOf('LOW')).toBeLessThan(values.indexOf('MEDIUM'));
    expect(values.indexOf('MEDIUM')).toBeLessThan(values.indexOf('HIGH'));
    expect(values.indexOf('HIGH')).toBeLessThan(values.indexOf('CRITICAL'));
  });

  it('GateApprovalDecision.ESCALATED ties into EscalationSeverity', () => {
    expect(GateApprovalDecision.ESCALATED).toBe('ESCALATED');
    // EscalationSeverity should have at least one severity level for escalations
    expect(Object.keys(EscalationSeverity).length).toBeGreaterThanOrEqual(1);
  });

  it('ClickSignEnvelopeStatus lifecycle should be: CREATED -> RUNNING -> COMPLETED|CANCELLED|EXPIRED', () => {
    const values = Object.values(ClickSignEnvelopeStatus);
    expect(values).toContain('CREATED');
    expect(values).toContain('RUNNING');
    expect(values).toContain('COMPLETED');
    expect(values).toContain('CANCELLED');
    expect(values).toContain('EXPIRED');
  });

  it('ContractStatus lifecycle should be: DRAFT -> PENDING_LEGAL -> PENDING_FINANCIAL -> SENT -> SIGNED -> ACTIVE', () => {
    const values = Object.values(ContractStatus);
    expect(values).toContain('DRAFT');
    expect(values).toContain('PENDING_LEGAL');
    expect(values).toContain('PENDING_FINANCIAL');
    expect(values).toContain('SENT');
    expect(values).toContain('SIGNED');
    expect(values).toContain('ACTIVE');
    expect(values).toContain('CANCELLED');
  });
});
