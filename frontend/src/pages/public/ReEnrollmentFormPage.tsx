import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useReEnrollmentFormData, useSubmitReEnrollmentForm } from '@/hooks/useReEnrollment';
import DocumentRenewalSection from './re-enrollment/DocumentRenewalSection';
import {
  SuccessScreen,
  AlreadyConfirmedScreen,
  ErrorScreen,
  LoadingScreen,
} from './re-enrollment/components';
import { useReEnrollmentFormState } from './re-enrollment/useReEnrollmentFormState';
import { useReEnrollmentSubmit } from './re-enrollment/useReEnrollmentSubmit';
import { HeaderSection } from './re-enrollment/sections/HeaderSection';
import { StudentDataSection } from './re-enrollment/sections/StudentDataSection';
import { ParentContactsSection } from './re-enrollment/sections/ParentContactsSection';
import { HealthSection } from './re-enrollment/sections/HealthSection';
import { TransportSection } from './re-enrollment/sections/TransportSection';
import { EmergencyContactsSection } from './re-enrollment/sections/EmergencyContactsSection';
import { FinancialResponsibleSection } from './re-enrollment/sections/FinancialResponsibleSection';
import { HealthPlanSection } from './re-enrollment/sections/HealthPlanSection';
import { LgpdConsentSection } from './re-enrollment/sections/LgpdConsentSection';
import { SubmitFooter } from './re-enrollment/sections/SubmitFooter';

export default function ReEnrollmentFormPage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error, refetch } = useReEnrollmentFormData(token || null);
  const submitMutation = useSubmitReEnrollmentForm(token || null);
  const [submitted, setSubmitted] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [showFinancialAlert, setShowFinancialAlert] = useState(false);

  const formData = data?.data;

  const formState = useReEnrollmentFormState({ formData });
  const {
    health,
    setHealth,
    transport,
    setTransport,
    emergencyContacts,
    financial,
    setFinancial,
    healthPlan,
    setHealthPlan,
    correctionNotes,
    setCorrectionNotes,
    parentEmails,
    setParentEmails,
    additionalResponsible,
    setAdditionalResponsible,
    showAdditionalResp,
    setShowAdditionalResp,
    dropoffPickupPersons,
    authorizedPersons,
    familyVehicles,
    handleExclusiveCheckbox,
    handleDropoffPersonChange,
    addEmergencyContact,
    removeEmergencyContact,
    updateEmergencyContact,
    addAuthorizedPerson,
    removeAuthorizedPerson,
    updateAuthorizedPerson,
    addFamilyVehicle,
    removeFamilyVehicle,
    updateFamilyVehicle,
  } = formState;

  const {
    validationErrors,
    setValidationErrors,
    hasError,
    submitCooldown,
    handleSubmit,
  } = useReEnrollmentSubmit({
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
    onSubmittedSuccessfully: () => setSubmitted(true),
  });

  if (isLoading) return <LoadingScreen />;
  if (error) {
    return (
      <ErrorScreen
        message={(error as { message?: string })?.message || 'Token inválido ou expirado.'}
        code={(error as { code?: string })?.code}
      />
    );
  }
  if (!formData) return <ErrorScreen message="Dados não encontrados." />;
  if (formData.invite.status === 'CONFIRMED') {
    return <AlreadyConfirmedScreen studentName={formData.student.fullName} />;
  }
  if (submitted) return <SuccessScreen studentName={formData.student.fullName} />;

  const { student, period, suggestedGrade, personalData } = formData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <HeaderSection
          student={student}
          period={period}
          suggestedGrade={suggestedGrade}
          financialInfo={formData.financialInfo}
        />

        <StudentDataSection
          student={student}
          personalData={personalData}
          correctionNotes={correctionNotes}
          setCorrectionNotes={setCorrectionNotes}
        />

        <ParentContactsSection
          parentEmails={parentEmails}
          setParentEmails={setParentEmails}
          additionalResponsible={additionalResponsible}
          setAdditionalResponsible={setAdditionalResponsible}
          showAdditionalResp={showAdditionalResp}
          setShowAdditionalResp={setShowAdditionalResp}
          hasError={hasError}
          validationErrors={validationErrors}
        />

        <HealthSection
          health={health}
          setHealth={setHealth}
          handleExclusiveCheckbox={handleExclusiveCheckbox}
          hasError={hasError}
          validationErrors={validationErrors}
          setValidationErrors={setValidationErrors}
        />

        <TransportSection
          transport={transport}
          setTransport={setTransport}
          dropoffPickupPersons={dropoffPickupPersons}
          handleDropoffPersonChange={handleDropoffPersonChange}
          authorizedPersons={authorizedPersons}
          addAuthorizedPerson={addAuthorizedPerson}
          removeAuthorizedPerson={removeAuthorizedPerson}
          updateAuthorizedPerson={updateAuthorizedPerson}
          familyVehicles={familyVehicles}
          addFamilyVehicle={addFamilyVehicle}
          removeFamilyVehicle={removeFamilyVehicle}
          updateFamilyVehicle={updateFamilyVehicle}
        />

        <EmergencyContactsSection
          emergencyContacts={emergencyContacts}
          addEmergencyContact={addEmergencyContact}
          removeEmergencyContact={removeEmergencyContact}
          updateEmergencyContact={updateEmergencyContact}
        />

        <FinancialResponsibleSection
          financial={financial}
          setFinancial={setFinancial}
          showFinancialAlert={showFinancialAlert}
          setShowFinancialAlert={setShowFinancialAlert}
        />

        <HealthPlanSection healthPlan={healthPlan} setHealthPlan={setHealthPlan} />

        {formData.requiredDocuments && formData.requiredDocuments.length > 0 && (
          <DocumentRenewalSection
            requiredDocuments={formData.requiredDocuments}
            token={token!}
            childId={null}
            onDocUploaded={() => refetch()}
          />
        )}

        <LgpdConsentSection lgpdConsent={lgpdConsent} setLgpdConsent={setLgpdConsent} />

        <SubmitFooter
          validationErrors={validationErrors}
          lgpdConsent={lgpdConsent}
          isSubmitting={submitMutation.isPending}
          submitCooldown={submitCooldown}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
