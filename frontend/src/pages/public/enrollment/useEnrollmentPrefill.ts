import { useEffect, useRef } from 'react';
import type { UseFormSetValue } from 'react-hook-form';
import type {
  AthleteSchedule,
  AuthorizedPerson,
  EnrollmentPrefilledData,
  HealthData,
  Vehicle,
} from '@/types/enrollment';
import { ADDRESS_FIELDS } from './constants';
import type { EnrollmentForm, StudentEnrollmentData } from './types';

interface UseEnrollmentPrefillParams {
  enrollmentData: EnrollmentPrefilledData | undefined;
  /**
   * Server-side draft checkpoint. When present, prefill is skipped because
   * the draft itself already restored the form values via reset().
   */
  serverDraft: unknown;
  setValue: UseFormSetValue<EnrollmentForm>;
  setParentsSeparateAddresses: (value: boolean) => void;
}

/**
 * Populates the enrollment wizard form once admission data arrives from
 * the server. Runs exactly once per mount via a ref guard so re-renders
 * triggered by user typing never overwrite their edits. No-ops when a
 * server draft is present (the draft hook handles that case via reset).
 */
export function useEnrollmentPrefill({
  enrollmentData,
  serverDraft,
  setValue,
  setParentsSeparateAddresses,
}: UseEnrollmentPrefillParams): void {
  const hasPreFilled = useRef(false);

  useEffect(() => {
    if (enrollmentData && !serverDraft && !hasPreFilled.current) {
      hasPreFilled.current = true;
      // Pre-fill student desired grade (from first student or legacy)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const students = (enrollmentData as any).students || [];
      const primaryStudent = students[0] || enrollmentData.student;
      if (primaryStudent?.desiredGrade) {
        setValue('student.desiredGrade', primaryStudent.desiredGrade);
      }

      // Build per-student enrollment data if multiple students
      if (students.length > 1) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const studentsEnrollmentData: StudentEnrollmentData[] = students.map((s: any) => ({
          childId: s.id || '',
          desiredGrade: s.desiredGrade || '',
          enrollmentInfo: s.enrollmentInfo || {
            academicCalendar: '', campus: '', course: '', module: '', classGroup: '',
            personType: 'INDIVIDUAL', studentCpf: '', studentIdNumber: '', studentIdIssueDate: '', studentIdIssuer: '',
          },
          health: s.childHealth ? Object.fromEntries(
            Object.entries(s.childHealth).filter(([key]) => !['id', 'leadId', 'childId'].includes(key))
          ) as unknown as HealthData : {
            weight: '', height: '', bloodType: '', medicalConditions: [], medicalConditionsNotes: '',
            hasHospitalizations: false, hospitalizationsNotes: '', hasSeizures: false, seizuresNotes: '',
            allergies: [], allergiesNotes: '', feverMedications: [], feverMedicationOther: '',
            painMedications: [], painMedicationOther: '', medicationRestrictions: '', regularMedications: '',
            hasEatingDisorder: false, eatingDisorderNotes: '', additionalHealthInfo: '',
          },
          transport: s.childTransport ? {
            dropoffPickupPersons: (s.childTransport.dropoffPickupPersons as string[]) || [],
            dropoffPickupOther: s.childTransport.dropoffPickupOther || '',
            transportMethod: s.childTransport.transportMethod || '',
            transportMethodOther: s.childTransport.transportMethodOther || '',
            familyVehicles: (s.childTransport.familyVehicles as Vehicle[]) || [],
            canLeaveAlone: s.childTransport.canLeaveAlone || false,
            isAthlete: s.childTransport.isAthlete || false,
            athleteSchedule: s.childTransport.athleteSchedule as AthleteSchedule | undefined,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            athleteNotes: (s.childTransport as any).athleteNotes || '',
            schoolBusCompany: s.childTransport.schoolBusCompany || '',
            schoolBusContactName: s.childTransport.schoolBusContactName || '',
            schoolBusContactPhone: s.childTransport.schoolBusContactPhone || '',
            schoolBusContactEmail: s.childTransport.schoolBusContactEmail || '',
            hasLegalRestrictions: s.childTransport.hasLegalRestrictions || false,
            legalRestrictionsNotes: s.childTransport.legalRestrictionsNotes || '',
            allowThirdPartyPickup: s.childTransport.allowThirdPartyPickup || false,
            authorizedPersons: (s.childTransport.authorizedPersons as AuthorizedPerson[]) || [],
          } : {
            dropoffPickupPersons: [], dropoffPickupOther: '', transportMethod: '', transportMethodOther: '',
            familyVehicles: [], canLeaveAlone: false, isAthlete: false, athleteNotes: '', schoolBusCompany: '',
            schoolBusContactName: '', schoolBusContactPhone: '', schoolBusContactEmail: '',
            hasLegalRestrictions: false, legalRestrictionsNotes: '', allowThirdPartyPickup: false, authorizedPersons: [],
          },
          authorizedPersons: s.childTransport?.authorizedPersons
            ? (s.childTransport.authorizedPersons as AuthorizedPerson[])
            : [],
        }));
        setValue('studentsEnrollment', studentsEnrollmentData);
      }

      // Pre-fill parent updates
      if (enrollmentData.father) {
        setValue('fatherUpdates.email', enrollmentData.father.email || '');
        setValue('fatherUpdates.phone', enrollmentData.father.phone || '');
        setValue('fatherUpdates.cpf', enrollmentData.father.cpf || '');
        setValue('fatherUpdates.idNumber', enrollmentData.father.idNumber || '');
        setValue('fatherUpdates.idIssueDate', enrollmentData.father.idIssueDate || '');
        setValue('fatherUpdates.idIssuer', enrollmentData.father.idIssuer || '');
        setValue('fatherUpdates.dateOfBirth', enrollmentData.father.dateOfBirth || '');
        setValue('fatherUpdates.occupation', enrollmentData.father.occupation || '');
        setValue('fatherUpdates.education', enrollmentData.father.education || '');
        setValue('fatherUpdates.religion', enrollmentData.father.religion || '');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue('fatherUpdates.nationality', (enrollmentData.father as any).nationality || '');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue('fatherUpdates.maritalStatus', (enrollmentData.father as any).maritalStatus || '');
        if (enrollmentData.father.address) {
          setValue('fatherUpdates.address.zipCode', enrollmentData.father.address.zipCode || '');
          setValue('fatherUpdates.address.country', enrollmentData.father.address.country || '');
          setValue('fatherUpdates.address.state', enrollmentData.father.address.state || '');
          setValue('fatherUpdates.address.city', enrollmentData.father.address.city || '');
          setValue('fatherUpdates.address.neighborhood', enrollmentData.father.address.neighborhood || '');
          setValue('fatherUpdates.address.street', enrollmentData.father.address.street || '');
          setValue('fatherUpdates.address.number', enrollmentData.father.address.number || '');
          setValue('fatherUpdates.address.complement', enrollmentData.father.address.complement || '');
        }
      }
      if (enrollmentData.mother) {
        setValue('motherUpdates.email', enrollmentData.mother.email || '');
        setValue('motherUpdates.phone', enrollmentData.mother.phone || '');
        setValue('motherUpdates.cpf', enrollmentData.mother.cpf || '');
        setValue('motherUpdates.idNumber', enrollmentData.mother.idNumber || '');
        setValue('motherUpdates.idIssueDate', enrollmentData.mother.idIssueDate || '');
        setValue('motherUpdates.idIssuer', enrollmentData.mother.idIssuer || '');
        setValue('motherUpdates.dateOfBirth', enrollmentData.mother.dateOfBirth || '');
        setValue('motherUpdates.occupation', enrollmentData.mother.occupation || '');
        setValue('motherUpdates.education', enrollmentData.mother.education || '');
        setValue('motherUpdates.religion', enrollmentData.mother.religion || '');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue('motherUpdates.nationality', (enrollmentData.mother as any).nationality || '');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue('motherUpdates.maritalStatus', (enrollmentData.mother as any).maritalStatus || '');
        if (enrollmentData.mother.address) {
          setValue('motherUpdates.address.zipCode', enrollmentData.mother.address.zipCode || '');
          setValue('motherUpdates.address.country', enrollmentData.mother.address.country || '');
          setValue('motherUpdates.address.state', enrollmentData.mother.address.state || '');
          setValue('motherUpdates.address.city', enrollmentData.mother.address.city || '');
          setValue('motherUpdates.address.neighborhood', enrollmentData.mother.address.neighborhood || '');
          setValue('motherUpdates.address.street', enrollmentData.mother.address.street || '');
          setValue('motherUpdates.address.number', enrollmentData.mother.address.number || '');
          setValue('motherUpdates.address.complement', enrollmentData.mother.address.complement || '');
        }
      }

      // Detect if parents have separate addresses
      if (enrollmentData.mother?.sameAddressAsOtherParent) {
        // Mother explicitly marked as same address -> shared
        setParentsSeparateAddresses(false);
        setValue('motherUpdates.sameAddressAsOtherParent', true);
      } else if (enrollmentData.father?.address && enrollmentData.mother?.address) {
        // Both have addresses - check if they differ
        const fa = enrollmentData.father.address;
        const ma = enrollmentData.mother.address;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const differ = ADDRESS_FIELDS.some((f) => (fa as any)[f] !== (ma as any)[f]);
        setParentsSeparateAddresses(differ);
        setValue('motherUpdates.sameAddressAsOtherParent', !differ);
      } else {
        // Default: shared address
        setParentsSeparateAddresses(false);
        setValue('motherUpdates.sameAddressAsOtherParent', true);
      }

      // Pre-fill enrollment info if exists
      if (enrollmentData.enrollmentInfo) {
        Object.entries(enrollmentData.enrollmentInfo).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(`enrollmentInfo.${key}` as any, value);
          }
        });
      }

      // Pre-fill health data if exists
      if (enrollmentData.childHealth) {
        Object.entries(enrollmentData.childHealth).forEach(([key, value]) => {
          if (value !== undefined && value !== null && key !== 'id' && key !== 'leadId' && key !== 'childId') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(`health.${key}` as any, value);
          }
        });
      }

      // Pre-fill health plan if exists
      if (enrollmentData.healthPlan) {
        Object.entries(enrollmentData.healthPlan).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(`healthPlan.${key}` as any, value);
          }
        });
      }

      // Pre-fill transport if exists
      if (enrollmentData.transport) {
        Object.entries(enrollmentData.transport).forEach(([key, value]) => {
          if (value !== undefined && value !== null && key !== 'authorizedPersons') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(`transport.${key}` as any, value);
          }
        });
        if (enrollmentData.transport.authorizedPersons) {
          setValue('authorizedPersons', enrollmentData.transport.authorizedPersons);
        }
      }

      // Pre-fill financial responsible if exists
      if (enrollmentData.financialResponsible) {
        Object.entries(enrollmentData.financialResponsible).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(`financialResponsible.${key}` as any, value);
          }
        });
      }

      // Pre-fill emergency contacts if exist
      if (enrollmentData.emergencyContacts.length > 0) {
        setValue('emergencyContacts', enrollmentData.emergencyContacts);
      }
    }
  }, [enrollmentData, serverDraft, setValue, setParentsSeparateAddresses]);
}
