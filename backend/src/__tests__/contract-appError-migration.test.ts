import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The contract service was split across multiple files and sub-folders
// (contract-webhook/, contract-pdf/, ...). Read every .ts file recursively
// so adding a new sub-module doesn't silently break these source-string
// migration assertions.
const contractDir = path.resolve(__dirname, '../services/contract');
const contractServiceSource = readdirSync(contractDir, { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('.ts'))
  .map(entry => readFileSync(path.join(entry.parentPath, entry.name), 'utf-8'))
  .join('\n');

describe('Contract service - AppError migration (BUG-04)', () => {
  it('should import createAppError from error-messages', () => {
    expect(contractServiceSource).toContain("from '../../lib/error-messages.js'");
  });

  it('should NOT contain throw new Error for known error codes', () => {
    const oldPatterns = [
      "throw new Error('CONTRACT_ALREADY_EXISTS')",
      "throw new Error('LEAD_NOT_FOUND')",
      "throw new Error('CONTRACT_NOT_FOUND')",
      "throw new Error('CONTRACT_ALREADY_SENT')",
      "throw new Error('SIGNER_NOT_FOUND')",
      "throw new Error('CONTRACT_NOT_FULLY_APPROVED')",
      "throw new Error('INSUFFICIENT_ROLE')",
    ];
    for (const pattern of oldPatterns) {
      expect(contractServiceSource).not.toContain(pattern);
    }
  });

  it('should use createAppError for CONTRACT_ALREADY_EXISTS', () => {
    expect(contractServiceSource).toContain("createAppError('CONTRACT_ALREADY_EXISTS')");
  });

  it('should catch P2002 and throw CONTRACT_ALREADY_EXISTS', () => {
    expect(contractServiceSource).toContain('P2002');
    expect(contractServiceSource).toContain("createAppError('CONTRACT_ALREADY_EXISTS')");
  });

  it('should use createAppError for CONTRACT_NOT_FOUND', () => {
    expect(contractServiceSource).toContain("createAppError('CONTRACT_NOT_FOUND')");
  });

  it('should use createAppError for INSUFFICIENT_ROLE', () => {
    expect(contractServiceSource).toContain("createAppError('INSUFFICIENT_ROLE')");
  });

  it('should use createAppError for CONTRACT_NOT_FULLY_APPROVED', () => {
    expect(contractServiceSource).toContain("createAppError('CONTRACT_NOT_FULLY_APPROVED')");
  });

  it('should use createAppError for CONTRACT_PDF_UPLOAD_FAILED', () => {
    expect(contractServiceSource).toContain("createAppError('CONTRACT_PDF_UPLOAD_FAILED')");
  });
});

describe('Contract service - ClickSign idempotency (BUG-01 D-17/D-18)', () => {
  it('should check existing ClickSign document status before creating new one', () => {
    expect(contractServiceSource).toContain('clicksignEnvelopeId');
    expect(contractServiceSource).toMatch(/getDocument|getEnvelopeDocuments/);
  });

  it('should handle invalid ClickSign document by clearing envelope reference', () => {
    expect(contractServiceSource).toContain('clicksignEnvelopeId: null');
  });

  it('should import AppError for instanceof check in idempotency logic', () => {
    // Tolerate any relative depth — sub-modules under contract/ live at
    // different depths (../../ vs ../../../) and we just want to confirm
    // the AppError import is wired up somewhere in the contract service.
    expect(contractServiceSource).toMatch(/import\s*\{[^}]*\bAppError\b[^}]*\}\s*from\s*['"](?:\.\.\/)+middlewares\/errorHandler\.js['"]/);
  });
});
