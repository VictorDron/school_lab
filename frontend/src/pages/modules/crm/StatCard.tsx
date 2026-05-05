interface StatCardProps {
  label: string;
  value: number;
  filteredValue?: number;
  icon: React.ReactNode;
  color: 'blue' | 'amber' | 'green' | 'purple';
}

const colors = {
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
};

export function StatCard({ label, value, filteredValue, icon, color }: StatCardProps) {
  const isFiltered = filteredValue !== undefined;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-neutral-200 min-w-fit">
      <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-xl font-bold text-neutral-900">
          {isFiltered ? (
            <><span>{filteredValue}</span><span className="text-sm font-normal text-neutral-400"> de {value}</span></>
          ) : (
            value
          )}
        </p>
        <p className="text-xs text-neutral-500">{label}</p>
      </div>
    </div>
  );
}
