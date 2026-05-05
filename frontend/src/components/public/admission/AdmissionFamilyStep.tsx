import { motion } from 'framer-motion';
import { Plus, Trash2, MapPin, Mail, AlertCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { gradeOptions } from '@/constants/grades';
import { validateCPF, validateEmail, validateNotFutureDate, getTodayString } from '@/utils/validation';
import { FormField, formatCPF, formatPhone, formatZipCode } from '@/components/public/shared';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import type { AdmissionFamilyStepProps } from './types';

// ---------------------------------------------------------------------------
// Admission-specific phone validation (used only in this step)
// ---------------------------------------------------------------------------

const validatePhone = (value: string | undefined): boolean => {
  if (!value) return true;
  const numbers = value.replace(/\D/g, '');
  return numbers.length >= 10;
};

// ---------------------------------------------------------------------------
// Step 2: Family Information
// ---------------------------------------------------------------------------

export function AdmissionFamilyStep({
  register,
  control,
  watch,
  setValue,
  errors,
  t,
  language,
  livesWith,
  siblingFields,
  appendSibling,
  removeSibling,
  isLoadingAddress,
  watchedCountry,
  watchedState,
  watchedCity,
  stateOptions,
  cityOptions,
  neighborhoodOptions,
  countryOptions,
}: AdmissionFamilyStepProps) {
  return (
    <div className="space-y-6">
      {/* Father's Info */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5 md:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4 sm:mb-5">{t.fatherInfo}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField label={t.name} required error={(errors as any).father?.name?.message} className="sm:col-span-2">
            <input
              {...register('father.name', {
                required: t.required,
                minLength: { value: 3, message: t.minNameLength },
              })}
              className="input"
              placeholder={t.name}
            />
          </FormField>

          <FormField label={t.cpf} required error={(errors as any).father?.cpf?.message}>
            <input
              {...register('father.cpf', {
                required: t.required,
                validate: (value) => validateCPF(value) === true || t.invalidCpf,
              })}
              className="input"
              placeholder="000.000.000-00"
              inputMode="numeric"
              onChange={(e) => setValue('father.cpf', formatCPF(e.target.value), { shouldValidate: true })}
            />
          </FormField>

          <FormField label={t.email} required error={(errors as any).father?.email?.message}>
            <input
              type="email"
              {...register('father.email', {
                required: t.required,
                validate: (value) => validateEmail(value) || t.invalidEmail,
              })}
              className="input"
              placeholder="email@exemplo.com"
              inputMode="email"
            />
          </FormField>

          <FormField label={t.phone} required error={(errors as any).father?.phone?.message} className="sm:col-span-2">
            <input
              {...register('father.phone', {
                required: t.required,
                validate: (value) => validatePhone(value) || t.invalidPhone,
              })}
              className="input"
              placeholder="(00) 00000-0000"
              inputMode="tel"
              onChange={(e) => setValue('father.phone', formatPhone(e.target.value), { shouldValidate: true })}
            />
          </FormField>
        </div>
      </div>

      {/* Mother's Info */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5 md:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4 sm:mb-5">{t.motherInfo}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField label={t.name} required error={(errors as any).mother?.name?.message} className="sm:col-span-2">
            <input
              {...register('mother.name', {
                required: t.required,
                minLength: { value: 3, message: t.minNameLength },
              })}
              className="input"
              placeholder={t.name}
            />
          </FormField>

          <FormField label={t.cpf} required error={(errors as any).mother?.cpf?.message}>
            <input
              {...register('mother.cpf', {
                required: t.required,
                validate: (value) => validateCPF(value) === true || t.invalidCpf,
              })}
              className="input"
              placeholder="000.000.000-00"
              inputMode="numeric"
              onChange={(e) => setValue('mother.cpf', formatCPF(e.target.value), { shouldValidate: true })}
            />
          </FormField>

          <FormField label={t.email} required error={(errors as any).mother?.email?.message}>
            <input
              type="email"
              {...register('mother.email', {
                required: t.required,
                validate: (value) => validateEmail(value) || t.invalidEmail,
              })}
              className="input"
              placeholder="email@exemplo.com"
              inputMode="email"
            />
          </FormField>

          <FormField label={t.phone} required error={(errors as any).mother?.phone?.message} className="sm:col-span-2">
            <input
              {...register('mother.phone', {
                required: t.required,
                validate: (value) => validatePhone(value) || t.invalidPhone,
              })}
              className="input"
              placeholder="(00) 00000-0000"
              inputMode="tel"
              onChange={(e) => setValue('mother.phone', formatPhone(e.target.value), { shouldValidate: true })}
            />
          </FormField>
        </div>
      </div>

      {/* Living Situation */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5 md:p-6">
        <FormField label={t.livesWith} required>
          <select
            {...register('livesWith', { required: t.required })}
            className="input w-full sm:max-w-xs"
          >
            <option value="BOTH">{t.bothParents}</option>
            <option value="FATHER">{t.withFather}</option>
            <option value="MOTHER">{t.withMother}</option>
            <option value="OTHER">{t.otherGuardian}</option>
          </select>
        </FormField>

        {livesWith === 'OTHER' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <FormField label={t.guardianInfo}>
              <input
                {...register('guardianInfo')}
                className="input"
                placeholder={t.guardianInfo}
              />
            </FormField>
          </motion.div>
        )}
      </div>

      {/* Notification Contact Preference */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5 md:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-1 flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary-600 flex-shrink-0" />
          {t.notificationContact}
        </h3>
        <p className="text-xs text-neutral-400 mb-4">{t.notificationOptional}</p>
        <div className="flex flex-wrap gap-4">
          {(['FATHER', 'MOTHER', 'BOTH'] as const).map((option) => (
            <label key={option} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={option}
                {...register('notificationPreference')}
                className="w-4 h-4 accent-[#0aacce]"
              />
              <span className="text-sm text-neutral-700">
                {option === 'FATHER' ? t.notificationFather :
                 option === 'MOTHER' ? t.notificationMother :
                 t.notificationBoth}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5 md:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4 sm:mb-5 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary-600 flex-shrink-0" />
          {t.addressInfo}
        </h3>

        {/* CEP and Country row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <FormField label={t.country} required error={(errors as any).address?.country?.message}>
            <Controller
              name="address.country"
              control={control}
              rules={{ required: t.required }}
              render={({ field }) => (
                <SearchableSelect
                  options={countryOptions}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder={t.select}
                  searchPlaceholder={t.search}
                />
              )}
            />
          </FormField>

          <FormField label={t.zipCode} required error={(errors as any).address?.zipCode?.message}>
            <div className="relative">
              <input
                {...register('address.zipCode', { required: t.required })}
                className="input pr-10"
                placeholder={watchedCountry === 'BR' ? '00000-000' : 'Zip Code'}
                onChange={(e) => {
                  const formatted = watchedCountry === 'BR'
                    ? formatZipCode(e.target.value)
                    : e.target.value;
                  setValue('address.zipCode', formatted);
                }}
              />
              {isLoadingAddress && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary-600" />
              )}
            </div>
            {watchedCountry === 'BR' && (
              <p className="text-xs text-neutral-400 mt-1">
                {language === 'pt'
                  ? 'Digite o CEP para preencher automaticamente'
                  : 'Enter ZIP code to auto-fill address'}
              </p>
            )}
          </FormField>

          {/* State - dynamic dropdown for Brazil, text input for other countries */}
          <FormField label={t.state} required error={(errors as any).address?.state?.message}>
            {watchedCountry === 'BR' ? (
              <Controller
                name="address.state"
                control={control}
                rules={{ required: t.required }}
                render={({ field }) => (
                  <SearchableSelect
                    options={stateOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder={t.select}
                    searchPlaceholder={t.search}
                  />
                )}
              />
            ) : (
              <input
                {...register('address.state', { required: t.required })}
                className="input"
                placeholder={t.state}
              />
            )}
          </FormField>
        </div>

        {/* City and Neighborhood row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <FormField label={t.city} required error={(errors as any).address?.city?.message}>
            {watchedCountry === 'BR' && cityOptions.length > 0 ? (
              <Controller
                name="address.city"
                control={control}
                rules={{ required: t.required }}
                render={({ field }) => (
                  <SearchableSelect
                    options={cityOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder={t.select}
                    searchPlaceholder={t.search}
                    allowCustomValue
                    customValueLabel={t.useCustomValue}
                  />
                )}
              />
            ) : (
              <input
                {...register('address.city', { required: t.required })}
                className="input"
                placeholder={t.city}
              />
            )}
          </FormField>

          <FormField label={t.neighborhood} required error={(errors as any).address?.neighborhood?.message}>
            {watchedCountry === 'BR' && neighborhoodOptions.length > 0 ? (
              <Controller
                name="address.neighborhood"
                control={control}
                rules={{ required: t.required }}
                render={({ field }) => (
                  <SearchableSelect
                    options={neighborhoodOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder={t.select}
                    searchPlaceholder={t.search}
                    allowCustomValue
                    customValueLabel={t.useCustomValue}
                  />
                )}
              />
            ) : (
              <input
                {...register('address.neighborhood', { required: t.required })}
                className="input"
                placeholder={t.neighborhood}
              />
            )}
          </FormField>
        </div>

        {/* Street, Number, Complement row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <FormField label={t.street} required error={(errors as any).address?.street?.message} className="col-span-2">
            <input
              {...register('address.street', { required: t.required })}
              className="input"
              placeholder={t.street}
            />
          </FormField>

          <FormField label={t.number} required error={(errors as any).address?.number?.message}>
            <input
              {...register('address.number', { required: t.required })}
              className="input"
              placeholder={t.number}
              inputMode="numeric"
            />
          </FormField>

          <FormField label={t.complement}>
            <input
              {...register('address.complement')}
              className="input"
              placeholder={t.complement}
            />
          </FormField>
        </div>
      </div>

      {/* Siblings */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900">
              {t.siblingsInfo}
            </h3>
          </div>
          {siblingFields.length < 3 && (
            <button
              type="button"
              onClick={() => appendSibling({ name: '', cpf: '', dateOfBirth: '', grade: '' })}
              className="btn btn-outline btn-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              {t.add}
            </button>
          )}
        </div>

        {/* Optional callout banner */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-sm font-semibold text-blue-700">{t.siblingsOptional}</span>
            <p className="text-xs sm:text-sm text-blue-600 mt-0.5">{t.siblingsHint}</p>
          </div>
        </div>

        {siblingFields.length === 0 ? (
          <p className="text-neutral-400 text-sm text-center py-4">{t.noSiblings}</p>
        ) : (
          <div className="space-y-4">
            {siblingFields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 sm:p-4 bg-neutral-50 rounded-lg"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <FormField label={t.siblingName} required error={(errors as any).siblings?.[index]?.name?.message}>
                    <input
                      {...register(`siblings.${index}.name`, {
                        required: t.required,
                        minLength: { value: 3, message: t.minNameLength },
                      })}
                      className="input"
                      placeholder={t.siblingName}
                    />
                  </FormField>
                  <FormField label={t.siblingCpf} required error={(errors as any).siblings?.[index]?.cpf?.message}>
                    <input
                      {...register(`siblings.${index}.cpf`, {
                        required: t.required,
                        validate: (value) => validateCPF(value) === true || t.invalidCpf,
                      })}
                      className="input"
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                      onChange={(e) => setValue(`siblings.${index}.cpf`, formatCPF(e.target.value), { shouldValidate: true })}
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label={t.siblingDob} required error={(errors as any).siblings?.[index]?.dateOfBirth?.message}>
                    <input
                      type="date"
                      max={getTodayString()}
                      {...register(`siblings.${index}.dateOfBirth`, {
                        required: t.required,
                        validate: (value) => validateNotFutureDate(value) || t.futureDateError,
                      })}
                      className="input"
                    />
                  </FormField>
                  <FormField label={t.siblingGrade} required error={(errors as any).siblings?.[index]?.grade?.message}>
                    <select
                      {...register(`siblings.${index}.grade`, { required: t.required })}
                      className="input"
                    >
                      <option value="">{t.select}</option>
                      {gradeOptions.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.en}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeSibling(index)}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg mb-0.5 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
