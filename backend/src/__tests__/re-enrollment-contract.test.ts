import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    contract: { findFirst: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    reEnrollmentInvite: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    leadHistory: { create: vi.fn() },
    clickSignWebhookLog: { create: vi.fn(), update: vi.fn() },
    $transaction: vi.fn((fn: any) => fn(mockPrisma)),
  };
  return { mockPrisma };
});

vi.mock('../config/database.js', () => ({ prisma: mockPrisma }));
vi.mock('../config/redis.js', () => ({ redis: { publish: vi.fn() } }));
vi.mock('../socket/io.js', () => ({
  getIO: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })),
}));
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../config/supabase.js', () => ({ uploadFile: vi.fn(), getSignedUrl: vi.fn(), extractStoragePath: vi.fn() }));
vi.mock('./clicksign.service.js', () => ({ getEnvelopeDocuments: vi.fn(), createEnvelope: vi.fn(), addSigner: vi.fn(), getDocument: vi.fn() }));
vi.mock('./admission-gate.service.js', () => ({ transition: vi.fn() }));
vi.mock('./re-enrollment-gate.service.js', () => ({ transitionGate: vi.fn(), canTransitionGate: vi.fn() }));

describe('createRenewalContract', () => {
  it.todo('creates contract with enrollmentType=RENEWAL');
  it.todo('throws RENEWAL_CONTRACT_ALREADY_EXISTS when non-cancelled RENEWAL contract exists');
  it.todo('allows RENEWAL contract when FIRST contract exists (different enrollmentType)');
  it.todo('transitions gate to CONTRATO_PENDENTE after creation');
  it.todo('validates invite is in FORMULARIO_CONFIRMADO state');
});

describe('handleWebhookEvent — RENEWAL branch', () => {
  it.todo('detects RENEWAL contract and calls re-enrollment gate service');
  it.todo('creates new Student with progression on close event for RENEWAL');
  it.todo('transitions gate CONTRATO_PENDENTE -> CONTRATO_ASSINADO -> REMATRICULADO');
  it.todo('does NOT call AdmissionGateService for RENEWAL contracts');
  it.todo('sends welcome email after RENEWAL contract close');
});
