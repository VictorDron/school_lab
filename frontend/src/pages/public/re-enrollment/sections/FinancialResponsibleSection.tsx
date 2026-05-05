import type { Dispatch, SetStateAction } from 'react';
import { AlertCircle, DollarSign } from 'lucide-react';
import type { ReEnrollmentFinancialResponsible } from '@/types/re-enrollment';
import { SectionCard, FormField } from '../components';
import { formatCPF, formatPhone } from '../formatters';
import { inputClass, selectClass } from '../types';

interface FinancialResponsibleSectionProps {
  financial: Partial<ReEnrollmentFinancialResponsible>;
  setFinancial: Dispatch<SetStateAction<Partial<ReEnrollmentFinancialResponsible>>>;
  showFinancialAlert: boolean;
  setShowFinancialAlert: (value: boolean) => void;
}

export function FinancialResponsibleSection({
  financial,
  setFinancial,
  showFinancialAlert,
  setShowFinancialAlert,
}: FinancialResponsibleSectionProps) {
  const dismissAlert = () => setShowFinancialAlert(false);

  return (
    <SectionCard icon={DollarSign} title="Responsável Financeiro">
      {showFinancialAlert && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Preencha pelo menos o nome, CPF ou e-mail do responsável financeiro para continuar.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Tipo de responsável">
          <select
            className={selectClass}
            value={financial.responsibleType || ''}
            onChange={(e) => setFinancial((f) => ({ ...f, responsibleType: e.target.value }))}
          >
            <option value="">Selecione</option>
            <option value="FATHER">Pai</option>
            <option value="MOTHER">Mãe</option>
            <option value="OTHER">Outro</option>
          </select>
        </FormField>
        {financial.responsibleType === 'OTHER' && (
          <FormField label="Parentesco">
            <input
              className={inputClass}
              value={financial.relationship || ''}
              onChange={(e) => setFinancial((f) => ({ ...f, relationship: e.target.value }))}
              placeholder="Ex: Avó, Tio"
            />
          </FormField>
        )}
        <FormField label="Nome completo">
          <input
            className={inputClass}
            value={financial.fullName || ''}
            onChange={(e) => {
              dismissAlert();
              setFinancial((f) => ({ ...f, fullName: e.target.value }));
            }}
          />
        </FormField>
        <FormField label="CPF">
          <input
            className={inputClass}
            value={financial.cpf || ''}
            onChange={(e) => {
              dismissAlert();
              setFinancial((f) => ({ ...f, cpf: formatCPF(e.target.value) }));
            }}
            placeholder="000.000.000-00"
          />
        </FormField>
        <FormField label="E-mail">
          <input
            className={inputClass}
            value={financial.email || ''}
            onChange={(e) => {
              dismissAlert();
              setFinancial((f) => ({ ...f, email: e.target.value }));
            }}
          />
        </FormField>
        <FormField label="Telefone">
          <input
            className={inputClass}
            value={financial.phone || ''}
            onChange={(e) => setFinancial((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
            placeholder="(00) 00000-0000"
          />
        </FormField>
      </div>
    </SectionCard>
  );
}
