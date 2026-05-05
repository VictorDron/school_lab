import { useState } from 'react';
import {
  Mail,
  Phone,
  User,
  Briefcase,
  Languages,
  FileText,
  Loader2,
  Pencil,
  Save,
  X,
} from 'lucide-react';
import type { LeadParent } from '@/types/crm';
import { useUpdateParent } from '@/hooks/useLeads';
import { parentTypeLabels, formatCPF } from './constants';

interface ParentCardProps {
  parent: LeadParent;
  leadId: string;
  canEdit: boolean;
}

export function ParentCard({ parent, leadId, canEdit }: ParentCardProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: parent.fullName || '',
    email: parent.email || '',
    phone: parent.phone || '',
    cpf: parent.cpf || '',
    occupation: parent.occupation || '',
    nativeLanguage: parent.nativeLanguage || '',
    nationality: parent.nationality || '',
    maritalStatus: parent.maritalStatus || '',
  });
  const updateParent = useUpdateParent();

  const handleSave = () => {
    const cleanData: Record<string, string> = {};
    for (const [k, v] of Object.entries(form)) {
      if (v) cleanData[k] = v;
    }
    updateParent.mutate(
      { leadId, parentId: parent.id, data: cleanData },
      { onSuccess: () => setEditing(false) },
    );
  };

  if (editing) {
    return (
      <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-emerald-600 font-semibold">
            {parentTypeLabels[parent.parentType] || parent.parentType}
          </p>
          <button onClick={() => setEditing(false)} className="text-neutral-400 hover:text-neutral-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className="block text-xs text-neutral-500 mb-0.5">Nome</label>
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-0.5">Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-0.5">Telefone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-0.5">CPF</label>
            <input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-0.5">Profissao</label>
            <input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-0.5">Idioma nativo</label>
            <input value={form.nativeLanguage} onChange={(e) => setForm({ ...form, nativeLanguage: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-0.5">Nacionalidade</label>
            <select value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm">
              <option value="">Selecione...</option>
              <option value="BRASILEIRA">Brasileira</option>
              <option value="AMERICANA">Americana</option>
              <option value="PORTUGUESA">Portuguesa</option>
              <option value="ARGENTINA">Argentina</option>
              <option value="COLOMBIANA">Colombiana</option>
              <option value="OUTRA">Outra</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-0.5">Estado civil</label>
            <select value={form.maritalStatus} onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm">
              <option value="">Selecione...</option>
              <option value="SOLTEIRO">Solteiro(a)</option>
              <option value="CASADO">Casado(a)</option>
              <option value="DIVORCIADO">Divorciado(a)</option>
              <option value="VIUVO">Viuvo(a)</option>
              <option value="SEPARADO">Separado(a)</option>
              <option value="UNIAO_ESTAVEL">Uniao estavel</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={() => setEditing(false)} className="px-3 py-1 text-xs text-neutral-600 border rounded hover:bg-neutral-50">Cancelar</button>
          <button onClick={handleSave} disabled={updateParent.isPending} className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
            {updateParent.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Salvar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-emerald-100 relative">
      {canEdit && (
        <button
          onClick={() => setEditing(true)}
          className="absolute top-3 right-3 text-neutral-400 hover:text-blue-600 transition-colors"
          title="Editar"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="font-medium text-neutral-900">{parent.fullName}</p>
          <p className="text-xs text-emerald-600 font-medium">
            {parentTypeLabels[parent.parentType] || parent.parentType}
          </p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {parent.email && (
          <div className="flex items-center gap-2 text-neutral-600">
            <Mail className="w-3.5 h-3.5 text-neutral-400" />
            <a href={`mailto:${parent.email}`} className="hover:text-emerald-600 truncate">
              {parent.email}
            </a>
          </div>
        )}

        {parent.phone && (
          <div className="flex items-center gap-2 text-neutral-600">
            <Phone className="w-3.5 h-3.5 text-neutral-400" />
            <a href={`tel:${parent.phone}`} className="hover:text-emerald-600">
              {parent.phone}
            </a>
          </div>
        )}

        {parent.cpf && (
          <div className="flex items-center gap-2 text-neutral-600">
            <FileText className="w-3.5 h-3.5 text-neutral-400" />
            <span>CPF: {formatCPF(parent.cpf)}</span>
          </div>
        )}

        {parent.occupation && (
          <div className="flex items-center gap-2 text-neutral-600">
            <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
            <span>{parent.occupation}</span>
          </div>
        )}

        {parent.nativeLanguage && (
          <div className="flex items-center gap-2 text-neutral-600">
            <Languages className="w-3.5 h-3.5 text-neutral-400" />
            <span>{parent.nativeLanguage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
