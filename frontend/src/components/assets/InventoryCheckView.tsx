import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Tag,
  StickyNote,
  ArrowLeft,
  Play,
  ClipboardCheck,
} from 'lucide-react';
import {
  useInventorySession,
  useCheckInventoryItem,
  useCompleteInventory,
  useStartInventory,
} from '@/hooks/useAssets';
import type { InventoryItem, InventoryItemStatus } from '@/types/assets';

interface InventoryCheckViewProps {
  sessionId: string;
  onClose: () => void;
}

type FilterOption = 'ALL' | 'PENDING' | 'FOUND' | 'NOT_FOUND';

const filterLabels: Record<FilterOption, string> = {
  ALL: 'Todos',
  PENDING: 'Pendentes',
  FOUND: 'Encontrados',
  NOT_FOUND: 'Não Encontrados',
};

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function InventoryCheckView({ sessionId, onClose }: InventoryCheckViewProps) {
  const { data: sessionData, isLoading } = useInventorySession(sessionId);
  const checkItemMutation = useCheckInventoryItem();
  const completeMutation = useCompleteInventory();
  const startMutation = useStartInventory();

  const session = sessionData?.data;

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterOption>('ALL');
  const [noteItemId, setNoteItemId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const items = session?.items || [];

  const foundCount = useMemo(
    () => items.filter((i) => i.status === 'FOUND').length,
    [items],
  );
  const missingCount = useMemo(
    () => items.filter((i) => i.status === 'NOT_FOUND').length,
    [items],
  );
  const pendingCount = useMemo(
    () => items.filter((i) => i.status === 'PENDING').length,
    [items],
  );
  const totalCount = items.length;
  const checkedCount = foundCount + missingCount;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const allChecked = totalCount > 0 && pendingCount === 0;

  const filteredItems = useMemo(() => {
    let result = items;

    if (filter !== 'ALL') {
      result = result.filter((item) => item.status === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.asset?.code?.toLowerCase().includes(q) ||
          item.asset?.name?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [items, filter, search]);

  const handleCheck = (item: InventoryItem, status: 'FOUND' | 'NOT_FOUND', notes?: string) => {
    checkItemMutation.mutate({
      sessionId,
      itemId: item.id,
      status,
      notes,
    });
  };

  const handleNotFoundClick = (itemId: string) => {
    setNoteItemId(itemId);
    setNoteText('');
  };

  const handleConfirmNotFound = () => {
    if (!noteItemId) return;
    const item = items.find((i) => i.id === noteItemId);
    if (item) {
      handleCheck(item, 'NOT_FOUND', noteText.trim() || undefined);
    }
    setNoteItemId(null);
    setNoteText('');
  };

  const handleCancelNotFound = () => {
    setNoteItemId(null);
    setNoteText('');
  };

  const handleStartInventory = () => {
    startMutation.mutate(sessionId);
  };

  const handleCompleteInventory = () => {
    completeMutation.mutate(sessionId, {
      onSuccess: () => onClose(),
    });
  };

  const getStatusBadge = (item: InventoryItem) => {
    switch (item.status) {
      case 'FOUND':
        return (
          <div className="flex items-center gap-1.5 text-success-700 bg-success-50 border border-success-200 rounded-lg px-3 py-1.5 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Encontrado
              {item.checkedBy && <> por {item.checkedBy.displayName}</>}
              {item.checkedAt && <>, {formatDateTime(item.checkedAt)}</>}
            </span>
          </div>
        );
      case 'NOT_FOUND':
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-error-700 bg-error-50 border border-error-200 rounded-lg px-3 py-1.5 text-sm">
              <XCircle className="w-4 h-4" />
              <span>Não Encontrado</span>
            </div>
            {item.notes && (
              <div className="flex items-start gap-1.5 text-xs text-neutral-600 bg-neutral-50 rounded-lg px-3 py-1.5 border border-neutral-200">
                <StickyNote className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 mt-0.5" />
                <span>"{item.notes}"</span>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-warning-700 bg-warning-50 border border-warning-200 rounded-lg px-3 py-1.5 text-sm">
            <Clock className="w-4 h-4" />
            <span>Pendente</span>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="bg-white rounded-xl shadow-large p-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-sm text-neutral-600">Carregando inventário...</p>
          </div>
        </motion.div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="bg-white rounded-xl shadow-large p-8 flex flex-col items-center gap-3">
            <XCircle className="w-8 h-8 text-error-500" />
            <p className="text-sm text-neutral-600">Sessão não encontrada.</p>
            <button onClick={onClose} className="btn btn-secondary btn-sm mt-2">
              Fechar
            </button>
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 z-50 flex flex-col bg-white"
      >
        {/* Top Bar */}
        <div className="bg-white border-b border-neutral-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-600" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-neutral-900">
                    {session.code} &mdash; {session.name}
                  </h1>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className={`badge ${
                      session.status === 'DRAFT'
                        ? 'badge-neutral'
                        : session.status === 'IN_PROGRESS'
                          ? 'badge-warning'
                          : session.status === 'COMPLETED'
                            ? 'badge-success'
                            : 'badge-neutral'
                    }`}
                  >
                    {session.status === 'DRAFT'
                      ? 'Rascunho'
                      : session.status === 'IN_PROGRESS'
                        ? 'Em Andamento'
                        : session.status === 'COMPLETED'
                          ? 'Concluído'
                          : session.status}
                  </span>
                  <span className="text-sm text-neutral-500">
                    Progresso: {progressPercent}%
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-neutral-600" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-primary-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-success-700">
                <CheckCircle2 className="w-4 h-4" />
                {foundCount}
              </span>
              <span className="flex items-center gap-1.5 text-error-700">
                <XCircle className="w-4 h-4" />
                {missingCount}
              </span>
              <span className="flex items-center gap-1.5 text-warning-700">
                <Clock className="w-4 h-4" />
                {pendingCount}
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código ou nome..."
              className="input pl-10"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterOption)}
            className="input w-auto"
          >
            {(Object.keys(filterLabels) as FilterOption[]).map((key) => (
              <option key={key} value={key}>
                {filterLabels[key]}
              </option>
            ))}
          </select>
        </div>

        {/* Draft state: Start button */}
        {session.status === 'DRAFT' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <ClipboardCheck className="w-12 h-12 text-primary-400 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-neutral-800">Inventário em Rascunho</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  Inicie o inventário para começar a verificação dos ativos.
                </p>
              </div>
              <button
                onClick={handleStartInventory}
                disabled={startMutation.isPending}
                className="btn btn-primary btn-md"
              >
                {startMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Inventário
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Items list */}
        {session.status !== 'DRAFT' && (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm text-neutral-500">Nenhum item encontrado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="card p-4 space-y-3"
                  >
                    {/* Item header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-medium text-primary-600">
                            {item.asset?.code || '---'}
                          </span>
                          <span className="text-sm font-semibold text-neutral-800 truncate">
                            {item.asset?.name || 'Ativo desconhecido'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-neutral-500">
                          {item.asset?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {item.asset.location.name}
                            </span>
                          )}
                          {item.asset?.category && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5" />
                              {item.asset.category.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status display or action buttons */}
                    {item.status === 'PENDING' ? (
                      noteItemId === item.id ? (
                        /* Note input for NOT_FOUND */
                        <div className="space-y-2">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            rows={2}
                            placeholder="Observação (opcional)..."
                            className="input resize-none text-sm"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleConfirmNotFound}
                              disabled={checkItemMutation.isPending}
                              className="btn btn-sm bg-error-600 text-white hover:bg-error-700 focus:ring-error-500"
                            >
                              {checkItemMutation.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                'Confirmar Não Encontrado'
                              )}
                            </button>
                            <button
                              onClick={handleCancelNotFound}
                              className="btn btn-secondary btn-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Action buttons */
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCheck(item, 'FOUND')}
                            disabled={checkItemMutation.isPending}
                            className="btn btn-sm bg-success-600 text-white hover:bg-success-700 focus:ring-success-500 flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Encontrado
                          </button>
                          <button
                            onClick={() => handleNotFoundClick(item.id)}
                            disabled={checkItemMutation.isPending}
                            className="btn btn-sm bg-error-600 text-white hover:bg-error-700 focus:ring-error-500 flex items-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Não Encontrado
                          </button>
                        </div>
                      )
                    ) : (
                      getStatusBadge(item)
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom action bar */}
        {session.status === 'IN_PROGRESS' && allChecked && (
          <div className="bg-white border-t border-neutral-200 px-6 py-4 flex items-center justify-end flex-shrink-0">
            <button
              onClick={handleCompleteInventory}
              disabled={completeMutation.isPending}
              className="btn btn-primary btn-md flex items-center gap-2"
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <ClipboardCheck className="w-4 h-4" />
                  Finalizar Inventário
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}
