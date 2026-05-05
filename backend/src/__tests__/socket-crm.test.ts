import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock redis before importing services
vi.mock('../config/redis.js', () => ({
  redis: {
    publish: vi.fn().mockResolvedValue(1),
  },
}));

// Mock socket io.ts so getIO() returns a controllable mock
const mockEmit = vi.fn();
const mockTo = vi.fn(() => ({ emit: mockEmit }));
vi.mock('../socket/io.js', () => ({
  getIO: vi.fn(() => ({ to: mockTo })),
  setIO: vi.fn(),
}));

// Mock prisma for leads and contract services
vi.mock('../config/database.js', () => ({
  prisma: {
    lead: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    leadChild: {
      findMany: vi.fn(),
    },
    experienceEvaluation: {
      findMany: vi.fn(),
    },
    kanbanColumn: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    gateStepConfig: {
      findMany: vi.fn(),
    },
    admissionGateApproval: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    leadHistory: {
      create: vi.fn(),
    },
    contract: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    contractSigner: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock external side-effect services
vi.mock('../utils/notification-contacts.js', () => ({
  getNotificationRecipients: vi.fn().mockResolvedValue([]),
}));

vi.mock('../config/supabase.js', () => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  refreshDocumentUrl: vi.fn().mockResolvedValue(null),
  getSignedUrl: vi.fn().mockResolvedValue(null),
  extractStoragePath: vi.fn().mockReturnValue(null),
  initializeStorage: vi.fn(),
}));

vi.mock('../utils/helpers.js', () => ({
  generateCode: vi.fn().mockReturnValue('LD-TEST-001'),
}));

vi.mock('./admissions.service.js', () => ({
  generateApplicationLink: vi.fn(),
  getTokenStatus: vi.fn(),
  revokeToken: vi.fn(),
  sendApplicationLinkByEmail: vi.fn(),
}));

vi.mock('../lib/error-messages.js', () => ({
  createAppError: vi.fn((code: string, detail?: string) => {
    const err = new Error(code) as any;
    err.code = code;
    err.statusCode = 400;
    err.detail = detail;
    return err;
  }),
}));

vi.mock('../services/admission-gate.service.js', () => ({
  transition: vi.fn().mockResolvedValue(undefined),
  canTransition: vi.fn().mockReturnValue(true),
}));

vi.mock('../services/gate-approval.service.js', () => ({
  createApprovalsForGate: vi.fn().mockResolvedValue([]),
  checkAndAdvanceGate: vi.fn().mockResolvedValue(undefined),
  cancelApprovalTasks: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/approval-task.service.js', () => ({
  completeApprovalTask: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/clicksign.service.js', () => ({
  createDocument: vi.fn(),
  createSigner: vi.fn(),
  addSignerToDocument: vi.fn(),
  notifySigners: vi.fn(),
  getDocument: vi.fn(),
}));

vi.mock('../middlewares/errorHandler.js', () => ({
  AppError: class AppError extends Error {
    constructor(message: string, public statusCode = 500, public code = 'UNKNOWN') {
      super(message);
    }
  },
}));

vi.mock('../templates/contract-template.js', () => ({
  generateContractHtml: vi.fn().mockReturnValue('<html></html>'),
  FEE_TABLE: [],
  FOOD_TABLE: [],
}));

import { prisma } from '../config/database.js';
import { redis } from '../config/redis.js';
import * as LeadsService from '../services/leads/index.js';

const mockPrisma = prisma as any;
const mockRedis = redis as any;

// CRM-01: Real-time CRM updates via Redis pub/sub
// These tests verify that mutations publish to the correct Redis channels.

describe('CRM Socket Events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTo.mockReturnValue({ emit: mockEmit });
  });

  it('should emit crm:lead:list-updated after lead column update', async () => {
    const leadId = 'lead-123';
    const columnId = 'col-456';
    const userId = 'user-789';

    const mockLead = {
      id: leadId,
      column: { id: 'col-old', name: 'Old Column' },
    };
    const mockColumn = { id: columnId, name: 'New Column' };

    mockPrisma.lead.findUnique.mockResolvedValue(mockLead);
    mockPrisma.kanbanColumn.findUnique.mockResolvedValue(mockColumn);
    mockPrisma.lead.update.mockResolvedValue({ ...mockLead, columnId, column: mockColumn });
    mockPrisma.leadHistory.create.mockResolvedValue({});

    await LeadsService.updateColumn(leadId, columnId, userId);

    // Assert: redis.publish called with 'crm:leads:list' channel
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'crm:leads:list',
      expect.stringContaining('"type":"lead:column-moved"')
    );
    // Assert: payload includes the leadId
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'crm:leads:list',
      expect.stringContaining(`"leadId":"${leadId}"`)
    );
  });

  it('should emit lead-specific event after lead update', async () => {
    const leadId = 'lead-123';
    const userId = 'user-789';

    mockPrisma.lead.findUnique.mockResolvedValue({ id: leadId });
    mockPrisma.lead.update.mockResolvedValue({ id: leadId });
    mockPrisma.leadHistory.create.mockResolvedValue({});

    await LeadsService.update(leadId, { familyName: 'Família Teste' }, userId);

    // Assert: redis.publish called for list invalidation
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'crm:leads:list',
      expect.stringContaining('"type":"lead:updated"')
    );
    // Assert: getIO().to('lead:{leadId}').emit('crm:lead:updated', ...) called
    expect(mockTo).toHaveBeenCalledWith(`lead:${leadId}`);
    expect(mockEmit).toHaveBeenCalledWith('crm:lead:updated', { leadId });
  });

  it('should emit event after contract approval', async () => {
    const ContractService = await import('../services/contract.service.js');

    const contractId = 'contract-123';
    const leadId = 'lead-456';
    const userId = 'user-789';

    mockPrisma.contract.findUnique.mockResolvedValue({
      id: contractId,
      leadId,
      status: 'PENDING_LEGAL',
      legalApprovalStatus: 'PENDING',
    });

    mockPrisma.contract.update.mockResolvedValue({
      id: contractId,
      leadId,
      status: 'PENDING_FINANCIAL',
      legalApprovalStatus: 'APPROVED',
    });

    mockPrisma.leadHistory.create.mockResolvedValue({});
    mockPrisma.admissionGateApproval.findUnique.mockResolvedValue(null);

    await ContractService.submitLegalApproval(contractId, 'APPROVED', userId, 'LEGAL' as any);

    // Assert: redis.publish called with correct channel and type
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'crm:leads:list',
      expect.stringContaining('"type":"contract:updated"')
    );
    // Assert: leadId is in the payload
    expect(mockRedis.publish).toHaveBeenCalledWith(
      'crm:leads:list',
      expect.stringContaining(`"leadId":"${leadId}"`)
    );
  });

  it('should wrap redis.publish in try/catch — Redis failure does not throw', async () => {
    const leadId = 'lead-123';
    const columnId = 'col-456';
    const userId = 'user-789';

    const mockLead = {
      id: leadId,
      column: { id: 'col-old', name: 'Old Column' },
    };
    const mockColumn = { id: columnId, name: 'New Column' };

    mockPrisma.lead.findUnique.mockResolvedValue(mockLead);
    mockPrisma.kanbanColumn.findUnique.mockResolvedValue(mockColumn);
    mockPrisma.lead.update.mockResolvedValue({ ...mockLead, columnId, column: mockColumn });
    mockPrisma.leadHistory.create.mockResolvedValue({});

    // Simulate Redis failure — both redis.publish AND getIO should fail
    mockRedis.publish.mockRejectedValueOnce(new Error('Redis connection lost'));

    // The mutation should complete successfully even when Redis fails
    const result = await LeadsService.updateColumn(leadId, columnId, userId);

    // Mutation returned a result — it was not blocked by Redis failure
    expect(result).toBeDefined();
    expect(result.updated).toBeDefined();
  });
});
