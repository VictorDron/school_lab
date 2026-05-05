import { useState } from 'react';
import { X, Users, ArrowRightLeft, Download } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { gradeOptions } from '@/constants/grades';
import type { StudentStatus } from '@/types/students';

interface BulkActionPayload {
  type: 'changeGrade' | 'changeStatus';
  value: string;
}

interface BulkActionsToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onBulkAction: (action: BulkActionPayload) => void;
  onExportSelected: () => void;
  isLoading: boolean;
}

const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
  { value: 'TRANSFERRED', label: 'Transferido' },
  { value: 'GRADUATED', label: 'Graduado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

export function BulkActionsToolbar({
  selectedIds,
  onClearSelection,
  onBulkAction,
  onExportSelected,
  isLoading,
}: BulkActionsToolbarProps) {
  const [gradeOpen, setGradeOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const count = selectedIds.length;

  function handleGradeChange(value: string) {
    onBulkAction({ type: 'changeGrade', value });
    setGradeOpen(false);
  }

  function handleStatusChange(value: string) {
    onBulkAction({ type: 'changeStatus', value });
    setStatusOpen(false);
  }

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="sticky bottom-0 z-10 bg-violet-600 text-white rounded-t-xl shadow-lg px-6 py-3 flex items-center justify-between gap-4"
        >
          {/* Left: count */}
          <div className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
            <Users className="w-4 h-4" />
            <span>
              {count} aluno{count !== 1 ? 's' : ''} selecionado{count !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Center: actions */}
          <div className="flex items-center gap-2">
            {/* Grade change */}
            <div className="relative">
              <button
                onClick={() => {
                  setGradeOpen(!gradeOpen);
                  setStatusOpen(false);
                }}
                disabled={isLoading}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-50"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Alterar Turma
              </button>
              {gradeOpen && (
                <div className="absolute bottom-full mb-1 left-0 bg-white text-neutral-800 rounded-lg shadow-xl border border-neutral-200 py-1 max-h-60 overflow-y-auto w-56 z-20">
                  {gradeOptions.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => handleGradeChange(g.value)}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-violet-50 transition-colors"
                    >
                      {g.en}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status change */}
            <div className="relative">
              <button
                onClick={() => {
                  setStatusOpen(!statusOpen);
                  setGradeOpen(false);
                }}
                disabled={isLoading}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-50"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Alterar Status
              </button>
              {statusOpen && (
                <div className="absolute bottom-full mb-1 left-0 bg-white text-neutral-800 rounded-lg shadow-xl border border-neutral-200 py-1 w-48 z-20">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusChange(opt.value)}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-violet-50 transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export */}
            <button
              onClick={onExportSelected}
              disabled={isLoading}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar Selecionados
            </button>
          </div>

          {/* Right: clear */}
          <button
            onClick={onClearSelection}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 text-sm transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Limpar Seleção
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
