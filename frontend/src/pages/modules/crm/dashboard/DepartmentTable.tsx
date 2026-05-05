import type { DashboardStats } from './types';

interface DepartmentTableProps {
  departments: DashboardStats['departmentPerformance'];
}

const DEPT_LABELS: Record<string, string> = {
  ADMISSIONS: 'Admissões',
  PSYCHOLOGY: 'Psicologia',
  HEALTH: 'Saúde',
  COORDINATION: 'Coordenação',
  SECRETARIAT: 'Secretaria',
  FINANCE: 'Financeiro',
  LEGAL: 'Jurídico',
  DIRECTOR: 'Diretoria',
};

export function DepartmentTable({ departments }: DepartmentTableProps) {
  if (!departments?.length) {
    return (
      <div className="flex items-center justify-center h-24 text-neutral-400 text-sm">
        Nenhum dado disponível
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100">
            <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide pb-3 pr-4">
              Departamento
            </th>
            <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide pb-3 px-4">
              Total
            </th>
            <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide pb-3 px-4">
              Aprovados
            </th>
            <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide pb-3 px-4">
              Rejeitados
            </th>
            <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide pb-3 px-4">
              Pendentes
            </th>
            <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide pb-3 pl-4">
              Tempo Médio
            </th>
          </tr>
        </thead>
        <tbody>
          {departments.map((dept, idx) => {
            const approvalRate =
              dept.total > 0 ? (dept.approved / dept.total) * 100 : 0;
            return (
              <tr
                key={dept.department}
                className={`border-b border-neutral-50 hover:bg-neutral-50 transition-colors ${
                  idx === departments.length - 1 ? 'border-b-0' : ''
                }`}
              >
                <td className="py-3 pr-4">
                  <span className="font-medium text-neutral-800">
                    {DEPT_LABELS[dept.department] ?? dept.department}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-semibold text-neutral-900">
                  {dept.total}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-medium px-2 py-0.5 rounded">
                      {dept.approved}
                    </span>
                    {dept.total > 0 && (
                      <div className="w-16 h-1 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${approvalRate}%` }}
                        />
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="bg-red-100 text-red-600 text-[10px] font-medium px-2 py-0.5 rounded">
                    {dept.rejected}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-medium px-2 py-0.5 rounded">
                    {dept.pending}
                  </span>
                </td>
                <td className="py-3 pl-4 text-right text-neutral-600 font-medium">
                  {dept.avgDays != null ? `${dept.avgDays}d` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
