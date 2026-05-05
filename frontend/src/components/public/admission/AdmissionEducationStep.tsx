import { motion } from 'framer-motion';
import { User, Plus, Trash2, GraduationCap } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { isFirstSchoolGrade, isMayBeFirstSchoolGrade } from '@/constants/grades';
import { FormField } from '@/components/public/shared';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import type { AdmissionEducationStepProps } from './types';

// ---------------------------------------------------------------------------
// Step 3: Languages & Education History
// ---------------------------------------------------------------------------

export function AdmissionEducationStep({
  register,
  control,
  watch,
  setValue,
  getValues,
  errors,
  t,
  activeStudentTab,
  onTabSwitch,
  watchedNumberOfStudents,
  languageOptions,
  countryOptions,
  getCityOptionsForIndex,
}: AdmissionEducationStepProps) {
  return (
    <div className="space-y-6">
      {/* Student tabs for Step 3 */}
      {watchedNumberOfStudents > 1 && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {Array.from({ length: watchedNumberOfStudents }, (_, i) => {
            const studentName = watch(`students.${i}.fullName` as any);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onTabSwitch(i)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeStudentTab === i
                    ? 'bg-primary-600 text-white shadow-sm'
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

      {/* Per-student Languages */}
      <div key={`lang-${activeStudentTab}`} className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5 md:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4 sm:mb-5">
          {t.languagesInfo}
          {watchedNumberOfStudents > 1 && (
            <span className="text-primary-600 text-sm font-normal ml-2">
              ({watch(`students.${activeStudentTab}.fullName` as any)?.trim() || `${t.studentTab} ${activeStudentTab + 1}`})
            </span>
          )}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField label={t.studentNativeLanguage} required error={(errors as any)?.students?.[activeStudentTab]?.primaryLanguage?.message}>
            <Controller
              name={`students.${activeStudentTab}.primaryLanguage` as any}
              control={control}
              rules={{ required: t.required }}
              render={({ field }) => (
                <SearchableSelect
                  options={languageOptions}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder={t.select}
                  searchPlaceholder={t.search}
                />
              )}
            />
          </FormField>

          <FormField label={t.studentOtherLanguages}>
            <Controller
              name={`students.${activeStudentTab}.otherLanguages` as any}
              control={control}
              render={({ field }) => {
                const languages: string[] = Array.isArray(field.value) ? field.value : [''];
                const selectedValues = languages.filter(Boolean);
                return (
                  <div className="space-y-2">
                    {languages.map((lang: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1">
                          <SearchableSelect
                            options={languageOptions.filter(
                              opt => !selectedValues.includes(opt.value) || opt.value === lang
                            )}
                            value={lang || ''}
                            onChange={(val) => {
                              const updated = [...languages];
                              updated[idx] = val;
                              field.onChange(updated);
                            }}
                            placeholder={t.select}
                            searchPlaceholder={t.search}
                          />
                        </div>
                        {languages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = languages.filter((_, i) => i !== idx);
                              field.onChange(updated.length > 0 ? updated : ['']);
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {languages.length < 5 && (
                      <button
                        type="button"
                        onClick={() => field.onChange([...languages, ''])}
                        className="btn btn-outline btn-sm"
                      >
                        <Plus className="w-4 h-4" />
                        {t.addLanguage}
                      </button>
                    )}
                  </div>
                );
              }}
            />
          </FormField>

          <FormField label={t.motherNativeLanguage} required error={(errors as any).languages?.motherNative?.message}>
            <Controller
              name="languages.motherNative"
              control={control}
              rules={{ required: t.required }}
              render={({ field }) => (
                <SearchableSelect
                  options={languageOptions}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder={t.select}
                  searchPlaceholder={t.search}
                />
              )}
            />
          </FormField>

          <FormField label={t.fatherNativeLanguage} required error={(errors as any).languages?.fatherNative?.message}>
            <Controller
              name="languages.fatherNative"
              control={control}
              rules={{ required: t.required }}
              render={({ field }) => (
                <SearchableSelect
                  options={languageOptions}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder={t.select}
                  searchPlaceholder={t.search}
                />
              )}
            />
          </FormField>
        </div>
      </div>

      {/* Per-student Education History */}
      {(() => {
        const studentGrade = watch(`students.${activeStudentTab}.desiredGrade` as any) || '';
        const studentIsFirstSchool = isFirstSchoolGrade(studentGrade);
        const studentMayBeFirstSchool = isMayBeFirstSchoolGrade(studentGrade);

        if (studentIsFirstSchool || studentMayBeFirstSchool) {
          return null;
        }

        const studentEduHistory = watch(`students.${activeStudentTab}.educationHistory` as any) || [];

        return (
          <div key={`edu-${activeStudentTab}`} className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  {t.educationHistory}
                  {watchedNumberOfStudents > 1 && (
                    <span className="text-primary-600 text-sm font-normal">
                      ({watch(`students.${activeStudentTab}.fullName` as any)?.trim() || `${t.studentTab} ${activeStudentTab + 1}`})
                    </span>
                  )}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1">{t.educationHint}</p>
              </div>
              {studentEduHistory.length < 3 && (
                <button
                  type="button"
                  onClick={() => {
                    const current = getValues(`students.${activeStudentTab}.educationHistory` as any) || [];
                    setValue(`students.${activeStudentTab}.educationHistory` as any, [
                      ...current,
                      { schoolName: '', country: 'BR', city: '', gradesAttended: '' },
                    ]);
                  }}
                  className="btn btn-outline btn-sm self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  {t.add}
                </button>
              )}
            </div>

            {studentEduHistory.length === 0 ? (
              <p className="text-neutral-400 text-sm text-center py-4">{t.noSchools}</p>
            ) : (
              <div className="space-y-4">
                {studentEduHistory.map((_: any, index: number) => (
                  <motion.div
                    key={`edu-${activeStudentTab}-${index}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 sm:p-4 bg-neutral-50 rounded-lg"
                  >
                    <div className="mb-3">
                      <FormField
                        label={t.schoolName}
                        required={index === 0}
                      >
                        <input
                          {...register(`students.${activeStudentTab}.educationHistory.${index}.schoolName` as any, {
                            required: index === 0 ? t.required : false,
                          })}
                          className="input"
                          placeholder={t.schoolName}
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <FormField label={t.schoolCountry}>
                        <Controller
                          name={`students.${activeStudentTab}.educationHistory.${index}.country` as any}
                          control={control}
                          render={({ field: countryField }) => (
                            <SearchableSelect
                              options={countryOptions}
                              value={countryField.value || ''}
                              onChange={(value) => {
                                countryField.onChange(value);
                                setValue(`students.${activeStudentTab}.educationHistory.${index}.city` as any, '');
                              }}
                              placeholder={t.select}
                              searchPlaceholder={t.search}
                            />
                          )}
                        />
                      </FormField>

                      <FormField label={t.schoolCity}>
                        <Controller
                          name={`students.${activeStudentTab}.educationHistory.${index}.city` as any}
                          control={control}
                          render={({ field: cityField }) => {
                            const currentCountry = watch(`students.${activeStudentTab}.educationHistory.${index}.country` as any) || 'BR';
                            const eduCityOptions = getCityOptionsForIndex(currentCountry);

                            if (eduCityOptions.length === 0) {
                              return (
                                <input
                                  value={cityField.value || ''}
                                  onChange={(e) => cityField.onChange(e.target.value)}
                                  className="input"
                                  placeholder={t.schoolCity}
                                />
                              );
                            }

                            return (
                              <SearchableSelect
                                options={eduCityOptions}
                                value={cityField.value || ''}
                                onChange={cityField.onChange}
                                placeholder={t.select}
                                searchPlaceholder={t.search}
                              />
                            );
                          }}
                        />
                      </FormField>

                      <div className="flex items-end gap-2">
                        <FormField label={t.gradesAttended} className="flex-1">
                          <input
                            {...register(`students.${activeStudentTab}.educationHistory.${index}.gradesAttended` as any)}
                            className="input"
                            placeholder={t.gradesAttended}
                          />
                        </FormField>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const current = getValues(`students.${activeStudentTab}.educationHistory` as any) || [];
                              setValue(
                                `students.${activeStudentTab}.educationHistory` as any,
                                current.filter((_: any, i: number) => i !== index)
                              );
                            }}
                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg mb-0.5 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
