import toast from 'react-hot-toast';
import { getDocumentsByCategory, type DocumentCategory } from '@/types/enrollment';
import type { ValidatorContext } from './types';

export function validateDocumentsStep(ctx: ValidatorContext): boolean {
  const {
    getValues,
    language,
    enrollmentStudents,
    enrollmentData,
    watchFinancialResponsible,
  } = ctx;

  const isMultiChildDocs = enrollmentStudents.length > 1;
  const sharedCats: DocumentCategory[] = ['MOTHER', 'FATHER'];
  if (watchFinancialResponsible?.responsibleType === 'OTHER') {
    sharedCats.push('FINANCIAL_RESPONSIBLE');
  }
  sharedCats.push('SCHOOL');

  const healthData = getValues('health');
  const hasHealthConditions = !!(
    (healthData?.medicalConditions && healthData.medicalConditions.length > 0 && !healthData.medicalConditions.every((c: string) => c === 'NONE')) ||
    healthData?.hasHospitalizations ||
    healthData?.hasSeizures ||
    (healthData?.allergies && healthData.allergies.length > 0 && !healthData.allergies.every((a: string) => a === 'NONE')) ||
    healthData?.hasEatingDisorder
  );

  const uploadedDocs = enrollmentData?.documents || [];
  const missingDocs: string[] = [];

  const isDocUploaded = (docType: string, category: string, childId?: string) => {
    return uploadedDocs.some(u => {
      const matchesCategory = u.category === category;
      const matchesChild = childId ? u.childId === childId : true;
      if (!matchesCategory || !matchesChild) return false;
      if (u.documentType === docType) return true;
      if (u.includesOtherDocs?.includes(docType)) return true;
      return false;
    });
  };

  const studentDocs = getDocumentsByCategory('STUDENT');
  if (isMultiChildDocs) {
    for (const student of enrollmentStudents) {
      for (const doc of studentDocs) {
        if (!doc.required) continue;
        if (doc.conditionalOn === 'hasHealthConditions' && !hasHealthConditions) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!isDocUploaded(doc.type, 'STUDENT', (student as any).id)) {
          const label = language === 'pt' ? doc.labelPt : doc.labelEn;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const childName = (student as any).fullName || `${language === 'pt' ? 'Filho' : 'Child'}`;
          missingDocs.push(`${label} (${childName})`);
        }
      }
    }
  } else {
    for (const doc of studentDocs) {
      if (!doc.required) continue;
      if (doc.conditionalOn === 'hasHealthConditions' && !hasHealthConditions) continue;
      if (!isDocUploaded(doc.type, 'STUDENT')) {
        missingDocs.push(language === 'pt' ? doc.labelPt : doc.labelEn);
      }
    }
  }

  const valFinPersonType = watchFinancialResponsible?.personType as 'INDIVIDUAL' | 'COMPANY' | undefined;
  for (const cat of sharedCats) {
    const docs = getDocumentsByCategory(cat);
    for (const doc of docs) {
      if (!doc.required) continue;
      if (doc.conditionalOn === 'hasHealthConditions' && !hasHealthConditions) continue;
      if (doc.personTypeFilter && doc.personTypeFilter !== valFinPersonType) continue;
      if (!isDocUploaded(doc.type, cat)) {
        missingDocs.push(language === 'pt' ? doc.labelPt : doc.labelEn);
      }
    }
  }

  if (missingDocs.length > 0) {
    const maxShow = 3;
    const shown = missingDocs.slice(0, maxShow).join(', ');
    const extra = missingDocs.length > maxShow
      ? ` ${language === 'pt' ? `e mais ${missingDocs.length - maxShow}` : `and ${missingDocs.length - maxShow} more`}`
      : '';
    toast.error(
      language === 'pt'
        ? `Documentos obrigatórios faltando: ${shown}${extra}`
        : `Required documents missing: ${shown}${extra}`,
    );
    return false;
  }

  return true;
}
