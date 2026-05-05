import { User } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { gradeOptions, isFirstSchoolGrade } from '@/constants/grades';
import { getTodayString } from '@/utils/validation';
import { FormField } from '@/components/public/shared';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import type { AdmissionStudentStepProps } from './types';

// ---------------------------------------------------------------------------
// Admission-specific date validation (used only in this step)
// ---------------------------------------------------------------------------

const validateStudentDateOfBirth = (value: string | undefined): boolean | string => {
  if (!value) return true;
  const date = new Date(value + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) return 'future';
  const age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const effectiveAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate()) ? age - 1 : age;
  if (effectiveAge > 19) return 'range';
  return true;
};

// ---------------------------------------------------------------------------
// Step 1: Student Information
// ---------------------------------------------------------------------------

export function AdmissionStudentStep({
  register,
  control,
  watch,
  setValue,
  errors,
  t,
  activeStudentTab,
  onTabSwitch,
  watchedNumberOfStudents,
  lockedFields,
  isFirstSchool,
  nationalityOptions,
  handleNumberOfStudentsChange,
}: AdmissionStudentStepProps) {
  return (
    <div className="space-y-6">
      {/* Number of students selector */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5 md:p-6">
        <FormField label={t.numberOfStudents} required>
          <select
            {...register('numberOfStudents', { valueAsNumber: true })}
            className="input max-w-[200px]"
            onChange={(e) => {
              const newVal = parseInt(e.target.value, 10);
              setValue('numberOfStudents', newVal);
              handleNumberOfStudentsChange(newVal);
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </FormField>
      </div>

      {/* Student tabs - only show if more than 1 student */}
      {watchedNumberOfStudents > 1 && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {Array.from({ length: watchedNumberOfStudents }, (_, i) => {
            const studentName = watch(`students.${i}.fullName` as any);
            const hasErrors = !!(errors as any)?.students?.[i];
            return (
              <button
                key={i}
                type="button"
                onClick={() => onTabSwitch(i)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeStudentTab === i
                    ? 'bg-primary-600 text-white shadow-sm'
                    : hasErrors
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                {studentName?.trim() || `${t.studentTab} ${i + 1}`}
              </button>
            );
          })}
        </div>
      )}

      <div key={activeStudentTab} className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5 md:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-600 flex-shrink-0" />
            {t.studentInfo}
            {watchedNumberOfStudents > 1 && (
              <span className="text-primary-600 text-sm font-normal">
                ({watch(`students.${activeStudentTab}.fullName` as any)?.trim() || `${t.studentTab} ${activeStudentTab + 1}`})
              </span>
            )}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField label={t.studentType} required error={(errors as any)?.students?.[activeStudentTab]?.studentType?.message}>
            <select
              {...register(`students.${activeStudentTab}.studentType` as any, { required: t.required })}
              className="input"
            >
              <option value="NEW">{t.newStudent}</option>
              <option value="RETURNING">{t.returningStudent}</option>
              <option value="CURRENT">{t.currentRisStudent}</option>
            </select>
          </FormField>

          {!isFirstSchool && (
            <FormField label={t.currentGrade} required error={(errors as any)?.students?.[activeStudentTab]?.currentGrade?.message}>
              <Controller
                name={`students.${activeStudentTab}.currentGrade` as any}
                control={control}
                rules={{ required: !isFirstSchool ? t.required : false }}
                render={({ field }) => (
                  <div className="relative">
                    <select
                      value={field.value || ''}
                      onChange={field.onChange}
                      className="input"
                    >
                      <option value="">{t.select}</option>
                      {gradeOptions.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.en}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              />
            </FormField>
          )}

          <FormField label={t.fullName} required error={(errors as any)?.students?.[activeStudentTab]?.fullName?.message} className="sm:col-span-2">
            <input
              {...register(`students.${activeStudentTab}.fullName` as any, {
                required: t.required,
                minLength: { value: 3, message: t.minNameLength },
              })}
              className="input"
              placeholder={t.fullName}
            />
          </FormField>

          <FormField label={t.dateOfBirth} required error={(errors as any)?.students?.[activeStudentTab]?.dateOfBirth?.message}>
            <input
              type="date"
              max={getTodayString()}
              {...register(`students.${activeStudentTab}.dateOfBirth` as any, {
                required: t.required,
                validate: (value: string) => {
                  const result = validateStudentDateOfBirth(value);
                  if (result === 'future') return t.futureDateError;
                  if (result === 'range') return t.invalidDateRange;
                  return true;
                },
              })}
              className="input min-h-[44px] text-base"
            />
          </FormField>

          <FormField label={t.gender} required error={(errors as any)?.students?.[activeStudentTab]?.gender?.message}>
            <select
              {...register(`students.${activeStudentTab}.gender` as any, { required: t.required })}
              className="input"
            >
              <option value="">{t.select}</option>
              <option value="M">{t.male}</option>
              <option value="F">{t.female}</option>
            </select>
          </FormField>

          <FormField label={t.nationality}>
            <Controller
              name={`students.${activeStudentTab}.nationality` as any}
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  options={nationalityOptions}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder={t.select}
                  searchPlaceholder={t.search}
                />
              )}
            />
          </FormField>

          <FormField
            label={t.desiredGrade}
            required
            error={(errors as any)?.students?.[activeStudentTab]?.desiredGrade?.message}
            locked={lockedFields.desiredGrade}
            lockedHint={t.lockedBySchool}
          >
            <select
              {...register(`students.${activeStudentTab}.desiredGrade` as any, { required: t.required })}
              className={`input ${lockedFields.desiredGrade ? 'bg-neutral-100 cursor-not-allowed' : ''}`}
              disabled={lockedFields.desiredGrade}
            >
              <option value="">{t.select}</option>
              {gradeOptions.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.en}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>
    </div>
  );
}
