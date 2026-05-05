import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Clock,
  Link2Off,
} from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useLanguageStore } from '@/stores/languageStore';
import { useEnrollmentData, useSubmitEnrollment, useUploadEnrollmentDocument, useDeleteEnrollmentDocument, useToggleDocumentIncludes } from '@/hooks/useEnrollment';
import {
  getDocumentsByCategory,
  type EnrollmentFormData,
  type HealthData,
  type EmergencyContact,
  type HealthPlan,
  type TransportData,
  type FinancialResponsible,
  type Vehicle,
  type AthleteSchedule,
  type AuthorizedPerson,
  type EnrollmentInfo,
  type DocumentCategory,
} from '@/types/enrollment';
import {
  validateCPF,
  validateCNPJ,
  validateEmail,
  validateNotFutureDate,
  scrollToFirstError,
} from '@/utils/validation';
import {
  PublicFormShell,
  PublicStatusCard,
} from '@/components/public/shared';
import { EnrollmentTermsStep } from '@/components/public/enrollment/EnrollmentTermsStep';
import { EnrollmentFinancialStep } from '@/components/public/enrollment/EnrollmentFinancialStep';
import { EnrollmentDocumentsStep } from '@/components/public/enrollment/EnrollmentDocumentsStep';
import { EnrollmentHealthStep } from '@/components/public/enrollment/EnrollmentHealthStep';
import { EnrollmentTransportStep } from '@/components/public/enrollment/EnrollmentTransportStep';
import { EnrollmentStudentStep } from '@/components/public/enrollment/EnrollmentStudentStep';

import { ADDRESS_FIELDS, ENROLLMENT_FORM_DEFAULTS, RESOLVED_STEPS } from './enrollment/constants';
import type {
  StudentEnrollmentData,
  EnrollmentForm,
} from './enrollment/types';
import { useEnrollmentDraft } from './enrollment/useEnrollmentDraft';
import { useAddressLookup } from './enrollment/useAddressLookup';
import { useStudentTabs } from './enrollment/useStudentTabs';
import { useStepValidation } from './enrollment/useStepValidation';
import { useEnrollmentSubmit } from './enrollment/useEnrollmentSubmit';
import { useEnrollmentPrefill } from './enrollment/useEnrollmentPrefill';
import { useNoneAwareToggle } from './enrollment/useNoneAwareToggle';

