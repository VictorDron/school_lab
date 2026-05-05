import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../config/database.js', () => ({
  prisma: {
    student: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    studentHistory: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    leadChild: {
      findMany: vi.fn(),
    },
    lead: {
      findUnique: vi.fn(),
    },
    user: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../config/redis.js', () => ({ redis: { publish: vi.fn() } }));
vi.mock('../socket/io.js', () => ({ getIO: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })) }));
vi.mock('../services/audit.service.js', () => ({ createAuditLog: vi.fn() }));
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { prisma } from '../config/database.js';
import { findByIdWithDocuments } from '../services/students/index.js';

describe('findByIdWithDocuments (STU-04)', () => {
  const mockPrisma = prisma as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return documents filtered by leadChildId', async () => {
    const student = {
      id: 'std-001',
      fullName: 'Ana Souza',
      leadId: 'lead-001',
      leadChildId: 'child-001',
      status: 'ACTIVE',
      history: [],
    };

    const documents = [
      { id: 'doc-001', childId: 'child-001', url: 'https://storage.example.com/doc1.pdf', name: 'RG' },
      { id: 'doc-002', childId: 'child-001', url: 'https://storage.example.com/doc2.pdf', name: 'CPF' },
    ];

    mockPrisma.student.findUnique.mockResolvedValue(student);
    mockPrisma.lead.findUnique.mockResolvedValue({
      documents,
      enrollmentDocuments: [],
    });

    const result = await findByIdWithDocuments('std-001');

    expect(result).not.toBeNull();
    expect(result!.student.id).toBe('std-001');
    expect(result!.documents).toHaveLength(2);
    expect(result!.documents[0].childId).toBe('child-001');
    expect(result!.documents[1].name).toBe('CPF');
  });

  it('should return enrollmentDocuments filtered by leadChildId', async () => {
    const student = {
      id: 'std-002',
      fullName: 'Bruno Lima',
      leadId: 'lead-002',
      leadChildId: 'child-002',
      status: 'ACTIVE',
      history: [],
    };

    const enrollmentDocuments = [
      {
        id: 'enrdoc-001',
        childId: 'child-002',
        fileUrl: 'https://storage.example.com/enroll1.pdf',
        documentType: 'BIRTH_CERTIFICATE',
      },
    ];

    mockPrisma.student.findUnique.mockResolvedValue(student);
    mockPrisma.lead.findUnique.mockResolvedValue({
      documents: [],
      enrollmentDocuments,
    });

    const result = await findByIdWithDocuments('std-002');

    expect(result).not.toBeNull();
    expect(result!.enrollmentDocuments).toHaveLength(1);
    expect(result!.enrollmentDocuments[0].documentType).toBe('BIRTH_CERTIFICATE');
    expect(result!.enrollmentDocuments[0].childId).toBe('child-002');

    // Verify lead.findUnique was queried with the childId filter
    const leadCall = mockPrisma.lead.findUnique.mock.calls[0][0];
    expect(leadCall.select.enrollmentDocuments.where.childId).toBe('child-002');
    expect(leadCall.select.documents.where.childId).toBe('child-002');
  });

  it('should return null for nonexistent student', async () => {
    mockPrisma.student.findUnique.mockResolvedValue(null);

    const result = await findByIdWithDocuments('nonexistent-id');

    expect(result).toBeNull();
    expect(mockPrisma.lead.findUnique).not.toHaveBeenCalled();
  });

  it('should return empty arrays when lead has no matching documents', async () => {
    const student = {
      id: 'std-003',
      fullName: 'Clara Mendes',
      leadId: 'lead-003',
      leadChildId: 'child-003',
      status: 'ACTIVE',
      history: [],
    };

    mockPrisma.student.findUnique.mockResolvedValue(student);
    mockPrisma.lead.findUnique.mockResolvedValue({
      documents: [],
      enrollmentDocuments: [],
    });

    const result = await findByIdWithDocuments('std-003');

    expect(result).not.toBeNull();
    expect(result!.documents).toEqual([]);
    expect(result!.enrollmentDocuments).toEqual([]);
  });
});
