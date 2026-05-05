import { useState, useMemo, useCallback } from 'react';
import {
  Send,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Mail,
  Search,
  X,
} from 'lucide-react';
import {
  useEligibleStudents,
  useCreateSingleInvite,
  useReEnrollmentInvites,
} from '@/hooks/useReEnrollmentAdmin';
import type { EligibleStudent } from '@/types/re-enrollment';
import toast from 'react-hot-toast';

const PAGE_SIZE = 30;

export default function EligibleStudentsTab({
  periodId,
  onNavigateToInvites,
}: {
  periodId: string;
  onNavigateToInvites?: () => void;
}) {
  const { data, isLoading } = useEligibleStudents(periodId);
  const { data: inviteData } = useReEnrollmentInvites(periodId, {});
  const singleInviteMutation = useCreateSingleInvite();
  const students = data?.data ?? [];
  const meta = data?.meta as { alreadyInvited?: number } | undefined;

  const allInvites = inviteData?.data ?? [];
  const inviteCounts = useMemo(
    () => ({
      total: allInvites.length,
      confirmed: allInvites.filter((i) => i.status === 'CONFIRMED').length,
      pending: allInvites.filter((i) => ['SENT', 'OPENED', 'PENDING'].includes(i.status)).length,
      declined: allInvites.filter((i) => i.status === 'DECLINED').length,
      expired: allInvites.filter((i) => i.status === 'EXPIRED').length,
    }),
    [allInvites],
  );

  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmStudent, setConfirmStudent] = useState<EligibleStudent | null>(null);
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const grades = useMemo(() => {
    const set = new Set<string>();
    for (const s of students) if (s.grade) set.add(s.grade);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (gradeFilter && s.grade !== gradeFilter) return false;
      if (!q) return true;
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.leadEmail ?? '').toLowerCase().includes(q)
      );
    });
  }, [students, search, gradeFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visible.length;

  const allVisibleSelected =
    visible.length > 0 && visible.every((s) => selectedIds.has(s.id));

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const everySelected = visible.every((s) => next.has(s.id));
      if (everySelected) {
        for (const s of visible) next.delete(s.id);
      } else {
        for (const s of visible) next.add(s.id);
      }
      return next;
    });
  }, [visible]);

  const toggleStudent = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setGradeFilter('');
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleConfirmSend = useCallback(() => {
    if (!confirmStudent) return;
    singleInviteMutation.mutate(
      { periodId, studentId: confirmStudent.id },
      {
        onSuccess: () => {
          setConfirmStudent(null);
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(confirmStudent.id);
            return next;
          });
        },
      },
    );
  }, [confirmStudent, periodId, singleInviteMutation]);

  const handleSendSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setIsSendingBatch(true);
    const ids = Array.from(selectedIds);
    const results = await Promise.allSettled(
      ids.map((studentId) => singleInviteMutation.mutateAsync({ periodId, studentId })),
    );
    const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
    const rejected = results.filter((r) => r.status === 'rejected').length;
    if (rejected === 0) {
      toast.success(`${fulfilled} convite(s) enviado(s) com sucesso.`);
    } else {
      toast.error(`${fulfilled} convite(s) enviado(s), ${rejected} falha(s).`);
    }
    setSelectedIds(new Set());
    setIsSendingBatch(false);
  }, [selectedIds, periodId, singleInviteMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="py-8">
        <div className="text-center mb-6">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
          <p className="text-sm font-semibold text-neutral-700">
            Todos os {inviteCounts.total} alunos elegíveis já foram convidados
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 max-w-2xl mx-auto">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
            <div className="text-xl font-semibold text-emerald-700">{inviteCounts.confirmed}</div>
            <div className="text-xs text-emerald-600 mt-0.5">Confirmados</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
            <div className="text-xl font-semibold text-amber-700">{inviteCounts.pending}</div>
            <div className="text-xs text-amber-600 mt-0.5">Pendentes</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <div className="text-xl font-semibold text-red-700">{inviteCounts.declined}</div>
            <div className="text-xs text-red-600 mt-0.5">Recusados</div>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-center">
            <div className="text-xl font-semibold text-neutral-600">{inviteCounts.expired}</div>
            <div className="text-xs text-neutral-500 mt-0.5">Expirados</div>
          </div>
        </div>
        <div className="text-center">
          <button
            onClick={() => onNavigateToInvites?.()}
            className="text-xs text-cyan-600 hover:underline"
          >
            Ver convites detalhados
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex items-center justify-between gap-3 flex-wrap text-sm">
        <div className="flex items-center gap-2 text-neutral-600">
          <Users className="w-4 h-4" />
          <span>
            <strong className="text-neutral-900">{filtered.length}</strong>
            {filtered.length !== students.length && (
              <span className="text-neutral-400"> de {students.length}</span>
            )}{' '}
            aluno(s) elegível(eis)
          </span>
          {meta?.alreadyInvited ? (
            <span className="text-neutral-400">
              · {meta.alreadyInvited} já convidado(s)
            </span>
          ) : null}
        </div>
      </div>

      {/* Search + filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Buscar por nome, código ou e-mail..."
            className="w-full pl-9 pr-9 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-700"
              aria-label="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select
          value={gradeFilter}
          onChange={(e) => {
            setGradeFilter(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className="px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">Todas as séries</option>
          {grades.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        {(search || gradeFilter) && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-xs font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 flex items-center gap-3 bg-cyan-50 border border-cyan-200 rounded-lg px-4 py-2.5">
          <span className="text-sm font-medium text-cyan-800">
            {selectedIds.size} aluno(s) selecionado(s)
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setSelectedIds(new Set())}
            className="px-3 py-1.5 text-xs font-medium text-cyan-700 border border-cyan-300 rounded-md hover:bg-cyan-100"
          >
            Limpar seleção
          </button>
          <button
            onClick={handleSendSelected}
            disabled={isSendingBatch}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:opacity-50"
          >
            {isSendingBatch ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Enviar para selecionados
          </button>
        </div>
      )}

      {/* List */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
        {/* Header row */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 text-xs font-medium text-neutral-600">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleSelectAllVisible}
            className="rounded border-neutral-300 text-cyan-600 focus:ring-cyan-500"
            aria-label="Selecionar todos visíveis"
          />
          <div className="flex-1 min-w-0">Aluno</div>
          <div className="w-24 hidden md:block">Série</div>
          <div className="w-64 hidden lg:block">E-mail do responsável</div>
          <div className="w-24 text-right">Ação</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-neutral-500">
            Nenhum aluno corresponde aos filtros.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {visible.map((s) => {
              const selected = selectedIds.has(s.id);
              return (
                <li
                  key={s.id}
                  className={`flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 transition-colors ${
                    selected ? 'bg-cyan-50/50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleStudent(s.id)}
                    className="rounded border-neutral-300 text-cyan-600 focus:ring-cyan-500"
                    aria-label={`Selecionar ${s.fullName}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-900 truncate" title={s.fullName}>
                      {s.fullName}
                    </div>
                    <div className="text-xs text-neutral-400 font-mono truncate" title={s.code}>
                      {s.code}
                    </div>
                  </div>
                  <div className="w-24 text-sm text-neutral-600 truncate hidden md:block" title={s.grade ?? ''}>
                    {s.grade || '—'}
                  </div>
                  <div className="w-64 text-sm text-neutral-500 truncate hidden lg:block" title={s.leadEmail ?? ''}>
                    {s.leadEmail || (
                      <span className="text-amber-600 inline-flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        sem e-mail
                      </span>
                    )}
                  </div>
                  <div className="w-24 text-right">
                    <button
                      onClick={() => setConfirmStudent(s)}
                      disabled={singleInviteMutation.isPending}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-cyan-700 border border-cyan-300 rounded-md hover:bg-cyan-50 disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      Enviar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {hasMore && (
          <div className="px-4 py-3 border-t border-neutral-100 text-center">
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="text-xs font-medium text-cyan-700 hover:text-cyan-800"
            >
              Carregar mais ({filtered.length - visible.length} restantes)
            </button>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {confirmStudent && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center"
          onClick={() => setConfirmStudent(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center mb-4">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mb-3">
                <Mail className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">
                Confirmar envio de convite
              </h3>
            </div>
            <p className="text-sm text-neutral-700 text-center mb-2">
              Enviar convite de rematrícula para <strong>{confirmStudent.fullName}</strong>?
            </p>
            <p className="text-sm text-neutral-500 text-center mb-4">
              O e-mail será enviado para{' '}
              <strong>{confirmStudent.leadEmail || 'E-mail não cadastrado'}</strong>
            </p>
            {!confirmStudent.leadEmail && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 inline mr-1.5 text-amber-500" />
                Este aluno não possui e-mail de responsável cadastrado. O convite será criado, mas
                o e-mail não será enviado.
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmStudent(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSend}
                disabled={singleInviteMutation.isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50"
              >
                {singleInviteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Enviar convite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
