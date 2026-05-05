import { User, Car, Plus, Trash2 } from 'lucide-react';
import {
  DROPOFF_PICKUP_OPTIONS,
  TRANSPORT_METHODS,
} from '@/types/enrollment';
import { formatCPF, formatPlate } from '@/components/public/shared';
import type { EnrollmentTransportStepProps } from './types';

export function EnrollmentTransportStep({
  register,
  setValue,
  language,
  enrollmentStudents,
  activeStudentTab,
  onTabSwitch,
  watchTransport,
  familyVehicleFields,
  appendFamilyVehicle,
  removeFamilyVehicle,
  authorizedPersonFields,
  appendAuthorizedPerson,
  removeAuthorizedPerson,
  onDropoffPersonChange,
  onCopyFromSibling,
}: EnrollmentTransportStepProps) {
  const selectedPersons = watchTransport?.dropoffPickupPersons || [];
  const isCarTransport = watchTransport?.transportMethod === 'CAR';

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-neutral-900">
        {language === 'pt' ? 'Transporte' : 'Transport'}
      </h2>

      {/* Student tabs for transport step */}
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

      {/* Copy transport from sibling */}
      {enrollmentStudents.length > 1 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Car className="w-4 h-4 text-blue-600 flex-shrink-0" />
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

      {/* Can Leave Alone - shown at top */}
      <label className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer select-none">
        <input type="checkbox" {...register('transport.canLeaveAlone')} className="rounded border-neutral-300 text-primary-600 w-4 h-4" />
        <div>
          <span className="text-sm font-medium text-blue-900">
            {language === 'pt' ? 'Autorizado a sair sozinho' : 'Authorized to leave alone'}
          </span>
          <p className="text-xs text-blue-700 mt-0.5">
            {language === 'pt'
              ? 'Se marcado, os campos de entrada/saída e meio de transporte são opcionais.'
              : 'If checked, drop-off/pick-up and transport method fields are optional.'}
          </p>
        </div>
      </label>

      {!watchTransport?.canLeaveAlone && (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-amber-800">
          {language === 'pt'
            ? 'Selecione todas as pessoas que fazem a entrada/saída. Se o meio de transporte for carro particular, cadastre os veículos da família.'
            : 'Select all persons who do drop-off/pick-up. If transport method is private car, register family vehicles.'}
        </p>
      </div>
      )}

      {!watchTransport?.canLeaveAlone && (
      <>
      {/* Dropoff/Pickup Persons - Multiple Selection */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {language === 'pt' ? 'Quem faz a entrada/saída?' : 'Who does drop-off/pick-up?'} <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-neutral-500 mb-3">
          {language === 'pt' ? 'Selecione todos que aplicam' : 'Select all that apply'}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {DROPOFF_PICKUP_OPTIONS.map((opt) => {
            const isChecked = selectedPersons.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  isChecked
                    ? 'bg-primary-50 border-primary-300'
                    : 'hover:bg-neutral-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => onDropoffPersonChange(opt.value, e.target.checked)}
                  className="rounded border-neutral-300 text-primary-600"
                />
                <span className="text-sm font-medium">
                  {language === 'pt' ? opt.labelPt : opt.labelEn}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Authorized Persons (when THIRD_PARTY selected) */}
      {selectedPersons.includes('THIRD_PARTY') && (
        <div className="border border-neutral-200 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="text-base font-medium text-neutral-900">
              {language === 'pt' ? 'Pessoas autorizadas' : 'Authorized persons'} <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-neutral-500 mt-1">
              {language === 'pt'
                ? 'Cadastre as pessoas autorizadas a fazer a entrada/saída do aluno. Máximo de 5 pessoas.'
                : 'Register persons authorized for student drop-off/pick-up. Maximum 5 persons.'}
            </p>
          </div>
          {authorizedPersonFields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 bg-neutral-50">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium text-sm">{language === 'pt' ? `Pessoa ${index + 1}` : `Person ${index + 1}`}</span>
                {authorizedPersonFields.length > 1 && (
                  <button type="button" onClick={() => removeAuthorizedPerson(index)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    {language === 'pt' ? 'Nome completo' : 'Full name'} <span className="text-red-500">*</span>
                  </label>
                  <input {...register(`authorizedPersons.${index}.name` as const)} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    {language === 'pt' ? 'Vínculo' : 'Bond/Relationship'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register(`authorizedPersons.${index}.bond` as const)}
                    className="input"
                    placeholder={language === 'pt' ? 'Ex: Avó materna, Motorista, Transporte escolar...' : 'E.g.: Grandmother, Driver, School bus...'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    {language === 'pt' ? 'Data de Nascimento' : 'Date of Birth'} <span className="text-red-500">*</span>
                  </label>
                  <input {...register(`authorizedPersons.${index}.dateOfBirth` as const)} type="date" className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    CPF <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register(`authorizedPersons.${index}.cpf` as const)}
                    className="input"
                    onChange={(e) => setValue(`authorizedPersons.${index}.cpf`, formatCPF(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input {...register(`authorizedPersons.${index}.email` as const)} type="email" className="input" />
                </div>
                <div className="md:col-span-2">
                  <h4 className="text-xs font-medium text-neutral-600 mb-2">
                    {language === 'pt' ? 'Veículo (opcional)' : 'Vehicle (optional)'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      {...register(`authorizedPersons.${index}.vehicle.model` as any)}
                      className="input"
                      placeholder={language === 'pt' ? 'Modelo' : 'Model'}
                    />
                    <input
                      {...register(`authorizedPersons.${index}.vehicle.color` as any)}
                      className="input"
                      placeholder={language === 'pt' ? 'Cor' : 'Color'}
                    />
                    <input
                      {...register(`authorizedPersons.${index}.vehicle.plate` as any)}
                      className="input"
                      placeholder={language === 'pt' ? 'Placa' : 'Plate'}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {authorizedPersonFields.length < 5 && (
            <button
              type="button"
              onClick={() => appendAuthorizedPerson({
                name: '', dateOfBirth: '', cpf: '', email: '', bond: '',
                vehicle: { model: '', color: '', plate: '' }
              })}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              {language === 'pt' ? 'Adicionar pessoa autorizada' : 'Add authorized person'}
            </button>
          )}
        </div>
      )}

      {/* Transport Method */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {language === 'pt' ? 'Meio de transporte' : 'Transport method'} <span className="text-red-500">*</span>
        </label>
        <select {...register('transport.transportMethod')} className="input">
          {TRANSPORT_METHODS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {language === 'pt' ? opt.labelPt : opt.labelEn}
            </option>
          ))}
        </select>
        {watchTransport?.transportMethod === 'OTHER' && (
          <input
            {...register('transport.transportMethodOther')}
            className="input mt-2"
            placeholder={language === 'pt' ? 'Especifique... *' : 'Specify... *'}
          />
        )}
      </div>

      {/* Family Vehicles */}
      {isCarTransport && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Car className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-medium text-neutral-900">
              {language === 'pt' ? 'Veículos da Família' : 'Family Vehicles'}
              <span className="text-red-500 ml-1">*</span>
            </h3>
          </div>
          <p className="text-sm text-neutral-500">
            {language === 'pt'
              ? 'Cadastre pelo menos um veículo da família. Máximo de 10 veículos.'
              : 'Register at least one family vehicle. Maximum of 10 vehicles.'}
          </p>

          {familyVehicleFields.map((field, index) => (
            <div key={field.id} className="bg-neutral-50 border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-neutral-600">
                  {language === 'pt' ? `Veículo ${index + 1}` : `Vehicle ${index + 1}`}
                </span>
                {familyVehicleFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFamilyVehicle(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    {language === 'pt' ? 'Modelo' : 'Model'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register(`transport.familyVehicles.${index}.model` as const)}
                    type="text"
                    placeholder={language === 'pt' ? 'Ex: Honda Civic' : 'E.g.: Honda Civic'}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    {language === 'pt' ? 'Cor' : 'Color'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register(`transport.familyVehicles.${index}.color` as const)}
                    type="text"
                    placeholder={language === 'pt' ? 'Ex: Prata' : 'E.g.: Silver'}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    {language === 'pt' ? 'Placa' : 'Plate'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register(`transport.familyVehicles.${index}.plate` as const)}
                    type="text"
                    placeholder="ABC-1234"
                    className="input"
                    onChange={(e) => setValue(`transport.familyVehicles.${index}.plate`, formatPlate(e.target.value))}
                  />
                </div>
              </div>
            </div>
          ))}

          {familyVehicleFields.length < 10 && (
            <button
              type="button"
              onClick={() => appendFamilyVehicle({ model: '', color: '', plate: '' })}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              {language === 'pt' ? 'Adicionar veículo' : 'Add vehicle'}
            </button>
          )}
        </div>
      )}
      </>
      )}

      {/* Checkboxes (always visible) */}
      <div className="space-y-3">
        <div>
          <label className="flex items-start gap-2">
            <input type="checkbox" {...register('transport.isAthlete')} className="rounded border-neutral-300 mt-1" />
            <span className="text-sm">
              {language === 'pt'
                ? 'O aluno atleta precisará entrar mais tarde ou sair mais cedo, para atividades esportivas oficiais? Se sim, por favor, informe à Administração da Escola e apresente o documento necessário.'
                : 'Will the student be eligible to late drop-off / early pick-up procedures, due to engagement in official sports activities? If yes, please inform the school administration and present the required information and documents.'}
            </span>
          </label>
          {watchTransport?.isAthlete && (
            <textarea
              {...register('transport.athleteNotes')}
              className="input mt-2"
              rows={3}
              placeholder={language === 'pt' ? 'Descreva a atividade esportiva e os horários necessários...' : 'Describe the sports activity and required schedule...'}
            />
          )}
        </div>

        <div className="border-2 border-amber-300 bg-amber-50 rounded-lg p-4">
          <label className="flex items-start gap-3">
            <input type="checkbox" {...register('transport.hasLegalRestrictions')} className="rounded border-amber-400 text-amber-600 mt-1" />
            <div>
              <span className="text-sm font-medium text-amber-900">
                {language === 'pt'
                  ? 'Há alguma restrição legal em vigor, que possa afetar o procedimento de entrada/saída (Ex. Divórcio, etc.)?'
                  : 'Is there any legal restriction in place that may impact the drop-off / pick-up procedures (e.g. in case of divorce etc)? If yes, please load the court order in the documents.'}
              </span>
            </div>
          </label>
          {watchTransport?.hasLegalRestrictions && (
            <textarea
              {...register('transport.legalRestrictionsNotes')}
              className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm mt-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
              rows={3}
              placeholder={language === 'pt' ? 'Explique a situação e as restrições aplicáveis...' : 'Explain the situation and applicable restrictions...'}
            />
          )}
        </div>

      </div>

    </div>
  );
}
