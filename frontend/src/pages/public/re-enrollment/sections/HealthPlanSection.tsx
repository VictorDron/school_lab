import type { Dispatch, SetStateAction } from 'react';
import { FileText } from 'lucide-react';
import type { ReEnrollmentHealthPlan } from '@/types/re-enrollment';
import { SectionCard, FormField } from '../components';
import { inputClass } from '../types';

interface HealthPlanSectionProps {
  healthPlan: Partial<ReEnrollmentHealthPlan>;
  setHealthPlan: Dispatch<SetStateAction<Partial<ReEnrollmentHealthPlan>>>;
}

export function HealthPlanSection({ healthPlan, setHealthPlan }: HealthPlanSectionProps) {
  return (
    <SectionCard icon={FileText} title="Plano de Saúde">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Operadora">
          <input
            className={inputClass}
            value={healthPlan.operator || ''}
            onChange={(e) => setHealthPlan((hp) => ({ ...hp, operator: e.target.value }))}
            placeholder="Nome da operadora"
          />
        </FormField>
        <FormField label="Código do beneficiário">
          <input
            className={inputClass}
            value={healthPlan.beneficiaryCode || ''}
            onChange={(e) => setHealthPlan((hp) => ({ ...hp, beneficiaryCode: e.target.value }))}
          />
        </FormField>
        <FormField label="Tipo do plano">
          <input
            className={inputClass}
            value={healthPlan.planType || ''}
            onChange={(e) => setHealthPlan((hp) => ({ ...hp, planType: e.target.value }))}
            placeholder="Ex: Enfermaria, Apartamento"
          />
        </FormField>
        <FormField label="Hospital de preferência">
          <input
            className={inputClass}
            value={healthPlan.preferredHospital || ''}
            onChange={(e) => setHealthPlan((hp) => ({ ...hp, preferredHospital: e.target.value }))}
          />
        </FormField>
      </div>
    </SectionCard>
  );
}
