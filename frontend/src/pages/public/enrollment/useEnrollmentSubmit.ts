import { useCallback, useState } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { UseFormGetValues } from 'react-hook-form';
import type { EnrollmentFormData } from '@/types/enrollment';
import { ADDRESS_FIELDS } from './constants';
import type { EnrollmentForm } from './types';

interface SubmitResponse {
  success: boolean;
  data: { leadCode: string };
  error?: string;
  code?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SubmitMutation = UseMutationResult<SubmitResponse, any, EnrollmentFormData, unknown>;

interface UseEnrollmentSubmitParams {
  token: string | null;
  getValues: UseFormGetValues<EnrollmentForm>;
  activeStudentTab: number;
  parentsSeparateAddresses: boolean;
  submitMutation: SubmitMutation;
  markSubmitted: () => void;
  setIsSuccess: (value: boolean) => void;
}

interface UseEnrollmentSubmitReturn {
  /**
   * RHF onSubmit handler. Sanitizes the wizard payload (multi-child sync,
   * shared address copy, array defaults), calls the submit mutation, and
   * flips success state on completion. Errors are intentionally swallowed:
   * the mutation hook's onError already surfaces a toast.
   */
  onSubmit: (data: EnrollmentForm) => Promise<void>;
  /** Submit-in-flight flag; bind to the submit button's disabled prop. */
  isSubmitting: boolean;
  /** Lead code returned by the API on success (rendered on the confirmation screen). */
  leadCode: string;
}

/**
 * Owns the public enrollment form's submit pipeline. Pulled out of
 * EnrollmentFormPage so the page renders only navigation and layout while
 * the data shaping (multi-child sync, address copy, sanitization) lives
 * next to the other enrollment hooks.
 */
export function useEnrollmentSubmit({
  token,
  getValues,
  activeStudentTab,
  parentsSeparateAddresses,
  submitMutation,
  markSubmitted,
  setIsSuccess,
}: UseEnrollmentSubmitParams): UseEnrollmentSubmitReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadCode, setLeadCode] = useState<string>('');

  const onSubmit = useCallback(async (data: EnrollmentForm) => {
    if (!token) return;

    setIsSubmitting(true);

    try {
      // For multi-child: sync ALL students' enrollmentInfo, health and transport from form state
      if (data.studentsEnrollment?.length > 1) {
        for (let i = 0; i < data.studentsEnrollment.length; i++) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const latestEI = getValues(`studentsEnrollment.${i}.enrollmentInfo` as any);
          const latestHealth = i === activeStudentTab
            ? data.health
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            : getValues(`studentsEnrollment.${i}.health` as any);
          const latestTransport = i === activeStudentTab
            ? data.transport
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            : getValues(`studentsEnrollment.${i}.transport` as any);
          const latestAP = i === activeStudentTab
            ? data.authorizedPersons
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            : getValues(`studentsEnrollment.${i}.authorizedPersons` as any);
          data.studentsEnrollment[i] = {
            ...data.studentsEnrollment[i],
            enrollmentInfo: latestEI || data.studentsEnrollment[i].enrollmentInfo,
            health: latestHealth || data.studentsEnrollment[i].health,
            transport: latestTransport || data.studentsEnrollment[i].transport,
            authorizedPersons: latestAP || data.studentsEnrollment[i].authorizedPersons,
          };
        }
      }

      // Build childrenData for multi-child support
      const childrenData = data.studentsEnrollment?.length > 1
        ? data.studentsEnrollment.map((se) => ({
            childId: se.childId || '',
            enrollmentInfo: se.enrollmentInfo,
            health: se.health,
            transport: se.transport ? {
              ...se.transport,
              dropoffPickupPersons: Array.isArray(se.transport?.dropoffPickupPersons) ? se.transport.dropoffPickupPersons : [],
              transportMethod: se.transport?.transportMethod || '',
              familyVehicles: Array.isArray(se.transport?.familyVehicles) ? se.transport.familyVehicles : [],
              canLeaveAlone: se.transport?.canLeaveAlone ?? false,
              isAthlete: se.transport?.isAthlete ?? false,
              hasLegalRestrictions: se.transport?.hasLegalRestrictions ?? false,
              allowThirdPartyPickup: se.transport?.allowThirdPartyPickup ?? false,
              authorizedPersons: se.transport?.allowThirdPartyPickup ? (se.authorizedPersons || []) : [],
            } : undefined,
          }))
        : undefined;

      // If parents share address, copy father's address to mother before submitting
      if (!parentsSeparateAddresses) {
        ADDRESS_FIELDS.forEach((field) => {
          const val = data.fatherUpdates?.address?.[field] || '';
          if (!data.motherUpdates.address) data.motherUpdates.address = {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data.motherUpdates.address as any)[field] = val;
        });
      }

      // Clean up authorized persons: only include when third-party pickup is enabled
      const cleanAuthorizedPersons = data.transport?.allowThirdPartyPickup
        ? (data.authorizedPersons || [])
        : [];

      // Sanitize health data to ensure arrays have defaults
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sanitizeHealth = (h: any) => {
        if (!h) return undefined;
        return {
          ...h,
          weight: h.weight || '',
          height: h.height || '',
          bloodType: h.bloodType || '',
          medicalConditions: Array.isArray(h.medicalConditions) ? h.medicalConditions : [],
          allergies: Array.isArray(h.allergies) ? h.allergies : [],
          feverMedications: Array.isArray(h.feverMedications) ? h.feverMedications : [],
          painMedications: Array.isArray(h.painMedications) ? h.painMedications : [],
          hasHospitalizations: h.hasHospitalizations ?? false,
          hasSeizures: h.hasSeizures ?? false,
          hasEatingDisorder: h.hasEatingDisorder ?? false,
        };
      };

      // Sanitize transport data
      const sanitizedTransport = {
        ...data.transport,
        dropoffPickupPersons: Array.isArray(data.transport?.dropoffPickupPersons) ? data.transport.dropoffPickupPersons : [],
        transportMethod: data.transport?.transportMethod || '',
        familyVehicles: Array.isArray(data.transport?.familyVehicles) ? data.transport.familyVehicles : [],
        canLeaveAlone: data.transport?.canLeaveAlone ?? false,
        isAthlete: data.transport?.isAthlete ?? false,
        hasLegalRestrictions: data.transport?.hasLegalRestrictions ?? false,
        allowThirdPartyPickup: data.transport?.allowThirdPartyPickup ?? false,
        authorizedPersons: cleanAuthorizedPersons,
      };

      // Sanitize emergency contacts
      const sanitizedContacts = (data.emergencyContacts || []).filter(c => c.name?.trim() && c.phone?.trim()).map(c => ({
        ...c,
        name: c.name.trim(),
        phone: c.phone.trim(),
        email: c.email || '',
        relationship: c.relationship || '',
        isPrimary: c.isPrimary ?? false,
      }));

      // Sanitize childrenData health and transport
      const sanitizedChildrenData = childrenData?.map(cd => ({
        ...cd,
        health: sanitizeHealth(cd.health),
        transport: cd.transport,
      }));

      const formData: EnrollmentFormData = {
        enrollmentToken: token,
        // For multi-child, root enrollmentInfo has stale defaults; only send it for single-child
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        enrollmentInfo: sanitizedChildrenData ? undefined as any : data.enrollmentInfo,
        student: data.student,
        childrenData: sanitizedChildrenData,
        fatherUpdates: {
          ...data.fatherUpdates,
        },
        motherUpdates: {
          ...data.motherUpdates,
          sameAddressAsOtherParent: !parentsSeparateAddresses,
        },
        // For multi-child, per-child health is in childrenData; root health has only the last active child
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        health: sanitizedChildrenData ? undefined as any : sanitizeHealth(data.health) as any,
        emergencyContacts: sanitizedContacts,
        healthPlan: data.healthPlan,
        // For multi-child, per-child transport is in childrenData; root transport kept for single-child/backward compat
        transport: sanitizedChildrenData ? sanitizedTransport : sanitizedTransport,
        financialResponsible: data.financialResponsible,
        termsAccepted: data.termsAccepted,
      };

      const result = await submitMutation.mutateAsync(formData);
      setLeadCode(result.data?.leadCode || '');
      setIsSuccess(true);
      markSubmitted();
    } catch {
      // Mutation's onError already surfaces a toast; swallow here to avoid double notification.
    } finally {
      setIsSubmitting(false);
    }
  }, [
    token,
    getValues,
    activeStudentTab,
    parentsSeparateAddresses,
    submitMutation,
    markSubmitted,
    setIsSuccess,
  ]);

  return { onSubmit, isSubmitting, leadCode };
}
