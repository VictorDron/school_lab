import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Trash2,
  Users,
  Pencil,
  Check,
  X,
  Plus,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { post, del, patch, getErrorMessage, get } from '@/lib/api';
import { SignerProgress } from './SignerProgress';
import type { ContractSignerRole } from '@/types/contract';
import { signerRoleOptions, type NewSigner } from './constants';

interface SignerManagementProps {
  contract: any;
  leadId: string;
}

export function SignerManagement({ contract, leadId }: SignerManagementProps) {
  const queryClient = useQueryClient();

  // Inline edit state for signers in existing contracts
  const [editingExistingSignerId, setEditingExistingSignerId] = useState<string | null>(null);
  const [editExistingName, setEditExistingName] = useState('');
  const [editExistingEmail, setEditExistingEmail] = useState('');
  const [editExistingRole, setEditExistingRole] = useState<ContractSignerRole>('PARENT');

  // Add signer state
  const [addSignerName, setAddSignerName] = useState('');
  const [addSignerEmail, setAddSignerEmail] = useState('');
  const [addSignerRole, setAddSignerRole] = useState<ContractSignerRole>('SCHOOL_REPRESENTATIVE');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const { data: systemUsers } = useQuery({
    queryKey: ['users-search', userSearchQuery],
    queryFn: () =>
      get<Array<{ id: string; email: string; displayName: string; fullName: string }>>('/users', {
        params: { search: userSearchQuery, limit: 10 },
      }),
    enabled: userSearchQuery.length >= 2,
  });

  const addSignerMutation = useMutation({
    mutationFn: ({ contractId, data }: { contractId: string; data: NewSigner }) =>
      post(`/contracts/${contractId}/signers`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      setAddSignerName('');
      setAddSignerEmail('');
      setUserSearchQuery('');
      toast.success('Signatario adicionado');
    },
    onError: (error: any) => toast.error(getErrorMessage(error)),
  });

  const removeSignerMutation = useMutation({
    mutationFn: ({ contractId, signerId }: { contractId: string; signerId: string }) =>
      del(`/contracts/${contractId}/signers/${signerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      toast.success('Signatario removido');
    },
    onError: (error: any) => toast.error(getErrorMessage(error)),
  });

  const updateSignerMutation = useMutation({
    mutationFn: ({
      contractId,
      signerId,
      data,
    }: {
      contractId: string;
      signerId: string;
      data: Partial<NewSigner>;
    }) => patch(`/contracts/${contractId}/signers/${signerId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      setEditingExistingSignerId(null);
      toast.success('Signatario atualizado');
    },
    onError: (error: any) => toast.error(getErrorMessage(error)),
  });

  const canEditSigners = !contract.clicksignEnvelopeId && contract.status !== 'SIGNED' && contract.status !== 'ACTIVE';
  const showRequirements = canEditSigners && contract.status !== 'CANCELLED';

  return (
    <>
      {/* Signer Progress */}
      {contract.signers && contract.signers.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">Signatarios</h5>
          <SignerProgress signers={contract.signers} />

          {/* Edit/Remove signer (only before sending) */}
          {canEditSigners && (
            <div className="mt-2 space-y-1">
              {contract.signers.map((s: any) => (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  {editingExistingSignerId === s.id ? (
                    <>
                      <input
                        type="text"
                        value={editExistingName}
                        onChange={(e) => setEditExistingName(e.target.value)}
                        className="flex-1 border border-blue-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                      <input
                        type="email"
                        value={editExistingEmail}
                        onChange={(e) => setEditExistingEmail(e.target.value)}
                        className="flex-1 border border-blue-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                      <select
                        value={editExistingRole}
                        onChange={(e) => setEditExistingRole(e.target.value as ContractSignerRole)}
                        className="border border-blue-300 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        {signerRoleOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          if (!editExistingName.trim() || !editExistingEmail.trim()) return;
                          updateSignerMutation.mutate({
                            contractId: contract.id,
                            signerId: s.id,
                            data: { name: editExistingName.trim(), email: editExistingEmail.trim(), role: editExistingRole },
                          });
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingExistingSignerId(null)} className="text-neutral-400 hover:text-neutral-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-neutral-700">{s.name}</span>
                      <span className="text-neutral-400">({s.email})</span>
                      <span className="text-neutral-400">— {signerRoleOptions.find((r) => r.value === s.role)?.label}</span>
                      <button
                        onClick={() => {
                          setEditingExistingSignerId(s.id);
                          setEditExistingName(s.name);
                          setEditExistingEmail(s.email);
                          setEditExistingRole(s.role as ContractSignerRole);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeSignerMutation.mutate({ contractId: contract.id, signerId: s.id })}
                        disabled={removeSignerMutation.isPending}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Signer Requirements Checklist + Add Signer */}
      {showRequirements &&
        (() => {
          const schoolReps = (contract.signers || []).filter((s: any) => s.role === 'SCHOOL_REPRESENTATIVE').length;
          const witnesses = (contract.signers || []).filter((s: any) => s.role === 'WITNESS').length;
          return (
            <div className="border border-neutral-200 rounded-lg p-3 space-y-3">
              <h5 className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Requisitos para Assinatura</h5>
              <div className="flex flex-wrap gap-3 text-xs">
                <span
                  className={`flex items-center gap-1 px-2 py-1 rounded-full font-medium ${schoolReps >= 1 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
                >
                  {schoolReps >= 1 ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  Repr. Escola: {schoolReps}/1
                </span>
                <span
                  className={`flex items-center gap-1 px-2 py-1 rounded-full font-medium ${witnesses >= 2 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
                >
                  {witnesses >= 2 ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  Testemunhas: {witnesses}/2
                </span>
              </div>

              {/* Add signer form */}
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <div className="w-36">
                    <select
                      value={addSignerRole}
                      onChange={(e) => {
                        setAddSignerRole(e.target.value as ContractSignerRole);
                        setAddSignerName('');
                        setAddSignerEmail('');
                        setUserSearchQuery('');
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
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Buscar usuario ou digitar nome..."
                      value={addSignerName}
                      onChange={(e) => {
                        setAddSignerName(e.target.value);
                        setUserSearchQuery(e.target.value);
                      }}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    {userSearchQuery.length >= 2 && systemUsers?.data && systemUsers.data.length > 0 && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {systemUsers.data.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setAddSignerName(u.fullName || u.displayName);
                              setAddSignerEmail(u.email);
                              setUserSearchQuery('');
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2"
                          >
                            <Users className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="font-medium">{u.fullName || u.displayName}</span>
                            <span className="text-neutral-400 text-xs">{u.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="email"
                      placeholder="Email"
                      value={addSignerEmail}
                      onChange={(e) => setAddSignerEmail(e.target.value)}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!addSignerName.trim() || !addSignerEmail.trim()) {
                        toast.error('Preencha nome e email');
                        return;
                      }
                      addSignerMutation.mutate({
                        contractId: contract.id,
                        data: { name: addSignerName.trim(), email: addSignerEmail.trim(), role: addSignerRole },
                      });
                    }}
                    disabled={addSignerMutation.isPending}
                    className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
}
