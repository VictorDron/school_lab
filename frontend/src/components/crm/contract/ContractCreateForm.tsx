import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  FileText,
  Loader2,
  Pencil,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useCreateContract } from '@/hooks/useContracts';
import { get } from '@/lib/api';
import type { ContractSignerRole } from '@/types/contract';
import { signerRoleOptions, type FeeRow, type NewSigner } from './constants';

interface ContractCreateFormProps {
  leadId: string;
  lead?: {
    primaryContactName?: string;
    primaryContactEmail?: string;
    secondaryContactName?: string;
    secondaryContactEmail?: string;
    parents?: Array<{ fullName: string; email?: string; parentType: string }>;
  };
  feeTable: FeeRow[];
  discountOptions: number[];
  onCreated: () => void;
  onCancel: () => void;
}

export function ContractCreateForm({
  leadId,
  lead,
  feeTable,
  discountOptions,
  onCreated,
  onCancel,
}: ContractCreateFormProps) {
  const createContract = useCreateContract();

  const [selectedFaixa, setSelectedFaixa] = useState('');
  const [installments, setInstallments] = useState<number>(12);
  const [discountValue, setDiscountValue] = useState(0);
  const [enrollmentFee, setEnrollmentFee] = useState(1400);
  const [paymentStartDate, setPaymentStartDate] = useState('');
  const [signers, setSigners] = useState<NewSigner[]>([]);
  const [newSignerName, setNewSignerName] = useState('');
  const [newSignerEmail, setNewSignerEmail] = useState('');
  const [newSignerRole, setNewSignerRole] = useState<ContractSignerRole>('PARENT');
  const [newSignerSearchQuery, setNewSignerSearchQuery] = useState('');

  // Inline edit state for signers
  const [editingSignerIdx, setEditingSignerIdx] = useState<number | null>(null);
  const [editSignerName, setEditSignerName] = useState('');
  const [editSignerEmail, setEditSignerEmail] = useState('');
  const [editSignerRole, setEditSignerRole] = useState<ContractSignerRole>('PARENT');

  // Search users for the creation form
  const { data: createFormUsers } = useQuery({
    queryKey: ['users-search-create', newSignerSearchQuery],
    queryFn: () =>
      get<Array<{ id: string; email: string; displayName: string; fullName: string }>>('/users', {
        params: { search: newSignerSearchQuery, limit: 10 },
      }),
    enabled: newSignerSearchQuery.length >= 2,
  });

  // Draft persistence (localStorage)
  const draftKey = `contract-draft-${leadId}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.selectedFaixa) setSelectedFaixa(draft.selectedFaixa);
        if (draft.installments) setInstallments(draft.installments);
        if (draft.discountValue != null) setDiscountValue(draft.discountValue);
        if (draft.enrollmentFee != null) setEnrollmentFee(draft.enrollmentFee);
        if (draft.paymentStartDate) setPaymentStartDate(draft.paymentStartDate);
        if (draft.signers?.length) setSigners(draft.signers);
      }
    } catch {
      /* ignore corrupted drafts */
    }
  }, [leadId]);

  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          selectedFaixa,
          installments,
          discountValue,
          enrollmentFee,
          paymentStartDate,
          signers,
          showForm: true,
        }),
      );
    } catch {
      /* quota exceeded */
    }
  }, [selectedFaixa, installments, discountValue, enrollmentFee, paymentStartDate, signers, draftKey]);

  useEffect(() => {
    saveDraft();
  }, [saveDraft]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(draftKey);
  }, [draftKey]);

  // Pre-populate signers from lead on mount (only if empty)
  useEffect(() => {
    if (signers.length > 0) return;
    if (lead?.parents && lead.parents.length > 0) {
      setSigners(
        lead.parents.filter((p) => p.email).map((p) => ({
          name: p.fullName,
          email: p.email!,
          role: (p.parentType === 'FATHER' || p.parentType === 'MOTHER' ? 'PARENT' : 'GUARDIAN') as ContractSignerRole,
        })),
      );
    } else if (lead?.primaryContactName && lead?.primaryContactEmail) {
      setSigners([{ name: lead.primaryContactName, email: lead.primaryContactEmail, role: 'PARENT' as ContractSignerRole }]);
    }
  }, []);

  function handleAddSigner() {
    if (!newSignerName.trim() || !newSignerEmail.trim()) return;
    setSigners((prev) => [
      ...prev,
      { name: newSignerName.trim(), email: newSignerEmail.trim(), role: newSignerRole },
    ]);
    setNewSignerName('');
    setNewSignerEmail('');
    setNewSignerRole('PARENT');
  }

  function handleRemoveSigner(index: number) {
    setSigners((prev) => prev.filter((_, i) => i !== index));
  }

  function handleStartEditSigner(index: number) {
    const signer = signers[index];
    setEditingSignerIdx(index);
    setEditSignerName(signer.name);
    setEditSignerEmail(signer.email);
    setEditSignerRole(signer.role);
  }

  function handleSaveEditSigner() {
    if (editingSignerIdx === null) return;
    if (!editSignerName.trim() || !editSignerEmail.trim()) return;
    setSigners((prev) =>
      prev.map((s, i) =>
        i === editingSignerIdx
          ? { name: editSignerName.trim(), email: editSignerEmail.trim(), role: editSignerRole }
          : s,
      ),
    );
    setEditingSignerIdx(null);
  }

  function handleCreateContract() {
    const fee = feeTable.find((f) => f.faixa === selectedFaixa);
    if (!fee) {
      toast.error('Selecione a faixa de serie');
      return;
    }
    if (signers.length === 0) {
      toast.error('Adicione ao menos um assinante');
      return;
    }
    createContract.mutate(
      {
        leadId,
        totalAnnualValue: fee.anuidade,
        installments: installments || 12,
        discountPercent: discountValue > 0 ? discountValue : undefined,
        enrollmentFee: enrollmentFee,
        signers,
        paymentStartDate: paymentStartDate || undefined,
      },
      {
        onSuccess: () => {
          clearDraft();
          onCreated();
        },
      },
    );
  }

  return (
    <div className="border border-neutral-200 rounded-lg p-4 space-y-4 bg-white">
      <h4 className="text-sm font-semibold text-neutral-700">Novo Contrato</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Faixa de Serie</label>
          <select
            value={selectedFaixa}
            onChange={(e) => {
              setSelectedFaixa(e.target.value);
              const fee = feeTable.find((f) => f.faixa === e.target.value);
              if (fee) setEnrollmentFee(fee.entrada);
            }}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Selecione a faixa...</option>
            {feeTable.map((f) => (
              <option key={f.faixa} value={f.faixa}>
                {f.faixa} — R$ {f.anuidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Parcelas</label>
          <select
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}x
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Desconto (%)</label>
          <select
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {discountOptions.map((v) => (
              <option key={v} value={v}>
                {v.toLocaleString('pt-BR', { minimumFractionDigits: v % 1 !== 0 ? 2 : 0 })}%
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Data Inicio Pagamento</label>
          <input
            type="date"
            value={paymentStartDate}
            onChange={(e) => setPaymentStartDate(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Values Summary */}
      {selectedFaixa &&
        (() => {
          const fee = feeTable.find((f) => f.faixa === selectedFaixa);
          if (!fee) return null;
          const parcela = installments > 0 ? (fee.anuidade - enrollmentFee) / installments : 0;
          const parcelaComDesc = discountValue > 0 ? parcela * (1 - discountValue / 100) : parcela;
          return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-xs text-blue-600 font-medium">Anuidade</span>
                  <p className="font-semibold text-blue-900">
                    R$ {fee.anuidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-blue-600 font-medium">Entrada</span>
                  <p className="font-semibold text-blue-900">
                    R$ {enrollmentFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-blue-600 font-medium">{installments}x s/ desc.</span>
                  <p className="font-semibold text-blue-900">
                    R$ {parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {discountValue > 0 && (
                  <div>
                    <span className="text-xs text-green-600 font-medium">
                      {installments}x c/ {discountValue}% desc.
                    </span>
                    <p className="font-semibold text-green-700">
                      R$ {parcelaComDesc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      {/* Signers Table */}
      <div>
        <label className="block text-xs font-medium text-neutral-600 mb-2">Signatarios</label>
        {signers.length > 0 && (
          <div className="border border-neutral-200 rounded-lg overflow-hidden mb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 text-xs text-neutral-500 uppercase tracking-wider">
                  <th className="py-2 px-3 text-left">Nome</th>
                  <th className="py-2 px-3 text-left">Email</th>
                  <th className="py-2 px-3 text-left">Papel</th>
                  <th className="py-2 px-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {signers.map((signer, idx) => (
                  <tr key={idx} className="border-t border-neutral-100">
                    {editingSignerIdx === idx ? (
                      <>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={editSignerName}
                            onChange={(e) => setEditSignerName(e.target.value)}
                            className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="email"
                            value={editSignerEmail}
                            onChange={(e) => setEditSignerEmail(e.target.value)}
                            className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <select
                            value={editSignerRole}
                            onChange={(e) => setEditSignerRole(e.target.value as ContractSignerRole)}
                            className="w-full border border-blue-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                          >
                            {signerRoleOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1.5 px-2">
                          <div className="flex items-center gap-1">
                            <button onClick={handleSaveEditSigner} className="text-green-600 hover:text-green-800">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingSignerIdx(null)} className="text-neutral-400 hover:text-neutral-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-3 text-neutral-700">{signer.name}</td>
                        <td className="py-2 px-3 text-neutral-500">{signer.email}</td>
                        <td className="py-2 px-3">
                          <span className="text-xs">{signerRoleOptions.find((r) => r.value === signer.role)?.label}</span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleStartEditSigner(idx)} className="text-blue-500 hover:text-blue-700">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleRemoveSigner(idx)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Nome ou buscar usuario do sistema..."
              value={newSignerName}
              onChange={(e) => {
                setNewSignerName(e.target.value);
                setNewSignerSearchQuery(e.target.value);
              }}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {newSignerSearchQuery.length >= 2 && createFormUsers?.data && createFormUsers.data.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {createFormUsers.data.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setNewSignerName(u.fullName || u.displayName);
                      setNewSignerEmail(u.email);
                      setNewSignerSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors border-b border-neutral-50 last:border-b-0"
                  >
                    <span className="font-medium text-neutral-700">{u.fullName || u.displayName}</span>
                    <span className="text-neutral-400 ml-1">({u.email})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="email"
              placeholder="Email"
              value={newSignerEmail}
              onChange={(e) => setNewSignerEmail(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="w-40">
            <select
              value={newSignerRole}
              onChange={(e) => {
                setNewSignerRole(e.target.value as ContractSignerRole);
                setNewSignerSearchQuery('');
              }}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {signerRoleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddSigner}
            className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
        <button
          onClick={() => {
            clearDraft();
            onCancel();
          }}
          className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleCreateContract}
          disabled={createContract.isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {createContract.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Criar Contrato
        </button>
      </div>
    </div>
  );
}
