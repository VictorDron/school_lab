import { Lock } from 'lucide-react';

interface LockedFieldProps {
  label: string;
  value?: string;
}

export function LockedField({ label, value }: LockedFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        {label}
        <Lock className="inline-block w-3 h-3 ml-1 text-neutral-400" />
      </label>
      <div className="px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-md text-neutral-600">
        {value || '-'}
      </div>
    </div>
  );
}