export default function EnrollmentFormPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { language, setLanguage } = useLanguageStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, { progress: number; fileName: string }>>({});
  const [optimisticIncludes, setOptimisticIncludes] = useState<Record<string, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Queries
  const { data: enrollmentDataResponse, isLoading, error } = useEnrollmentData(token);
  const enrollmentData = enrollmentDataResponse?.data;

  // Mutations
  const submitMutation = useSubmitEnrollment();
  const uploadDocMutation = useUploadEnrollmentDocument();
  const deleteDocMutation = useDeleteEnrollmentDocument();
  const toggleIncludesMutation = useToggleDocumentIncludes();

  // Form setup
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<EnrollmentForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: ENROLLMENT_FORM_DEFAULTS as any,
  });

  const { fields: emergencyContactFields, append: appendEmergencyContact, remove: removeEmergencyContact } = useFieldArray({
    control,
    name: 'emergencyContacts',
  });

  const { fields: authorizedPersonFields, append: appendAuthorizedPerson, remove: removeAuthorizedPerson } = useFieldArray({
    control,
    name: 'authorizedPersons',
  });

  const { fields: familyVehicleFields, append: appendFamilyVehicle, remove: removeFamilyVehicle } = useFieldArray({
    control,
    name: 'transport.familyVehicles',
  });

  // Watch values
  const watchTransport = watch('transport');
  const watchFinancialResponsible = watch('financialResponsible');
  const watchHealth = watch('health');
  // Watch parent address fields
  const watchFatherCountry = watch('fatherUpdates.address.country');
  const watchFatherState = watch('fatherUpdates.address.state');
  const watchFatherCity = watch('fatherUpdates.address.city');
  const watchFatherZipCode = watch('fatherUpdates.address.zipCode');

  const watchMotherCountry = watch('motherUpdates.address.country');
  const watchMotherState = watch('motherUpdates.address.state');
  const watchMotherCity = watch('motherUpdates.address.city');
  const watchMotherZipCode = watch('motherUpdates.address.zipCode');

  const {
    countryOptions,
    nationalityOptions,
    stateOptions,
    fatherCityOptions,
    fatherNeighborhoodOptions,
    motherCityOptions,
    motherNeighborhoodOptions,
    isFatherAddressLoading,
    isMotherAddressLoading,
    parentsSeparateAddresses,
    setParentsSeparateAddresses,
    handleSeparateAddressToggle,
  } = useAddressLookup({ watch, setValue, getValues, language });

  const { serverDraft, markSubmitted, saveServerCheckpoint } =
    useEnrollmentDraft({
      token,
      enrollmentData,
      reset,
      watch,
      getValues,
      setCurrentStep,
      setIsSuccess,
    });

  useEnrollmentPrefill({
    enrollmentData,
    serverDraft,
    setValue,
    setParentsSeparateAddresses,
  });

  // Clear fields when switching between PF/PJ person type
  const watchPersonType = watchFinancialResponsible?.personType;
  useEffect(() => {
    if (watchFinancialResponsible?.responsibleType !== 'OTHER') return;
    if (watchPersonType === 'COMPANY') {
      // Switching to PJ: clear PF fields + relationship (PJ has no relationship)
      setValue('financialResponsible.relationship', '');
      setValue('financialResponsible.fullName', '');
      setValue('financialResponsible.cpf', '');
      setValue('financialResponsible.email', '');
      setValue('financialResponsible.phone', '');
    } else if (watchPersonType === 'INDIVIDUAL') {
      // Switching to PF: clear PJ fields
      setValue('financialResponsible.companyName', '');
      setValue('financialResponsible.cnpj', '');
      setValue('financialResponsible.tradeName', '');
      setValue('financialResponsible.contactPerson', '');
      setValue('financialResponsible.contactEmail', '');
      setValue('financialResponsible.contactPhone', '');
    }
  }, [watchPersonType]);


  // Step navigation with validation
  const nextStep = (e?: React.MouseEvent) => {
    // Prevent default form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Don't allow advancing beyond step 5
    if (currentStep >= 6) return;

    if (validateCurrentStep()) {
      // Mark the current step as completed
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      const nextStepValue = Math.min(currentStep + 1, 6);
      setCurrentStep(nextStepValue);
      setFieldErrors({});

      saveServerCheckpoint(nextStepValue);
    }
  };
  const prevStep = () => {
    setFieldErrors({});
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  // Handle clicking on a stepper step to navigate
  const handleStepClick = (stepId: number) => {
    if (stepId !== currentStep && (completedSteps.has(stepId) || stepId < currentStep)) {
      setFieldErrors({});
      setCurrentStep(stepId);
    }
  };

  // Get students list (multi-child or legacy single) - must be before early returns
  const enrollmentStudents = useMemo(() => {
    const students = (enrollmentData as any)?.students || [];
    if (students.length > 0) return students;
    return enrollmentData?.student ? [enrollmentData.student] : [];
  }, [enrollmentData]);

  const {
    activeStudentTab,
    setActiveStudentTab,
    handleHealthTabSwitch,
    handleCopyHealthFromSibling,
    handleTransportTabSwitch,
    handleCopyTransportFromSibling,
  } = useStudentTabs({ enrollmentStudents, getValues, setValue, language });

  const { validateCurrentStep } = useStepValidation({
    watch,
    setValue,
    getValues,
    language,
    currentStep,
    enrollmentStudents,
    enrollmentData,
    activeStudentTab,
    setActiveStudentTab,
    setFieldErrors,
    watchFinancialResponsible,
  });

  const { onSubmit, isSubmitting, leadCode } = useEnrollmentSubmit({
    token,
    getValues,
    activeStudentTab,
    parentsSeparateAddresses,
    submitMutation,
    markSubmitted,
    setIsSuccess,
  });

  const activeStudent = enrollmentStudents[activeStudentTab] || enrollmentStudents[0];

  // Error states
  if (!token) {
    return (
      <PublicStatusCard
        variant="red"
        icon={AlertCircle}
        title={language === 'pt' ? 'Link inválido' : 'Invalid link'}
        message={language === 'pt'
          ? 'Este formulário só pode ser acessado através de um link enviado pela escola.'
          : 'This form can only be accessed through a link sent by the school.'}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    const errorObj = error as { code?: string; message?: string };
    const isExpired = errorObj.code === 'TOKEN_EXPIRED';
    const isAdmissionNotCompleted = errorObj.code === 'ADMISSION_NOT_COMPLETED';

    if (isExpired) {
      return (
        <PublicStatusCard
          variant="amber"
          icon={Clock}
          title={language === 'pt' ? 'Link expirado' : 'Link expired'}
          message={language === 'pt'
            ? 'Este link de matrícula expirou. Solicite um novo link à escola.'
            : 'This enrollment link has expired. Please request a new link from the school.'}
        />
      );
    }
    if (isAdmissionNotCompleted) {
      return (
        <PublicStatusCard
          variant="amber"
          icon={AlertCircle}
          title={language === 'pt' ? 'Admissão não concluída' : 'Admission not completed'}
          message={language === 'pt'
            ? 'Por favor, complete o formulário de admissão antes de preencher a matrícula.'
            : 'Please complete the admission form before filling out the enrollment.'}
        />
      );
    }
    return (
      <PublicStatusCard
        variant="red"
        icon={Link2Off}
        title={language === 'pt' ? 'Link inválido' : 'Invalid link'}
        message={language === 'pt'
          ? 'Este link de matrícula não é válido.'
          : 'This enrollment link is not valid.'}
      />
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <PublicStatusCard
        variant="green"
        icon={CheckCircle}
        title={language === 'pt' ? 'Matrícula enviada!' : 'Enrollment submitted!'}
        message={language === 'pt'
          ? 'Obrigado por completar o formulário de matrícula. A escola entrará em contato em breve.'
          : 'Thank you for completing the enrollment form. The school will contact you soon.'}
        footer={
          <div className="bg-neutral-100 rounded-lg p-4">
            <p className="text-sm text-neutral-600">
              {language === 'pt' ? 'Seu protocolo:' : 'Your protocol:'}
            </p>
            <p className="text-2xl font-bold text-primary-600">{leadCode}</p>
          </div>
        }
      />
    );
  }

  // Render step content
  const renderStepContent = () => {
    const baseProps = {
      register, control: control as any, watch, setValue, getValues, errors,
      language, fieldErrors, setFieldErrors,
    };

    switch (currentStep) {
      case 1:
        return (
          <EnrollmentStudentStep
            {...baseProps}
            enrollmentStudents={enrollmentStudents}
            activeStudentTab={activeStudentTab}
            onTabSwitch={setActiveStudentTab}
            enrollmentData={enrollmentData}
            activeStudent={activeStudent}
            parentsSeparateAddresses={parentsSeparateAddresses}
            onSeparateAddressToggle={handleSeparateAddressToggle}
            watchFatherCountry={watchFatherCountry}
            watchFatherState={watchFatherState}
            watchFatherCity={watchFatherCity}
            watchMotherCountry={watchMotherCountry}
            watchMotherState={watchMotherState}
            watchMotherCity={watchMotherCity}
            isFatherAddressLoading={isFatherAddressLoading}
            isMotherAddressLoading={isMotherAddressLoading}
            countryOptions={countryOptions}
            nationalityOptions={nationalityOptions}
            stateOptions={stateOptions}
            fatherCityOptions={fatherCityOptions}
            fatherNeighborhoodOptions={fatherNeighborhoodOptions}
            motherCityOptions={motherCityOptions}
            motherNeighborhoodOptions={motherNeighborhoodOptions}
          />
        );
      case 2:
        return (
          <EnrollmentHealthStep
            {...baseProps}
            enrollmentStudents={enrollmentStudents}
            activeStudentTab={activeStudentTab}
            onTabSwitch={handleHealthTabSwitch}
            watchHealth={watchHealth}
            emergencyContactFields={emergencyContactFields}
            appendEmergencyContact={appendEmergencyContact}
            removeEmergencyContact={removeEmergencyContact}
            onMedicalConditionChange={handleMedicalConditionChange}
            onAllergyChange={handleAllergyChange}
            onFeverMedicationChange={handleFeverMedicationChange}
            onPainMedicationChange={handlePainMedicationChange}
            onCopyFromSibling={handleCopyHealthFromSibling}
          />
        );
      case 3:
        return (
          <EnrollmentTransportStep
            {...baseProps}
            enrollmentStudents={enrollmentStudents}
            activeStudentTab={activeStudentTab}
            onTabSwitch={handleTransportTabSwitch}
            watchTransport={watchTransport}
            familyVehicleFields={familyVehicleFields}
            appendFamilyVehicle={appendFamilyVehicle}
            removeFamilyVehicle={removeFamilyVehicle}
            authorizedPersonFields={authorizedPersonFields}
            appendAuthorizedPerson={appendAuthorizedPerson}
            removeAuthorizedPerson={removeAuthorizedPerson}
            onDropoffPersonChange={handleDropoffPersonChange}
            onCopyFromSibling={handleCopyTransportFromSibling}
          />
        );
      case 4:
        return (
          <EnrollmentFinancialStep
            {...baseProps}
            watchFinancialResponsible={watchFinancialResponsible}
            enrollmentData={enrollmentData}
            token={token}
            uploadProgress={uploadProgress}
            setUploadProgress={setUploadProgress}
            optimisticIncludes={optimisticIncludes}
            setOptimisticIncludes={setOptimisticIncludes}
            uploadDocMutation={uploadDocMutation}
            deleteDocMutation={deleteDocMutation}
            toggleIncludesMutation={toggleIncludesMutation}
          />
        );
      case 5:
        return (
          <EnrollmentDocumentsStep
            {...baseProps}
            enrollmentStudents={enrollmentStudents}
            activeStudentTab={activeStudentTab}
            onTabSwitch={setActiveStudentTab}
            enrollmentData={enrollmentData}
            token={token}
            watchFinancialResponsible={watchFinancialResponsible}
            uploadProgress={uploadProgress}
            setUploadProgress={setUploadProgress}
            optimisticIncludes={optimisticIncludes}
            setOptimisticIncludes={setOptimisticIncludes}
            uploadDocMutation={uploadDocMutation}
            deleteDocMutation={deleteDocMutation}
            toggleIncludesMutation={toggleIncludesMutation}
          />
        );
      case 6:
        return <EnrollmentTermsStep {...baseProps} />;
      default:
        return null;
    }
  };


  // Health step "None"-aware multi-select handlers
  const { toggle: toggleHealthMulti } = useNoneAwareToggle({ setValue, watchHealth });
  const handleMedicalConditionChange = (value: string, checked: boolean) =>
    toggleHealthMulti('health.medicalConditions', value, checked);
  const handleAllergyChange = (value: string, checked: boolean) =>
    toggleHealthMulti('health.allergies', value, checked);
  const handleFeverMedicationChange = (value: string, checked: boolean) =>
    toggleHealthMulti('health.feverMedications', value, checked);
  const handlePainMedicationChange = (value: string, checked: boolean) =>
    toggleHealthMulti('health.painMedications', value, checked);

  // Transport: simple add/remove for the dropoff/pickup person multi-select.
  const handleDropoffPersonChange = (personType: string, checked: boolean) => {
    const current = watchTransport?.dropoffPickupPersons || [];
    const updated = checked
      ? [...current, personType]
      : current.filter((p: string) => p !== personType);
    setValue('transport.dropoffPickupPersons', updated);
  };

  // Steps 2-6 extracted to components in frontend/src/components/public/enrollment/

  return (
    <PublicFormShell
      steps={RESOLVED_STEPS}
      currentStep={currentStep}
      language={language}
      completedSteps={completedSteps}
      onStepClick={handleStepClick}
      headerTitle={language === 'pt' ? 'Formulário de Matrícula' : 'Enrollment Form'}
      logoSrc="/logo_ris.png"
      onLanguageChange={setLanguage}
      fieldErrors={fieldErrors}
      onPrev={prevStep}
      onNext={(e) => nextStep(e as React.MouseEvent)}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      canSubmit={!!watch('termsAccepted')}
      submitLabel={language === 'pt' ? 'Enviar Matrícula' : 'Submit Enrollment'}
    >
      {renderStepContent()}
    </PublicFormShell>
  );
}
