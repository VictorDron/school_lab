import { Loader2 } from 'lucide-react';
import { Controller, type Control, type UseFormRegister, type UseFormSetValue } from 'react-hook-form';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { formatCEP } from './formatters';

export interface AddressFieldsProps {
  prefix: string;
  register: UseFormRegister<any>;
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  language: string;
  watchCountry: string | undefined;
  watchState: string | undefined;
  watchCity: string | undefined;
  countryOptions: Array<{ value: string; label: string }>;
  stateOptions: Array<{ value: string; label: string }>;
  cityOptions: Array<{ value: string; label: string }>;
  neighborhoodOptions: Array<{ value: string; label: string }>;
  isLoading: boolean;
}

export function AddressFields({
  prefix,
  register,
  control,
  setValue,
  language,
  watchCountry,
  watchState,
  watchCity,
  countryOptions,
  stateOptions,
  cityOptions,
  neighborhoodOptions,
  isLoading,
}: AddressFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {language === 'pt' ? 'País' : 'Country'} <span className="text-red-500">*</span>
        </label>
        <Controller
          name={`${prefix}.country` as any}
          control={control}
          render={({ field }) => (
            <SearchableSelect
              options={countryOptions}
              value={field.value || ''}
              onChange={field.onChange}
              placeholder={language === 'pt' ? 'Selecione o país' : 'Select country'}
            />
          )}
        />
      </div>

      {watchCountry === 'BR' && (
        <>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              CEP <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                {...register(`${prefix}.zipCode` as any)}
                onChange={(e) => {
                  const formatted = formatCEP(e.target.value);
                  setValue(`${prefix}.zipCode` as any, formatted);
                }}
                className="input pr-10"
                placeholder="00000-000"
                maxLength={9}
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin" />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {language === 'pt' ? 'Estado' : 'State'} <span className="text-red-500">*</span>
            </label>
            <Controller
              name={`${prefix}.state` as any}
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  options={stateOptions}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder={language === 'pt' ? 'Selecione o estado' : 'Select state'}
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {language === 'pt' ? 'Cidade' : 'City'} <span className="text-red-500">*</span>
            </label>
            <Controller
              name={`${prefix}.city` as any}
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  options={cityOptions}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder={language === 'pt' ? 'Selecione a cidade' : 'Select city'}
                  allowCustomValue={true}
                  disabled={!watchState}
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {language === 'pt' ? 'Bairro' : 'Neighborhood'} <span className="text-red-500">*</span>
            </label>
            <Controller
              name={`${prefix}.neighborhood` as any}
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  options={neighborhoodOptions}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder={language === 'pt' ? 'Digite ou selecione o bairro' : 'Type or select neighborhood'}
                  allowCustomValue={true}
                  disabled={!watchCity}
                />
              )}
            />
          </div>
        </>
      )}

      {watchCountry && watchCountry !== 'BR' && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Cidade' : 'City'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register(`${prefix}.city` as any)}
            className="input"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {language === 'pt' ? 'Rua' : 'Street'} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register(`${prefix}.street` as any)}
          className="input"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {language === 'pt' ? 'Número' : 'Number'} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register(`${prefix}.number` as any)}
          className="input"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {language === 'pt' ? 'Complemento' : 'Complement'}
        </label>
        <input
          type="text"
          {...register(`${prefix}.complement` as any)}
          className="input"
          placeholder={language === 'pt' ? 'Apto, bloco, etc.' : 'Apt, block, etc.'}
        />
      </div>
    </div>
  );
}
