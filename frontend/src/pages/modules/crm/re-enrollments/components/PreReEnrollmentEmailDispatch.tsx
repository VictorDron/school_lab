import { useState, useEffect, useMemo } from 'react';
import { Mail, Loader2, Send, AlertTriangle, Search, X } from 'lucide-react';
import {
  useEmailTemplate,
  useUpdateEmailTemplate,
  useSendPreReEnrollmentEmails,
  usePreReEnrollmentResponses,
} from '@/hooks/usePreReEnrollment';
import type { StudentPriceCalculation } from '@/types/pre-reenrollment';

interface PreReEnrollmentEmailDispatchProps {
  periodId: string;
  students: StudentPriceCalculation[];
  isLocked: boolean;
}

function formatBRL(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function PreReEnrollmentEmailDispatch({
  periodId,
  students,
  isLocked,
}: PreReEnrollmentEmailDispatchProps) {
  const { data: templateData, isLoading: loadingTemplate } = useEmailTemplate(periodId);
  const { data: responsesData } = usePreReEnrollmentResponses(periodId);
  const updateTemplate = useUpdateEmailTemplate(periodId);
  const sendEmails = useSendPreReEnrollmentEmails(periodId);

  const [templateBody, setTemplateBody] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  useEffect(() => {
    if (templateData?.data) {
      setTemplateBody(templateData.data.template || '');
      const raw = templateData.data.deadline || '';
      setDeadline(raw.includes('T') ? raw.split('T')[0] : raw);
    }
  }, [templateData]);

  const respondedStudentIds = useMemo(() => {
    if (!responsesData?.data) return new Set<string>();
    return new Set(responsesData.data.map((r) => r.studentId));
  }, [responsesData]);

  const eligibleStudents = useMemo(
    () => students.filter((s) => !respondedStudentIds.has(s.studentId)),
    [students, respondedStudentIds]
  );

  const gradeOptions = useMemo(() => {
    const grades = new Set(eligibleStudents.map((s) => s.grade).filter((g): g is string => !!g));
    return Array.from(grades).sort();
  }, [eligibleStudents]);

  const filteredStudents = useMemo(() => {
    let result = eligibleStudents;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => s.studentName.toLowerCase().includes(q));
    }
    if (gradeFilter) {
      result = result.filter((s) => s.grade === gradeFilter);
    }
    return result;
  }, [eligibleStudents, searchQuery, gradeFilter]);

  const hasActiveFilters = searchQuery !== '' || gradeFilter !== '';

  const allSelected =
    filteredStudents.length > 0 && filteredStudents.every((s) => selectedIds.has(s.studentId));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredStudents.forEach((s) => next.delete(s.studentId));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredStudents.forEach((s) => next.add(s.studentId));
        return next;
      });
    }
  };

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toISODeadline = (dateStr: string) => {
    if (!dateStr) return undefined;
    if (dateStr.includes('T')) return dateStr;
    return new Date(`${dateStr}T23:59:59`).toISOString();
  };

  const handleSaveTemplate = () => {
    if (!templateBody.trim()) return;
    updateTemplate.mutate({ template: templateBody.trim(), deadline: toISODeadline(deadline) });
  };

  const isTemplateValid = templateBody.trim().length >= 10;

  const handleSend = () => {
    if (selectedIds.size === 0 || !deadline || !isTemplateValid) return;
    sendEmails.mutate(
      {
        studentIds: Array.from(selectedIds),
        customBody: templateBody.trim(),
        deadline: toISODeadline(deadline)!,
      },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          setShowConfirm(false);
        },
        onError: () => {
          setShowConfirm(false);
        },
      }
    );
  };

  if (loadingTemplate) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 rounded-lg bg-indigo-50">
          <Mail className="w-4 h-4 text-indigo-600" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-800">
          Comunicação de Pré-Rematrícula
        </h3>
      </div>

      {/* Template editor */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Modelo do e-mail
          </label>
          <textarea
            value={templateBody}
            onChange={(e) => setTemplateBody(e.target.value)}
            onBlur={handleSaveTemplate}
            disabled={isLocked}
            rows={5}
            placeholder="Prezados pais/responsáveis, informamos que os novos valores para o próximo ano letivo foram definidos..."
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none disabled:bg-neutral-100 ${templateBody.trim().length > 0 && !isTemplateValid ? 'border-red-300' : 'border-neutral-300'}`}
          />
          {templateBody.trim().length > 0 && !isTemplateValid && (
            <p className="text-xs text-red-500 mt-1">O texto do e-mail deve ter pelo menos 10 caracteres.</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Prazo para manifestação
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            onBlur={handleSaveTemplate}
            disabled={isLocked}
            className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-neutral-100"
          />
        </div>
      </div>

      {/* Student selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-600">
            Selecionar alunos para envio
            {hasActiveFilters && (
              <span className="ml-1 text-neutral-400">
                ({filteredStudents.length} de {eligibleStudents.length})
              </span>
            )}
          </span>
          {filteredStudents.length > 0 && (
            <label className="inline-flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                disabled={isLocked}
                className="rounded border-neutral-300 text-cyan-600 focus:ring-cyan-500"
              />
              Selecionar todos
            </label>
          )}
        </div>

        {/* Search and filter bar */}
        {eligibleStudents.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar aluno..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
            {gradeOptions.length > 1 && (
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="">Todas as séries</option>
                {gradeOptions.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setGradeFilter(''); }}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                <X className="w-3 h-3" />
                Limpar
              </button>
            )}
          </div>
        )}

        {eligibleStudents.length === 0 ? (
          <p className="text-xs text-neutral-400 py-4 text-center">
            {students.length === 0
              ? 'Nenhum aluno disponível.'
              : 'Todos os alunos já receberam a comunicação.'}
          </p>
        ) : filteredStudents.length === 0 ? (
          <p className="text-xs text-neutral-400 py-4 text-center">
            Nenhum aluno encontrado com os filtros aplicados.
          </p>
        ) : (
          <div className="max-h-60 overflow-y-auto border border-neutral-200 rounded-lg">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-neutral-500 border-b border-neutral-200 bg-neutral-50">
                  <th className="p-2 w-8" />
                  <th className="p-2">Aluno</th>
                  <th className="p-2">Série</th>
                  <th className="p-2 text-right">Valor Proposto</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr
                    key={student.studentId}
                    className="border-b border-neutral-100 hover:bg-neutral-50"
                  >
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(student.studentId)}
                        onChange={() => handleToggle(student.studentId)}
                        disabled={isLocked}
                        className="rounded border-neutral-300 text-cyan-600 focus:ring-cyan-500"
                      />
                    </td>
                    <td className="p-2 text-neutral-800">{student.studentName}</td>
                    <td className="p-2 text-neutral-600">{student.grade || '—'}</td>
                    <td className="p-2 text-right text-neutral-700">
                      {formatBRL(student.finalAnnualValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Send button */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isLocked || selectedIds.size === 0 || !deadline || !isTemplateValid || sendEmails.isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          Enviar para {selectedIds.size} família(s)
        </button>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h4 className="text-sm font-semibold text-neutral-900">Confirmar envio</h4>
            </div>
            <p className="text-sm text-neutral-600 mb-4">
              Tem certeza que deseja enviar {selectedIds.size} e-mail(s) de pré-rematrícula?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSend}
                disabled={sendEmails.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {sendEmails.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirmar envio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
