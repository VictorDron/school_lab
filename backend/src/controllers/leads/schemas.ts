import { LeadSource, NotificationPreference } from '@prisma/client';
import { z } from 'zod';

export const createLeadSchema = z.object({
  familyName: z.string().min(2),
  primaryContactName: z.string().min(2),
  primaryContactEmail: z.string().email(),
  primaryContactPhone: z.string().optional(),
  secondaryContactName: z.string().optional(),
  secondaryContactEmail: z.string().email().optional().or(z.literal('')),
  secondaryContactPhone: z.string().optional(),
  numberOfChildren: z.number().min(1).max(10).default(1),
  desiredGrades: z.array(z.string()).max(10).default([]),
  source: z.nativeEnum(LeadSource).default('OTHER'),
  notes: z.string().optional(),
  columnId: z.string().optional(),
  force: z.boolean().optional(),
});

export const updateLeadSchema = z.object({
  familyName: z.string().min(2).optional(),
  primaryContactName: z.string().min(2).optional(),
  primaryContactEmail: z.string().email().optional(),
  primaryContactPhone: z.string().optional(),
  secondaryContactName: z.string().optional(),
  secondaryContactEmail: z.string().email().optional().or(z.literal('')),
  secondaryContactPhone: z.string().optional(),
  numberOfChildren: z.number().min(1).max(10).optional(),
  desiredGrades: z.array(z.string()).max(10).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  notes: z.string().optional(),
  hasSiblingsAtSchool: z.boolean().optional(),
  notificationPreference: z.nativeEnum(NotificationPreference).optional(),
});

export const updateChildSchema = z.object({
  fullName: z.string().min(2).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  desiredGrade: z.string().optional(),
  currentSchool: z.string().optional(),
  specialNeeds: z.string().optional(),
  primaryLanguage: z.string().optional(),
});

export const updateParentSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  occupation: z.string().optional(),
  nativeLanguage: z.string().optional(),
  idNumber: z.string().optional(),
  idIssueDate: z.string().optional(),
  idIssuer: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  maritalStatus: z.string().optional(),
  education: z.string().optional(),
  religion: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
});

export const updateAddressSchema = z.object({
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  zipCode: z.string().optional(),
});

export const updateChildHealthSchema = z.object({
  weight: z.string().optional(),
  height: z.string().optional(),
  bloodType: z.string().optional(),
  medicalConditions: z.array(z.string()).optional(),
  medicalConditionsNotes: z.string().optional(),
  hasHospitalizations: z.boolean().optional(),
  hospitalizationsNotes: z.string().optional(),
  hasSeizures: z.boolean().optional(),
  seizuresNotes: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  allergiesNotes: z.string().optional(),
  feverMedications: z.array(z.string()).optional(),
  painMedications: z.array(z.string()).optional(),
  medicationRestrictions: z.string().optional(),
  regularMedications: z.string().optional(),
  hasEatingDisorder: z.boolean().optional(),
  eatingDisorderNotes: z.string().optional(),
  additionalHealthInfo: z.string().optional(),
});

export const updateChildTransportSchema = z.object({
  dropoffPickupPersons: z.array(z.string()).optional(),
  transportMethod: z.string().optional(),
  transportMethodOther: z.string().optional(),
  familyVehicles: z.any().optional(),
  canLeaveAlone: z.boolean().optional(),
  isAthlete: z.boolean().optional(),
  athleteNotes: z.string().optional(),
  hasLegalRestrictions: z.boolean().optional(),
  legalRestrictionsNotes: z.string().optional(),
  authorizedPersons: z.any().optional(),
});

export const updateEmergencyContactSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().optional(),
  relationship: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const createEmergencyContactSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  email: z.string().optional(),
  relationship: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const updateFinancialResponsibleSchema = z.object({
  responsibleType: z.string().optional(),
  relationship: z.string().optional(),
  personType: z.string().optional(),
  fullName: z.string().optional(),
  cpf: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  cnpj: z.string().optional(),
  tradeName: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  zipCode: z.string().optional(),
});

export const updateHealthPlanSchema = z.object({
  operator: z.string().optional(),
  beneficiaryCode: z.string().optional(),
  planType: z.string().optional(),
  preferredHospital: z.string().optional(),
});
