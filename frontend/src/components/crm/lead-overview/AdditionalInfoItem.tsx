interface AdditionalInfoItemProps {
  icon: React.ElementType;
  label: string;
  hasCondition: boolean;
  details?: string;
  colorClass?: string;
}

export function AdditionalInfoItem({
  icon: Icon,
  label,
  hasCondition,
  details,
  colorClass = 'text-amber-600 bg-amber-50',
}: AdditionalInfoItemProps) {
  if (!hasCondition) return null;

  return (
    <div className={`rounded-lg p-3 ${colorClass}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="font-medium text-sm">{label}</span>
      </div>
      {details && (
        <p className="text-sm opacity-80 ml-6">{details}</p>
      )}
    </div>
  );
}
