import { useState } from 'react';
import { Loader2, Pencil, Save } from 'lucide-react';
import { DollarSign } from 'lucide-react';
import type { Lead } from '@/types/crm';
import { useUpdateFinancialResponsible } from '@/hooks/useLeads';

interface FinancialResponsibleSectionProps {
  data: Lead['financialResponsible'];
  leadId: string;
  canEdit: boolean;
}

export function FinancialResponsibleSection({ data, leadId, canEdit }: FinancialResponsibleSectionProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    responsibleType: data?.responsibleType || '',
    fullName: data?.fullName || '',
    cpf: data?.cpf || '',
    email: data?.email || '',
    phone: data?.phone || '',
    personType: data?.personType || 'INDIVIDUAL',
    companyName: data?.companyName || '',
    cnpj: data?.cnpj || '',
  });
  const mutation = useUpdateFinancialResponsible();

  const typeLabel = data?.responsibleType === 'FATHER' ? 'Pai' : data?.responsibleType === 'MOTHER' ? 'Mae' : 'Outro';

  return (
    <section className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Responsavel Financeiro
        </h3>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} className="text-neutral-400 hover:text-blue-600">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">Tipo</label>
              <select value={form.responsibleType} onChange={e => setForm({...form, responsibleType: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm">
                <option value="FATHER">Pai</option>
                <option value="MOTHER">Mae</option>
                <option value="OTHER">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">Tipo Pessoa</label>
              <select value={form.personType} onChange={e => setForm({...form, personType: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm">
                <option value="INDIVIDUAL">Pessoa Fisica</option>
                <option value="COMPANY">Pessoa Juridica</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">Nome</label>
              <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">{form.personType === 'COMPANY' ? 'CNPJ' : 'CPF'}</label>
              <input value={form.personType === 'COMPANY' ? form.cnpj : form.cpf} onChange={e => setForm(form.personType === 'COMPANY' ? {...form, cnpj: e.target.value} : {...form, cpf: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">Email</label>
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">Telefone</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            {form.personType === 'COMPANY' && (
              <div className="col-span-2">
                <label className="block text-xs text-neutral-500 mb-0.5">Nome da Empresa</label>
                <input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setEditing(false)} className="px-3 py-1 text-xs text-neutral-600 border rounded hover:bg-neutral-50">Cancelar</button>
            <button onClick={() => mutation.mutate({ leadId, data: form }, { onSuccess: () => setEditing(false) })} disabled={mutation.isPending} className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
              {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-4 border border-emerald-100 space-y-2 text-sm text-neutral-700">
          <p><strong>{typeLabel}</strong>{data?.fullName ? ` — ${data.fullName}` : ''}</p>
          {data?.personType === 'COMPANY' && data.companyName && <p>Empresa: {data.companyName}</p>}
          {data?.cpf && <p>CPF: {data.cpf}</p>}
          {data?.cnpj && <p>CNPJ: {data.cnpj}</p>}
          {data?.email && <p>{data.email}</p>}
          {data?.phone && <p>{data.phone}</p>}
        </div>
      )}
    </section>
  );
}
