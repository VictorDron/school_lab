// SEC-01: Role-based authorization on sensitive approval operations
// Defense-in-depth: service layer enforces roles regardless of route guard

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UserRole } from '@prisma/client';

// Mock prisma before importing the service
vi.mock('../config/database.js', () => ({
  prisma: {
    contract: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    leadHistory: {
      create: vi.fn(),
    },
  },
}));

vi.mock('./clicksign.service.js', () => ({}));
vi.mock('./admission-gate.service.js', () => ({}));
vi.mock('./approval-task.service.js', () => ({}));
vi.mock('../config/supabase.js', () => ({
  uploadFile: vi.fn(),
  getSignedUrl: vi.fn().mockResolvedValue(null),
  extractStoragePath: vi.fn().mockReturnValue(null),
}));
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock('../templates/contract-template.js', () => ({
  generateContractHtml: vi.fn(),
  FEE_TABLE: [],
  FOOD_TABLE: [],
}));

import { prisma } from '../config/database.js';
import * as ContractService from '../services/contract.service.js';
import { AppError } from '../middlewares/errorHandler.js';

const mockPrisma = prisma as unknown as {
  contract: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  leadHistory: {
    create: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('submitLegalApproval — role enforcement (SEC-01)', () => {
  it('should throw INSUFFICIENT_ROLE when role is TEACHER', async () => {
    await expect(
      ContractService.submitLegalApproval('contract-1', 'APPROVED', 'user-1', 'TEACHER' as UserRole),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_ROLE' });

    // The role check must fire BEFORE any DB query
    expect(mockPrisma.contract.findUnique).not.toHaveBeenCalled();
  });

  it('should throw INSUFFICIENT_ROLE when role is FINANCE', async () => {
    await expect(
      ContractService.submitLegalApproval('contract-1', 'APPROVED', 'user-1', 'FINANCE' as UserRole),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_ROLE' });

    expect(mockPrisma.contract.findUnique).not.toHaveBeenCalled();
  });

  it('should throw INSUFFICIENT_ROLE when role is STAFF', async () => {
    await expect(
      ContractService.submitLegalApproval('contract-1', 'APPROVED', 'user-1', 'STAFF' as UserRole),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_ROLE' });

    expect(mockPrisma.contract.findUnique).not.toHaveBeenCalled();
  });

  it('should throw AppError with correct statusCode 403 for INSUFFICIENT_ROLE', async () => {
    const error = await ContractService.submitLegalApproval(
      'contract-1', 'APPROVED', 'user-1', 'TEACHER' as UserRole,
    ).catch((e) => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(403);
    expect((error as AppError).code).toBe('INSUFFICIENT_ROLE');
  });

  it('should proceed past the role check when role is LEGAL', async () => {
    mockPrisma.contract.findUnique.mockResolvedValue(null);

    // Will throw CONTRACT_NOT_FOUND (from DB), not INSUFFICIENT_ROLE
    await expect(
      ContractService.submitLegalApproval('contract-1', 'APPROVED', 'user-1', 'LEGAL' as UserRole),
    ).rejects.toMatchObject({ code: 'CONTRACT_NOT_FOUND' });

    // Proves the role check passed and the DB was queried
    expect(mockPrisma.contract.findUnique).toHaveBeenCalledOnce();
  });

  it('should proceed past the role check when role is ADMIN', async () => {
    mockPrisma.contract.findUnique.mockResolvedValue(null);

    await expect(
      ContractService.submitLegalApproval('contract-1', 'APPROVED', 'user-1', 'ADMIN' as UserRole),
    ).rejects.toMatchObject({ code: 'CONTRACT_NOT_FOUND' });

    expect(mockPrisma.contract.findUnique).toHaveBeenCalledOnce();
  });
});

describe('submitFinancialApproval — role enforcement (SEC-01)', () => {
  it('should throw INSUFFICIENT_ROLE when role is TEACHER', async () => {
    await expect(
      ContractService.submitFinancialApproval('contract-1', 'APPROVED', 'user-1', 'TEACHER' as UserRole),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_ROLE' });

    expect(mockPrisma.contract.findUnique).not.toHaveBeenCalled();
  });

  it('should throw INSUFFICIENT_ROLE when role is LEGAL', async () => {
    await expect(
      ContractService.submitFinancialApproval('contract-1', 'APPROVED', 'user-1', 'LEGAL' as UserRole),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_ROLE' });

    expect(mockPrisma.contract.findUnique).not.toHaveBeenCalled();
  });

  it('should throw INSUFFICIENT_ROLE when role is STAFF', async () => {
    await expect(
      ContractService.submitFinancialApproval('contract-1', 'APPROVED', 'user-1', 'STAFF' as UserRole),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_ROLE' });

    expect(mockPrisma.contract.findUnique).not.toHaveBeenCalled();
  });

  it('should proceed past the role check when role is FINANCE', async () => {
    mockPrisma.contract.findUnique.mockResolvedValue(null);

    await expect(
      ContractService.submitFinancialApproval('contract-1', 'APPROVED', 'user-1', 'FINANCE' as UserRole),
    ).rejects.toMatchObject({ code: 'CONTRACT_NOT_FOUND' });

    expect(mockPrisma.contract.findUnique).toHaveBeenCalledOnce();
  });

  it('should proceed past the role check when role is ADMIN', async () => {
    mockPrisma.contract.findUnique.mockResolvedValue(null);

    await expect(
      ContractService.submitFinancialApproval('contract-1', 'APPROVED', 'user-1', 'ADMIN' as UserRole),
    ).rejects.toMatchObject({ code: 'CONTRACT_NOT_FOUND' });

    expect(mockPrisma.contract.findUnique).toHaveBeenCalledOnce();
  });
});
