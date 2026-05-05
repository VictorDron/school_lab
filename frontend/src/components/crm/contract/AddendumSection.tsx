import { useState } from 'react';
import {
  Plus,
  FileText,
  Send,
  Ban,
  Eye,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
} from 'lucide-react';
import {
  useContractAddendums,
  useCreateAddendum,
  useGenerateAddendumPdf,
  useSendAddendumForSignature,
  useCancelAddendum,
  useAddendumDocumentUrl,
} from '@/hooks/useAddendums';
import type { ContractAddendum, AddendumType } from '@/types/contract';
import { ADDENDUM_TYPE_LABELS, ADDENDUM_STATUS_LABELS } from '@/types/contract';
import clsx from 'clsx';

interface AddendumSectionProps {
  contractId: string;
  contractCode: string;
  contractSigners?: Array<{ name: string; email: string; role: string; cpf?: string }>;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_SIGNATURE: 'bg-blue-100 text-blue-800',
  SIGNED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const typeOptions: { value: AddendumType; label: string }[] = [
  { value: 'DISCOUNT', label: ADDENDUM_TYPE_LABELS.DISCOUNT },
  { value: 'SPECIAL_CONDITION', label: ADDENDUM_TYPE_LABELS.SPECIAL_CONDITION },
  { value: 'GRADE_CHANGE', label: ADDENDUM_TYPE_LABELS.GRADE_CHANGE },
  { value: 'OTHER', label: ADDENDUM_TYPE_LABELS.OTHER },
];

const signerRoleOptions = [
  { value: 'PARENT', label: 'Responsável' },
  { value: 'GUARDIAN', label: 'Tutor' },
  { value: 'SCHOOL_REPRESENTATIVE', label: 'Repr. Escola' },
  { value: 'WITNESS', label: 'Testemunha' },
];

export function AddendumSection({ contractId, contractCode, contractSigners }: AddendumSectionProps) {
  const { data: addendumResponse, isLoading } = useContractAddendums(contractId);
  const addendums = addendumResponse?.data || [];

  const createAddendum = useCreateAddendum();
  const generatePdf = useGenerateAddendumPdf();
  const sendForSignature = useSendAddendumForSignature();
  const cancelAddendum = useCancelAddendum();
  const getDocUrl = useAddendumDocumentUrl();

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<AddendumType>('DISCOUNT');
  const [description, setDescription] = useState('');
  const [showChangedValues, setShowChangedValues] = useState(false);
  const [changedValues, setChangedValues] = useState<Array<{ field: string; oldValue: string; newValue: string }>>([]);
  const [selectedSigners, setSelectedSigners] = useState<Set<number>>(new Set());
  const [customSigners, setCustomSigners] = useState<Array<{ name: string; email: string; role: string }>>([]);
  const [newSignerName, setNewSignerName] = useState('');
  const [newSignerEmail, setNewSignerEmail] = useState('');
  const [newSignerRole, setNewSignerRole] = useState('PARENT');
  const [expandedAddendum, setExpandedAddendum] = useState<string | null>(null);

  function resetForm() {
    setType('DISCOUNT');
    setDescription('');
    setShowChangedValues(false);
    setChangedValues([]);
    setSelectedSigners(new Set());
    setCustomSigners([]);
    setNewSignerName('');
    setNewSignerEmail('');
    setNewSignerRole('PARENT');
    setShowForm(false);
  }

  function handleCreate() {
    const signers: Array<{ role: string; name: string; email: string; cpf?: string }> = [];

    // Add selected contract signers
    if (contractSigners) {
      selectedSigners.forEach((idx) => {
        const s = contractSigners[idx];
        if (s) {
          signers.push({ role: s.role, name: s.name, email: s.email, cpf: s.cpf });
        }
      });
    }

    // Add custom signers
    customSigners.forEach((s) => {
      signers.push({ role: s.role, name: s.name, email: s.email });
    });

    if (signers.length === 0) return;

    createAddendum.mutate(
      {
        contractId,
        type,
        description,
        changedValues: changedValues.length > 0 ? changedValues : undefined,
        signers,
      },
      { onSuccess: () => resetForm() },
    );
  }

  function addChangedValue() {
    setChangedValues((prev) => [...prev, { field: '', oldValue: '', newValue: '' }]);
  }

  function updateChangedValue(index: number, key: 'field' | 'oldValue' | 'newValue', value: string) {
    setChangedValues((prev) => prev.map((cv, i) => (i === index ? { ...cv, [key]: value } : cv)));
  }

  function removeChangedValue(index: number) {
    setChangedValues((prev) => prev.filter((_, i) => i !== index));
  }

  function addCustomSigner() {
    if (!newSignerName.trim() || !newSignerEmail.trim()) return;
    setCustomSigners((prev) => [...prev, { name: newSignerName.trim(), email: newSignerEmail.trim(), role: newSignerRole }]);
    setNewSignerName('');
    setNewSignerEmail('');
  }

  function toggleContractSigner(idx: number) {
    setSelectedSigners((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }

  async function handleViewPdf(addendum: ContractAddendum, signed = false) {
    getDocUrl.mutate(
      { id: addendum.id, signed },
      {
        onSuccess: (data) => {
          if (data?.url) {
            window.open(data.url, '_blank');
          }
        },
      },
    );
  }

  const totalSigners = selectedSigners.size + customSigners.length;

  return (
    <div className="mt-4 pt-4 border-t border-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          Aditivos Contratuais
        </h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#0aacce] border border-[#0aacce]/30 rounded-lg hover:bg-[#0aacce]/5 transition-colors"
        >
          {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showForm ? 'Fechar' : 'Novo Aditivo'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="mb-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3">
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Tipo do aditivo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AddendumType)}
              className="w-full px-2.5 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-1 focus:ring-[#0aacce] focus:border-[#0aacce]"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o motivo e as condições do aditivo (mínimo 10 caracteres)"
              rows={3}
              className="w-full px-2.5 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-1 focus:ring-[#0aacce] focus:border-[#0aacce] resize-none"
            />
          </div>

          {/* Changed Values */}
          <div>
            <button
              type="button"
              onClick={() => {
                setShowChangedValues(!showChangedValues);
                if (!showChangedValues && changedValues.length === 0) {
                  addChangedValue();
                }
              }}
              className="text-xs font-medium text-neutral-600 hover:text-neutral-800 flex items-center gap-1"
            >
              {showChangedValues ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Alterações de valores
            </button>
            {showChangedValues && (
              <div className="mt-2 space-y-2">
                {changedValues.map((cv, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <input
                      value={cv.field}
                      onChange={(e) => updateChangedValue(idx, 'field', e.target.value)}
                      placeholder="Condição"
                      className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded"
                    />
                    <input
                      value={cv.oldValue}
                      onChange={(e) => updateChangedValue(idx, 'oldValue', e.target.value)}
                      placeholder="Valor anterior"
                      className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded"
                    />
                    <input
                      value={cv.newValue}
                      onChange={(e) => updateChangedValue(idx, 'newValue', e.target.value)}
                      placeholder="Novo valor"
                      className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeChangedValue(idx)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addChangedValue}
                  className="text-xs text-[#0aacce] hover:underline"
                >
                  + Adicionar alteração
                </button>
              </div>
            )}
          </div>

          {/* Signers */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Signatários</label>

            {/* Contract signers (checkboxes) */}
            {contractSigners && contractSigners.length > 0 && (
              <div className="mb-2 space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wide">Do contrato</span>
                {contractSigners.map((s, idx) => (
                  <label key={idx} className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSigners.has(idx)}
                      onChange={() => toggleContractSigner(idx)}
                      className="rounded border-neutral-300 text-[#0aacce] focus:ring-[#0aacce]"
                    />
                    {s.name} ({s.email}) — {signerRoleOptions.find((r) => r.value === s.role)?.label || s.role}
                  </label>
                ))}
              </div>
            )}

            {/* Custom signers list */}
            {customSigners.length > 0 && (
              <div className="mb-2 space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wide">Adicionados</span>
                {customSigners.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-neutral-700 px-2 py-1 bg-white rounded border border-neutral-200">
                    <span>
                      {s.name} ({s.email}) — {signerRoleOptions.find((r) => r.value === s.role)?.label || s.role}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomSigners((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add custom signer */}
            <div className="flex items-end gap-2">
              <input
                value={newSignerName}
                onChange={(e) => setNewSignerName(e.target.value)}
                placeholder="Nome"
                className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded"
              />
              <input
                value={newSignerEmail}
                onChange={(e) => setNewSignerEmail(e.target.value)}
                placeholder="E-mail"
                className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded"
              />
              <select
                value={newSignerRole}
                onChange={(e) => setNewSignerRole(e.target.value)}
                className="px-2 py-1 text-xs border border-neutral-300 rounded"
              >
                {signerRoleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addCustomSigner}
                className="px-2 py-1 text-xs font-medium text-[#0aacce] border border-[#0aacce]/30 rounded hover:bg-[#0aacce]/5"
              >
                Adicionar
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              onClick={handleCreate}
              disabled={description.length < 10 || totalSigners === 0 || createAddendum.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#0aacce] rounded-lg hover:bg-[#0aacce]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createAddendum.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Criar Aditivo
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && addendums.length === 0 && (
        <p className="text-xs text-neutral-400 text-center py-3">Nenhum aditivo cadastrado</p>
      )}

      {/* Addendum list */}
      {addendums.length > 0 && (
        <div className="space-y-2">
          {addendums.map((addendum: ContractAddendum) => {
            const isExpanded = expandedAddendum === addendum.id;
            const isDraft = addendum.status === 'DRAFT';
            const hasPdf = !!addendum.documentUrl;
            const isPending = addendum.status === 'PENDING_SIGNATURE';
            const isSigned = addendum.status === 'SIGNED';
            const isCancelled = addendum.status === 'CANCELLED';

            return (
              <div
                key={addendum.id}
                className="border border-neutral-200 rounded-lg bg-white overflow-hidden"
              >
                {/* Card Header */}
                <div
                  className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-neutral-50 transition-colors"
                  onClick={() => setExpandedAddendum(isExpanded ? null : addendum.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-neutral-700">{addendum.code}</span>
                    <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-medium', statusColors[addendum.status])}>
                      {ADDENDUM_STATUS_LABELS[addendum.status]}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 text-[10px] font-medium">
                      {ADDENDUM_TYPE_LABELS[addendum.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-400">
                      {new Date(addendum.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t border-neutral-100">
                    {/* Description */}
                    <p className="text-xs text-neutral-600 mt-2">{addendum.description}</p>

                    {/* Changed values table */}
                    {addendum.changedValues && addendum.changedValues.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-neutral-500 border-b border-neutral-100">
                              <th className="text-left py-1 pr-2 font-medium">Condição</th>
                              <th className="text-left py-1 pr-2 font-medium">Valor anterior</th>
                              <th className="text-left py-1 font-medium">Novo valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {addendum.changedValues.map((cv, idx) => (
                              <tr key={idx} className="border-b border-neutral-50">
                                <td className="py-1 pr-2 text-neutral-700">{cv.field}</td>
                                <td className="py-1 pr-2 text-red-600 line-through">{cv.oldValue}</td>
                                <td className="py-1 text-green-700 font-medium">{cv.newValue}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Signers */}
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wide font-medium">Signatários</span>
                      <div className="mt-1 space-y-0.5">
                        {addendum.signers.map((signer) => (
                          <div key={signer.id} className="flex items-center gap-2 text-xs">
                            <span className={clsx('w-1.5 h-1.5 rounded-full', signer.hasSigned ? 'bg-green-500' : 'bg-neutral-300')} />
                            <span className="text-neutral-700">{signer.name}</span>
                            <span className="text-neutral-400">{signer.email}</span>
                            <span className="text-neutral-400">
                              ({signerRoleOptions.find((r) => r.value === signer.role)?.label || signer.role})
                            </span>
                            {signer.hasSigned && (
                              <span className="text-[10px] text-green-600 font-medium">Assinou</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    {!isCancelled && (
                      <div className="flex items-center gap-2 pt-1">
                        {isDraft && !hasPdf && (
                          <button
                            onClick={() => generatePdf.mutate({ id: addendum.id })}
                            disabled={generatePdf.isPending}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-700 border border-neutral-300 rounded hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                          >
                            {generatePdf.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                            Gerar PDF
                          </button>
                        )}
                        {isDraft && hasPdf && (
                          <>
                            <button
                              onClick={() => handleViewPdf(addendum)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-700 border border-neutral-300 rounded hover:bg-neutral-50 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              Ver PDF
                            </button>
                            <button
                              onClick={() => sendForSignature.mutate({ id: addendum.id })}
                              disabled={sendForSignature.isPending}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#0aacce] border border-[#0aacce]/30 rounded hover:bg-[#0aacce]/5 disabled:opacity-50 transition-colors"
                            >
                              {sendForSignature.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                              Enviar para Assinatura
                            </button>
                          </>
                        )}
                        {isPending && hasPdf && (
                          <button
                            onClick={() => handleViewPdf(addendum)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-700 border border-neutral-300 rounded hover:bg-neutral-50 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            Ver PDF
                          </button>
                        )}
                        {isSigned && (
                          <>
                            {addendum.signedDocumentUrl && (
                              <button
                                onClick={() => handleViewPdf(addendum, true)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 border border-green-300 rounded hover:bg-green-50 transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                Ver PDF Assinado
                              </button>
                            )}
                            {hasPdf && (
                              <button
                                onClick={() => handleViewPdf(addendum)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-700 border border-neutral-300 rounded hover:bg-neutral-50 transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                Ver PDF Original
                              </button>
                            )}
                          </>
                        )}
                        {isDraft && (
                          <button
                            onClick={() => cancelAddendum.mutate({ id: addendum.id })}
                            disabled={cancelAddendum.isPending}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            {cancelAddendum.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                            Cancelar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
