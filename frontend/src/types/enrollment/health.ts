// Health-related interfaces

export interface HealthData {
  weight?: string;
  height?: string;
  bloodType?: string;
  medicalConditions: string[];
  medicalConditionsNotes?: string;
  hasHospitalizations: boolean;
  hospitalizationsNotes?: string;
  hasSeizures: boolean;
  seizuresNotes?: string;
  allergies: string[];
  allergiesNotes?: string;
  feverMedications: string[];
  feverMedicationOther?: string;
  painMedications: string[];
  painMedicationOther?: string;
  medicationRestrictions?: string;
  regularMedications?: string;
  hasEatingDisorder: boolean;
  eatingDisorderNotes?: string;
  additionalHealthInfo?: string;
}

export interface EmergencyContact {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
  isPrimary: boolean;
}

export interface HealthPlan {
  operator: string;
  beneficiaryCode: string;
  planType: string;
  preferredHospital: string;
}

export interface LeadChildHealth {
  id: string;
  leadId: string;
  childId: string;
  weight?: string;
  height?: string;
  bloodType?: string;
  medicalConditions: string[];
  medicalConditionsNotes?: string;
  hasHospitalizations: boolean;
  hospitalizationsNotes?: string;
  hasSeizures: boolean;
  seizuresNotes?: string;
  allergies: string[];
  allergiesNotes?: string;
  feverMedications: string[];
  feverMedicationOther?: string;
  painMedications: string[];
  painMedicationOther?: string;
  medicationRestrictions?: string;
  regularMedications?: string;
  hasEatingDisorder: boolean;
  eatingDisorderNotes?: string;
  additionalHealthInfo?: string;
}
