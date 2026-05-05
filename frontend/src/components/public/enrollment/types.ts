import type {
  UseFormRegister,
  Control,
  UseFormWatch,
  UseFormSetValue,
  UseFormGetValues,
  FieldErrors,
  UseFieldArrayReturn,
} from 'react-hook-form';
import type {
  DocumentCategory,
  DocumentTypeConfig,
  EnrollmentDocument,
  FinancialResponsible,
} from '@/types/enrollment';

// ---------------------------------------------------------------------------
// Base props shared by every step
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EnrollmentStepBaseProps {
  register: UseFormRegister<any>;
  control: Control<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  errors: FieldErrors<any>;
  language: string;
  fieldErrors: Record<string, string>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

// ---------------------------------------------------------------------------
// Multi-child props (used by health, transport, documents, student steps)
// ---------------------------------------------------------------------------

export interface EnrollmentMultiChildProps {
  enrollmentStudents: any[];
  activeStudentTab: number;
  onTabSwitch: (tab: number) => void;
}

// ---------------------------------------------------------------------------
// Per-step prop interfaces
// ---------------------------------------------------------------------------

export interface EnrollmentTermsStepProps extends EnrollmentStepBaseProps {}

export interface EnrollmentFinancialStepProps extends EnrollmentStepBaseProps {
  watchFinancialResponsible: FinancialResponsible | undefined;
  enrollmentData: any;
  token: string | null;
  // Document rendering dependencies (financial step renders doc rows inline)
  uploadProgress: Record<string, { progress: number; fileName: string }>;
  setUploadProgress: React.Dispatch<React.SetStateAction<Record<string, { progress: number; fileName: string }>>>;
  optimisticIncludes: Record<string, boolean>;
  setOptimisticIncludes: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  uploadDocMutation: any;
  deleteDocMutation: any;
  toggleIncludesMutation: any;
}

export interface EnrollmentDocumentsStepProps extends EnrollmentStepBaseProps, EnrollmentMultiChildProps {
  enrollmentData: any;
  token: string | null;
  watchFinancialResponsible: FinancialResponsible | undefined;
  uploadProgress: Record<string, { progress: number; fileName: string }>;
  setUploadProgress: React.Dispatch<React.SetStateAction<Record<string, { progress: number; fileName: string }>>>;
  optimisticIncludes: Record<string, boolean>;
  setOptimisticIncludes: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  uploadDocMutation: any;
  deleteDocMutation: any;
  toggleIncludesMutation: any;
}

export interface EnrollmentHealthStepProps extends EnrollmentStepBaseProps, EnrollmentMultiChildProps {
  watchHealth: any;
  emergencyContactFields: UseFieldArrayReturn<any, 'emergencyContacts'>['fields'];
  appendEmergencyContact: UseFieldArrayReturn<any, 'emergencyContacts'>['append'];
  removeEmergencyContact: UseFieldArrayReturn<any, 'emergencyContacts'>['remove'];
  onMedicalConditionChange: (value: string, checked: boolean) => void;
  onAllergyChange: (value: string, checked: boolean) => void;
  onFeverMedicationChange: (value: string, checked: boolean) => void;
  onPainMedicationChange: (value: string, checked: boolean) => void;
  onCopyFromSibling: (sourceTabIndex: number) => void;
}

export interface EnrollmentTransportStepProps extends EnrollmentStepBaseProps, EnrollmentMultiChildProps {
  watchTransport: any;
  familyVehicleFields: UseFieldArrayReturn<any, 'transport.familyVehicles'>['fields'];
  appendFamilyVehicle: UseFieldArrayReturn<any, 'transport.familyVehicles'>['append'];
  removeFamilyVehicle: UseFieldArrayReturn<any, 'transport.familyVehicles'>['remove'];
  authorizedPersonFields: UseFieldArrayReturn<any, 'authorizedPersons'>['fields'];
  appendAuthorizedPerson: UseFieldArrayReturn<any, 'authorizedPersons'>['append'];
  removeAuthorizedPerson: UseFieldArrayReturn<any, 'authorizedPersons'>['remove'];
  onDropoffPersonChange: (personType: string, checked: boolean) => void;
  onCopyFromSibling: (sourceTabIndex: number) => void;
}

export interface EnrollmentStudentStepProps extends EnrollmentStepBaseProps, EnrollmentMultiChildProps {
  enrollmentData: any;
  activeStudent: any;
  parentsSeparateAddresses: boolean;
  onSeparateAddressToggle: (separate: boolean) => void;
  // Father address
  watchFatherCountry: string | undefined;
  watchFatherState: string | undefined;
  watchFatherCity: string | undefined;
  watchMotherCountry: string | undefined;
  watchMotherState: string | undefined;
  watchMotherCity: string | undefined;
  isFatherAddressLoading: boolean;
  isMotherAddressLoading: boolean;
  countryOptions: Array<{ value: string; label: string }>;
  nationalityOptions: Array<{ value: string; label: string }>;
  stateOptions: Array<{ value: string; label: string }>;
  fatherCityOptions: Array<{ value: string; label: string }>;
  fatherNeighborhoodOptions: Array<{ value: string; label: string }>;
  motherCityOptions: Array<{ value: string; label: string }>;
  motherNeighborhoodOptions: Array<{ value: string; label: string }>;
}
