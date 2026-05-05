import { useState } from 'react';
import { Home, Loader2, Pencil, Save } from 'lucide-react';
import type { Lead } from '@/types/crm';
import { useUpdateAddress } from '@/hooks/useLeads';

interface AddressSectionProps {
  address: Lead['address'];
  leadId: string;
  canEdit: boolean;
}

export function AddressSection({ address, leadId, canEdit }: AddressSectionProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    street: address?.street || '',
    number: address?.number || '',
    complement: address?.complement || '',
    neighborhood: address?.neighborhood || '',
    city: address?.city || '',
    state: address?.state || '',
    country: address?.country || '',
    zipCode: address?.zipCode || '',
  });
  const updateAddress = useUpdateAddress();

  const handleSave = () => {
    const cleanData: Record<string, string> = {};
    for (const [k, v] of Object.entries(form)) {
      if (v) cleanData[k] = v;
    }
    updateAddress.mutate(
      { leadId, data: cleanData },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <section className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
          <Home className="w-4 h-4" />
          Endereco
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
            <div className="col-span-2">
              <label className="block text-xs text-neutral-500 mb-0.5">Rua</label>
              <input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">Numero</label>
              <input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">Complemento</label>
              <input value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">Bairro</label>
              <input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">Cidade</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">Estado</label>
              <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">Pais</label>
              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">CEP</label>
              <input value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setEditing(false)} className="px-3 py-1 text-xs text-neutral-600 border rounded hover:bg-neutral-50">Cancelar</button>
            <button onClick={handleSave} disabled={updateAddress.isPending} className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
              {updateAddress.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-4 border border-emerald-100">
          <div className="space-y-2 text-sm text-neutral-700">
            {(address?.street || address?.number) && (
              <p>
                {address?.street}
                {address?.number && `, ${address.number}`}
                {address?.complement && ` - ${address.complement}`}
              </p>
            )}
            {address?.neighborhood && <p>{address.neighborhood}</p>}
            <p className="font-medium">
              {address?.city}
              {address?.state && `, ${address.state}`}
              {address?.country && ` - ${address.country}`}
            </p>
            {address?.zipCode && <p className="text-neutral-500">CEP: {address.zipCode}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
