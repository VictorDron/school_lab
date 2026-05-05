import type { Dispatch, SetStateAction } from 'react';
import { Bus, Car, Plus, Trash2 } from 'lucide-react';
import { DROPOFF_PICKUP_OPTIONS, TRANSPORT_METHODS } from '@/types/enrollment';
import type { ReEnrollmentChildTransport } from '@/types/re-enrollment';
import { SectionCard, FormField } from '../components';
import { formatCPF, formatPhone, formatPlate } from '../formatters';
import {
  inputClass,
  selectClass,
  checkboxClass,
  type AuthorizedPerson,
  type FamilyVehicle,
} from '../types';

interface TransportSectionProps {
  transport: Partial<ReEnrollmentChildTransport>;
  setTransport: Dispatch<SetStateAction<Partial<ReEnrollmentChildTransport>>>;
  dropoffPickupPersons: string[];
  handleDropoffPersonChange: (personType: string, checked: boolean) => void;
  authorizedPersons: AuthorizedPerson[];
  addAuthorizedPerson: () => void;
  removeAuthorizedPerson: (index: number) => void;
  updateAuthorizedPerson: (index: number, field: string, value: string) => void;
  familyVehicles: FamilyVehicle[];
  addFamilyVehicle: () => void;
  removeFamilyVehicle: (index: number) => void;
  updateFamilyVehicle: (index: number, field: keyof FamilyVehicle, value: string) => void;
}

