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
import { AppError } from '../middlewares/errorHandler.js';

const mockPrisma = prisma as any;

describe('Contract service - signing rules validation (SIGN-01/02)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw CONTRACT_MISSING_REQUIRED_SIGNERS when 0 SCHOOL_REPRESENTATIVE signers', async () => {
    const contract = {
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
      signers: [
        // No school rep, only 2 witnesses
        { id: 'sig-1', name: 'Joao Santos', email: 'joao@example.com', cpf: '98765432100', role: 'WITNESS', clicksignSignerId: null },
        { id: 'sig-2', name: 'Ana Costa', email: 'ana@example.com', cpf: '11122233344', role: 'WITNESS', clicksignSignerId: null },
      ],
    };

    mockPrisma.contract.findUnique.mockResolvedValue(contract);

    const { sendForSignature } = await import('../services/contract.service.js');

    await expect(sendForSignature('contract-001', 'user-001')).rejects.toThrow(AppError);
    await expect(sendForSignature('contract-001', 'user-001')).rejects.toMatchObject({
      code: 'CONTRACT_MISSING_REQUIRED_SIGNERS',
    });
  });

  it('should throw CONTRACT_MISSING_REQUIRED_SIGNERS when only 1 WITNESS signer', async () => {
    const contract = {
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
      signers: [
        { id: 'sig-1', name: 'Maria Silva', email: 'maria@school.com', cpf: '12345678901', role: 'SCHOOL_REPRESENTATIVE', clicksignSignerId: null },
        // Only 1 witness (need 2)
        { id: 'sig-2', name: 'Joao Santos', email: 'joao@example.com', cpf: '98765432100', role: 'WITNESS', clicksignSignerId: null },
      ],
    };

    mockPrisma.contract.findUnique.mockResolvedValue(contract);

    const { sendForSignature } = await import('../services/contract.service.js');

    await expect(sendForSignature('contract-001', 'user-001')).rejects.toThrow(AppError);
    await expect(sendForSignature('contract-001', 'user-001')).rejects.toMatchObject({
      code: 'CONTRACT_MISSING_REQUIRED_SIGNERS',
    });
  });

  it('should throw CONTRACT_NOT_FULLY_APPROVED when legalApprovalStatus is PENDING', async () => {
    const contract = {
      id: 'contract-001',
      code: 'CTR-2026-001',
      leadId: 'lead-001',
      status: 'APPROVED',
      legalApprovalStatus: 'PENDING',
      financialApprovalStatus: 'APPROVED',
      clicksignEnvelopeId: null,
      clicksignStatus: null,
      clicksignEnvelopeUrl: null,
      documentUrl: 'data:application/pdf;base64,JVBERi0xLjQK',
      signers: [
        { id: 'sig-1', name: 'Maria Silva', email: 'maria@school.com', cpf: '12345678901', role: 'SCHOOL_REPRESENTATIVE', clicksignSignerId: null },
        { id: 'sig-2', name: 'Joao Santos', email: 'joao@example.com', cpf: '98765432100', role: 'WITNESS', clicksignSignerId: null },
        { id: 'sig-3', name: 'Ana Costa', email: 'ana@example.com', cpf: '11122233344', role: 'WITNESS', clicksignSignerId: null },
      ],
    };

    mockPrisma.contract.findUnique.mockResolvedValue(contract);

    const { sendForSignature } = await import('../services/contract.service.js');

    await expect(sendForSignature('contract-001', 'user-001')).rejects.toThrow(AppError);
    await expect(sendForSignature('contract-001', 'user-001')).rejects.toMatchObject({
      code: 'CONTRACT_NOT_FULLY_APPROVED',
    });
  });
});
