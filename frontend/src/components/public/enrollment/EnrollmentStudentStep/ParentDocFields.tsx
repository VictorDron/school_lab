import { Controller } from 'react-hook-form';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { educationLevels } from '@/constants/educationLevels';
import { religions } from '@/constants/religions';
import { validateEmail, getTodayString } from '@/utils/validation';
import { formatPhone, LockedField } from '@/components/public/shared';
import { MARITAL_STATUS_OPTIONS } from './constants';
import { applyFieldValidation } from './helpers';

// ---------------------------------------------------------------------------
// Parent documentation fields — rendered once for the father, once for the
// mother. The only differences are the form prefix (fatherUpdates vs
// motherUpdates), the heading label and the occupation placeholder gender.
// ---------------------------------------------------------------------------

export interface ParentDocFieldsProps {
  parentPrefix: 'fatherUpdates' | 'motherUpdates';
  parentLabel: { pt: string; en: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any;
  language: string;
  fieldErrors: Record<string, string>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enrollmentData: any;
  nationalityOptions: Array<{ value: string; label: string }>;
}

export function ParentDocFields({
  parentPrefix,
  parentLabel,
  register,
  control,
  setValue,
  language,
  fieldErrors,
  setFieldErrors,
  enrollmentData,
  nationalityOptions,
}: ParentDocFieldsProps) {
  const parent = parentPrefix === 'fatherUpdates' ? enrollmentData?.father : enrollmentData?.mother;

  return (
    <>
      <h3 className="text-lg font-medium text-neutral-900">
        {language === 'pt' ? `Documentação ${parentLabel.pt}` : `${parentLabel.en} Documentation`}
      </h3>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-amber-800">
          {language === 'pt'
            ? `Preencha os dados documentais ${parentLabel.pt.toLowerCase()}. Todos os campos marcados com (*) são obrigatórios.`
            : `Fill in the ${parentLabel.en.toLowerCase()}'s documentation data. All fields marked with (*) are required.`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LockedField
          label={language === 'pt' ? 'Nome Completo' : 'Full Name'}
          value={parent?.fullName}
        />
        <LockedField
          label="CPF"
          value={parent?.cpf}
        />
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            {...register(`${parentPrefix}.email`)}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              const value = e.target.value;
              const isValid = !value || validateEmail(value);
              applyFieldValidation(
                `${parentPrefix}.email`,
                isValid,
                language === 'pt' ? 'Email inválido' : 'Invalid email',
                setFieldErrors,
              );
            }}
            className={`input ${fieldErrors[`${parentPrefix}.email`] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            data-field-error={!!fieldErrors[`${parentPrefix}.email`]}
          />
          {fieldErrors[`${parentPrefix}.email`] && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors[`${parentPrefix}.email`]}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Telefone' : 'Phone'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register(`${parentPrefix}.phone`)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(`${parentPrefix}.phone`, formatPhone(e.target.value))}
            className={`input ${fieldErrors[`${parentPrefix}.phone`] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            data-field-error={!!fieldErrors[`${parentPrefix}.phone`]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'RG/Passaporte' : 'ID/Passport'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register(`${parentPrefix}.idNumber`)}
            className={`input ${fieldErrors[`${parentPrefix}.idNumber`] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            data-field-error={!!fieldErrors[`${parentPrefix}.idNumber`]}
            placeholder={language === 'pt' ? 'Número do documento' : 'Document number'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Data de Emissão' : 'Issue Date'} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register(`${parentPrefix}.idIssueDate`)}
            className={`input ${fieldErrors[`${parentPrefix}.idIssueDate`] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            data-field-error={!!fieldErrors[`${parentPrefix}.idIssueDate`]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Órgão Emissor' : 'Issuing Authority'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register(`${parentPrefix}.idIssuer`)}
            className="input"
            placeholder={language === 'pt' ? 'Ex: SSP/RJ' : 'Ex: SSP/RJ'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Data de Nascimento' : 'Date of Birth'} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register(`${parentPrefix}.dateOfBirth`, { required: true })}
            max={getTodayString()}
            className={`input ${fieldErrors[`${parentPrefix}.dateOfBirth`] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            data-field-error={!!fieldErrors[`${parentPrefix}.dateOfBirth`]}
          />
          {fieldErrors[`${parentPrefix}.dateOfBirth`] && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors[`${parentPrefix}.dateOfBirth`]}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Profissão' : 'Occupation'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register(`${parentPrefix}.occupation`, { required: true })}
            className={`input ${fieldErrors[`${parentPrefix}.occupation`] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            data-field-error={!!fieldErrors[`${parentPrefix}.occupation`]}
            placeholder={parentPrefix === 'fatherUpdates'
              ? (language === 'pt' ? 'Ex: Engenheiro, Professor, Médico...' : 'Ex: Engineer, Teacher, Doctor...')
              : (language === 'pt' ? 'Ex: Engenheira, Professora, Médica...' : 'Ex: Engineer, Teacher, Doctor...')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Escolaridade' : 'Education'} <span className="text-red-500">*</span>
          </label>
          <select {...register(`${parentPrefix}.education`, { required: true })} className={`input ${fieldErrors[`${parentPrefix}.education`] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            data-field-error={!!fieldErrors[`${parentPrefix}.education`]}>
            <option value="">{language === 'pt' ? 'Selecione...' : 'Select...'}</option>
            {educationLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Religião' : 'Religion'}
          </label>
          <select {...register(`${parentPrefix}.religion`)} className="input">
            <option value="">{language === 'pt' ? 'Selecione...' : 'Select...'}</option>
            {religions.map((religion) => (
              <option key={religion.value} value={religion.value}>
                {religion.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Nacionalidade' : 'Nationality'} <span className="text-red-500">*</span>
          </label>
          <Controller
            name={`${parentPrefix}.nationality`}
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <SearchableSelect
                options={nationalityOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder={language === 'pt' ? 'Selecione...' : 'Select...'}
                searchPlaceholder={language === 'pt' ? 'Buscar...' : 'Search...'}
              />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Estado Civil' : 'Marital Status'} <span className="text-red-500">*</span>
          </label>
          <select
            {...register(`${parentPrefix}.maritalStatus`, { required: true })}
            className={`input ${fieldErrors[`${parentPrefix}.maritalStatus`] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            data-field-error={!!fieldErrors[`${parentPrefix}.maritalStatus`]}
          >
            <option value="">{language === 'pt' ? 'Selecione...' : 'Select...'}</option>
            {MARITAL_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{language === 'pt' ? opt.pt : opt.en}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
