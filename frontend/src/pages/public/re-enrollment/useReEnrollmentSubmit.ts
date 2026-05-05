import { useCallback, useState } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import type {
  ReEnrollmentChildHealth,
  ReEnrollmentChildTransport,
  ReEnrollmentEmergencyContact,
  ReEnrollmentFinancialResponsible,
  ReEnrollmentHealthPlan,
  ReEnrollmentSubmitData,
} from '@/types/re-enrollment';
import type {
  AdditionalResponsible,
  AuthorizedPerson,
  FamilyVehicle,
  ParentEmailState,
} from './types';

interface UseReEnrollmentSubmitParams {
  health: Partial<ReEnrollmentChildHealth>;
  transport: Partial<ReEnrollmentChildTransport>;
  emergencyContacts: ReEnrollmentEmergencyContact[];
  financial: Partial<ReEnrollmentFinancialResponsible>;
  healthPlan: Partial<ReEnrollmentHealthPlan>;
  correctionNotes: string;
  parentEmails: ParentEmailState[];
  additionalResponsible: AdditionalResponsible;
  showAdditionalResp: boolean;
  dropoffPickupPersons: string[];
  authorizedPersons: AuthorizedPerson[];
  familyVehicles: FamilyVehicle[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitMutation: UseMutationResult<any, unknown, ReEnrollmentSubmitData, unknown>;
  setShowFinancialAlert: (value: boolean) => void;
  onSubmittedSuccessfully: () => void;
}

interface UseReEnrollmentSubmitReturn {
  validationErrors: Record<string, string>;
  setValidationErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  /** True when an error is registered for the given key — used to flag inputs in JSX. */
  hasError: (field: string) => boolean;
  submitCooldown: boolean;
  /** Validate, then submit the assembled payload to the re-enrollment endpoint. */
  handleSubmit: () => void;
}

/**
 * Strip database-only fields the server already owns. Mutates a fresh
 * object; the source object is preserved.
 */
function stripDbFields(obj: Record<string, unknown>): Record<string, unknown> {
  const dbKeys = ['id', 'leadId', 'childId', 'createdAt', 'updatedAt'];
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !dbKeys.includes(k)));
}

/**
 * Owns the validate → assemble payload → submit pipeline for the public
 * re-enrollment confirmation form. Validation surfaces inline errors via
 * validationErrors state; the page binds hasError() to inputs and reads
 * the error map for messages. On submit failure a 3s cooldown blocks
 * re-submits, mirroring the previous inline behavior.
 */
export function useReEnrollmentSubmit({
  health,
  transport,
  emergencyContacts,
  financial,
  healthPlan,
  correctionNotes,
  parentEmails,
  additionalResponsible,
  showAdditionalResp,
  dropoffPickupPersons,
  authorizedPersons,
  familyVehicles,
  submitMutation,
  setShowFinancialAlert,
  onSubmittedSuccessfully,
}: UseReEnrollmentSubmitParams): UseReEnrollmentSubmitReturn {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitCooldown, setSubmitCooldown] = useState(false);

  const hasError = useCallback(
    (field: string) => !!validationErrors[field],
    [validationErrors]
  );

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!health.weight?.trim()) errors['health.weight'] = 'Peso é obrigatório.';
    if (!health.height?.trim()) errors['health.height'] = 'Altura é obrigatória.';
    if (!health.bloodType) errors['health.bloodType'] = 'Tipo sanguíneo é obrigatório.';
    if (!health.medicalConditions?.length) errors['health.medicalConditions'] = 'Selecione pelo menos uma opção (ou "Nenhuma").';
    if (!health.allergies?.length) errors['health.allergies'] = 'Selecione pelo menos uma opção (ou "Nenhuma").';
    if (!health.feverMedications?.length) errors['health.feverMedications'] = 'Selecione pelo menos uma opção (ou "Nenhum").';
    if (!health.painMedications?.length) errors['health.painMedications'] = 'Selecione pelo menos uma opção (ou "Nenhum").';

    for (let i = 0; i < parentEmails.length; i++) {
      if (!parentEmails[i].email?.trim()) {
        errors[`parent.${i}.email`] = 'E-mail é obrigatório.';
      }
    }

    const hasFinancialData = financial.fullName?.trim() || financial.cpf?.trim() || financial.email?.trim();
    if (!hasFinancialData) {
      errors['financial'] = 'Preencha os dados do responsável financeiro.';
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstErrorEl = document.querySelector('[data-error="true"]');
      firstErrorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  }, [health, parentEmails, financial]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;
    setShowFinancialAlert(false);

    const validContacts = emergencyContacts.filter((c) => c.name?.trim() && c.phone?.trim());

    const transportPayload: Record<string, unknown> = {
      ...stripDbFields(transport as Record<string, unknown>),
      dropoffPickupPersons,
      authorizedPersons: authorizedPersons.filter((p) => p.name?.trim()),
      familyVehicles: familyVehicles.filter((v) => v.model?.trim()),
    };

    const payload: ReEnrollmentSubmitData = {
      health: Object.keys(health).length > 0 ? stripDbFields(health as Record<string, unknown>) : undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transport: transportPayload as any,
      emergencyContacts: validContacts.length > 0 ? validContacts : undefined,
      financialResponsible: Object.keys(financial).length > 0 ? stripDbFields(financial as Record<string, unknown>) : undefined,
      healthPlan: Object.keys(healthPlan).length > 0 ? stripDbFields(healthPlan as Record<string, unknown>) : undefined,
      lgpdConsent: true,
      correctionNotes: correctionNotes.trim() || undefined,
      parentUpdates: parentEmails
        .filter((p) => p.parentId && p.email?.trim())
        .map((p) => ({ parentId: p.parentId, email: p.email.trim(), phone: p.phone?.trim() || undefined })),
      additionalResponsible: showAdditionalResp && additionalResponsible.fullName?.trim()
        ? {
            fullName: additionalResponsible.fullName,
            email: additionalResponsible.email,
            phone: additionalResponsible.phone,
            relationship: additionalResponsible.relationship,
          }
        : undefined,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    submitMutation.mutate(payload as any, {
      onSuccess: () => onSubmittedSuccessfully(),
      onError: () => {
        setSubmitCooldown(true);
        setTimeout(() => setSubmitCooldown(false), 3000);
      },
    });
  }, [
    validateForm,
    setShowFinancialAlert,
    emergencyContacts,
    transport,
    dropoffPickupPersons,
    authorizedPersons,
    familyVehicles,
    health,
    financial,
    healthPlan,
    correctionNotes,
    parentEmails,
    showAdditionalResp,
    additionalResponsible,
    submitMutation,
    onSubmittedSuccessfully,
  ]);

  return {
    validationErrors,
    setValidationErrors,
    hasError,
    submitCooldown,
    handleSubmit,
  };
}
