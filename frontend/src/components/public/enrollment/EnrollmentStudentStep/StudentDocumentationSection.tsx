import { validateCPF } from '@/utils/validation';
import { formatCPF } from '@/components/public/shared';
import { applyFieldValidation } from './helpers';

// ---------------------------------------------------------------------------
// StudentDocumentationSection — student-side documents (CPF, RG/passport,
// issue date, issuing authority). The form path prefix depends on whether the
// enrollment covers a single child or multiple, and the CPF field carries
// inline format-on-change + validate-on-blur behaviour.
// ---------------------------------------------------------------------------

export interface StudentDocumentationSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValues: any;
  language: string;
  fieldErrors: Record<string, string>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enrollmentStudents: any[];
  activeStudentTab: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeStudent: any;
}

export function StudentDocumentationSection({
  register,
  setValue,
  getValues,
  language,
  fieldErrors,
  setFieldErrors,
  enrollmentStudents,
  activeStudentTab,
  activeStudent,
}: StudentDocumentationSectionProps) {
  const isMultiStudent = enrollmentStudents.length > 1;
  const eiPrefix = isMultiStudent
    ? `studentsEnrollment.${activeStudentTab}.enrollmentInfo`
    : 'enrollmentInfo';
  const cpfKey = `${eiPrefix}.studentCpf`;

  return (
    <>
      <h3 className="text-lg font-medium text-neutral-900">
        {language === 'pt' ? 'Documentação do Aluno' : 'Student Documentation'}
        {isMultiStudent && (
          <span className="text-primary-600 text-sm font-normal ml-2">
            ({activeStudent?.fullName || `${language === 'pt' ? 'Filho' : 'Child'} ${activeStudentTab + 1}`})
          </span>
        )}
      </h3>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-amber-800">
          {language === 'pt'
            ? 'Preencha os dados documentais do aluno. Todos os campos marcados com (*) são obrigatórios.'
            : 'Fill in the student\'s documentation data. All fields marked with (*) are required.'}
        </p>
      </div>

      <div key={`enrollment-doc-${activeStudentTab}`} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'CPF do Aluno' : 'Student CPF'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...register(cpfKey as any)}
            onChange={(e) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setValue(cpfKey as any, formatCPF(e.target.value));
            }}
            onBlur={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const val = getValues(cpfKey as any);
              const isValid = !val || validateCPF(val) === true;
              applyFieldValidation(
                cpfKey,
                isValid,
                language === 'pt' ? 'CPF inválido' : 'Invalid CPF',
                setFieldErrors,
              );
            }}
            className={`input ${fieldErrors[cpfKey] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            data-field-error={!!fieldErrors[cpfKey]}
            placeholder="000.000.000-00"
          />
          {fieldErrors[cpfKey] && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors[cpfKey]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'RG/Passaporte' : 'ID Number/Passport'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...register(`${eiPrefix}.studentIdNumber` as any)}
            placeholder={language === 'pt' ? 'Ex: 12.345.678-9 ou AB123456' : 'e.g. 12.345.678-9 or AB123456'}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Data de Emissão' : 'Issue Date'} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...register(`${eiPrefix}.studentIdIssueDate` as any)}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Órgão Emissor' : 'Issuing Authority'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...register(`${eiPrefix}.studentIdIssuer` as any)}
            className="input"
            placeholder={language === 'pt' ? 'Ex: SSP/RJ' : 'Ex: SSP/RJ'}
          />
        </div>
      </div>
    </>
  );
}
