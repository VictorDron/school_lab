// Enrollment type unions / enums

export type EnrollmentFormStatus = 'NOT_STARTED' | 'LINK_SENT' | 'FORM_RECEIVED';

export type FinancialResponsibleType = 'FATHER' | 'MOTHER' | 'OTHER';

export type FinancialPersonType = 'INDIVIDUAL' | 'COMPANY';

export type DocumentCategory = 'STUDENT' | 'MOTHER' | 'FATHER' | 'FINANCIAL_RESPONSIBLE' | 'SCHOOL';

export type EnrollmentDocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
