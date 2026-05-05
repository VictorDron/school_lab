import type {
  UseFormRegister,
  Control,
  UseFormWatch,
  UseFormSetValue,
  UseFormGetValues,
  FieldErrors,
  UseFieldArrayReturn,
} from 'react-hook-form';

// ---------------------------------------------------------------------------
// Form data types (moved from AdmissionFormPage.tsx)
// ---------------------------------------------------------------------------

export interface StudentFormData {
  studentType: string;
  currentGrade: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  nationality?: string;
  desiredGrade: string;
  primaryLanguage: string;
  otherLanguages: string[];
  educationHistory: {
    schoolName: string;
    country: string;
    city: string;
    gradesAttended: string;
  }[];
  additionalInfo: {
    hasPsychoEvaluation: string;
    psychoEvaluationDetails?: string;
    hasAcademicSupport: string;
    academicSupportDetails?: string;
    hasHealthIssues: string;
    healthIssuesDetails?: string;
    hasAdaptationDifficulty: string;
    adaptationDifficultyDetails?: string;
    otherRelevantInfo?: string;
  };
}

export interface AdmissionForm {
  numberOfStudents: number;
  students: StudentFormData[];
  student?: {
    studentType: string;
    currentGrade: string;
    fullName: string;
    dateOfBirth: string;
    gender: string;
    nationality?: string;
    desiredGrade: string;
  };
  father: {
    name: string;
    cpf?: string;
    email: string;
    phone: string;
  };
  mother: {
    name: string;
    cpf?: string;
    email: string;
    phone: string;
  };
  livesWith: string;
  guardianInfo?: string;
  notificationPreference?: 'FATHER' | 'MOTHER' | 'BOTH';
  address: {
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    country: string;
  };
  siblings: { name: string; cpf: string; dateOfBirth: string; grade: string }[];
  languages: {
    studentNative: string;
    studentOther: string;
    motherNative: string;
    fatherNative: string;
  };
  educationHistory: {
    schoolName: string;
    country: string;
    city: string;
    gradesAttended: string;
  }[];
  additionalInfo: {
    hasPsychoEvaluation: string;
    psychoEvaluationDetails?: string;
    hasAcademicSupport: string;
    academicSupportDetails?: string;
    hasHealthIssues: string;
    healthIssuesDetails?: string;
    hasAdaptationDifficulty: string;
    adaptationDifficultyDetails?: string;
    otherRelevantInfo?: string;
  };
  source: string;
}

export const defaultStudentData: StudentFormData = {
  studentType: 'NEW',
  currentGrade: '',
  fullName: '',
  dateOfBirth: '',
  gender: '',
  nationality: '',
  desiredGrade: '',
  primaryLanguage: '',
  otherLanguages: [''],
  educationHistory: [{ schoolName: '', country: 'BR', city: '', gradesAttended: '' }],
  additionalInfo: {
    hasPsychoEvaluation: 'NO',
    psychoEvaluationDetails: '',
    hasAcademicSupport: 'NO',
    academicSupportDetails: '',
    hasHealthIssues: 'NO',
    healthIssuesDetails: '',
    hasAdaptationDifficulty: 'NO',
    adaptationDifficultyDetails: '',
    otherRelevantInfo: '',
  },
};

// ---------------------------------------------------------------------------
// Constants (shared across orchestrator and steps)
// ---------------------------------------------------------------------------

export const SOURCE_LABELS: Record<string, { en: string; pt: string }> = {
  WEBSITE: { en: 'Website', pt: 'Website' },
  REFERRAL: { en: 'Referral', pt: 'Indicação' },
  SOCIAL_MEDIA: { en: 'Social Media', pt: 'Redes Sociais' },
  EVENT: { en: 'Event', pt: 'Evento' },
  ADVERTISEMENT: { en: 'Advertisement', pt: 'Publicidade' },
  WALK_IN: { en: 'Walk-in', pt: 'Visita Presencial' },
  PHONE: { en: 'Phone', pt: 'Telefone' },
  EMAIL: { en: 'Email', pt: 'Email' },
  OTHER: { en: 'Other', pt: 'Outro' },
};

// ---------------------------------------------------------------------------
// Base props shared by every step
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AdmissionStepBaseProps {
  register: UseFormRegister<any>;
  control: Control<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  errors: FieldErrors<any>;
  t: Record<string, string>;
  language: string;
  activeStudentTab: number;
  onTabSwitch: (tab: number) => void;
  watchedNumberOfStudents: number;
}

// ---------------------------------------------------------------------------
// Per-step prop interfaces
// ---------------------------------------------------------------------------

export interface AdmissionStudentStepProps extends AdmissionStepBaseProps {
  lockedFields: { desiredGrade: boolean; source: boolean };
  isFirstSchool: boolean;
  nationalityOptions: Array<{ value: string; label: string }>;
  gradeSelectOptions: Array<{ value: string; label: string; sublabel: string }>;
  handleNumberOfStudentsChange: (newCount: number) => void;
}

export interface AdmissionFamilyStepProps extends AdmissionStepBaseProps {
  livesWith: string;
  siblingFields: UseFieldArrayReturn<any, 'siblings'>['fields'];
  appendSibling: UseFieldArrayReturn<any, 'siblings'>['append'];
  removeSibling: UseFieldArrayReturn<any, 'siblings'>['remove'];
  isLoadingAddress: boolean;
  watchedCountry: string;
  watchedState: string;
  watchedCity: string;
  stateOptions: Array<{ value: string; label: string }>;
  cityOptions: Array<{ value: string; label: string }>;
  neighborhoodOptions: Array<{ value: string; label: string }>;
  countryOptions: Array<{ value: string; label: string }>;
}

export interface AdmissionEducationStepProps extends AdmissionStepBaseProps {
  languageOptions: Array<{ value: string; label: string }>;
  countryOptions: Array<{ value: string; label: string }>;
  getCityOptionsForIndex: (countryCode: string) => Array<{ value: string; label: string }>;
}

export interface AdmissionAdditionalStepProps extends AdmissionStepBaseProps {
  lockedFields: { desiredGrade: boolean; source: boolean };
  hasPsychoEvaluation: string;
  hasAcademicSupport: string;
  hasHealthIssues: string;
  hasAdaptationDifficulty: string;
}
