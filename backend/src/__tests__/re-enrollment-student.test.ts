import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    student: { findFirst: vi.fn(), create: vi.fn(), findUnique: vi.fn() },
    studentHistory: { create: vi.fn() },
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

describe('createStudentFromReEnrollment', () => {
  it.todo('creates new Student with previousStudentId pointing to current student');
  it.todo('uses getNextGrade for the new student grade');
  it.todo('sets academicYear to the target year from the period');
  it.todo('is idempotent — returns existing if same leadChildId + academicYear');
  it.todo('creates StudentHistory entry with source RE_ENROLLMENT');
});

describe('Student anterior status — REMAT-10', () => {
  it.todo('does NOT change previous student status to GRADUATED at re-enrollment');
  it.todo('previous student remains ACTIVE after new student creation');
});
