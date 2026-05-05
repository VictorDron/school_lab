import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
  locked?: boolean;
  lockedHint?: string;
}

export function FormField({ label, required, error, children, className = '', locked, lockedHint }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5">
        {label}
        {required && <span className="text-red-500">*</span>}
        {locked && (
          <span className="inline-flex items-center gap-1 text-xs text-neutral-400" title={lockedHint}>
            <Lock className="w-3 h-3" />
          </span>
        )}
      </label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500 mt-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
