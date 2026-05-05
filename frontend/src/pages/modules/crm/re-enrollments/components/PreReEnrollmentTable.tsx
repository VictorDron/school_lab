import { useState, useMemo } from 'react';
import { Star, ArrowUpDown, Search } from 'lucide-react';
import type { StudentPriceCalculation } from '@/types/pre-reenrollment';
import { gradeOptions } from '@/constants/grades';

interface PreReEnrollmentTableProps {
  students: StudentPriceCalculation[];
  onAddException: (studentId: string, studentName: string, exception?: { id: string; overrideAnnualValue: number | null; overrideDiscountPercent: number | null; justification: string | null }) => void;
}

const FINANCIAL_STATUS_LABELS: Record<string, string> = {
  ADIMPLENTE: 'Adimplente',
  INADIMPLENTE: 'Inadimplente',
  SEM_CONTRATO: 'Sem Contrato',
};

const FINANCIAL_STATUS_COLORS: Record<string, string> = {
  ADIMPLENTE: 'bg-emerald-100 text-emerald-700',
  INADIMPLENTE: 'bg-red-100 text-red-700',
  SEM_CONTRATO: 'bg-neutral-100 text-neutral-500',
};

function formatBRL(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

type SortKey = 'name' | 'grade' | 'financialStatus';
type SortDir = 'asc' | 'desc';

export default function PreReEnrollmentTable({
  students,
  onAddException,
}: PreReEnrollmentTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('grade');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  const availableGrades = useMemo(() =>
    [...new Set(students.map((s) => s.grade).filter((g): g is string => !!g))].sort(
      (a, b) => {
        const idxA = gradeOptions.findIndex((g) => g.value === a);
        const idxB = gradeOptions.findIndex((g) => g.value === b);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
      }
    ), [students]);

  const filtered = useMemo(() => students.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!s.studentName.toLowerCase().includes(q) && !s.studentCode.toLowerCase().includes(q)) return false;
    }
    if (gradeFilter && s.grade !== gradeFilter) return false;
    return true;
  }), [students, searchQuery, gradeFilter]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = a.studentName.localeCompare(b.studentName, 'pt-BR');
      } else if (sortKey === 'grade') {
        const idxA = gradeOptions.findIndex((g) => g.value === a.grade);
        const idxB = gradeOptions.findIndex((g) => g.value === b.grade);
        cmp = (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
      } else if (sortKey === 'financialStatus') {
        cmp = a.financialStatus.localeCompare(b.financialStatus);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-400 text-sm">
        Nenhum aluno encontrado para esta campanha.
      </div>
    );
  }

  return (
    <div>
      {/* Search + grade filter */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou código..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
        >
          <option value="">Todas as séries</option>
          {availableGrades.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <span className="text-xs text-neutral-500">{filtered.length} de {students.length} aluno(s)</span>
      </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-medium text-neutral-500 border-b border-neutral-200">
            <th className="pb-2 pr-3">
              <button
                onClick={() => handleSort('name')}
                className="inline-flex items-center gap-1 hover:text-neutral-700"
              >
                Aluno
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </th>
            <th className="pb-2 pr-3">
              <button
                onClick={() => handleSort('grade')}
                className="inline-flex items-center gap-1 hover:text-neutral-700"
              >
                Série
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </th>
            <th className="pb-2 pr-3">Status Acadêmico</th>
            <th className="pb-2 pr-3">
              <button
                onClick={() => handleSort('financialStatus')}
                className="inline-flex items-center gap-1 hover:text-neutral-700"
              >
                Status Financeiro
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </th>
            <th className="pb-2 pr-3 text-right">Valor Atual</th>
            <th className="pb-2 pr-3 text-right">Valor Proposto</th>
            <th className="pb-2 pr-3 text-right">Valor Final</th>
            <th className="pb-2 pr-3 text-right">Mensal</th>
            <th className="pb-2">Ação</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((student) => (
            <tr
              key={student.studentId}
              className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <td className="py-2.5 pr-3">
                <div>
                  <span className="font-medium text-neutral-900">{student.studentName}</span>
                  <span className="ml-1.5 text-xs text-neutral-400">{student.studentCode}</span>
                </div>
                {student.hasException && (
                  <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded-full">
                    <Star className="w-2.5 h-2.5" />
                    Exceção: {student.exceptionJustification}
                  </span>
                )}
              </td>
              <td className="py-2.5 pr-3 text-neutral-700">{student.grade || '—'}</td>
              <td className="py-2.5 pr-3 text-neutral-700">{student.academicStatus}</td>
              <td className="py-2.5 pr-3">
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                    FINANCIAL_STATUS_COLORS[student.financialStatus] || 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {FINANCIAL_STATUS_LABELS[student.financialStatus] || student.financialStatus}
                </span>
              </td>
              <td className="py-2.5 pr-3 text-right text-neutral-700">
                {student.currentAnnualValue !== null
                  ? formatBRL(student.currentAnnualValue)
                  : <span className="text-neutral-400 text-xs">Sem contrato</span>}
              </td>
              <td className="py-2.5 pr-3 text-right text-neutral-700">
                {student.proposedAnnualValue !== null
                  ? formatBRL(student.proposedAnnualValue)
                  : <span className="text-neutral-400 text-xs">Não configurado</span>}
              </td>
              <td className="py-2.5 pr-3 text-right">
                <span className={student.hasException ? 'font-bold text-amber-700' : 'text-neutral-900'}>
                  {formatBRL(student.finalAnnualValue)}
                </span>
              </td>
              <td className="py-2.5 pr-3 text-right text-neutral-700">
                {formatBRL(student.monthlyValue)}
              </td>
              <td className="py-2.5">
                <button
                  onClick={() => onAddException(student.studentId, student.studentName, student.hasException ? {
                    id: student.exceptionId!,
                    overrideAnnualValue: student.exceptionOverrideAnnualValue,
                    overrideDiscountPercent: student.exceptionOverrideDiscountPercent,
                    justification: student.exceptionJustification,
                  } : undefined)}
                  className="px-2.5 py-1 text-xs font-medium text-cyan-700 border border-cyan-300 rounded-lg hover:bg-cyan-50 transition-colors"
                >
                  Exceção
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}
