import type { DocumentCategory, EnrollmentDocumentStatus } from './enums';

// Enrollment document types

export interface EnrollmentDocument {
  id: string;
  leadId: string;
  documentType: string;
  category: DocumentCategory;
  childId?: string | null;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  includesOtherDocs: string[];
  status: EnrollmentDocumentStatus;
  rejectionReason?: string;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface DocumentTypeConfig {
  type: string;
  category: DocumentCategory;
  labelPt: string;
  labelEn: string;
  required: boolean;
  canInclude?: string[];
  notePt?: string;
  noteEn?: string;
  conditionalOn?: 'hasHealthConditions';
  personTypeFilter?: 'INDIVIDUAL' | 'COMPANY';
}

export const DOCUMENT_TYPES: DocumentTypeConfig[] = [
  // Student documents
  { type: 'STUDENT_ID', category: 'STUDENT', labelPt: 'RG do Aluno', labelEn: 'Student ID', required: true, canInclude: ['STUDENT_CPF'] },
  { type: 'STUDENT_CPF', category: 'STUDENT', labelPt: 'CPF do Aluno', labelEn: 'Student CPF', required: true },
  { type: 'BIRTH_CERTIFICATE', category: 'STUDENT', labelPt: 'Certidão de Nascimento', labelEn: 'Birth Certificate', required: true },
  { type: 'VACCINATION_CARD', category: 'STUDENT', labelPt: 'Caderneta de Vacinação', labelEn: 'Vaccination Card', required: true },
  { type: 'HEALTH_PLAN_CARD', category: 'STUDENT', labelPt: 'Carteira do Plano de Saúde', labelEn: 'Health Plan Card', required: false },
  { type: 'STUDENT_PHOTO', category: 'STUDENT', labelPt: 'Foto 3x4 do Aluno', labelEn: 'Student Photo 3x4', required: true },
  {
    type: 'MEDICAL_CERTIFICATE',
    category: 'STUDENT',
    labelPt: 'Atestado para Prática de Atividade Física',
    labelEn: 'Medical Certificate for Physical Activity',
    required: false,
    notePt: 'Pode ser entregue em até 30 dias após a matrícula',
    noteEn: 'Can be submitted up to 30 days after enrollment'
  },
  {
    type: 'MEDICAL_REPORT',
    category: 'STUDENT',
    labelPt: 'Laudo Médico',
    labelEn: 'Medical Report',
    required: false,
    conditionalOn: 'hasHealthConditions',
    notePt: 'Apenas se houver condições médicas especiais informadas',
    noteEn: 'Only if special medical conditions were reported'
  },

  // Mother documents
  { type: 'MOTHER_ID', category: 'MOTHER', labelPt: 'RG da Mãe', labelEn: 'Mother ID', required: true, canInclude: ['MOTHER_CPF'] },
  { type: 'MOTHER_CPF', category: 'MOTHER', labelPt: 'CPF da Mãe', labelEn: 'Mother CPF', required: true },
  { type: 'MOTHER_PROOF_OF_RESIDENCE', category: 'MOTHER', labelPt: 'Comprovante de Residência (Mãe)', labelEn: 'Proof of Residence (Mother)', required: true },

  // Father documents
  { type: 'FATHER_ID', category: 'FATHER', labelPt: 'RG do Pai', labelEn: 'Father ID', required: true, canInclude: ['FATHER_CPF'] },
  { type: 'FATHER_CPF', category: 'FATHER', labelPt: 'CPF do Pai', labelEn: 'Father CPF', required: true },
  { type: 'FATHER_PROOF_OF_RESIDENCE', category: 'FATHER', labelPt: 'Comprovante de Residência (Pai)', labelEn: 'Proof of Residence (Father)', required: true },

  // Financial responsible documents - Pessoa Física (if different from parents)
  { type: 'FIN_RESP_ID', category: 'FINANCIAL_RESPONSIBLE', labelPt: 'RG do Responsável Financeiro', labelEn: 'Financial Responsible ID', required: true, canInclude: ['FIN_RESP_CPF'], personTypeFilter: 'INDIVIDUAL' },
  { type: 'FIN_RESP_CPF', category: 'FINANCIAL_RESPONSIBLE', labelPt: 'CPF do Responsável Financeiro', labelEn: 'Financial Responsible CPF', required: true, personTypeFilter: 'INDIVIDUAL' },
  { type: 'FIN_RESP_PROOF_OF_RESIDENCE', category: 'FINANCIAL_RESPONSIBLE', labelPt: 'Comprovante de Residência (Resp. Financeiro)', labelEn: 'Proof of Residence (Fin. Responsible)', required: true, personTypeFilter: 'INDIVIDUAL' },

  // Financial responsible documents - Pessoa Jurídica
  { type: 'FIN_RESP_CNPJ_CARD', category: 'FINANCIAL_RESPONSIBLE', labelPt: 'Cartão CNPJ', labelEn: 'CNPJ Card', required: true, personTypeFilter: 'COMPANY' },
  { type: 'FIN_RESP_SOCIAL_CONTRACT', category: 'FINANCIAL_RESPONSIBLE', labelPt: 'Contrato Social / Estatuto', labelEn: 'Social Contract / Bylaws', required: true, personTypeFilter: 'COMPANY' },
  { type: 'FIN_RESP_COMMERCIAL_ADDRESS', category: 'FINANCIAL_RESPONSIBLE', labelPt: 'Comprovante de Endereço Comercial', labelEn: 'Commercial Proof of Address', required: true, personTypeFilter: 'COMPANY' },
  { type: 'FIN_RESP_POWER_OF_ATTORNEY', category: 'FINANCIAL_RESPONSIBLE', labelPt: 'Procuração', labelEn: 'Power of Attorney', required: false, personTypeFilter: 'COMPANY', notePt: 'Apenas se o representante não for sócio', noteEn: 'Only if the representative is not a partner' },

  // School documents
  { type: 'SCHOOL_DECLARATION', category: 'SCHOOL', labelPt: 'Declaração de Escolaridade', labelEn: 'School Declaration', required: true },
  { type: 'FINANCIAL_CLEARANCE', category: 'SCHOOL', labelPt: 'Declaração de Quitação Financeira', labelEn: 'Financial Clearance', required: true },
  {
    type: 'SCHOOL_HISTORY',
    category: 'SCHOOL',
    labelPt: 'Histórico Escolar',
    labelEn: 'School History',
    required: false,
    notePt: 'Pode ser enviado em até 30 dias após a matrícula',
    noteEn: 'Can be submitted up to 30 days after enrollment'
  },

  // Optional documents
  { type: 'CUSTODY_AGREEMENT', category: 'STUDENT', labelPt: 'Acordo de Guarda', labelEn: 'Custody Agreement', required: false },
  { type: 'SHARED_CUSTODY', category: 'STUDENT', labelPt: 'Guarda Compartilhada', labelEn: 'Shared Custody', required: false },
  { type: 'OTHER', category: 'STUDENT', labelPt: 'Outros Documentos', labelEn: 'Other Documents', required: false },
];

// Helper function to get documents by category
export function getDocumentsByCategory(category: DocumentCategory): DocumentTypeConfig[] {
  return DOCUMENT_TYPES.filter(d => d.category === category);
}

// Helper function to get required documents
export function getRequiredDocuments(): DocumentTypeConfig[] {
  return DOCUMENT_TYPES.filter(d => d.required);
}

// Helper function to get financial responsible docs filtered by person type
export function getFinancialResponsibleDocs(personType: 'INDIVIDUAL' | 'COMPANY'): DocumentTypeConfig[] {
  return DOCUMENT_TYPES.filter(
    d => d.category === 'FINANCIAL_RESPONSIBLE' && d.personTypeFilter === personType
  );
}

// Helper function to check if a document type can include another
export function canIncludeDocument(mainType: string, includedType: string): boolean {
  const config = DOCUMENT_TYPES.find(d => d.type === mainType);
  return config?.canInclude?.includes(includedType) || false;
}
