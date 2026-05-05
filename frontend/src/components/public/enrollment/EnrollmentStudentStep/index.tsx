import { AddressFields } from '@/components/public/shared';
import type { EnrollmentStudentStepProps } from '../types';
import { ParentDocFields } from './ParentDocFields';
import { StudentTabsNavigation } from './StudentTabsNavigation';
import { StudentPersonalDataSection } from './StudentPersonalDataSection';
import { StudentDocumentationSection } from './StudentDocumentationSection';
import { MotherAddressToggle } from './MotherAddressToggle';

// ---------------------------------------------------------------------------
// EnrollmentStudentStep
// ---------------------------------------------------------------------------

export function EnrollmentStudentStep({
  register,
  control,
  watch,
  setValue,
  getValues,
  language,
  fieldErrors,
  setFieldErrors,
  enrollmentStudents,
  activeStudentTab,
  onTabSwitch,
  enrollmentData,
  activeStudent,
  parentsSeparateAddresses,
  onSeparateAddressToggle,
  watchFatherCountry,
  watchFatherState,
  watchFatherCity,
  watchMotherCountry,
  watchMotherState,
  watchMotherCity,
  isFatherAddressLoading,
  isMotherAddressLoading,
  countryOptions,
  nationalityOptions,
  stateOptions,
  fatherCityOptions,
  fatherNeighborhoodOptions,
  motherCityOptions,
  motherNeighborhoodOptions,
}: EnrollmentStudentStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-neutral-900">
        {language === 'pt' ? 'Dados do Aluno e Informações Gerais' : 'Student and General Information'}
      </h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          {language === 'pt'
            ? 'Os dados abaixo foram preenchidos no formulário de admissão. Campos bloqueados não podem ser alterados.'
            : 'The data below was filled in the admission form. Locked fields cannot be changed.'}
        </p>
      </div>

      <StudentTabsNavigation
        enrollmentStudents={enrollmentStudents}
        activeStudentTab={activeStudentTab}
        onTabSwitch={onTabSwitch}
        language={language}
      />

      <StudentPersonalDataSection
        register={register}
        language={language}
        enrollmentStudents={enrollmentStudents}
        activeStudentTab={activeStudentTab}
        activeStudent={activeStudent}
      />

      <hr className="my-6" />

      <StudentDocumentationSection
        register={register}
        setValue={setValue}
        getValues={getValues}
        language={language}
        fieldErrors={fieldErrors}
        setFieldErrors={setFieldErrors}
        enrollmentStudents={enrollmentStudents}
        activeStudentTab={activeStudentTab}
        activeStudent={activeStudent}
      />

      <hr className="my-6" />

      {/* Father Documentation */}
      <ParentDocFields
        parentPrefix="fatherUpdates"
        parentLabel={{ pt: 'do Pai', en: 'Father' }}
        register={register}
        control={control}
        setValue={setValue}
        language={language}
        fieldErrors={fieldErrors}
        setFieldErrors={setFieldErrors}
        enrollmentData={enrollmentData}
        nationalityOptions={nationalityOptions}
      />

      {/* Family Address */}
      <h4 className="text-md font-medium text-neutral-900 mt-6 mb-2">
        {language === 'pt' ? 'Endereço da Família' : 'Family Address'}
      </h4>
      <p className="text-sm text-neutral-500 mb-4">
        {language === 'pt'
          ? 'Este endereço será usado para ambos os pais, a menos que a mãe more em endereço diferente.'
          : 'This address will be used for both parents, unless the mother lives at a different address.'}
      </p>

      <AddressFields
        prefix="fatherUpdates.address"
        register={register}
        control={control}
        setValue={setValue}
        language={language}
        watchCountry={watchFatherCountry}
        watchState={watchFatherState}
        watchCity={watchFatherCity}
        countryOptions={countryOptions}
        stateOptions={stateOptions}
        cityOptions={fatherCityOptions}
        neighborhoodOptions={fatherNeighborhoodOptions}
        isLoading={isFatherAddressLoading}
      />

      <hr className="my-6" />

      {/* Mother Documentation */}
      <ParentDocFields
        parentPrefix="motherUpdates"
        parentLabel={{ pt: 'da Mãe', en: 'Mother' }}
        register={register}
        control={control}
        setValue={setValue}
        language={language}
        fieldErrors={fieldErrors}
        setFieldErrors={setFieldErrors}
        enrollmentData={enrollmentData}
        nationalityOptions={nationalityOptions}
      />

      <MotherAddressToggle
        enabled={parentsSeparateAddresses}
        onChange={onSeparateAddressToggle}
        language={language}
      />

      {parentsSeparateAddresses && (
      <>
      <h4 className="text-md font-medium text-neutral-900 mb-4">
        {language === 'pt' ? 'Endereço da Mãe' : 'Mother Address'}
      </h4>

      <AddressFields
        prefix="motherUpdates.address"
        register={register}
        control={control}
        setValue={setValue}
        language={language}
        watchCountry={watchMotherCountry}
        watchState={watchMotherState}
        watchCity={watchMotherCity}
        countryOptions={countryOptions}
        stateOptions={stateOptions}
        cityOptions={motherCityOptions}
        neighborhoodOptions={motherNeighborhoodOptions}
        isLoading={isMotherAddressLoading}
      />
      </>
      )}
    </div>
  );
}
