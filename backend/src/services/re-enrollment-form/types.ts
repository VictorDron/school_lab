export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export interface SubmitFormData {
  confirmed?: boolean;
  declineReason?: string | null;
  health?: Record<string, any> | null;
  transport?: Record<string, any> | null;
  emergencyContacts?: Array<{
    name: string;
    phone: string;
    email?: string | null;
    relationship?: string | null;
    isPrimary?: boolean | null;
  }>;
  financialResponsible?: Record<string, any> | null;
  healthPlan?: Record<string, any> | null;
  parentUpdates?: Array<{ parentId: string; email: string; phone?: string }>;
  additionalResponsible?: { fullName: string; email: string; phone?: string; relationship?: string } | null;
  lgpdConsent: boolean;
  correctionNotes?: string | null;
}
