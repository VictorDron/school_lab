import {
  Settings,
  User,
  Heart,
  Car,
  CreditCard,
  FileUp,
  FileCheck,
} from 'lucide-react';
import { ENROLLMENT_STEPS } from '@/types/enrollment';
import type { StepDef } from '@/components/public/shared';

export const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const STORAGE_KEY = 'enrollment_form_draft';

/** Draft expires after 72 hours so a stale localStorage entry can't haunt the wizard. */
export const DRAFT_EXPIRY_HOURS = 72;

/** Maps the string icon names declared in ENROLLMENT_STEPS to their lucide components. */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Settings,
  User,
  Heart,
  Car,
  CreditCard,
  FileUp,
  FileCheck,
};

/** Steps with their string icon names resolved to actual components for StepIndicator. */
export const RESOLVED_STEPS: StepDef[] = ENROLLMENT_STEPS.map((s) => ({
  id: s.id,
  icon: ICON_MAP[s.icon] || Settings,
  labelPt: s.labelPt,
  labelEn: s.labelEn,
}));

/** Parent address fields kept in sync between father and mother when sharing address. */
export const ADDRESS_FIELDS = [
  'country',
  'zipCode',
  'state',
  'city',
  'neighborhood',
  'street',
  'number',
  'complement',
] as const;

const emptyAddress = {
  zipCode: '',
  country: '',
  state: '',
  city: '',
  neighborhood: '',
  street: '',
  number: '',
  complement: '',
};

const emptyParent = {
  email: '',
  phone: '',
  cpf: '',
  occupation: '',
  idNumber: '',
  idIssueDate: '',
  idIssuer: '',
  dateOfBirth: '',
  education: '',
  religion: '',
  nationality: '',
  maritalStatus: '',
  address: emptyAddress,
};

/**
 * Initial values for the enrollment form. Keeping it as a separate constant
 * declutters the page component and ensures every field is initialised so
 * react-hook-form does not flip between controlled/uncontrolled.
 */
export const ENROLLMENT_FORM_DEFAULTS = {
  enrollmentInfo: {
    academicCalendar: '',
    campus: '',
    course: '',
    module: '',
    classGroup: '',
    personType: 'INDIVIDUAL',
    studentCpf: '',
    studentIdNumber: '',
    studentIdIssueDate: '',
    studentIdIssuer: '',
  },
  student: {
    desiredGrade: '',
  },
  studentsEnrollment: [],
  fatherUpdates: emptyParent,
  motherUpdates: emptyParent,
  health: {
    weight: '',
    height: '',
    bloodType: '',
    medicalConditions: [],
    medicalConditionsNotes: '',
    hasHospitalizations: false,
    hospitalizationsNotes: '',
    hasSeizures: false,
    seizuresNotes: '',
    allergies: [],
    allergiesNotes: '',
    feverMedications: [],
    feverMedicationOther: '',
    painMedications: [],
    painMedicationOther: '',
    medicationRestrictions: '',
    regularMedications: '',
    hasEatingDisorder: false,
    eatingDisorderNotes: '',
    additionalHealthInfo: '',
  },
  emergencyContacts: [{ name: '', phone: '', email: '', relationship: '', isPrimary: true }],
  healthPlan: {
    operator: '',
    beneficiaryCode: '',
    planType: '',
    preferredHospital: '',
  },
  transport: {
    dropoffPickupPersons: [],
    transportMethod: 'CAR',
    transportMethodOther: '',
    familyVehicles: [],
    canLeaveAlone: false,
    isAthlete: false,
    athleteSchedule: {},
    athleteNotes: '',
    hasLegalRestrictions: false,
    legalRestrictionsNotes: '',
  },
  financialResponsible: {
    responsibleType: 'FATHER',
    relationship: '',
    personType: 'INDIVIDUAL',
    fullName: '',
    cpf: '',
    email: '',
    phone: '',
    companyName: '',
    cnpj: '',
    tradeName: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    address: {},
  },
  authorizedPersons: [],
  termsAccepted: false,
};
