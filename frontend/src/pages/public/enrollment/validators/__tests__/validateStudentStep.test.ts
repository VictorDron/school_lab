import { describe, it, expect } from 'vitest';
import toast from 'react-hot-toast';
import { validateStudentStep } from '../validateStudentStep';
import { buildContext } from './contextHelper';

const validParent = (overrides: Record<string, unknown> = {}) => ({
  email: 'parent@example.com',
  phone: '21999998888',
  cpf: '529.982.247-25',
  idNumber: `RG-${Math.random().toString(36).slice(2, 8)}`,
  idIssueDate: '2010-05-01',
  idIssuer: 'DETRAN-RJ',
  dateOfBirth: '1980-01-15',
  occupation: 'Engenheiro',
  education: 'HIGHER_COMPLETE',
  address: {
    country: 'BR',
    state: 'RJ',
    city: 'Rio de Janeiro',
    street: 'Rua A',
    number: '100',
  },
  ...overrides,
});

const validStudent = {
  studentCpf: '987.654.321-00', // distinct from parents
  studentIdNumber: 'STU-88',
  studentIdIssueDate: '2018-03-10',
  studentIdIssuer: 'DETRAN-RJ',
};

describe('validateStudentStep — single child', () => {
  it('accepts a fully filled form', () => {
    const ctx = buildContext({
      formValues: {
        enrollmentInfo: validStudent,
        fatherUpdates: validParent({ cpf: '111.444.777-35', idNumber: 'RG-FATHER' }),
        motherUpdates: validParent({ cpf: '038.394.250-92', idNumber: 'RG-MOTHER' }),
      },
    });
    expect(validateStudentStep(ctx)).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('rejects when student CPF is invalid', () => {
    const ctx = buildContext({
      formValues: {
        enrollmentInfo: { ...validStudent, studentCpf: '111.111.111-11' },
        fatherUpdates: validParent({ cpf: '111.444.777-35' }),
        motherUpdates: validParent({ cpf: '038.394.250-92' }),
      },
    });
    expect(validateStudentStep(ctx)).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('CPF'));
  });

  it('rejects when student ID is missing', () => {
    const ctx = buildContext({
      formValues: {
        enrollmentInfo: { ...validStudent, studentIdNumber: '' },
        fatherUpdates: validParent({ cpf: '111.444.777-35' }),
        motherUpdates: validParent({ cpf: '038.394.250-92' }),
      },
    });
    expect(validateStudentStep(ctx)).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('RG/Passaporte'),
    );
  });

  it('flags duplicate CPF between father and mother', () => {
    const sharedCpf = '111.444.777-35';
    const ctx = buildContext({
      formValues: {
        enrollmentInfo: validStudent,
        fatherUpdates: validParent({ cpf: sharedCpf }),
        motherUpdates: validParent({ cpf: sharedCpf }),
      },
    });
    expect(validateStudentStep(ctx)).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('é igual'),
    );
  });

  it('rejects when father date of birth is in the future', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
      .toISOString()
      .slice(0, 10);
    const ctx = buildContext({
      formValues: {
        enrollmentInfo: validStudent,
        fatherUpdates: validParent({
          cpf: '111.444.777-35',
          dateOfBirth: future,
        }),
        motherUpdates: validParent({ cpf: '038.394.250-92' }),
      },
    });
    expect(validateStudentStep(ctx)).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('futuro'),
    );
  });

  it('clears field errors when validation passes', () => {
    const ctx = buildContext({
      formValues: {
        enrollmentInfo: validStudent,
        fatherUpdates: validParent({ cpf: '111.444.777-35', idNumber: 'RG-FATHER' }),
        motherUpdates: validParent({ cpf: '038.394.250-92', idNumber: 'RG-MOTHER' }),
      },
    });
    validateStudentStep(ctx);
    expect(ctx.setFieldErrorsSpy).toHaveBeenLastCalledWith({});
  });
});

describe('validateStudentStep — multi child', () => {
  it('switches to the failing child tab when their student ID is missing', () => {
    const ctx = buildContext({
      enrollmentStudents: [
        { id: 's1', fullName: 'João' },
        { id: 's2', fullName: 'Maria' },
      ],
      formValues: {
        studentsEnrollment: [
          { enrollmentInfo: validStudent },
          { enrollmentInfo: { ...validStudent, studentIdNumber: '' } },
        ],
        fatherUpdates: validParent({ cpf: '111.444.777-35' }),
        motherUpdates: validParent({ cpf: '038.394.250-92' }),
      },
    });
    expect(validateStudentStep(ctx)).toBe(false);
    expect(ctx.setActiveStudentTabSpy).toHaveBeenCalledWith(1);
  });
});
