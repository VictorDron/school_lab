import { LeadSource, NotificationPreference } from '@prisma/client';

export interface LeadFilters {
  columnId?: string;
  source?: LeadSource;
  flagged?: boolean;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface CreateLeadData {
  familyName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;
  secondaryContactName?: string;
  secondaryContactEmail?: string;
  secondaryContactPhone?: string;
  numberOfChildren?: number;
  desiredGrades?: string[];
  source?: LeadSource;
  notes?: string;
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
  notificationPreference?: NotificationPreference;
}

export interface CreateChildData {
  fullName: string;
  dateOfBirth: string;
  gender?: string;
  nationality?: string;
  desiredGrade: string;
  currentSchool?: string;
  specialNeeds?: string;
  primaryLanguage?: string;
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
