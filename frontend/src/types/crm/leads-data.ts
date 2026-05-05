import type { LeadSource, CommentType, DocumentRequestStatus } from './leads';

// Token & link response types
export interface TokenStatus {
  hasToken: boolean;
  isExpired: boolean;
  expiresAt: string | null;
  wasSubmitted: boolean;
  submittedAt: string | null;
}

export interface ApplicationLinkResponse {
  applicationLink: string;
  token: string;
  expiresAt: string;
  expiryHours: number;
}

// Document types
export interface LeadDocument {
  id: string;
  leadId: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: string;
  uploadedBy?: string;
  uploadedVia?: string;
  childId?: string;
}

export interface LeadDocumentRequest {
  id: string;
  leadId: string;
  documentType: string;
  isRequired: boolean;
  childId?: string;
  status: DocumentRequestStatus;
  requestedAt: string;
  receivedAt?: string;
  child?: { id: string; fullName: string };
}

// Comment & history types
export interface LeadComment {
  id: string;
  leadId: string;
  userId: string;
  content: string;
  type: CommentType;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; displayName: string; avatarUrl?: string };
}

export interface LeadHistory {
  id: string;
  leadId: string;
  action: string;
  details?: Record<string, any>;
  actorId?: string;
  createdAt: string;
}

// API request types
export interface LeadFilters {
  search?: string;
  columnId?: string;
  source?: LeadSource;
  flagged?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateLeadData {
  familyName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;
  numberOfChildren?: number;
  desiredGrades?: string[];
  source?: LeadSource;
  notes?: string;
  hasSiblingsAtSchool?: boolean;
  columnId?: string;
}

export interface UpdateLeadData {
  familyName?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  secondaryContactName?: string;
  secondaryContactEmail?: string;
  secondaryContactPhone?: string;
  numberOfChildren?: number;
  desiredGrades?: string[];
  source?: LeadSource;
  notes?: string;
  hasSiblingsAtSchool?: boolean;
  notificationPreference?: 'PRIMARY' | 'MOTHER' | 'FATHER' | 'BOTH';
}

export interface CreateChildData {
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  desiredGrade?: string;
  currentSchool?: string;
  specialNeeds?: string;
  primaryLanguage?: string;
  relationship?: 'STUDENT' | 'SIBLING';
  isApplicant?: boolean;
}

export interface UpdateChildData {
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  desiredGrade?: string;
  currentSchool?: string;
  specialNeeds?: string;
  primaryLanguage?: string;
}

export interface CreateCommentData {
  content: string;
  type?: CommentType;
}

// Stats types
export interface LeadStats {
  total: number;
  flagged: number;
  thisMonth: number;
  thisWeek: number;
  byColumn: { columnId: string; column?: import('./contracts').KanbanColumn; count: number }[];
  bySource: { source: LeadSource; count: number }[];
}

export interface PipelineStats {
  pipeline: {
    columnId: string;
    name: string;
    slug: string;
    color: string;
    isFinal: boolean;
    count: number;
  }[];
  conversions: {
    from: { columnId: string; name: string };
    to: { columnId: string; name: string };
    rate: number;
  }[];
  total: number;
}
