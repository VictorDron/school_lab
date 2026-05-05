import { useState } from 'react';
import { Loader2, Pencil, Save } from 'lucide-react';
import { Activity } from 'lucide-react';
import type { Lead } from '@/types/crm';
import { useUpdateHealthPlan } from '@/hooks/useLeads';

interface HealthPlanSectionProps {
  data: Lead['healthPlan'];
  leadId: string;
  canEdit: boolean;
}

export function HealthPlanSection({ data, leadId, canEdit }: HealthPlanSectionProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    operator: data?.operator || '',
    beneficiaryCode: data?.beneficiaryCode || '',
    planType: data?.planType || '',
    preferredHospital: data?.preferredHospital || '',
  });
  const mutation = useUpdateHealthPlan();

  return (
    <section className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Plano de Saude
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
              <label className="block text-xs text-neutral-500 mb-0.5">Operadora</label>
              <input value={form.operator} onChange={e => setForm({...form, operator: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">Codigo Beneficiario</label>
              <input value={form.beneficiaryCode} onChange={e => setForm({...form, beneficiaryCode: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">Tipo do Plano</label>
              <input value={form.planType} onChange={e => setForm({...form, planType: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">Hospital de Preferencia</label>
              <input value={form.preferredHospital} onChange={e => setForm({...form, preferredHospital: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
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
          {data?.operator && <p><strong>Operadora:</strong> {data.operator}</p>}
          {data?.beneficiaryCode && <p><strong>Codigo:</strong> {data.beneficiaryCode}</p>}
          {data?.planType && <p><strong>Tipo:</strong> {data.planType}</p>}
          {data?.preferredHospital && <p><strong>Hospital:</strong> {data.preferredHospital}</p>}
        </div>
      )}
    </section>
  );
}
