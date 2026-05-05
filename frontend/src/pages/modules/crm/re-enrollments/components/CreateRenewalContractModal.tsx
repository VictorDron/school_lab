import { useState, useEffect, useMemo } from 'react';
import { FileSignature, Loader2, X, Trash2, AlertTriangle } from 'lucide-react';
import { useCreateRenewalContract } from '@/hooks/useReEnrollmentAdmin';
import { usePreReEnrollmentDashboard } from '@/hooks/usePreReEnrollment';
import { useContractDefaultSigners } from '@/hooks/useContractDefaultSigners';
import { signerRoleOptions } from '@/components/crm/contract/constants';
import { api } from '@/lib/api';
import type { ContractSignerRole } from '@/types/contract';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inviteId: string;
  periodId: string;
  studentId: string;
  studentName: string;
  studentGrade: string | null;
  leadId: string;
}

interface ParentInfo {
  fullName: string;
  email: string;
  cpf?: string;
  phone?: string;
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function CreateRenewalContractModal({
  isOpen,
  onClose,
  inviteId,
  periodId,
  studentId,
  studentName,
  studentGrade,
  leadId,
}: Props) {
  const createMutation = useCreateRenewalContract();
  const { data: dashboardData, isLoading: dashboardLoading } = usePreReEnrollmentDashboard(periodId);
  const { data: defaultSignersData } = useContractDefaultSigners();

  const installments = 12;
  const [sendForSignature, setSendForSignature] = useState(true);
  const [signers, setSigners] = useState<Array<{ role: string; name: string; email: string; cpf: string }>>([]);
  type SignerEntry = { role: string; name: string; email: string; cpf: string };
  const [loadingLead, setLoadingLead] = useState(true);

  // Find student's pre-calculated financial data from the dashboard
  const studentPrice = useMemo(() => {
    if (!dashboardData?.data?.students) return null;
    return dashboardData.data.students.find((s) => s.studentId === studentId) ?? null;
  }, [dashboardData, studentId]);

  // Get price table entry for this grade (fallback if student not in dashboard)
  const priceTableEntry = useMemo(() => {
    if (!dashboardData?.data?.priceTable || !studentGrade) return null;
    return dashboardData.data.priceTable.find((e) => e.grade === studentGrade) ?? null;
  }, [dashboardData, studentGrade]);

  // Resolve values: student exception > price table > 0
  const annualValue = studentPrice?.finalAnnualValue ?? priceTableEntry?.baseAnnualValue ?? 0;
  const enrollmentFee = priceTableEntry?.enrollmentFee ?? 0;
  const discountPercent = studentPrice?.exceptionOverrideDiscountPercent ?? 0;
  const monthlyValue = installments > 0 ? annualValue / installments : 0;
  const hasFinancialData = annualValue > 0;

  // Pre-populate signers from lead parents + default signers
  useEffect(() => {
    if (!isOpen || !leadId) return;
    setLoadingLead(true);

    const defaults: SignerEntry[] = (defaultSignersData?.data ?? []).map((ds) => ({
      role: ds.role,
      name: ds.name,
      email: ds.email,
      cpf: '',
    }));

    api.get(`/leads/${leadId}`)
      .then((res) => {
        const lead = res.data.data;
        const parents = (lead?.parents || []) as Array<ParentInfo & { parentType?: string }>;
        const withEmail = parents.filter((p) => p.email);

        if (withEmail.length > 0) {
          const mapped: SignerEntry[] = withEmail.map((p) => ({
            role: (p.parentType === 'FATHER' || p.parentType === 'MOTHER') ? 'PARENT' : 'GUARDIAN',
            name: p.fullName || '',
            email: p.email || '',
            cpf: p.cpf || '',
          }));
          setSigners([...mapped, ...defaults]);
        } else if (lead?.primaryContactName && lead?.primaryContactEmail) {
          setSigners([{ role: 'PARENT', name: lead.primaryContactName, email: lead.primaryContactEmail, cpf: '' }, ...defaults]);
        } else {
          setSigners([{ role: 'PARENT', name: '', email: '', cpf: '' }, ...defaults]);
        }
      })
      .catch(() => {
        setSigners([{ role: 'PARENT', name: '', email: '', cpf: '' }, ...defaults]);
      })
      .finally(() => setLoadingLead(false));
  }, [isOpen, leadId, defaultSignersData]);

  const validSigners = signers.filter((s) => s.name && s.email);
  const canSubmit = hasFinancialData && validSigners.length > 0 && !createMutation.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;

    createMutation.mutate({
      inviteId,
      data: {
        leadId,
        totalAnnualValue: annualValue,
        installments,
        discountPercent: discountPercent || undefined,
        enrollmentFee: enrollmentFee || undefined,
        signers: validSigners,
        sendForSignature,
      },
    }, {
      onSuccess: () => onClose(),
    });
  };

