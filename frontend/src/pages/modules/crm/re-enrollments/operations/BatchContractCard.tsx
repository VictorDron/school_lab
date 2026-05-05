import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSignature, Loader2, AlertCircle } from 'lucide-react';
import { useReEnrollmentManagement } from '@/hooks/useReEnrollmentAdmin';
import {
  useContractDefaultSigners,
  useBatchCreateContracts,
} from '@/hooks/useContractDefaultSigners';

export default function BatchContractCard({ periodId }: { periodId: string }) {
  const navigate = useNavigate();
  const { data, isLoading } = useReEnrollmentManagement(periodId, {});
  const { data: signersData } = useContractDefaultSigners();
  const batchMutation = useBatchCreateContracts();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const eligibleRows = useMemo(() => {
    const rows = data?.data ?? [];
    return rows.filter(
      (r) =>
        r.invite?.gateStatus === 'DOCS_APROVADOS' &&
        !r.student?.lead?.contracts?.[0],
    );
  }, [data]);

  const hasDefaultSigners = (signersData?.data ?? []).length > 0;

  const allSelected =
    eligibleRows.length > 0 &&
    eligibleRows.every((r) => selectedIds.has(r.invite!.id));

  const toggleAll = useCallback(() => {
    setSelectedIds(
      allSelected
        ? new Set()
        : new Set(eligibleRows.map((r) => r.invite!.id)),
    );
  }, [allSelected, eligibleRows]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBatch = useCallback(() => {
    if (selectedIds.size === 0) return;
    batchMutation.mutate(
      {
        periodId,
        inviteIds: Array.from(selectedIds),
        sendForSignature: true,
      },
      { onSuccess: () => setSelectedIds(new Set()) },
    );
  }, [selectedIds, periodId, batchMutation]);

  return (
    <section className="bg-white border border-neutral-200 rounded-xl">
      <header className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
        <FileSignature className="w-4 h-4 text-emerald-600" />
        <h3 className="text-sm font-semibold text-neutral-800">
          Contratos prontos para criar em lote
        </h3>
        <span className="text-xs text-neutral-500">({eligibleRows.length})</span>
      </header>

      {isLoading ? (
        <div className="px-4 py-6 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
        </div>
      ) : eligibleRows.length === 0 ? (
        <p className="px-4 py-4 text-sm text-neutral-500">
          Nenhum aluno aguardando criação de contrato.
        </p>
      ) : (
        <>
          {!hasDefaultSigners && (
            <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Configure os signatários padrão da campanha antes de criar contratos
                em lote.
              </p>
            </div>
          )}

          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                  aria-label="Selecionar todos os alunos elegíveis"
                />
                Selecionar todos
              </label>
              <button
                onClick={handleBatch}
                disabled={
                  selectedIds.size === 0 ||
                  !hasDefaultSigners ||
                  batchMutation.isPending
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {batchMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSignature className="w-3.5 h-3.5" />
                )}
                Criar contratos ({selectedIds.size})
              </button>
            </div>
            <ul className="border border-neutral-100 rounded-lg divide-y divide-neutral-100">
              {eligibleRows.map((row) => (
                <li
                  key={row.invite!.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.invite!.id)}
                    onChange={() => toggleOne(row.invite!.id)}
                    className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                    aria-label={`Selecionar ${row.student.fullName}`}
                  />
                  <button
                    onClick={() =>
                      navigate(`/crm/re-enrollments/invites/${row.invite!.id}`)
                    }
                    className="flex-1 text-left text-sm text-neutral-800 hover:text-emerald-700 truncate"
                  >
                    {row.student.fullName}
                  </button>
                  <span className="text-xs text-neutral-400 flex-shrink-0">
                    {row.student.grade ?? '—'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
