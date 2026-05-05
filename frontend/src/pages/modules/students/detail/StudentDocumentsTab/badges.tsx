import clsx from 'clsx';
import { STATUS_CONFIG } from './constants';

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const Icon = config.icon;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-full',
        config.color,
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export function SourceBadge({ source }: { source: 'admission' | 'enrollment' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
        source === 'admission' ? 'text-blue-700 bg-blue-50' : 'text-violet-700 bg-violet-50',
      )}
    >
      {source === 'admission' ? 'Admissão' : 'Matrícula'}
    </span>
  );
}