  if (!isOpen) return null;

  const updateSigner = (idx: number, field: string, value: string) => {
    const updated = [...signers];
    updated[idx] = { ...updated[idx], [field]: value };
    setSigners(updated);
  };

  const removeSigner = (idx: number) => {
    if (signers.length <= 1) return;
    setSigners(signers.filter((_, i) => i !== idx));
  };

  const loading = loadingLead || dashboardLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
              <FileSignature className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">Criar Contrato de Rematrícula</h3>
              <p className="text-xs text-neutral-500">{studentName} — {studentGrade}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Financial summary — read-only from pre-reenrollment */}
            {hasFinancialData ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2.5">
                <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Valores da Pré-Rematrícula</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Valor anual:</span>
                  <span className="font-semibold text-neutral-900">{formatBRL(annualValue)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Desconto aplicado:</span>
                    <span className="font-medium text-emerald-700">{discountPercent}%</span>
                  </div>
                )}
                {enrollmentFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Entrada:</span>
                    <span className="font-medium text-neutral-900">{formatBRL(enrollmentFee)}</span>
                  </div>
                )}
                {studentPrice?.hasException && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-1">
                    Exceção: {studentPrice.exceptionJustification}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Valores não encontrados</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Não foi possível encontrar os valores para este aluno. Verifique se a tabela de preços da campanha está configurada para a série {studentGrade}.
                  </p>
                </div>
              </div>
            )}

            {/* Installments — readonly */}
            {hasFinancialData && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Parcelas</label>
                  <div className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-700">
                    {installments}x
                  </div>
                </div>
                <div className="flex items-end">
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 w-full text-center">
                    <span className="text-xs text-neutral-500 block">Parcela mensal</span>
                    <span className="text-sm font-bold text-cyan-700">{formatBRL(monthlyValue)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Signers */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-2">Signatários</label>
              <div className="space-y-2">
                {signers.map((signer, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2.5 bg-neutral-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <select
                        value={signer.role}
                        onChange={(e) => updateSigner(idx, 'role', e.target.value)}
                        className="px-2 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        {signerRoleOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <input
                        placeholder="Nome"
                        value={signer.name}
                        onChange={(e) => updateSigner(idx, 'name', e.target.value)}
                        className="px-2 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                      <input
                        placeholder="E-mail"
                        type="email"
                        value={signer.email}
                        onChange={(e) => updateSigner(idx, 'email', e.target.value)}
                        className="px-2 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                    {signers.length > 1 && (
                      <button
                        onClick={() => removeSigner(idx)}
                        className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                        title="Remover signatário"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setSigners([...signers, { role: 'WITNESS', name: '', email: '', cpf: '' }])}
                  className="text-xs text-cyan-600 hover:text-cyan-700 hover:underline font-medium"
                >
                  + Adicionar signatário
                </button>
              </div>
            </div>

            {/* Send for signature option */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendForSignature}
                onChange={(e) => setSendForSignature(e.target.checked)}
                className="rounded border-neutral-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-sm text-neutral-700">Enviar para assinatura automaticamente</span>
            </label>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSignature className="w-4 h-4" />
                )}
                Criar Contrato
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
