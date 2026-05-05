import { User } from 'lucide-react';
import type { ReEnrollmentFormData } from '@/types/re-enrollment';
import { SectionCard, ReadOnlyField, FormField } from '../components';
import { formatDateBR } from '../formatters';
import { inputClass } from '../types';

interface StudentDataSectionProps {
  student: ReEnrollmentFormData['student'];
  personalData: ReEnrollmentFormData['personalData'];
  correctionNotes: string;
  setCorrectionNotes: (value: string) => void;
}

export function StudentDataSection({
  student,
  personalData,
  correctionNotes,
  setCorrectionNotes,
}: StudentDataSectionProps) {
  const address = personalData.address;
  const fullAddress = address
    ? [address.street, address.number, address.complement, address.neighborhood, address.city, address.state]
        .filter(Boolean)
        .join(', ')
    : null;

  return (
    <SectionCard icon={User} title="Dados Pessoais do Aluno" readOnly>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <ReadOnlyField label="Nome completo" value={student.fullName} />
        <ReadOnlyField label="Data de nascimento" value={formatDateBR(student.dateOfBirth)} />
        <ReadOnlyField label="Série atual" value={student.grade} />
        <ReadOnlyField label="Código" value={student.code} />
      </div>
      {fullAddress && (
        <div className="border-t border-neutral-200 pt-4 mt-4">
          <h3 className="text-sm font-medium text-neutral-600 mb-3">Endereço</h3>
          <ReadOnlyField label="Endereço completo" value={fullAddress} />
        </div>
      )}
      <div className="border-t border-neutral-200 pt-4 mt-4">
        <FormField label="Se algum dado pessoal estiver incorreto, descreva a correção necessária:">
          <textarea
            className={`${inputClass} min-h-[60px]`}
            value={correctionNotes}
            onChange={(e) => setCorrectionNotes(e.target.value)}
            placeholder="Ex: O endereço mudou para Rua Nova, 123..."
          />
        </FormField>
      </div>
    </SectionCard>
  );
}
