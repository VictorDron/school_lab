import { AlertTriangle, Phone, Plus, Trash2 } from 'lucide-react';
import { RELATIONSHIP_OPTIONS } from '@/types/enrollment';
import type { ReEnrollmentEmergencyContact } from '@/types/re-enrollment';
import { SectionCard, FormField } from '../components';
import { formatPhone } from '../formatters';
import { inputClass, selectClass } from '../types';

interface EmergencyContactsSectionProps {
  emergencyContacts: ReEnrollmentEmergencyContact[];
  addEmergencyContact: () => void;
  removeEmergencyContact: (index: number) => void;
  updateEmergencyContact: (
    index: number,
    field: keyof ReEnrollmentEmergencyContact,
    value: string | boolean
  ) => void;
}

export function EmergencyContactsSection({
  emergencyContacts,
  addEmergencyContact,
  removeEmergencyContact,
  updateEmergencyContact,
}: EmergencyContactsSectionProps) {
  return (
    <SectionCard icon={Phone} title="Contatos de Emergência">
      <p className="text-sm text-neutral-500 mb-1">
        Cadastre pelo menos um contato de emergência. Todos os campos marcados com * são obrigatórios.
      </p>
      <p className="text-sm font-semibold text-amber-600 mb-4">
        <AlertTriangle className="w-4 h-4 inline mr-1" />
        O contato de emergência não pode ser o pai ou a mãe do aluno.
      </p>
      <div className="space-y-4">
        {emergencyContacts.map((contact, index) => (
          <div key={index} className="p-4 border border-neutral-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">Contato {index + 1}</span>
              {emergencyContacts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEmergencyContact(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Nome completo" required>
                <input
                  className={inputClass}
                  value={contact.name}
                  onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                  placeholder="Nome completo"
                />
              </FormField>
              <FormField label="Telefone" required>
                <input
                  className={inputClass}
                  value={contact.phone}
                  onChange={(e) => updateEmergencyContact(index, 'phone', formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                />
              </FormField>
              <FormField label="E-mail" required>
                <input
                  type="email"
                  className={inputClass}
                  value={contact.email || ''}
                  onChange={(e) => updateEmergencyContact(index, 'email', e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </FormField>
              <FormField label="Parentesco" required>
                <select
                  className={selectClass}
                  value={contact.relationship || ''}
                  onChange={(e) => updateEmergencyContact(index, 'relationship', e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {RELATIONSHIP_OPTIONS.map((rel) => (
                    <option key={rel.value} value={rel.value}>
                      {rel.labelPt}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>
        ))}
        {emergencyContacts.length < 3 && (
          <button
            type="button"
            onClick={addEmergencyContact}
            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="w-4 h-4" /> Adicionar contato
          </button>
        )}
      </div>
    </SectionCard>
  );
}
