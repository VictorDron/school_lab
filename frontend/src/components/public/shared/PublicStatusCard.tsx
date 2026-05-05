import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type StatusVariant = 'neutral' | 'amber' | 'red' | 'green';

const VARIANT_CLASSES: Record<StatusVariant, { bg: string; iconBg: string; icon: string }> = {
  neutral: { bg: 'bg-neutral-50', iconBg: 'bg-neutral-100', icon: 'text-neutral-500' },
  amber: { bg: 'bg-neutral-50', iconBg: 'bg-amber-100', icon: 'text-amber-600' },
  red: { bg: 'bg-neutral-50', iconBg: 'bg-red-100', icon: 'text-red-600' },
  green: { bg: 'bg-neutral-50', iconBg: 'bg-green-100', icon: 'text-green-600' },
};

interface PublicStatusCardProps {
  variant: StatusVariant;
  icon: LucideIcon;
  title: string;
  message?: ReactNode;
  footer?: ReactNode;
  /** Use the gradient background instead of the flat neutral-50 used by Enrollment. */
  gradientBackground?: boolean;
}

/**
 * Terminal status card shown by the public admission/enrollment/re-enrollment
 * pages when the form cannot proceed (no token, expired link, invalid link,
 * loading, or successful submission).
 */
export function PublicStatusCard({
  variant,
  icon: Icon,
  title,
  message,
  footer,
  gradientBackground = false,
}: PublicStatusCardProps) {
  const v = VARIANT_CLASSES[variant];
  const wrapper = gradientBackground
    ? 'min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 flex items-center justify-center p-4'
    : `min-h-screen ${v.bg} flex items-center justify-center p-4`;

  return (
    <div className={wrapper}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className={`w-20 h-20 ${v.iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}
        >
          <Icon className={`w-10 h-10 ${v.icon}`} />
        </motion.div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-3">{title}</h1>
        {message != null && <div className="text-neutral-600 mb-6">{message}</div>}
        {footer}
      </motion.div>
    </div>
  );
}
