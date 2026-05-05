import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock ClickSign service
vi.mock('../services/clicksign.service.js', () => ({
  createDocument: vi.fn(),
  createSigner: vi.fn(),
  addSignerToDocument: vi.fn(),
  notifySigners: vi.fn(),
  getDocument: vi.fn(),
}));

// Mock prisma
vi.mock('../config/database.js', () => ({
  prisma: {
    contract: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    contractSigner: {
      update: vi.fn(),
    },
    leadHistory: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../config/redis.js', () => ({ redis: { publish: vi.fn() } }));
vi.mock('../socket/io.js', () => ({ getIO: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })) }));
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../config/supabase.js', () => ({
  uploadFile: vi.fn(),
  getSignedUrl: vi.fn(),
  extractStoragePath: vi.fn(),
}));
vi.mock('../templates/contract-template.js', () => ({
  generateContractHtml: vi.fn(),
  FEE_TABLE: {},
  FOOD_TABLE: {},
}));

import { prisma } from '../config/database.js';
import * as ClickSignService from '../services/clicksign.service.js';
import { AppError } from '../middlewares/errorHandler.js';

const mockPrisma = prisma as any;
const mockClickSign = ClickSignService as any;

// Base contract fixture with valid signers (1 school rep + 2 witnesses), both approvals, and document
function makeValidContract(overrides?: Partial<Record<string, any>>) {
  return {
    id: 'contract-001',
    code: 'CTR-2026-001',
    leadId: 'lead-001',
    status: 'APPROVED',
    legalApprovalStatus: 'APPROVED',
    financialApprovalStatus: 'APPROVED',
    clicksignEnvelopeId: null,
    clicksignStatus: null,
    clicksignEnvelopeUrl: null,
    documentUrl: 'data:application/pdf;base64,JVBERi0xLjQK',
    totalAnnualValue: 50000,
    signers: [
      { id: 'sig-1', name: 'Maria Silva', email: 'maria@school.com', cpf: '12345678901', role: 'SCHOOL_REPRESENTATIVE', clicksignSignerId: null },
      { id: 'sig-2', name: 'Joao Santos', email: 'joao@example.com', cpf: '98765432100', role: 'WITNESS', clicksignSignerId: null },
      { id: 'sig-3', name: 'Ana Costa', email: 'ana@example.com', cpf: '11122233344', role: 'WITNESS', clicksignSignerId: null },
    ],
    ...overrides,
  };
}

describe('Contract service - ClickSign error wrapping (CS-01/02/03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw AppError with code CLICKSIGN_DOCUMENT_CREATION_FAILED when createDocument rejects', async () => {
    const contract = makeValidContract();
    mockPrisma.contract.findUnique.mockResolvedValue(contract);

    // createDocument rejects with a network error
    mockClickSign.createDocument.mockRejectedValue(new Error('Network timeout'));

    const { sendForSignature } = await import('../services/contract.service.js');

    await expect(sendForSignature('contract-001', 'user-001')).rejects.toThrow(AppError);
    await expect(sendForSignature('contract-001', 'user-001')).rejects.toMatchObject({
      code: 'CLICKSIGN_DOCUMENT_CREATION_FAILED',
      statusCode: 502,
    });
  });

  it('should throw AppError with code CLICKSIGN_SIGNER_CREATION_FAILED when createSigner rejects with generic error', async () => {
    const contract = makeValidContract();
    mockPrisma.contract.findUnique.mockResolvedValue(contract);

    // createDocument succeeds
    mockClickSign.createDocument.mockResolvedValue({
      document: { key: 'doc-key-123' },
    });

    // createSigner rejects with a generic API error
    mockClickSign.createSigner.mockRejectedValue(new Error('API 500 Internal Server Error'));

    const { sendForSignature } = await import('../services/contract.service.js');

    await expect(sendForSignature('contract-001', 'user-001')).rejects.toThrow(AppError);
    await expect(sendForSignature('contract-001', 'user-001')).rejects.toMatchObject({
      code: 'CLICKSIGN_SIGNER_CREATION_FAILED',
      statusCode: 502,
    });
  });

  it('should throw AppError with code CLICKSIGN_SIGNER_INVALID_NAME when signer name has no last name', async () => {
    const contract = makeValidContract();
    mockPrisma.contract.findUnique.mockResolvedValue(contract);

    // createDocument succeeds
    mockClickSign.createDocument.mockResolvedValue({
      document: { key: 'doc-key-123' },
    });

    // createSigner throws INVALID_NAME (from clicksign.service.ts validation)
    mockClickSign.createSigner.mockRejectedValue(new Error('CLICKSIGN_SIGNER_INVALID_NAME'));

    const { sendForSignature } = await import('../services/contract.service.js');

    await expect(sendForSignature('contract-001', 'user-001')).rejects.toThrow(AppError);
    await expect(sendForSignature('contract-001', 'user-001')).rejects.toMatchObject({
      code: 'CLICKSIGN_SIGNER_INVALID_NAME',
      statusCode: 400,
    });
  });

  it('should throw AppError with code CLICKSIGN_ADD_SIGNER_FAILED when addSignerToDocument rejects', async () => {
    const contract = makeValidContract();
    mockPrisma.contract.findUnique.mockResolvedValue(contract);

    // createDocument succeeds
    mockClickSign.createDocument.mockResolvedValue({
      document: { key: 'doc-key-123' },
    });

    // createSigner succeeds
    mockClickSign.createSigner.mockResolvedValue({
      signer: { key: 'signer-key-001' },
    });

    // contractSigner update succeeds
    mockPrisma.contractSigner.update.mockResolvedValue({});

    // addSignerToDocument rejects
    mockClickSign.addSignerToDocument.mockRejectedValue(new Error('ClickSign API Error'));

    const { sendForSignature } = await import('../services/contract.service.js');

    await expect(sendForSignature('contract-001', 'user-001')).rejects.toThrow(AppError);
    await expect(sendForSignature('contract-001', 'user-001')).rejects.toMatchObject({
      code: 'CLICKSIGN_ADD_SIGNER_FAILED',
      statusCode: 502,
    });
  });
});
