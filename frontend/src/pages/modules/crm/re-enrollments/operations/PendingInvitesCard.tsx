import { useState } from 'react';
import { Send, Loader2, Hourglass, Users } from 'lucide-react';
import {
  useReEnrollmentManagement,
  useBatchCreateInvites,
} from '@/hooks/useReEnrollmentAdmin';
import EligibleStudentsDrawer from '../EligibleStudentsDrawer';

export default function PendingInvitesCard({ periodId }: { periodId: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data, isLoading } = useReEnrollmentManagement(periodId, {});
  const batchMutation = useBatchCreateInvites();

  const meta = data?.meta as { awaiting?: number } | undefined;
  const awaiting = meta?.awaiting ?? 0;

  return (
    <section className="bg-white border border-neutral-200 rounded-xl">
      <header className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
        <Hourglass className="w-4 h-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-neutral-800">
          Convites a enviar
        </h3>
        <span className="text-xs text-neutral-500">({awaiting})</span>
      </header>

      <div className="px-4 py-4 flex flex-wrap items-center gap-3">
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
        ) : awaiting === 0 ? (
          <p className="text-sm text-neutral-500">
            Todos os alunos elegíveis já receberam convite.
          </p>
        ) : (
          <>
            <p className="flex-1 min-w-[200px] text-sm text-neutral-700">
              <strong>{awaiting}</strong> aluno(s) elegível(eis) ainda sem convite.
            </p>
            <button
              onClick={() => batchMutation.mutate(periodId)}
              disabled={batchMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:opacity-50 transition-colors"
            >
              {batchMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Enviar todos em lote
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-700 border border-cyan-300 rounded-md hover:bg-cyan-50 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              Selecionar manualmente
            </button>
          </>
        )}
      </div>

      <EligibleStudentsDrawer
        periodId={periodId}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </section>
  );
}
