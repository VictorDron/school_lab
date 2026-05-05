import type { Dispatch, SetStateAction } from 'react';
import { Heart } from 'lucide-react';
import {
  ALLERGY_TYPES,
  BLOOD_TYPES,
  FEVER_MEDICATIONS,
  MEDICAL_CONDITIONS,
  PAIN_MEDICATIONS,
} from '@/types/enrollment';
import type { ReEnrollmentChildHealth } from '@/types/re-enrollment';
import { SectionCard, FormField } from '../components';
import {
  inputClass,
  selectClass,
  checkboxClass,
  checkboxCardClass,
  checkboxCardActiveClass,
} from '../types';

type ChecklistField = 'medicalConditions' | 'allergies' | 'feverMedications' | 'painMedications';

interface HealthSectionProps {
  health: Partial<ReEnrollmentChildHealth>;
  setHealth: Dispatch<SetStateAction<Partial<ReEnrollmentChildHealth>>>;
  handleExclusiveCheckbox: (field: ChecklistField, value: string, checked: boolean) => void;
  hasError: (field: string) => boolean;
  validationErrors: Record<string, string>;
  setValidationErrors: Dispatch<SetStateAction<Record<string, string>>>;
}

function clearError(
  setValidationErrors: Dispatch<SetStateAction<Record<string, string>>>,
  key: string
) {
  setValidationErrors((v) => {
    const { [key]: _removed, ...rest } = v;
    return rest;
  });
}

