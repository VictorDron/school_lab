import { GraduationCap, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { StudentAlertBadges } from './StudentAlertBadges';
import type { Student, StudentStatus, StudentFilters } from '@/types/students';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

type SortableField = NonNullable<StudentFilters['sortBy']>;

interface StudentsListProps {
  students: Student[];
  isLoading: boolean;
  isError: boolean;
  pagination?: PaginationProps;
  sortBy?: SortableField;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: SortableField) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onStudentClick?: (id: string) => void;
}

const STATUS_LABELS: Record<StudentStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  TRANSFERRED: 'Transferido',
  GRADUATED: 'Graduado',
  CANCELLED: 'Cancelado',
};

const STATUS_CLASSES: Record<StudentStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-neutral-100 text-neutral-600',
  TRANSFERRED: 'bg-blue-100 text-blue-700',
  GRADUATED: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

interface SortableColumn {
  label: string;
  field: SortableField | null;
  colSpan: string;
}

const COLUMNS: SortableColumn[] = [
  { label: 'Código', field: null, colSpan: 'col-span-1' },
  { label: 'Nome', field: 'fullName', colSpan: 'col-span-3' },
  { label: 'Turma', field: 'grade', colSpan: 'col-span-2' },
  { label: 'Ano Letivo', field: 'academicYear', colSpan: 'col-span-1' },
  { label: 'Status', field: 'status', colSpan: 'col-span-2' },
  { label: 'Matriculado em', field: 'enrolledAt', colSpan: 'col-span-2' },
];

function SortIcon({ field, sortBy, sortOrder }: { field: SortableField; sortBy?: SortableField; sortOrder?: 'asc' | 'desc' }) {
  if (sortBy !== field) {
    return <ArrowUpDown className="w-3 h-3 text-neutral-400 ml-1" />;
  }
  return sortOrder === 'asc' ? (
    <ArrowUp className="w-3 h-3 text-violet-600 ml-1" />
  ) : (
    <ArrowDown className="w-3 h-3 text-violet-600 ml-1" />
  );
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 p-4 bg-white rounded-lg border border-neutral-200 animate-pulse">
      <div className="lg:col-span-2 h-4 bg-neutral-200 rounded" />
      <div className="lg:col-span-3 h-4 bg-neutral-200 rounded" />
      <div className="lg:col-span-2 h-4 bg-neutral-200 rounded w-2/3" />
      <div className="lg:col-span-1 h-4 bg-neutral-200 rounded w-1/2" />
      <div className="lg:col-span-2 h-4 bg-neutral-200 rounded w-16" />
      <div className="lg:col-span-2 h-4 bg-neutral-200 rounded w-24" />
    </div>
  );
}

export function StudentsList({ students, isLoading, isError, pagination, sortBy, sortOrder, onSort, selectedIds, onToggleSelect, onToggleSelectAll, onStudentClick }: StudentsListProps) {

  const allSelected = students.length > 0 && students.every((s) => selectedIds.has(s.id));
  const someSelected = students.some((s) => selectedIds.has(s.id)) && !allSelected;

  const handleSort = (field: SortableField | null) => {
    if (!field || !onSort) return;
    onSort(field);
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-red-600">Erro ao carregar alunos. Tente novamente.</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-neutral-700 mb-2">Nenhum aluno encontrado</p>
          <p className="text-neutral-500">Cadastre alunos ou ajuste os filtros de busca.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Scrollable list area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-2">
        {/* Table header */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 bg-neutral-100 rounded-lg text-xs font-medium text-neutral-500 uppercase">
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected; }}
              onChange={onToggleSelectAll}
              className="w-4 h-4 accent-violet-600 cursor-pointer"
            />
          </div>
          {COLUMNS.map((col) => (
            <div
              key={col.label}
              className={`${col.colSpan} flex items-center ${col.field ? 'cursor-pointer select-none hover:text-neutral-700' : ''}`}
              onClick={() => handleSort(col.field)}
            >
              {col.label}
              {col.field && (
                <SortIcon field={col.field} sortBy={sortBy} sortOrder={sortOrder} />
              )}
            </div>
          ))}
        </div>

        {/* Rows */}
        {students.map((student) => (
          <div
            key={student.id}
            onClick={() => onStudentClick?.(student.id)}
            className={`grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 p-4 bg-white rounded-lg border hover:shadow-md cursor-pointer transition-shadow ${selectedIds.has(student.id) ? 'border-violet-300 bg-violet-50/30' : 'border-neutral-200'}`}
          >
            {/* Checkbox */}
            <div className="lg:col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={selectedIds.has(student.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect(student.id);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 accent-violet-600 cursor-pointer"
              />
            </div>

            {/* Code */}
            <div className="lg:col-span-1 flex items-center">
              <span className="font-mono text-xs text-neutral-500">{student.code}</span>
            </div>

            {/* Name with Avatar */}
            <div className="lg:col-span-3 flex items-center gap-2">
              <Avatar name={student.fullName} avatarUrl={student.avatarUrl} size="sm" />
              <span className="font-semibold text-neutral-900 truncate">{student.fullName}</span>
            </div>

            {/* Grade */}
            <div className="lg:col-span-2 flex items-center text-sm text-neutral-600">
              {student.grade || <span className="text-neutral-400">&mdash;</span>}
            </div>

            {/* Academic year */}
            <div className="lg:col-span-1 flex items-center text-sm text-neutral-600">
              {student.academicYear}
            </div>

            {/* Status badge + alerts */}
            <div className="lg:col-span-2 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_CLASSES[student.status]}`}
              >
                {STATUS_LABELS[student.status]}
              </span>
              <StudentAlertBadges alerts={student.alerts} />
            </div>

            {/* Enrolled at */}
            <div className="lg:col-span-2 flex items-center text-sm text-neutral-500">
              {format(parseISO(student.enrolledAt), 'dd/MM/yyyy')}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      {pagination && pagination.totalPages > 0 && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-t border-neutral-200">
          {/* Total count */}
          <div className="text-sm text-neutral-500">
            {pagination.total} {pagination.total === 1 ? 'aluno' : 'alunos'} no total
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            {(() => {
              const pages: number[] = [];
              const start = Math.max(1, pagination.page - 2);
              const end = Math.min(pagination.totalPages, pagination.page + 2);
              for (let i = start; i <= end; i++) pages.push(i);
              return pages.map((p) => (
                <button
                  key={p}
                  onClick={() => pagination.onPageChange(p)}
                  className={`px-3 py-1.5 text-sm rounded-md ${
                    p === pagination.page
                      ? 'bg-violet-600 text-white'
                      : 'border border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  {p}
                </button>
              ));
            })()}

            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <span>Exibir</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
              className="border border-neutral-300 rounded-md px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>por página</span>
          </div>
        </div>
      )}
    </div>
  );
}
