interface DepartmentBadgeProps {
  department: string;
}

const departmentConfig: Record<string, { label: string; color: string }> = {
  ADMISSIONS: { label: 'Admissões', color: 'bg-blue-100 text-blue-800' },
  PSYCHOLOGY: { label: 'Psicologia', color: 'bg-purple-100 text-purple-800' },
  HEALTH: { label: 'Saúde', color: 'bg-emerald-100 text-emerald-800' },
  SECRETARIAT: { label: 'Secretaria', color: 'bg-amber-100 text-amber-800' },
  COORDINATION: { label: 'Coordenação', color: 'bg-cyan-100 text-cyan-800' },
  FINANCE: { label: 'Financeiro', color: 'bg-orange-100 text-orange-800' },
  LEGAL: { label: 'Jurídico', color: 'bg-rose-100 text-rose-800' },
  DIRECTOR: { label: 'Diretoria', color: 'bg-indigo-100 text-indigo-800' },
};

export function DepartmentBadge({ department }: DepartmentBadgeProps) {
  const config = departmentConfig[department] ?? {
    label: department,
    color: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
