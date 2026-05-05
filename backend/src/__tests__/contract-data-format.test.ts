import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Read both the orchestrator and the formatters module since the formatters
// were extracted out of the orchestrator into their own file.
const contractServiceSource = [
  readFileSync(path.resolve(__dirname, '../services/contract/contract-pdf/index.ts'), 'utf-8'),
  readFileSync(path.resolve(__dirname, '../services/contract/contract-pdf/formatters.ts'), 'utf-8'),
].join('\n');

describe('Contract service - formatMaritalStatus (DATA-01)', () => {
  it('should export formatMaritalStatus', () => {
    expect(contractServiceSource).toContain('export function formatMaritalStatus');
  });

  it('should map SOLTEIRO to Solteiro(a)', async () => {
    const { formatMaritalStatus } = await import('../services/contract.service.js');
    expect(formatMaritalStatus('SOLTEIRO')).toBe('Solteiro(a)');
  });

  it('should map CASADO to Casado(a)', async () => {
    const { formatMaritalStatus } = await import('../services/contract.service.js');
    expect(formatMaritalStatus('CASADO')).toBe('Casado(a)');
  });

  it('should map DIVORCIADO to Divorciado(a)', async () => {
    const { formatMaritalStatus } = await import('../services/contract.service.js');
    expect(formatMaritalStatus('DIVORCIADO')).toBe('Divorciado(a)');
  });

  it('should map VIUVO to Viuvo(a)', async () => {
    const { formatMaritalStatus } = await import('../services/contract.service.js');
    const result = formatMaritalStatus('VIUVO');
    // Accept accented version: Viuvo(a) or Viúvo(a)
    expect(result).toMatch(/Vi[uú]vo\(a\)/);
  });

  it('should map SEPARADO to Separado(a)', async () => {
    const { formatMaritalStatus } = await import('../services/contract.service.js');
    expect(formatMaritalStatus('SEPARADO')).toBe('Separado(a)');
  });

  it('should map UNIAO_ESTAVEL to Uniao Estavel or accented equivalent', async () => {
    const { formatMaritalStatus } = await import('../services/contract.service.js');
    const result = formatMaritalStatus('UNIAO_ESTAVEL');
    // Accept accented version: Uniao Estavel or União Estável
    expect(result).toMatch(/Uni[aã]o Est[aá]vel/);
  });

  it('should return fallback for null', async () => {
    const { formatMaritalStatus } = await import('../services/contract.service.js');
    const result = formatMaritalStatus(null);
    expect(result).toMatch(/N[aã]o informado/);
  });

  it('should return fallback for empty string', async () => {
    const { formatMaritalStatus } = await import('../services/contract.service.js');
    const result = formatMaritalStatus('');
    expect(result).toMatch(/N[aã]o informado/);
  });
});

describe('Contract service - formatNationality (DATA-02)', () => {
  it('should export formatNationality', () => {
    expect(contractServiceSource).toContain('export function formatNationality');
  });

  it('should map BRASILEIRA to Brasileira', async () => {
    const { formatNationality } = await import('../services/contract.service.js');
    expect(formatNationality('BRASILEIRA')).toBe('Brasileira');
  });

  it('should map AMERICANA to Americana', async () => {
    const { formatNationality } = await import('../services/contract.service.js');
    expect(formatNationality('AMERICANA')).toBe('Americana');
  });

  it('should map PORTUGUESA to Portuguesa', async () => {
    const { formatNationality } = await import('../services/contract.service.js');
    expect(formatNationality('PORTUGUESA')).toBe('Portuguesa');
  });

  it('should map ARGENTINA to Argentina', async () => {
    const { formatNationality } = await import('../services/contract.service.js');
    expect(formatNationality('ARGENTINA')).toBe('Argentina');
  });

  it('should map COLOMBIANA to Colombiana', async () => {
    const { formatNationality } = await import('../services/contract.service.js');
    expect(formatNationality('COLOMBIANA')).toBe('Colombiana');
  });

  it('should map OUTRA to Outra', async () => {
    const { formatNationality } = await import('../services/contract.service.js');
    expect(formatNationality('OUTRA')).toBe('Outra');
  });

  it('should return fallback for null', async () => {
    const { formatNationality } = await import('../services/contract.service.js');
    const result = formatNationality(null);
    expect(result).toMatch(/N[aã]o informado/);
  });
});
