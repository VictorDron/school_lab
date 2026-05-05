import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockFindUnique = vi.fn();

vi.mock('../config/database.js', () => ({
  prisma: {
    importHistory: {
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

import {
  createImportHistory,
  updateImportHistory,
  getImportHistory,
} from '../services/import.service.js';

// IMP-05: Resultado detalhado pos-importacao
describe('Import History', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockUpdate.mockReset();
    mockFindUnique.mockReset();
  });

  it('should create ImportHistory record with PROCESSING status', async () => {
    const mockRecord = {
      id: 'hist-1',
      userId: 'user-1',
      fileName: 'test.csv',
      fileSize: 1024,
      totalRows: 100,
      created: 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      errors: null,
      status: 'PROCESSING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockCreate.mockResolvedValue(mockRecord);

    const result = await createImportHistory({
      userId: 'user-1',
      fileName: 'test.csv',
      fileSize: 1024,
      totalRows: 100,
    });

    expect(mockCreate).toHaveBeenCalledOnce();
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.data.status).toBe('PROCESSING');
    expect(callArgs.data.userId).toBe('user-1');
    expect(callArgs.data.fileName).toBe('test.csv');
    expect(callArgs.data.totalRows).toBe(100);
    expect(result.status).toBe('PROCESSING');
  });

  it('should update ImportHistory with final counts and COMPLETED status', async () => {
    const mockUpdated = {
      id: 'hist-1',
      created: 80,
      updated: 5,
      failed: 10,
      skipped: 5,
      status: 'COMPLETED',
      errors: [],
    };

    mockUpdate.mockResolvedValue(mockUpdated);

    const result = await updateImportHistory('hist-1', {
      created: 80,
      updated: 5,
      failed: 10,
      skipped: 5,
      errors: [],
      status: 'COMPLETED',
    });

    expect(mockUpdate).toHaveBeenCalledOnce();
    const callArgs = mockUpdate.mock.calls[0][0];
    expect(callArgs.where.id).toBe('hist-1');
    expect(callArgs.data.created).toBe(80);
    expect(callArgs.data.status).toBe('COMPLETED');
    expect(result.status).toBe('COMPLETED');
  });

  it('should store error details as JSON array with row, field, message', async () => {
    const errors = [
      { row: 5, field: 'studentName', message: 'Nome obrigatorio', severity: 'error' as const },
      { row: 12, field: '_transaction', message: 'DB error', severity: 'error' as const },
    ];

    mockUpdate.mockResolvedValue({ id: 'hist-1', errors, status: 'COMPLETED' });

    await updateImportHistory('hist-1', {
      errors,
      status: 'COMPLETED',
    });

    const callArgs = mockUpdate.mock.calls[0][0];
    const storedErrors = callArgs.data.errors;
    expect(storedErrors).toHaveLength(2);
    expect(storedErrors[0]).toHaveProperty('row', 5);
    expect(storedErrors[0]).toHaveProperty('field', 'studentName');
    expect(storedErrors[0]).toHaveProperty('message', 'Nome obrigatorio');
    expect(storedErrors[1]).toHaveProperty('row', 12);
  });

  it('should retrieve ImportHistory by id', async () => {
    const mockRecord = {
      id: 'hist-1',
      status: 'COMPLETED',
      created: 10,
      failed: 0,
    };
    mockFindUnique.mockResolvedValue(mockRecord);

    const result = await getImportHistory('hist-1');

    expect(mockFindUnique).toHaveBeenCalledOnce();
    expect(mockFindUnique.mock.calls[0][0].where.id).toBe('hist-1');
    expect(result?.status).toBe('COMPLETED');
    expect(result?.created).toBe(10);
  });
});
