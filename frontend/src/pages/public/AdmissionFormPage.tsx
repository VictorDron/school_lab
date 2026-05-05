import { useMemo, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { useLanguageStore } from '@/stores/languageStore';
import { nationalities } from '@/constants/nationalities';
import { languages } from '@/constants/languages';
import { countries, getCitiesForCountry } from '@/constants/countries';
import { gradeOptions, isFirstSchoolGrade } from '@/constants/grades';
import { StepIndicator } from '@/components/public/shared';
import { AdmissionStudentStep } from '@/components/public/admission/AdmissionStudentStep';
import { AdmissionFamilyStep } from '@/components/public/admission/AdmissionFamilyStep';
import { AdmissionEducationStep } from '@/components/public/admission/AdmissionEducationStep';
import { AdmissionAdditionalStep } from '@/components/public/admission/AdmissionAdditionalStep';
import type { AdmissionForm } from '@/components/public/admission/types';
import { STEPS, defaultAdmissionValues } from './admission/constants';
import { buildAdmissionTranslations } from './admission/translations';
import { LanguageToggle } from './admission/components/LanguageToggle';
import { LockedFieldsBanner } from './admission/components/LockedFieldsBanner';
import { WelcomeHeader } from './admission/components/WelcomeHeader';
import { TokenExpirationBanner } from './admission/components/TokenExpirationBanner';
import { FormNavigation } from './admission/components/FormNavigation';
import { AdmissionStatusGate } from './admission/components/AdmissionStatusGate';
import { useAdmissionDraft } from './admission/useAdmissionDraft';
import { useAdmissionAddressLookup } from './admission/useAdmissionAddressLookup';
import { useAdmissionPrefill } from './admission/useAdmissionPrefill';
import { useAdmissionStepValidation } from './admission/useAdmissionStepValidation';
import { useAdmissionSubmit } from './admission/useAdmissionSubmit';
import { useAdmissionFormHandlers } from './admission/useAdmissionFormHandlers';

export default function AdmissionFormPage() {
  const { language, setLanguage } = useLanguageStore();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [activeStudentTab, setActiveStudentTab] = useState(0);
  const [familyName, setFamilyName] = useState<string>('');
  const applicationToken = searchParams.get('token');

  // Track which fields are pre-filled (locked)
  const [lockedFields, setLockedFields] = useState<{
    desiredGrade: boolean;
    source: boolean;
  }>({ desiredGrade: false, source: false });

  const t = useMemo(() => buildAdmissionTranslations(language), [language]);

  // Format nationalities for searchable select
  const nationalityOptions = useMemo(() =>
    nationalities.map((n) => ({
      value: n.en,
      label: language === 'pt' ? n.pt : n.en,
    })).sort((a, b) => a.label.localeCompare(b.label)),
    [language]
  );

  // Format languages for searchable select
  const languageOptions = useMemo(() =>
    languages.map((l) => ({
      value: l.code,
      label: language === 'pt' ? l.pt : l.en,
    })).sort((a, b) => {
      if (a.value === 'pt') return -1;
      if (b.value === 'pt') return 1;
      if (a.value === 'en') return -1;
      if (b.value === 'en') return 1;
      return a.label.localeCompare(b.label);
    }),
    [language]
  );

  // Format countries for searchable select
  const countryOptions = useMemo(() =>
    countries.map((c) => ({
      value: c.code,
      label: language === 'pt' ? c.pt : c.en,
    })).sort((a, b) => {
      if (a.value === 'BR') return -1;
      if (b.value === 'BR') return 1;
      return a.label.localeCompare(b.label);
    }),
    [language]
  );


  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<AdmissionForm>({ defaultValues: defaultAdmissionValues, mode: 'onChange' });

  const {
    fields: siblingFields,
    append: appendSibling,
    remove: removeSibling,
  } = useFieldArray({ control, name: 'siblings' });

  const {
    prefillData,
    isPrefillLoading,
    serverDraft,
    hasPrefilled,
    submitted,
    tokenError,
    setTokenError,
    markSubmitted,
  } = useAdmissionDraft({
    applicationToken,
    reset,
    watch,
    getValues,
    currentStep,
    setCurrentStep,
  });

  const livesWith = watch('livesWith');
  const watchedNumberOfStudents = watch('numberOfStudents');
  const hasPsychoEvaluation = watch(`students.${activeStudentTab}.additionalInfo.hasPsychoEvaluation` as any);
  const hasAcademicSupport = watch(`students.${activeStudentTab}.additionalInfo.hasAcademicSupport` as any);
  const hasHealthIssues = watch(`students.${activeStudentTab}.additionalInfo.hasHealthIssues` as any);
  const hasAdaptationDifficulty = watch(`students.${activeStudentTab}.additionalInfo.hasAdaptationDifficulty` as any);
  const watchedSource = watch('source');
  const watchedDesiredGrade = watch(`students.${activeStudentTab}.desiredGrade` as any);

  const {
    isLoadingAddress,
    stateOptions,
    cityOptions,
    neighborhoodOptions,
    watchedCountry,
    watchedState,
    watchedCity,
  } = useAdmissionAddressLookup({ watch, setValue, language });

  useAdmissionPrefill({
    prefillData,
    serverDraft,
    hasPrefilled,
    reset,
    setLockedFields,
    setFamilyName,
  });

  const { validateStep } = useAdmissionStepValidation({
    getValues,
    trigger,
    language,
    setActiveStudentTab,
    studentTabLabel: t.studentTab,
  });

  const { submitMutation } = useAdmissionSubmit({
    applicationToken,
    expiredMessage: t.expiredMessage,
    setTokenError,
    markSubmitted,
  });

  const {
    handleNumberOfStudentsChange,
    handleStepClick,
    handleNext,
    handlePrevious,
    onSubmit,
  } = useAdmissionFormHandlers({
    getValues,
    setValue,
    applicationToken,
    currentStep,
    setCurrentStep,
    activeStudentTab,
    setActiveStudentTab,
    watchedNumberOfStudents,
    language,
    t,
    validateStep,
    submitMutation,
  });

  const isFirstSchool = useMemo(
    () => isFirstSchoolGrade(watchedDesiredGrade),
    [watchedDesiredGrade]
  );

  // Grade options - always in English
  const gradeSelectOptions = useMemo(
    () =>
      gradeOptions.map((g) => ({
        value: g.value,
        label: g.en,
        sublabel: '',
      })),
    []
  );

  // Get city options for each education history entry
  const getCityOptionsForIndex = useCallback((countryCode: string) => {
    const cities = getCitiesForCountry(countryCode);
    return cities.map((c) => ({
      value: c.en,
      label: language === 'pt' ? c.pt : c.en,
    }));
  }, [language]);


  const statusScreen = AdmissionStatusGate({
    applicationToken,
    tokenError,
    isPrefillLoading,
    submitted,
    t,
  });
  if (statusScreen) return statusScreen;

  const baseStepProps = {
    register,
    control: control as any,
    watch,
    setValue,
    getValues,
    errors,
    t,
    language,
    activeStudentTab,
    onTabSwitch: setActiveStudentTab,
    watchedNumberOfStudents,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 safe-area-top">
        <div className="max-w-3xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <img
            src="/logo_ris.png"
            alt="Rio International School"
            className="h-8 sm:h-10 w-auto object-contain"
          />
          <LanguageToggle language={language} setLanguage={setLanguage} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <WelcomeHeader familyName={familyName} t={t} />

        <TokenExpirationBanner visible={!!prefillData?.tokenExpires} t={t} />

        <LockedFieldsBanner
          lockedFields={lockedFields}
          desiredGrade={watchedDesiredGrade}
          source={watchedSource}
          language={language}
          t={t}
        />

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} steps={STEPS} language={language} onStepClick={handleStepClick} variant="admission" />

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <AdmissionStudentStep
                  {...baseStepProps}
                  lockedFields={lockedFields}
                  isFirstSchool={isFirstSchool}
                  nationalityOptions={nationalityOptions}
                  gradeSelectOptions={gradeSelectOptions}
                  handleNumberOfStudentsChange={handleNumberOfStudentsChange}
                />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <AdmissionFamilyStep
                  {...baseStepProps}
                  livesWith={livesWith}
                  siblingFields={siblingFields}
                  appendSibling={appendSibling}
                  removeSibling={removeSibling}
                  isLoadingAddress={isLoadingAddress}
                  watchedCountry={watchedCountry}
                  watchedState={watchedState}
                  watchedCity={watchedCity}
                  stateOptions={stateOptions}
                  cityOptions={cityOptions}
                  neighborhoodOptions={neighborhoodOptions}
                  countryOptions={countryOptions}
                />
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <AdmissionEducationStep
                  {...baseStepProps}
                  languageOptions={languageOptions}
                  countryOptions={countryOptions}
                  getCityOptionsForIndex={getCityOptionsForIndex}
                />
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <AdmissionAdditionalStep
                  {...baseStepProps}
                  lockedFields={lockedFields}
                  hasPsychoEvaluation={hasPsychoEvaluation}
                  hasAcademicSupport={hasAcademicSupport}
                  hasHealthIssues={hasHealthIssues}
                  hasAdaptationDifficulty={hasAdaptationDifficulty}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <FormNavigation
            currentStep={currentStep}
            isSubmitting={submitMutation.isPending}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit(onSubmit)}
            t={t}
          />
        </form>
      </main>

      {/* Footer */}
      <footer className="py-4 sm:py-6 text-center text-xs sm:text-sm text-neutral-500 border-t border-neutral-100 mt-6 sm:mt-8 safe-area-bottom">
        <p>© {new Date().getFullYear()} School Lab. {language === 'pt' ? 'Todos os direitos reservados.' : 'All rights reserved.'}</p>
      </footer>
    </div>
  );
}
