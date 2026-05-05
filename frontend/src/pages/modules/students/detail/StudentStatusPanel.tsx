import { useState } from 'react';
import clsx from 'clsx';
import { useUpdateStudentStatus } from '@/hooks/useStudents';
import type { Student, StudentStatus } from '@/types/students';

interface StudentStatusPanelProps {
  student: Student;
}

const STATUS_LABELS: Record<StudentStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  TRANSFERRED: 'Transferido',
  GRADUATED: 'Graduado',
  CANCELLED: 'Cancelado',
};

const STATUS_CLASSES: Record<StudentStatus, string> = {
  ACTIVE: 'bg-green-50 text-green-700 border-green-200',
  INACTIVE: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  TRANSFERRED: 'bg-blue-50 text-blue-700 border-blue-200',
  GRADUATED: 'bg-purple-50 text-purple-700 border-purple-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

const ALL_STATUSES: StudentStatus[] = [
  'ACTIVE',
  'INACTIVE',
  'TRANSFERRED',
  'GRADUATED',
  'CANCELLED',
];

export function StudentStatusPanel({ student }: StudentStatusPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StudentStatus>(student.status);
  const [reason, setReason] = useState('');

  const { mutate: updateStatus, isPending } = useUpdateStudentStatus();

  function handleConfirm() {
    updateStatus(
      { id: student.id, status: selectedStatus, reason: reason || undefined },
      {
        onSuccess: () => {
          setIsOpen(false);
          setReason('');
        },
      }
    );
  }

  function handleCancel() {
    setSelectedStatus(student.status);
    setReason('');
    setIsOpen(false);
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className={clsx(
          'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border',
          STATUS_CLASSES[student.status]
        )}
      >
        {STATUS_LABELS[student.status]}
      </span>

      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-violet-600 hover:text-violet-700 hover:underline font-medium"
      >
        Alterar Status
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleCancel} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-semibold text-neutral-900 mb-4">Alterar status do aluno</h3>

            <div className="space-y-4">
              {/* Status selector */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Novo status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as StudentStatus)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                >
                  {ALL_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Motivo (opcional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Motivo da alteração (opcional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending || selectedStatus === student.status}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Salvando...' : 'Confirmar Alteração'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
