interface PhaseProgressBarProps {
  percentage: number;
  isCurrent: boolean;
  isBlocked: boolean;
}

export function PhaseProgressBar({ percentage, isCurrent, isBlocked }: PhaseProgressBarProps) {
  if (isBlocked) {
    return (
      <div className="w-full h-2 rounded bg-gray-100 border border-dashed border-gray-300" />
    );
  }

  return (
    <div className="w-full h-2 rounded bg-gray-200">
      {percentage > 0 && (
        <div
          className={`h-full rounded ${isCurrent ? 'bg-blue-500' : 'bg-green-500'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      )}
    </div>
  );
}
