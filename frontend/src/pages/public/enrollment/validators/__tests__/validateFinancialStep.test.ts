import { describe, it, expect, vi } from 'vitest';
import toast from 'react-hot-toast';
import { validateFinancialStep } from '../validateFinancialStep';
import { buildContext } from './contextHelper';

const validIndividual = {
  responsibleType: 'OTHER',
  personType: 'INDIVIDUAL',
  relationship: 'GRANDPARENT',
  fullName: 'Maria Silva',
  cpf: '529.982.247-25', // valid CPF (test fixture)
  email: 'maria@example.com',
  phone: '21999998888',
  address: {
    state: 'RJ',
    city: 'Rio de Janeiro',
    neighborhood: 'Centro',
    street: 'Rua A',
    number: '100',
  },
};

const validCompany = {
  responsibleType: 'OTHER',
  personType: 'COMPANY',
  companyName: 'Empresa LTDA',
  cnpj: '11.222.333/0001-81', // valid CNPJ (test fixture)
  contactPerson: 'João Silva',
  contactEmail: 'contato@empresa.com',
  contactPhone: '21999997777',
  address: {
    state: 'RJ',
    city: 'Rio de Janeiro',
    neighborhood: 'Centro',
    street: 'Rua B',
    number: '200',
  },
};

describe('validateFinancialStep', () => {
  it('returns true when responsibleType is FATHER (no extra fields required)', () => {
    const ctx = buildContext({
      formValues: { financialResponsible: { responsibleType: 'FATHER' } },
    });
    expect(validateFinancialStep(ctx)).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('rejects when responsibleType is empty', () => {
    const ctx = buildContext({ formValues: { financialResponsible: {} } });
    expect(validateFinancialStep(ctx)).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('responsável'),
    );
  });

  it('accepts a fully populated INDIVIDUAL responsible', () => {
    const ctx = buildContext({
      formValues: { financialResponsible: validIndividual },
    });
    expect(validateFinancialStep(ctx)).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('rejects INDIVIDUAL with invalid CPF', () => {
    const ctx = buildContext({
      formValues: {
        financialResponsible: { ...validIndividual, cpf: '111.111.111-11' },
      },
    });
    expect(validateFinancialStep(ctx)).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('CPF'));
  });

  it('rejects INDIVIDUAL when relationship is missing', () => {
    const ctx = buildContext({
      formValues: {
        financialResponsible: { ...validIndividual, relationship: '' },
      },
    });
    expect(validateFinancialStep(ctx)).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('parentesco'),
    );
  });

  it('accepts a fully populated COMPANY responsible', () => {
    const ctx = buildContext({
      formValues: { financialResponsible: validCompany },
    });
    expect(validateFinancialStep(ctx)).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('rejects COMPANY with invalid CNPJ', () => {
    const ctx = buildContext({
      formValues: {
        financialResponsible: { ...validCompany, cnpj: '11.111.111/1111-11' },
      },
    });
    expect(validateFinancialStep(ctx)).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('CNPJ'));
  });

  it('rejects when address state is missing', () => {
    const ctx = buildContext({
      formValues: {
        financialResponsible: {
          ...validIndividual,
          address: { ...validIndividual.address, state: '' },
        },
      },
    });
    expect(validateFinancialStep(ctx)).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('estado'));
  });

  it('flags duplicate CPF between father and financial responsible', () => {
    const ctx = buildContext({
      formValues: {
        financialResponsible: validIndividual,
        fatherUpdates: { cpf: validIndividual.cpf },
        motherUpdates: { cpf: '012.345.678-90' },
        enrollmentInfo: { studentCpf: '987.654.321-00' },
      },
    });
    expect(validateFinancialStep(ctx)).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('é igual'),
    );
  });

  it('emits English copy when language is en', () => {
    const ctx = buildContext({
      formValues: { financialResponsible: {} },
      language: 'en',
    });
    expect(validateFinancialStep(ctx)).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('financial responsible'),
    );
  });

  it('does not call toast when input is valid (sanity check vs. spy reuse)', () => {
    vi.clearAllMocks();
    const ctx = buildContext({
      formValues: { financialResponsible: validIndividual },
    });
    validateFinancialStep(ctx);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