export function HealthSection({
  health,
  setHealth,
  handleExclusiveCheckbox,
  hasError,
  validationErrors,
  setValidationErrors,
}: HealthSectionProps) {
  return (
    <SectionCard icon={Heart} title="Saúde">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <FormField label="Peso (kg)" required>
          <input
            className={`${inputClass} ${hasError('health.weight') ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            data-error={hasError('health.weight') ? 'true' : undefined}
            value={health.weight || ''}
            onChange={(e) => {
              setHealth((h) => ({ ...h, weight: e.target.value }));
              clearError(setValidationErrors, 'health.weight');
            }}
            placeholder="Ex: 35"
          />
          {hasError('health.weight') && <p className="text-xs text-red-500 mt-1">{validationErrors['health.weight']}</p>}
        </FormField>
        <FormField label="Altura (cm)" required>
          <input
            className={`${inputClass} ${hasError('health.height') ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            data-error={hasError('health.height') ? 'true' : undefined}
            value={health.height || ''}
            onChange={(e) => {
              setHealth((h) => ({ ...h, height: e.target.value }));
              clearError(setValidationErrors, 'health.height');
            }}
            placeholder="Ex: 140"
          />
          {hasError('health.height') && <p className="text-xs text-red-500 mt-1">{validationErrors['health.height']}</p>}
        </FormField>
        <FormField label="Tipo sanguíneo" required>
          <select
            className={`${selectClass} ${hasError('health.bloodType') ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            data-error={hasError('health.bloodType') ? 'true' : undefined}
            value={health.bloodType || ''}
            onChange={(e) => {
              setHealth((h) => ({ ...h, bloodType: e.target.value }));
              clearError(setValidationErrors, 'health.bloodType');
            }}
          >
            <option value="">Selecione...</option>
            {BLOOD_TYPES.map((bt) => (
              <option key={bt.value} value={bt.value}>
                {bt.label}
              </option>
            ))}
          </select>
          {hasError('health.bloodType') && <p className="text-xs text-red-500 mt-1">{validationErrors['health.bloodType']}</p>}
        </FormField>
      </div>

      <div className="space-y-6">
        <div>
          <FormField label="Condições médicas" required>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {MEDICAL_CONDITIONS.map((mc) => {
                const isChecked = health.medicalConditions?.includes(mc.value) || false;
                return (
                  <label
                    key={mc.value}
                    className={`${checkboxCardClass} ${isChecked ? checkboxCardActiveClass : ''}`}
                  >
                    <input
                      type="checkbox"
                      className={checkboxClass}
                      checked={isChecked}
                      onChange={(e) => {
                        handleExclusiveCheckbox('medicalConditions', mc.value, e.target.checked);
                        clearError(setValidationErrors, 'health.medicalConditions');
                      }}
                    />
                    <span className="text-sm">{mc.labelPt}</span>
                  </label>
                );
              })}
            </div>
          </FormField>
          {hasError('health.medicalConditions') && (
            <p className="text-xs text-red-500 mt-1">{validationErrors['health.medicalConditions']}</p>
          )}
          {health.medicalConditions?.length && !health.medicalConditions.includes('NONE') ? (
            <textarea
              className={`${inputClass} mt-2`}
              rows={2}
              value={health.medicalConditionsNotes || ''}
              onChange={(e) => setHealth((h) => ({ ...h, medicalConditionsNotes: e.target.value }))}
              placeholder="Detalhes sobre as condições médicas..."
            />
          ) : null}
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className={checkboxClass}
              checked={health.hasHospitalizations || false}
              onChange={(e) => setHealth((h) => ({ ...h, hasHospitalizations: e.target.checked }))}
            />
            <span className="text-sm font-medium text-neutral-700">Hospitalizações ou cirurgias anteriores</span>
          </label>
          {health.hasHospitalizations && (
            <textarea
              className={`${inputClass} mt-2`}
              rows={2}
              value={health.hospitalizationsNotes || ''}
              onChange={(e) => setHealth((h) => ({ ...h, hospitalizationsNotes: e.target.value }))}
              placeholder="Descreva as hospitalizações ou cirurgias..."
            />
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className={checkboxClass}
              checked={health.hasSeizures || false}
              onChange={(e) => setHealth((h) => ({ ...h, hasSeizures: e.target.checked }))}
            />
            <span className="text-sm font-medium text-neutral-700">Convulsões ou desmaios</span>
          </label>
          {health.hasSeizures && (
            <textarea
              className={`${inputClass} mt-2`}
              rows={2}
              value={health.seizuresNotes || ''}
              onChange={(e) => setHealth((h) => ({ ...h, seizuresNotes: e.target.value }))}
              placeholder="Descreva os episódios..."
            />
          )}
        </div>

        <div>
          <FormField label="Alergias" required>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ALLERGY_TYPES.map((al) => {
                const isChecked = health.allergies?.includes(al.value) || false;
                return (
                  <label
                    key={al.value}
                    className={`${checkboxCardClass} ${isChecked ? checkboxCardActiveClass : ''}`}
                  >
                    <input
                      type="checkbox"
                      className={checkboxClass}
                      checked={isChecked}
                      onChange={(e) => {
                        handleExclusiveCheckbox('allergies', al.value, e.target.checked);
                        clearError(setValidationErrors, 'health.allergies');
                      }}
                    />
                    <span className="text-sm">{al.labelPt}</span>
                  </label>
                );
              })}
            </div>
          </FormField>
          {hasError('health.allergies') && (
            <p className="text-xs text-red-500 mt-1">{validationErrors['health.allergies']}</p>
          )}
          {health.allergies?.length && !health.allergies.includes('NONE') ? (
            <textarea
              className={`${inputClass} mt-2`}
              rows={2}
              value={health.allergiesNotes || ''}
              onChange={(e) => setHealth((h) => ({ ...h, allergiesNotes: e.target.value }))}
              placeholder="Especifique as alergias..."
            />
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FormField label="Medicamentos autorizados para febre" required>
              <div className="space-y-1">
                {FEVER_MEDICATIONS.map((fm) => {
                  const isChecked = health.feverMedications?.includes(fm.value) || false;
                  return (
                    <label
                      key={fm.value}
                      className={`${checkboxCardClass} ${isChecked ? checkboxCardActiveClass : ''}`}
                    >
                      <input
                        type="checkbox"
                        className={checkboxClass}
                        checked={isChecked}
                        onChange={(e) => {
                          handleExclusiveCheckbox('feverMedications', fm.value, e.target.checked);
                          clearError(setValidationErrors, 'health.feverMedications');
                        }}
                      />
                      <span className="text-sm">{fm.labelPt}</span>
                    </label>
                  );
                })}
              </div>
            </FormField>
            {hasError('health.feverMedications') && (
              <p className="text-xs text-red-500 mt-1">{validationErrors['health.feverMedications']}</p>
            )}
            {health.feverMedications?.includes('OTHER') && (
              <input
                className={`${inputClass} mt-2`}
                value={health.feverMedicationOther || ''}
                onChange={(e) => setHealth((h) => ({ ...h, feverMedicationOther: e.target.value }))}
                placeholder="Especifique o medicamento..."
              />
            )}
          </div>
          <div>
            <FormField label="Medicamentos autorizados para dor" required>
              <div className="space-y-1">
                {PAIN_MEDICATIONS.map((pm) => {
                  const isChecked = health.painMedications?.includes(pm.value) || false;
                  return (
                    <label
                      key={pm.value}
                      className={`${checkboxCardClass} ${isChecked ? checkboxCardActiveClass : ''}`}
                    >
                      <input
                        type="checkbox"
                        className={checkboxClass}
                        checked={isChecked}
                        onChange={(e) => {
                          handleExclusiveCheckbox('painMedications', pm.value, e.target.checked);
                          clearError(setValidationErrors, 'health.painMedications');
                        }}
                      />
                      <span className="text-sm">{pm.labelPt}</span>
                    </label>
                  );
                })}
              </div>
            </FormField>
            {hasError('health.painMedications') && (
              <p className="text-xs text-red-500 mt-1">{validationErrors['health.painMedications']}</p>
            )}
            {health.painMedications?.includes('OTHER') && (
              <input
                className={`${inputClass} mt-2`}
                value={health.painMedicationOther || ''}
                onChange={(e) => setHealth((h) => ({ ...h, painMedicationOther: e.target.value }))}
                placeholder="Especifique o medicamento..."
              />
            )}
          </div>
        </div>

        <FormField label="Restrições a medicamentos">
          <textarea
            className={`${inputClass} min-h-[60px]`}
            value={health.medicationRestrictions || ''}
            onChange={(e) => setHealth((h) => ({ ...h, medicationRestrictions: e.target.value }))}
            placeholder="Caso não haja, deixe em branco"
          />
        </FormField>

        <FormField label="Medicamentos de uso contínuo">
          <textarea
            className={`${inputClass} min-h-[60px]`}
            value={health.regularMedications || ''}
            onChange={(e) => setHealth((h) => ({ ...h, regularMedications: e.target.value }))}
            placeholder="Caso não haja, deixe em branco"
          />
        </FormField>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className={checkboxClass}
              checked={health.hasEatingDisorder || false}
              onChange={(e) => setHealth((h) => ({ ...h, hasEatingDisorder: e.target.checked }))}
            />
            <span className="text-sm font-medium text-neutral-700">Transtorno alimentar</span>
          </label>
          {health.hasEatingDisorder && (
            <textarea
              className={`${inputClass} mt-2`}
              rows={2}
              value={health.eatingDisorderNotes || ''}
              onChange={(e) => setHealth((h) => ({ ...h, eatingDisorderNotes: e.target.value }))}
              placeholder="Descreva..."
            />
          )}
        </div>

        <FormField label="Informações adicionais de saúde">
          <textarea
            className={`${inputClass} min-h-[60px]`}
            value={health.additionalHealthInfo || ''}
            onChange={(e) => setHealth((h) => ({ ...h, additionalHealthInfo: e.target.value }))}
            placeholder="Observações relevantes sobre a saúde do aluno"
          />
        </FormField>
      </div>
    </SectionCard>
  );
}
