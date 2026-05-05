import { describe, it, expect } from 'vitest';
import toast from 'react-hot-toast';
import { validateDocumentsStep } from '../validateDocumentsStep';
import { buildContext } from './contextHelper';

// Required document types per category in the current spec.
const REQUIRED_STUDENT = ['STUDENT_ID', 'STUDENT_CPF', 'BIRTH_CERTIFICATE', 'VACCINATION_CARD', 'STUDENT_PHOTO'];
const REQUIRED_MOTHER = ['MOTHER_ID', 'MOTHER_CPF', 'MOTHER_PROOF_OF_RESIDENCE'];
const REQUIRED_FATHER = ['FATHER_ID', 'FATHER_CPF', 'FATHER_PROOF_OF_RESIDENCE'];
const REQUIRED_SCHOOL = ['SCHOOL_DECLARATION', 'FINANCIAL_CLEARANCE'];

// Minimal shape of EnrollmentDocument used by the validator. Cast to any for
// the enrollmentData payload to avoid carrying every persisted field through
// each test fixture.
interface UploadedDoc {
  documentType: string;
  category: string;
  childId?: string;
  includesOtherDocs?: string[];
}

const makeDocs = (
  pairs: Array<{ types: string[]; category: string; childId?: string }>,
): UploadedDoc[] =>
  pairs.flatMap(({ types, category, childId }) =>
    types.map(documentType => ({ documentType, category, childId })),
  );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asEnrollmentData = (documents: UploadedDoc[]): any => ({ documents });

describe('validateDocumentsStep', () => {
  it('rejects when nothing has been uploaded', () => {
    const ctx = buildContext({
      enrollmentData: asEnrollmentData([]),
      formValues: { health: {} },
    });
    expect(validateDocumentsStep(ctx)).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Documentos obrigatórios'),
    );
  });

  it('passes when all single-child required docs are uploaded (FATHER responsible)', () => {
    const documents = makeDocs([
      { types: REQUIRED_STUDENT, category: 'STUDENT' },
      { types: REQUIRED_MOTHER, category: 'MOTHER' },
      { types: REQUIRED_FATHER, category: 'FATHER' },
      { types: REQUIRED_SCHOOL, category: 'SCHOOL' },
    ]);
    const ctx = buildContext({
      enrollmentData: asEnrollmentData(documents),
      formValues: { health: {} },
      watchFinancialResponsible: { responsibleType: 'FATHER' },
    });
    expect(validateDocumentsStep(ctx)).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('requires extra FINANCIAL_RESPONSIBLE docs when responsibleType is OTHER (INDIVIDUAL)', () => {
    const documents = makeDocs([
      { types: REQUIRED_STUDENT, category: 'STUDENT' },
      { types: REQUIRED_MOTHER, category: 'MOTHER' },
      { types: REQUIRED_FATHER, category: 'FATHER' },
      { types: REQUIRED_SCHOOL, category: 'SCHOOL' },
    ]);
    const ctx = buildContext({
      enrollmentData: asEnrollmentData(documents),
      formValues: { health: {} },
      watchFinancialResponsible: {
        responsibleType: 'OTHER',
        personType: 'INDIVIDUAL',
      },
    });
    expect(validateDocumentsStep(ctx)).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Responsável Financeiro'),
    );
  });

  it('honours includesOtherDocs to satisfy a missing required doc', () => {
    const documents: UploadedDoc[] = [
      // STUDENT_ID upload that also covers STUDENT_CPF
      { documentType: 'STUDENT_ID', category: 'STUDENT', includesOtherDocs: ['STUDENT_CPF'] },
      { documentType: 'BIRTH_CERTIFICATE', category: 'STUDENT' },
      { documentType: 'VACCINATION_CARD', category: 'STUDENT' },
      { documentType: 'STUDENT_PHOTO', category: 'STUDENT' },
      ...makeDocs([{ types: REQUIRED_MOTHER, category: 'MOTHER' }])[0]
        ? makeDocs([{ types: REQUIRED_MOTHER, category: 'MOTHER' }])
        : [],
      ...makeDocs([{ types: REQUIRED_FATHER, category: 'FATHER' }]),
      ...makeDocs([{ types: REQUIRED_SCHOOL, category: 'SCHOOL' }]),
    ];
    const ctx = buildContext({
      enrollmentData: asEnrollmentData(documents),
      formValues: { health: {} },
      watchFinancialResponsible: { responsibleType: 'FATHER' },
    });
    expect(validateDocumentsStep(ctx)).toBe(true);
  });

  it('reports missing docs per child in multi-child scenario', () => {
    const documents = makeDocs([
      // child s1 has all student docs, child s2 is missing them
      { types: REQUIRED_STUDENT, category: 'STUDENT', childId: 's1' },
      { types: REQUIRED_MOTHER, category: 'MOTHER' },
      { types: REQUIRED_FATHER, category: 'FATHER' },
      { types: REQUIRED_SCHOOL, category: 'SCHOOL' },
    ]);
    const ctx = buildContext({
      enrollmentStudents: [
        { id: 's1', fullName: 'João' },
        { id: 's2', fullName: 'Maria' },
      ],
      enrollmentData: asEnrollmentData(documents),
      formValues: { health: {} },
      watchFinancialResponsible: { responsibleType: 'FATHER' },
    });
    expect(validateDocumentsStep(ctx)).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Maria'));
  });
});
