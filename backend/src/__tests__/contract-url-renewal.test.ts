import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const contractServiceSource = readFileSync(
  path.resolve(__dirname, '../services/contract/contract-core.service.ts'), 'utf-8'
);
const controllerSource = readFileSync(
  path.resolve(__dirname, '../controllers/contract.controller.ts'), 'utf-8'
);

describe('Contract URL renewal (BUG-03)', () => {
  it('service should have freshenContractUrls helper', () => {
    expect(contractServiceSource).toContain('freshenContractUrls');
  });

  it('findByLeadId should freshen URLs', () => {
    expect(contractServiceSource).toMatch(/findByLeadId[\s\S]*?freshenContractUrls/);
  });

  it('findById should freshen URLs', () => {
    expect(contractServiceSource).toMatch(/findById[\s\S]*?freshenContractUrls/);
  });

  it('freshenContractUrls should use getSignedUrl from supabase config', () => {
    expect(contractServiceSource).toContain("import { getSignedUrl, extractStoragePath } from '../../config/supabase.js'");
  });

  it('freshenContractUrls should generate 1-hour signed URLs', () => {
    expect(contractServiceSource).toContain('3600');
  });

  it('freshenContractUrls should handle legacy base64 documents (non-http URLs)', () => {
    expect(contractServiceSource).toContain("!contract.documentUrl.startsWith('http')");
  });
});

describe('Contract controller simplified error handling (BUG-04)', () => {
  it('controller create should not string-match CONTRACT_ALREADY_EXISTS', () => {
    expect(controllerSource).not.toContain("error.message === 'CONTRACT_ALREADY_EXISTS'");
  });

  it('controller create should not string-match LEAD_NOT_FOUND', () => {
    expect(controllerSource).not.toContain("error.message === 'LEAD_NOT_FOUND'");
  });

  it('controller sendForSignature should not string-match CONTRACT_ALREADY_SENT', () => {
    expect(controllerSource).not.toContain("error.message === 'CONTRACT_ALREADY_SENT'");
  });

  it('controller should still handle ZodError for validation', () => {
    expect(controllerSource).toContain('ZodError');
  });

  it('getDocument should still generate fresh signed URL', () => {
    expect(controllerSource).toContain('getSignedUrl');
  });
});
