import type { Dispatch, SetStateAction } from 'react';
import { Mail, Plus, Trash2, User } from 'lucide-react';
import { RELATIONSHIP_OPTIONS } from '@/types/enrollment';
import { SectionCard, FormField } from '../components';
import { formatPhone } from '../formatters';
import {
  inputClass,
  selectClass,
  type AdditionalResponsible,
  type ParentEmailState,
} from '../types';

interface ParentContactsSectionProps {
  parentEmails: ParentEmailState[];
  setParentEmails: Dispatch<SetStateAction<ParentEmailState[]>>;
  additionalResponsible: AdditionalResponsible;
  setAdditionalResponsible: Dispatch<SetStateAction<AdditionalResponsible>>;
  showAdditionalResp: boolean;
  setShowAdditionalResp: (value: boolean) => void;
  hasError: (field: string) => boolean;
  validationErrors: Record<string, string>;
}

export function ParentContactsSection({
  parentEmails,
  setParentEmails,
  additionalResponsible,
  setAdditionalResponsible,
  showAdditionalResp,
  setShowAdditionalResp,
  hasError,
  validationErrors,
}: ParentContactsSectionProps) {
  const resetAdditionalResponsible = () => {
    setShowAdditionalResp(false);
    setAdditionalResponsible({ fullName: '', email: '', phone: '', relationship: '' });
  };

  return (
    <SectionCard icon={Mail} title="Dados de Contato dos Responsáveis">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          Confirme ou atualize os e-mails e telefones dos responsáveis. Esses dados são essenciais para a comunicação da escola.
        </p>
      </div>
      <div className="space-y-4">
        {parentEmails.map((parent, index) => {
          const typeLabel =
            parent.parentType === 'FATHER'
              ? 'Pai'
              : parent.parentType === 'MOTHER'
                ? 'Mãe'
                : `Responsável ${index + 1}`;
          const emailErrorKey = `parent.${index}.email`;
          return (
            <div key={index} className="p-4 border border-neutral-200 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-neutral-500" />
                <span className="text-sm font-semibold text-neutral-700">
                  {typeLabel}: {parent.fullName}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="E-mail" required>
                  <input
                    type="email"
                    className={`${inputClass} ${hasError(emailErrorKey) ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    data-error={hasError(emailErrorKey) ? 'true' : undefined}
                    value={parent.email}
                    onChange={(e) =>
                      setParentEmails((prev) =>
                        prev.map((p, i) => (i === index ? { ...p, email: e.target.value } : p))
                      )
                    }
                    placeholder="email@exemplo.com"
                  />
                  {hasError(emailErrorKey) && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors[emailErrorKey]}</p>
                  )}
                </FormField>
                <FormField label="Telefone">
                  <input
                    className={inputClass}
                    value={parent.phone}
                    onChange={(e) =>
                      setParentEmails((prev) =>
                        prev.map((p, i) => (i === index ? { ...p, phone: formatPhone(e.target.value) } : p))
                      )
                    }
                    placeholder="(00) 00000-0000"
                  />
                </FormField>
              </div>
            </div>
          );
        })}

        {!showAdditionalResp ? (
          <button
            type="button"
            onClick={() => setShowAdditionalResp(true)}
            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="w-4 h-4" /> Adicionar outro responsável
          </button>
        ) : (
          <div className="p-4 border border-dashed border-primary-300 rounded-lg space-y-3 bg-primary-50/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-700">Outro responsável (opcional)</span>
              <button
                type="button"
                onClick={resetAdditionalResponsible}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Nome completo">
                <input
                  className={inputClass}
                  value={additionalResponsible.fullName}
                  onChange={(e) => setAdditionalResponsible((r) => ({ ...r, fullName: e.target.value }))}
                />
              </FormField>
              <FormField label="Parentesco">
                <select
                  className={selectClass}
                  value={additionalResponsible.relationship}
                  onChange={(e) => setAdditionalResponsible((r) => ({ ...r, relationship: e.target.value }))}
                >
                  <option value="">Selecione...</option>
                  {RELATIONSHIP_OPTIONS.map((rel) => (
                    <option key={rel.value} value={rel.value}>
                      {rel.labelPt}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="E-mail">
                <input
                  type="email"
                  className={inputClass}
                  value={additionalResponsible.email}
                  onChange={(e) => setAdditionalResponsible((r) => ({ ...r, email: e.target.value }))}
                />
              </FormField>
              <FormField label="Telefone">
                <input
                  className={inputClass}
                  value={additionalResponsible.phone}
                  onChange={(e) =>
                    setAdditionalResponsible((r) => ({ ...r, phone: formatPhone(e.target.value) }))
                  }
                  placeholder="(00) 00000-0000"
                />
              </FormField>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
