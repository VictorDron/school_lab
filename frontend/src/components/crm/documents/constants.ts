import { FileText, FileCheck, File, Image as ImageIcon } from 'lucide-react';

// Document type definition
export interface DocumentTypeDefinition {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  required?: boolean;
  perChild?: boolean;
}

export interface DocumentCategory {
  label: string;
  description: string;
  types: DocumentTypeDefinition[];
}

// Document type categories for better organization
export const documentCategories: Record<string, DocumentCategory> = {
  REQUIRED: {
    label: 'Documentos Obrigatórios',
    description: 'Documentos essenciais para o processo de admissão',
    types: [
      { value: 'ADMISSION_FORM', label: 'Formulário de Admissão', icon: FileCheck, required: true },
      { value: 'BIRTH_CERTIFICATE', label: 'Certidão de Nascimento', icon: FileText, required: true, perChild: true },
      { value: 'ID_DOCUMENT', label: 'RG/CPF dos Responsáveis', icon: FileText, required: true },
      { value: 'PROOF_OF_ADDRESS', label: 'Comprovante de Residência', icon: FileText, required: true },
    ],
  },
  ACADEMIC: {
    label: 'Documentos Acadêmicos',
    description: 'Histórico e registros escolares',
    types: [
      { value: 'SCHOOL_RECORDS', label: 'Histórico Escolar', icon: FileText, perChild: true },
      { value: 'TRANSFER_DECLARATION', label: 'Declaração de Transferência', icon: FileText, perChild: true },
      { value: 'REPORT_CARD', label: 'Boletim Escolar', icon: FileText, perChild: true },
    ],
  },
  MEDICAL: {
    label: 'Documentos Médicos',
    description: 'Informações de saúde do aluno',
    types: [
      { value: 'VACCINATION_CARD', label: 'Carteira de Vacinação', icon: FileText, perChild: true },
      { value: 'MEDICAL_REPORT', label: 'Laudo Médico', icon: FileText, perChild: true },
      { value: 'HEALTH_INSURANCE', label: 'Plano de Saúde', icon: FileText },
    ],
  },
  PHOTOS: {
    label: 'Fotos',
    description: 'Fotos para identificação',
    types: [
      { value: 'PHOTO_3X4', label: 'Foto 3x4', icon: ImageIcon, perChild: true },
      { value: 'PHOTO_FAMILY', label: 'Foto da Família', icon: ImageIcon },
    ],
  },
  OTHER: {
    label: 'Outros Documentos',
    description: 'Documentos complementares',
    types: [
      { value: 'RECOMMENDATION_LETTER', label: 'Carta de Recomendação', icon: FileText },
      { value: 'FINANCIAL_PROOF', label: 'Comprovante Financeiro', icon: FileText },
      { value: 'OTHER', label: 'Outro', icon: File },
    ],
  },
};

// Flatten all document types for easy lookup
export const allDocumentTypes = Object.values(documentCategories).flatMap((cat) => cat.types);

// Documents required to advance to each column (by slug)
export const documentsRequiredByColumnSlug: Record<string, string[]> = {
  FORM_RECEIVED: ['ADMISSION_FORM'],
  DOCUMENTS_PENDING: ['ADMISSION_FORM', 'BIRTH_CERTIFICATE', 'ID_DOCUMENT'],
  UNDER_ANALYSIS: ['ADMISSION_FORM', 'BIRTH_CERTIFICATE', 'ID_DOCUMENT', 'PROOF_OF_ADDRESS', 'SCHOOL_RECORDS'],
  APPROVED: ['ADMISSION_FORM', 'BIRTH_CERTIFICATE', 'ID_DOCUMENT', 'PROOF_OF_ADDRESS', 'SCHOOL_RECORDS', 'VACCINATION_CARD', 'PHOTO_3X4'],
};

// Enrollment document type labels (used in unified view)
export const enrollmentDocTypeLabels: Record<string, string> = {
  // Student
  STUDENT_ID: 'RG do Aluno',
  STUDENT_CPF: 'CPF do Aluno',
  BIRTH_CERTIFICATE: 'Certidão de Nascimento',
  VACCINATION_CARD: 'Carteira de Vacinação',
  HEALTH_PLAN_CARD: 'Carteira do Plano de Saúde',
  STUDENT_PHOTO: 'Foto 3x4 do Aluno',
  MEDICAL_CERTIFICATE: 'Atestado para Atividade Física',
  MEDICAL_REPORT: 'Laudo Médico',
  CUSTODY_AGREEMENT: 'Acordo de Guarda',
  SHARED_CUSTODY: 'Guarda Compartilhada',
  // Mother
  MOTHER_ID: 'RG da Mãe',
  MOTHER_CPF: 'CPF da Mãe',
  MOTHER_PROOF_OF_RESIDENCE: 'Comprovante de Residência (Mãe)',
  // Father
  FATHER_ID: 'RG do Pai',
  FATHER_CPF: 'CPF do Pai',
  FATHER_PROOF_OF_RESIDENCE: 'Comprovante de Residência (Pai)',
  // Financial Responsible - Individual
  FIN_RESP_ID: 'RG do Resp. Financeiro',
  FIN_RESP_CPF: 'CPF do Resp. Financeiro',
  FIN_RESP_PROOF_OF_RESIDENCE: 'Comprovante de Residência (Resp. Fin.)',
  // Financial Responsible - Company
  FIN_RESP_CNPJ_CARD: 'Cartão CNPJ',
  FIN_RESP_SOCIAL_CONTRACT: 'Contrato Social / Estatuto',
  FIN_RESP_COMMERCIAL_ADDRESS: 'Comprovante de Endereço Comercial',
  FIN_RESP_POWER_OF_ATTORNEY: 'Procuração',
  // School
  SCHOOL_DECLARATION: 'Declaração de Escolaridade',
  FINANCIAL_CLEARANCE: 'Declaração de Quitação Financeira',
  SCHOOL_HISTORY: 'Histórico Escolar',
  // Legacy / Generic
  GUARDIAN_ID: 'RG do Responsável',
  GUARDIAN_CPF: 'CPF do Responsável',
  PROOF_OF_ADDRESS: 'Comprovante de Residência',
  INCOME_PROOF: 'Comprovante de Renda',
  MARRIAGE_CERTIFICATE: 'Certidão de Casamento',
  SCHOOL_RECORDS: 'Registros Escolares',
  SCHOOL_TRANSCRIPT: 'Histórico Escolar',
  TRANSFER_DECLARATION: 'Declaração de Transferência',
  PHOTO_3X4: 'Foto 3x4',
  HEALTH_INSURANCE: 'Plano de Saúde',
  OTHER: 'Outro',
};

// Enrollment category labels
export const enrollmentCategoryLabels: Record<string, string> = {
  STUDENT: 'Aluno',
  MOTHER: 'Mae',
  FATHER: 'Pai',
  FINANCIAL_RESPONSIBLE: 'Resp. Financeiro',
  SCHOOL: 'Escola',
};
