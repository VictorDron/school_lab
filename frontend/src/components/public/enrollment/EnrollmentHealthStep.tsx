import { User, Heart, Plus, Trash2 } from 'lucide-react';
import {
  BLOOD_TYPES,
  MEDICAL_CONDITIONS,
  ALLERGY_TYPES,
  FEVER_MEDICATIONS,
  PAIN_MEDICATIONS,
  RELATIONSHIP_OPTIONS,
} from '@/types/enrollment';
import { formatPhone } from '@/components/public/shared';
import type { EnrollmentHealthStepProps } from './types';

export function EnrollmentHealthStep({
  register,
  setValue,
  watch,
  language,
  fieldErrors,
  enrollmentStudents,
  activeStudentTab,
  onTabSwitch,
  watchHealth,
  emergencyContactFields,
  appendEmergencyContact,
  removeEmergencyContact,
  onMedicalConditionChange,
  onAllergyChange,
  onFeverMedicationChange,
  onPainMedicationChange,
  onCopyFromSibling,
}: EnrollmentHealthStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-neutral-900">
        {language === 'pt' ? 'Saúde' : 'Health'}
      </h2>

      {/* Student tabs for health step */}
      {enrollmentStudents.length > 1 && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {enrollmentStudents.map((s: any, i: number) => (
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
              {s.fullName || `${language === 'pt' ? 'Filho' : 'Child'} ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Copy health from sibling */}
      {enrollmentStudents.length > 1 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Heart className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm text-blue-800 whitespace-nowrap">
            {language === 'pt' ? 'Copiar dados de:' : 'Copy data from:'}
          </span>
          <select
            className="input py-1.5 text-sm flex-1 max-w-xs"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value !== '') {
                onCopyFromSibling(Number(e.target.value));
                e.target.value = '';
              }
            }}
          >
            <option value="">
              {language === 'pt' ? 'Selecione um irmão...' : 'Select a sibling...'}
            </option>
            {enrollmentStudents.map((s: any, i: number) =>
              i !== activeStudentTab ? (
                <option key={i} value={i}>
                  {s.fullName || `${language === 'pt' ? 'Filho' : 'Child'} ${i + 1}`}
                </option>
              ) : null
            )}
          </select>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-amber-800">
          {language === 'pt'
            ? 'Todos os campos marcados com (*) são obrigatórios. Selecione "Nenhum(a)" quando não houver condições a reportar.'
            : 'All fields marked with (*) are required. Select "None" when there are no conditions to report.'}
        </p>
      </div>

      {/* Physical Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Peso (kg)' : 'Weight (kg)'} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="1"
            max="200"
            {...register('health.weight')}
            className={`input ${fieldErrors['health.weight'] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            data-field-error={!!fieldErrors['health.weight']}
            placeholder="Ex: 35"
          />
          {fieldErrors['health.weight'] && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors['health.weight']}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Altura (cm)' : 'Height (cm)'} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="1"
            min="30"
            max="250"
            {...register('health.height')}
            className={`input ${fieldErrors['health.height'] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            data-field-error={!!fieldErrors['health.height']}
            placeholder="Ex: 140"
          />
          {fieldErrors['health.height'] && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors['health.height']}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Tipo Sanguíneo' : 'Blood Type'} <span className="text-red-500">*</span>
          </label>
          <select {...register('health.bloodType')} className="input">
            <option value="">{language === 'pt' ? 'Selecione...' : 'Select...'}</option>
            {BLOOD_TYPES.map((bt) => (
              <option key={bt.value} value={bt.value}>{bt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Medical Conditions */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {language === 'pt' ? 'Condições Médicas' : 'Medical Conditions'} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {MEDICAL_CONDITIONS.map((cond) => {
            const isChecked = watchHealth?.medicalConditions?.includes(cond.value);
            return (
              <label
                key={cond.value}
                className={`flex items-center gap-2 p-2 border rounded hover:bg-neutral-50 cursor-pointer ${isChecked ? 'bg-primary-50 border-primary-300' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked || false}
                  onChange={(e) => onMedicalConditionChange(cond.value, e.target.checked)}
                  className="rounded border-neutral-300"
                />
                <span className="text-sm">
                  {language === 'pt' ? cond.labelPt : cond.labelEn}
                </span>
              </label>
            );
          })}
        </div>
        {watchHealth?.medicalConditions?.length > 0 && !watchHealth?.medicalConditions?.includes('NONE') && (
          <textarea
            {...register('health.medicalConditionsNotes')}
            className="input mt-2"
            rows={2}
            placeholder={language === 'pt' ? 'Detalhes sobre as condições...' : 'Details about conditions...'}
          />
        )}
      </div>

      {/* Hospitalizations */}
      <div>
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register('health.hasHospitalizations')} className="rounded border-neutral-300" />
          <span className="text-sm font-medium text-neutral-700">
            {language === 'pt' ? 'Hospitalizações ou cirurgias anteriores' : 'Previous hospitalizations or surgeries'}
          </span>
        </label>
        {watchHealth?.hasHospitalizations && (
          <textarea
            {...register('health.hospitalizationsNotes')}
            className="input mt-2"
            rows={2}
            placeholder={language === 'pt' ? 'Descreva...' : 'Describe...'}
          />
        )}
      </div>

      {/* Seizures */}
      <div>
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register('health.hasSeizures')} className="rounded border-neutral-300" />
          <span className="text-sm font-medium text-neutral-700">
            {language === 'pt' ? 'Convulsões ou desmaios' : 'Seizures or fainting'}
          </span>
        </label>
        {watchHealth?.hasSeizures && (
          <textarea
            {...register('health.seizuresNotes')}
            className="input mt-2"
            rows={2}
            placeholder={language === 'pt' ? 'Descreva...' : 'Describe...'}
          />
        )}
      </div>

      {/* Allergies */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {language === 'pt' ? 'Alergias' : 'Allergies'} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ALLERGY_TYPES.map((allergy) => {
            const isChecked = watchHealth?.allergies?.includes(allergy.value);
            return (
              <label
                key={allergy.value}
                className={`flex items-center gap-2 p-2 border rounded hover:bg-neutral-50 cursor-pointer ${isChecked ? 'bg-primary-50 border-primary-300' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked || false}
                  onChange={(e) => onAllergyChange(allergy.value, e.target.checked)}
                  className="rounded border-neutral-300"
                />
                <span className="text-sm">
                  {language === 'pt' ? allergy.labelPt : allergy.labelEn}
                </span>
              </label>
            );
          })}
        </div>
        {watchHealth?.allergies?.length > 0 && !watchHealth?.allergies?.includes('NONE') && (
          <textarea
            {...register('health.allergiesNotes')}
            className="input mt-2"
            rows={2}
            placeholder={language === 'pt' ? 'Especifique as alergias...' : 'Specify allergies...'}
          />
        )}
      </div>

      {/* Medications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {language === 'pt' ? 'Medicamentos autorizados para febre' : 'Authorized fever medications'} <span className="text-red-500">*</span>
          </label>
          <div className="space-y-1">
            {FEVER_MEDICATIONS.map((med) => {
              const isChecked = watchHealth?.feverMedications?.includes(med.value);
              return (
                <label
                  key={med.value}
                  className={`flex items-center gap-2 p-2 border rounded hover:bg-neutral-50 cursor-pointer ${isChecked ? 'bg-primary-50 border-primary-300' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked || false}
                    onChange={(e) => onFeverMedicationChange(med.value, e.target.checked)}
                    className="rounded border-neutral-300"
                  />
                  <span className="text-sm">
                    {language === 'pt' ? med.labelPt : med.labelEn}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {language === 'pt' ? 'Medicamentos autorizados para dor' : 'Authorized pain medications'} <span className="text-red-500">*</span>
          </label>
          <div className="space-y-1">
            {PAIN_MEDICATIONS.map((med) => {
              const isChecked = watchHealth?.painMedications?.includes(med.value);
              return (
                <label
                  key={med.value}
                  className={`flex items-center gap-2 p-2 border rounded hover:bg-neutral-50 cursor-pointer ${isChecked ? 'bg-primary-50 border-primary-300' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked || false}
                    onChange={(e) => onPainMedicationChange(med.value, e.target.checked)}
                    className="rounded border-neutral-300"
                  />
                  <span className="text-sm">
                    {language === 'pt' ? med.labelPt : med.labelEn}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {language === 'pt' ? 'Restrições a medicamentos' : 'Medication restrictions'}
        </label>
        <textarea {...register('health.medicationRestrictions')} className="input" rows={2} placeholder={language === 'pt' ? 'Caso não haja, deixe em branco' : 'Leave blank if none'} />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {language === 'pt' ? 'Medicamentos de uso regular' : 'Regular medications'}
        </label>
        <textarea {...register('health.regularMedications')} className="input" rows={2} placeholder={language === 'pt' ? 'Caso não haja, deixe em branco' : 'Leave blank if none'} />
      </div>

      {/* Emergency Contacts */}
      <hr className="my-6" />
      <h3 className="text-lg font-medium text-neutral-900">
        {language === 'pt' ? 'Contatos de Emergência' : 'Emergency Contacts'} <span className="text-red-500">*</span>
      </h3>
      <p className="text-sm text-neutral-500 mb-1">
        {language === 'pt'
          ? 'É necessário cadastrar pelo menos um contato de emergência. Todos os campos são obrigatórios.'
          : 'At least one emergency contact is required. All fields are mandatory.'}
      </p>
      <p className="text-sm font-semibold text-amber-600 mb-2">
        {language === 'pt'
          ? 'O contato de emergência não pode ser o pai ou a mãe do aluno.'
          : 'The emergency contact cannot be the student\'s father or mother.'}
      </p>

      {emergencyContactFields.map((field, index) => (
        <div key={field.id} className="border rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">
              {language === 'pt' ? `Contato ${index + 1}` : `Contact ${index + 1}`}
            </span>
            {index > 0 && (
              <button type="button" onClick={() => removeEmergencyContact(index)} className="text-red-500 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {language === 'pt' ? 'Nome completo' : 'Full name'} <span className="text-red-500">*</span>
              </label>
              <input
                {...register(`emergencyContacts.${index}.name` as const, { required: true })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {language === 'pt' ? 'Telefone' : 'Phone'} <span className="text-red-500">*</span>
              </label>
              <input
                {...register(`emergencyContacts.${index}.phone` as const, { required: true })}
                className="input"
                onChange={(e) => setValue(`emergencyContacts.${index}.phone`, formatPhone(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                {...register(`emergencyContacts.${index}.email` as const, { required: true })}
                className="input"
                type="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {language === 'pt' ? 'Parentesco' : 'Relationship'} <span className="text-red-500">*</span>
              </label>
              <select {...register(`emergencyContacts.${index}.relationship` as const, { required: true })} className="input">
                <option value="">{language === 'pt' ? 'Selecione...' : 'Select...'}</option>
                {RELATIONSHIP_OPTIONS.map((rel) => (
                  <option key={rel.value} value={rel.value}>
                    {language === 'pt' ? rel.labelPt : rel.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}

      {emergencyContactFields.length < 3 && (
        <button
          type="button"
          onClick={() => appendEmergencyContact({ name: '', phone: '', email: '', relationship: '', isPrimary: false })}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
        >
          <Plus className="w-4 h-4" />
          {language === 'pt' ? 'Adicionar contato' : 'Add contact'}
        </button>
      )}

      {/* Health Plan */}
      <hr className="my-6" />
      <h3 className="text-lg font-medium text-neutral-900">
        {language === 'pt' ? 'Plano de Saúde' : 'Health Plan'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Operadora' : 'Operator'}
          </label>
          <input {...register('healthPlan.operator')} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Código do beneficiário' : 'Beneficiary code'}
          </label>
          <input {...register('healthPlan.beneficiaryCode')} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Tipo do plano' : 'Plan type'}
          </label>
          <input {...register('healthPlan.planType')} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Hospital preferido na Barra' : 'Preferred hospital in Barra'}
          </label>
          <input {...register('healthPlan.preferredHospital')} className="input" />
        </div>
      </div>
    </div>
  );
}
