import { describe, it, expect } from 'vitest';
import { ERROR_MESSAGES, createAppError } from '../lib/error-messages.js';
import { AppError } from '../middlewares/errorHandler.js';

describe('ERROR_MESSAGES map', () => {
  it('should contain all required error codes', () => {
    const requiredCodes = [
      'CONTRACT_ALREADY_EXISTS',
      'LEAD_NOT_FOUND',
      'CONTRACT_NOT_FOUND',
      'EVALUATION_NOT_FOUND',
      'INVALID_GATE_TRANSITION',
      'GATE_PENDING_APPROVALS',
      'EVALUATION_INCOMPLETE',
      'EVENT_NOT_FOUND',
      'EVENT_NOT_VIVENCIA',
      'CHILD_NOT_FOUND',
      'CONTRACT_ALREADY_SENT',
      'CONTRACT_NOT_FULLY_APPROVED',
      'CONTRACT_MISSING_REQUIRED_SIGNERS',
      'CONTRACT_PDF_DOWNLOAD_FAILED',
      'SIGNER_NOT_FOUND',
      'CONTRACT_INVALID_STATUS',
      'CONTRACT_LEGAL_NOT_APPROVED',
      'INSUFFICIENT_ROLE',
    ];

    for (const code of requiredCodes) {
      expect(ERROR_MESSAGES[code], `Missing error code: ${code}`).toBeDefined();
      expect(typeof ERROR_MESSAGES[code].status).toBe('number');
      expect(typeof ERROR_MESSAGES[code].message).toBe('string');
      expect(ERROR_MESSAGES[code].message.length).toBeGreaterThan(0);
    }
  });

  it('should have pt-BR messages (contain accented characters or at least be non-empty)', () => {
    // Spot-check a few messages for Portuguese content
    expect(ERROR_MESSAGES['LEAD_NOT_FOUND'].message).toContain('encontrado');
    expect(ERROR_MESSAGES['EVALUATION_INCOMPLETE'].message).toContain('avaliação');
    expect(ERROR_MESSAGES['GATE_PENDING_APPROVALS'].message).toContain('aprovações');
  });

  it('should have correct HTTP status codes', () => {
    expect(ERROR_MESSAGES['CONTRACT_ALREADY_EXISTS'].status).toBe(409);
    expect(ERROR_MESSAGES['LEAD_NOT_FOUND'].status).toBe(404);
    expect(ERROR_MESSAGES['CONTRACT_NOT_FOUND'].status).toBe(404);
    expect(ERROR_MESSAGES['EVALUATION_INCOMPLETE'].status).toBe(400);
    expect(ERROR_MESSAGES['INVALID_GATE_TRANSITION'].status).toBe(400);
    expect(ERROR_MESSAGES['GATE_PENDING_APPROVALS'].status).toBe(400);
    expect(ERROR_MESSAGES['INSUFFICIENT_ROLE'].status).toBe(403);
  });
});

describe('createAppError', () => {
  it('should return AppError with correct status and message for known code CONTRACT_ALREADY_EXISTS', () => {
    const err = createAppError('CONTRACT_ALREADY_EXISTS');
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe(ERROR_MESSAGES['CONTRACT_ALREADY_EXISTS'].message);
    expect(err.code).toBe('CONTRACT_ALREADY_EXISTS');
  });

  it('should return AppError with status 404 for LEAD_NOT_FOUND', () => {
    const err = createAppError('LEAD_NOT_FOUND');
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('LEAD_NOT_FOUND');
  });

  it('should return AppError with status 500 and generic message for unknown code', () => {
    const err = createAppError('UNKNOWN_CODE_THAT_DOESNT_EXIST');
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('UNKNOWN_CODE_THAT_DOESNT_EXIST');
  });

  it('should append details to message when provided', () => {
    const err = createAppError('INVALID_GATE_TRANSITION', 'EVALUATION_PENDING → EVALUATION_COMPLETED');
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toContain('EVALUATION_PENDING → EVALUATION_COMPLETED');
  });

  it('should return correct instance type that extends Error', () => {
    const err = createAppError('EVALUATION_INCOMPLETE');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('AppError');
  });
});