export function TransportSection({
  transport,
  setTransport,
  dropoffPickupPersons,
  handleDropoffPersonChange,
  authorizedPersons,
  addAuthorizedPerson,
  removeAuthorizedPerson,
  updateAuthorizedPerson,
  familyVehicles,
  addFamilyVehicle,
  removeFamilyVehicle,
  updateFamilyVehicle,
}: TransportSectionProps) {
  return (
    <SectionCard icon={Bus} title="Transporte">
      <label className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer select-none mb-4">
        <input
          type="checkbox"
          className={`${checkboxClass} w-4 h-4`}
          checked={transport.canLeaveAlone || false}
          onChange={(e) => setTransport((t) => ({ ...t, canLeaveAlone: e.target.checked }))}
        />
        <div>
          <span className="text-sm font-medium text-blue-900">Autorizado a sair sozinho</span>
          <p className="text-xs text-blue-700 mt-0.5">
            Se marcado, os campos de entrada/saída e meio de transporte são opcionais.
          </p>
        </div>
      </label>

      {!transport.canLeaveAlone && (
        <>
          <div className="mb-4">
            <FormField label="Quem faz a entrada/saída?" required>
              <p className="text-xs text-neutral-500 mb-2">Selecione todos que se aplicam</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {DROPOFF_PICKUP_OPTIONS.map((opt) => {
                  const isChecked = dropoffPickupPersons.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-primary-50 border-primary-300' : 'hover:bg-neutral-50'}`}
                    >
                      <input
                        type="checkbox"
                        className={checkboxClass}
                        checked={isChecked}
                        onChange={(e) => handleDropoffPersonChange(opt.value, e.target.checked)}
                      />
                      <span className="text-sm font-medium">{opt.labelPt}</span>
                    </label>
                  );
                })}
              </div>
            </FormField>
          </div>

          {dropoffPickupPersons.includes('THIRD_PARTY') && (
            <div className="border border-neutral-200 rounded-lg p-4 space-y-4 mb-4">
              <div>
                <h3 className="text-base font-medium text-neutral-900">
                  Pessoas autorizadas <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                  Cadastre as pessoas autorizadas a fazer a entrada/saída do aluno. Máximo de 5 pessoas.
                </p>
              </div>
              {authorizedPersons.map((person, index) => (
                <div key={index} className="border rounded-lg p-4 bg-neutral-50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-sm">Pessoa {index + 1}</span>
                    {authorizedPersons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAuthorizedPerson(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField label="Nome completo" required>
                      <input
                        className={inputClass}
                        value={person.name}
                        onChange={(e) => updateAuthorizedPerson(index, 'name', e.target.value)}
                      />
                    </FormField>
                    <FormField label="Vínculo" required>
                      <input
                        className={inputClass}
                        value={person.bond}
                        onChange={(e) => updateAuthorizedPerson(index, 'bond', e.target.value)}
                        placeholder="Ex: Avó materna, Motorista..."
                      />
                    </FormField>
                    <FormField label="Data de nascimento">
                      <input
                        type="date"
                        className={inputClass}
                        value={person.dateOfBirth}
                        onChange={(e) => updateAuthorizedPerson(index, 'dateOfBirth', e.target.value)}
                      />
                    </FormField>
                    <FormField label="CPF">
                      <input
                        className={inputClass}
                        value={person.cpf}
                        onChange={(e) => updateAuthorizedPerson(index, 'cpf', formatCPF(e.target.value))}
                      />
                    </FormField>
                    <FormField label="E-mail">
                      <input
                        type="email"
                        className={inputClass}
                        value={person.email}
                        onChange={(e) => updateAuthorizedPerson(index, 'email', e.target.value)}
                      />
                    </FormField>
                    <div className="md:col-span-2">
                      <h4 className="text-xs font-medium text-neutral-600 mb-2">Veículo (opcional)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          className={inputClass}
                          value={person.vehicle.model}
                          onChange={(e) => updateAuthorizedPerson(index, 'vehicle.model', e.target.value)}
                          placeholder="Modelo"
                        />
                        <input
                          className={inputClass}
                          value={person.vehicle.color}
                          onChange={(e) => updateAuthorizedPerson(index, 'vehicle.color', e.target.value)}
                          placeholder="Cor"
                        />
                        <input
                          className={inputClass}
                          value={person.vehicle.plate}
                          onChange={(e) => updateAuthorizedPerson(index, 'vehicle.plate', formatPlate(e.target.value))}
                          placeholder="Placa (ABC-1234)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {authorizedPersons.length < 5 && (
                <button
                  type="button"
                  onClick={addAuthorizedPerson}
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> Adicionar pessoa autorizada
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <FormField label="Meio de transporte">
              <select
                className={selectClass}
                value={transport.transportMethod || ''}
                onChange={(e) => setTransport((t) => ({ ...t, transportMethod: e.target.value }))}
              >
                <option value="">Selecione</option>
                {TRANSPORT_METHODS.map((tm) => (
                  <option key={tm.value} value={tm.value}>
                    {tm.labelPt}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          {transport.transportMethod === 'OTHER' && (
            <div className="mb-4">
              <FormField label="Especifique o meio de transporte">
                <input
                  className={inputClass}
                  value={transport.transportMethodOther || ''}
                  onChange={(e) => setTransport((t) => ({ ...t, transportMethodOther: e.target.value }))}
                />
              </FormField>
            </div>
          )}

          {transport.transportMethod === 'CAR' && (
            <div className="space-y-4 mb-4">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-primary-600" />
                <h3 className="text-base font-medium text-neutral-900">Veículos da família</h3>
              </div>
              <p className="text-sm text-neutral-500">Cadastre pelo menos um veículo da família. Máximo de 10.</p>
              {familyVehicles.map((vehicle, index) => (
                <div key={index} className="bg-neutral-50 border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-neutral-600">Veículo {index + 1}</span>
                    {familyVehicles.length > 1 && (
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
                    <FormField label="Modelo" required>
                      <input
                        className={inputClass}
                        value={vehicle.model}
                        onChange={(e) => updateFamilyVehicle(index, 'model', e.target.value)}
                        placeholder="Ex: Honda Civic"
                      />
                    </FormField>
                    <FormField label="Cor" required>
                      <input
                        className={inputClass}
                        value={vehicle.color}
                        onChange={(e) => updateFamilyVehicle(index, 'color', e.target.value)}
                        placeholder="Ex: Prata"
                      />
                    </FormField>
                    <FormField label="Placa" required>
                      <input
                        className={inputClass}
                        value={vehicle.plate}
                        onChange={(e) => updateFamilyVehicle(index, 'plate', formatPlate(e.target.value))}
                        placeholder="ABC-1234"
                      />
                    </FormField>
                  </div>
                </div>
              ))}
              {familyVehicles.length < 10 && (
                <button
                  type="button"
                  onClick={addFamilyVehicle}
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> Adicionar veículo
                </button>
              )}
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <FormField label="Empresa de transporte escolar">
          <input
            className={inputClass}
            value={transport.schoolBusCompany || ''}
            onChange={(e) => setTransport((t) => ({ ...t, schoolBusCompany: e.target.value }))}
            placeholder="Nome da empresa"
          />
        </FormField>
        <FormField label="Nome do contato">
          <input
            className={inputClass}
            value={transport.schoolBusContactName || ''}
            onChange={(e) => setTransport((t) => ({ ...t, schoolBusContactName: e.target.value }))}
            placeholder="Nome do motorista/responsável"
          />
        </FormField>
        <FormField label="Telefone do transporte">
          <input
            className={inputClass}
            value={transport.schoolBusContactPhone || ''}
            onChange={(e) =>
              setTransport((t) => ({ ...t, schoolBusContactPhone: formatPhone(e.target.value) }))
            }
            placeholder="(00) 00000-0000"
          />
        </FormField>
        <FormField label="E-mail do transporte">
          <input
            type="email"
            className={inputClass}
            value={transport.schoolBusContactEmail || ''}
            onChange={(e) => setTransport((t) => ({ ...t, schoolBusContactEmail: e.target.value }))}
            placeholder="email@empresa.com"
          />
        </FormField>
      </div>

      <div className="space-y-3 mt-6">
        <div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              className={`${checkboxClass} mt-1`}
              checked={transport.isAthlete || false}
              onChange={(e) => setTransport((t) => ({ ...t, isAthlete: e.target.checked }))}
            />
            <span className="text-sm text-neutral-700">
              O aluno atleta precisará entrar mais tarde ou sair mais cedo para atividades esportivas oficiais?
            </span>
          </label>
          {transport.isAthlete && (
            <textarea
              className={`${inputClass} mt-2`}
              rows={2}
              value={transport.athleteNotes || ''}
              onChange={(e) => setTransport((t) => ({ ...t, athleteNotes: e.target.value }))}
              placeholder="Descreva a atividade esportiva e os horários necessários..."
            />
          )}
        </div>

        <div className="border-2 border-amber-300 bg-amber-50 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 mt-1"
              checked={transport.hasLegalRestrictions || false}
              onChange={(e) =>
                setTransport((t) => ({ ...t, hasLegalRestrictions: e.target.checked }))
              }
            />
            <span className="text-sm font-medium text-amber-900">
              Há alguma restrição legal em vigor que possa afetar o procedimento de entrada/saída (ex: divórcio, guarda compartilhada)?
            </span>
          </label>
          {transport.hasLegalRestrictions && (
            <textarea
              className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm mt-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
              rows={3}
              value={transport.legalRestrictionsNotes || ''}
              onChange={(e) =>
                setTransport((t) => ({ ...t, legalRestrictionsNotes: e.target.value }))
              }
              placeholder="Explique a situação e as restrições aplicáveis..."
            />
          )}
        </div>
      </div>
    </SectionCard>
  );
}
