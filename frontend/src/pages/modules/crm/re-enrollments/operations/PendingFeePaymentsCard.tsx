import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Loader2, ExternalLink } from 'lucide-react';
import { useReEnrollmentManagement } from '@/hooks/useReEnrollmentAdmin';

export default function PendingFeePaymentsCard({ periodId }: { periodId: string }) {
  const navigate = useNavigate();
  const { data, isLoading } = useReEnrollmentManagement(periodId, {});

  const rows = useMemo(() => {
    const all = data?.data ?? [];
    return all.filter((r) => r.invite?.gateStatus === 'CONTRATO_ASSINADO');
  }, [data]);

  return (
    <section className="bg-white border border-neutral-200 rounded-xl">
      <header className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-cyan-600" />
        <h3 className="text-sm font-semibold text-neutral-800">
          Pagamentos a registrar
        </h3>
        <span className="text-xs text-neutral-500">({rows.length})</span>
      </header>

      {isLoading ? (
        <div className="px-4 py-6 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
        </div>
      ) : rows.length === 0 ? (
        <p className="px-4 py-4 text-sm text-neutral-500">
          Nenhum aluno aguardando registro de pagamento da entrada.
        </p>
      ) : (
        <ul className="px-2 py-2 divide-y divide-neutral-100">
          {rows.map((row) => (
            <li
              key={row.invite!.id}
              className="flex items-center gap-3 px-2 py-2"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-neutral-800 truncate">
                  {row.student.fullName}
                </div>
                <div className="text-xs text-neutral-400">
                  {row.student.grade ?? '—'}
                </div>
              </div>
              <button
                onClick={() =>
                  navigate(`/crm/re-enrollments/invites/${row.invite!.id}`)
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-md hover:bg-cyan-100 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Registrar pagamento
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
