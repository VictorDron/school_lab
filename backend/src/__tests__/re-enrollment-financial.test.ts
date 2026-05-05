import { describe, it, expect } from 'vitest';
import { buildStudentPriceCalculation } from '../services/re-enrollment-financial.service.js';

const baseStudent = {
  id: 'stu-1',
  code: 'A001',
  fullName: 'Aluno Teste',
  grade: 'G6',
  status: 'ACTIVE',
  child: { id: 'child-1', fullName: 'Aluno Filho' },
};

const priceMap = new Map([
  ['G6', { baseAnnualValue: 24000, enrollmentFee: 1500, discountPercent: null }],
]);

describe('buildStudentPriceCalculation', () => {
  it('classifies student without lead and no exception as semContrato', () => {
    const result = buildStudentPriceCalculation(
      { ...baseStudent, lead: null },
      { priceMap, exceptionMap: new Map(), adjustmentPercent: 5 },
    );

    expect(result.bucket).toBe('semContrato');
    expect(result.hasException).toBe(false);
    expect(result.row.financialStatus).toBe('SEM_CONTRATO');
    expect(result.row.currentAnnualValue).toBeNull();
    expect(result.row.proposedAnnualValue).toBe(25200);
    expect(result.row.finalAnnualValue).toBe(25200);
    expect(result.row.monthlyValue).toBe(2100);
  });

  it('classifies student without lead but with exception as semContrato + hasException', () => {
    const exceptionMap = new Map([
      [
        'stu-1',
        {
          id: 'exc-1',
          overrideAnnualValue: 20000,
          overrideDiscountPercent: null,
          justification: 'Bolsa institucional',
        },
      ],
    ]);

    const result = buildStudentPriceCalculation(
      { ...baseStudent, lead: null },
      { priceMap, exceptionMap, adjustmentPercent: 5 },
    );

    expect(result.bucket).toBe('semContrato');
    expect(result.hasException).toBe(true);
    expect(result.row.exceptionId).toBe('exc-1');
    expect(result.row.finalAnnualValue).toBe(20000);
  });

  it('classifies student with lead and all-paid contract as adimplente', () => {
    const result = buildStudentPriceCalculation(
      {
        ...baseStudent,
        lead: {
          id: 'lead-1',
          familyName: 'Família X',
          contracts: [
            {
              id: 'c1',
              status: 'ACTIVE',
              totalAnnualValue: 22000,
              payments: [{ status: 'PAID' }, { status: 'PAID' }],
            },
          ],
        },
      },
      { priceMap, exceptionMap: new Map(), adjustmentPercent: 5 },
    );

    expect(result.bucket).toBe('adimplente');
    expect(result.row.financialStatus).toBe('ADIMPLENTE');
    expect(result.row.currentAnnualValue).toBe(22000);
  });

  it('classifies student with lead and at least one OVERDUE payment as inadimplente', () => {
    const result = buildStudentPriceCalculation(
      {
        ...baseStudent,
        lead: {
          id: 'lead-1',
          familyName: 'Família X',
          contracts: [
            {
              id: 'c1',
              status: 'ACTIVE',
              totalAnnualValue: 22000,
              payments: [{ status: 'PAID' }, { status: 'OVERDUE' }],
            },
          ],
        },
      },
      { priceMap, exceptionMap: new Map(), adjustmentPercent: 5 },
    );

    expect(result.bucket).toBe('inadimplente');
    expect(result.row.financialStatus).toBe('INADIMPLENTE');
  });

  it('returns null pricing when grade not in priceMap', () => {
    const result = buildStudentPriceCalculation(
      { ...baseStudent, grade: 'GX', lead: null },
      { priceMap, exceptionMap: new Map(), adjustmentPercent: 5 },
    );

    expect(result.row.baseAnnualValue).toBeNull();
    expect(result.row.proposedAnnualValue).toBeNull();
    expect(result.row.finalAnnualValue).toBeNull();
    expect(result.row.monthlyValue).toBeNull();
  });
});
