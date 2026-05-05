import { motion } from 'framer-motion';
import { User, FileText } from 'lucide-react';
import { FormField } from '@/components/public/shared';
import { SOURCE_LABELS } from './types';
import type { AdmissionAdditionalStepProps } from './types';

// ---------------------------------------------------------------------------
// Step 4: Additional Information
// ---------------------------------------------------------------------------

export function AdmissionAdditionalStep({
  register,
  watch,
  t,
  language,
  activeStudentTab,
  onTabSwitch,
  watchedNumberOfStudents,
  lockedFields,
  hasPsychoEvaluation,
  hasAcademicSupport,
  hasHealthIssues,
  hasAdaptationDifficulty,
}: AdmissionAdditionalStepProps) {
  return (
    <div className="space-y-6">
      {/* Student tabs for Step 4 */}
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

      <div key={activeStudentTab} className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5 md:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4 sm:mb-5 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
          {t.additionalInfo}
          {watchedNumberOfStudents > 1 && (
            <span className="text-primary-600 text-sm font-normal">
              ({watch(`students.${activeStudentTab}.fullName` as any)?.trim() || `${t.studentTab} ${activeStudentTab + 1}`})
            </span>
          )}
        </h3>

        <div className="space-y-5 sm:space-y-6">
          {/* Psycho Evaluation */}
          <div className="space-y-3">
            <FormField label={t.psychoEvaluation} required>
              <div className="flex gap-6">
                <label className="flex items-center gap-2.5 cursor-pointer py-1">
                  <input
                    type="radio"
                    value="YES"
                    {...register(`students.${activeStudentTab}.additionalInfo.hasPsychoEvaluation` as any, { required: t.required })}
                    className="w-5 h-5 text-primary-600"
                  />
                  <span className="text-sm sm:text-base">{t.yes}</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer py-1">
                  <input
                    type="radio"
                    value="NO"
                    {...register(`students.${activeStudentTab}.additionalInfo.hasPsychoEvaluation` as any, { required: t.required })}
                    className="w-5 h-5 text-primary-600"
                  />
                  <span className="text-sm sm:text-base">{t.no}</span>
                </label>
              </div>
            </FormField>
            {hasPsychoEvaluation === 'YES' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <textarea
                  {...register(`students.${activeStudentTab}.additionalInfo.psychoEvaluationDetails` as any)}
                  className="input resize-none"
                  rows={2}
                  placeholder={t.provideDetails}
                />
              </motion.div>
            )}
          </div>

          {/* Academic Support */}
          <div className="space-y-3">
            <FormField label={t.academicSupport} required>
              <div className="flex gap-6">
                <label className="flex items-center gap-2.5 cursor-pointer py-1">
                  <input
                    type="radio"
                    value="YES"
                    {...register(`students.${activeStudentTab}.additionalInfo.hasAcademicSupport` as any, { required: t.required })}
                    className="w-5 h-5 text-primary-600"
                  />
                  <span className="text-sm sm:text-base">{t.yes}</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer py-1">
                  <input
                    type="radio"
                    value="NO"
                    {...register(`students.${activeStudentTab}.additionalInfo.hasAcademicSupport` as any, { required: t.required })}
                    className="w-5 h-5 text-primary-600"
                  />
                  <span className="text-sm sm:text-base">{t.no}</span>
                </label>
              </div>
            </FormField>
            {hasAcademicSupport === 'YES' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <textarea
                  {...register(`students.${activeStudentTab}.additionalInfo.academicSupportDetails` as any)}
                  className="input resize-none"
                  rows={2}
                  placeholder={t.provideDetails}
                />
              </motion.div>
            )}
          </div>

          {/* Health Issues */}
          <div className="space-y-3">
            <FormField label={t.healthIssues} required>
              <div className="flex gap-6">
                <label className="flex items-center gap-2.5 cursor-pointer py-1">
                  <input
                    type="radio"
                    value="YES"
                    {...register(`students.${activeStudentTab}.additionalInfo.hasHealthIssues` as any, { required: t.required })}
                    className="w-5 h-5 text-primary-600"
                  />
                  <span className="text-sm sm:text-base">{t.yes}</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer py-1">
                  <input
                    type="radio"
                    value="NO"
                    {...register(`students.${activeStudentTab}.additionalInfo.hasHealthIssues` as any, { required: t.required })}
                    className="w-5 h-5 text-primary-600"
                  />
                  <span className="text-sm sm:text-base">{t.no}</span>
                </label>
              </div>
            </FormField>
            {hasHealthIssues === 'YES' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <textarea
                  {...register(`students.${activeStudentTab}.additionalInfo.healthIssuesDetails` as any)}
                  className="input resize-none"
                  rows={2}
                  placeholder={t.provideDetails}
                />
              </motion.div>
            )}
          </div>

          {/* Adaptation Difficulty */}
          <div className="space-y-3">
            <FormField label={t.adaptationDifficulty} required>
              <div className="flex gap-6">
                <label className="flex items-center gap-2.5 cursor-pointer py-1">
                  <input
                    type="radio"
                    value="YES"
                    {...register(`students.${activeStudentTab}.additionalInfo.hasAdaptationDifficulty` as any, { required: t.required })}
                    className="w-5 h-5 text-primary-600"
                  />
                  <span className="text-sm sm:text-base">{t.yes}</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer py-1">
                  <input
                    type="radio"
                    value="NO"
                    {...register(`students.${activeStudentTab}.additionalInfo.hasAdaptationDifficulty` as any, { required: t.required })}
                    className="w-5 h-5 text-primary-600"
                  />
                  <span className="text-sm sm:text-base">{t.no}</span>
                </label>
              </div>
            </FormField>
            {hasAdaptationDifficulty === 'YES' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <textarea
                  {...register(`students.${activeStudentTab}.additionalInfo.adaptationDifficultyDetails` as any)}
                  className="input resize-none"
                  rows={2}
                  placeholder={t.provideDetails}
                />
              </motion.div>
            )}
          </div>

          {/* Other Info - per student */}
          <FormField label={t.otherRelevantInfo}>
            <textarea
              {...register(`students.${activeStudentTab}.additionalInfo.otherRelevantInfo` as any)}
              className="input resize-none"
              rows={3}
              placeholder={t.otherRelevantInfo}
            />
          </FormField>

          {/* Source - Only show if not locked (shared, not per-student) */}
          {!lockedFields.source && (
            <FormField label={t.howDidYouHear}>
              <select {...register('source')} className="input max-w-xs">
                <option value="WEBSITE">{SOURCE_LABELS.WEBSITE[language === 'pt' ? 'pt' : 'en']}</option>
                <option value="REFERRAL">{SOURCE_LABELS.REFERRAL[language === 'pt' ? 'pt' : 'en']}</option>
                <option value="SOCIAL_MEDIA">{SOURCE_LABELS.SOCIAL_MEDIA[language === 'pt' ? 'pt' : 'en']}</option>
                <option value="EVENT">{SOURCE_LABELS.EVENT[language === 'pt' ? 'pt' : 'en']}</option>
                <option value="OTHER">{SOURCE_LABELS.OTHER[language === 'pt' ? 'pt' : 'en']}</option>
              </select>
            </FormField>
          )}
        </div>
      </div>
    </div>
  );
}
