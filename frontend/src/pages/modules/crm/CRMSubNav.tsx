import { Link, useLocation } from 'react-router-dom';
import { UsersRound, RotateCcw } from 'lucide-react';
import { useShouldShowCrmToggle } from './useShouldShowCrmToggle';

/**
 * Segmented control in the CRM shell that flips between the Enrollments
 * pipeline (new leads) and the Re-enrollments board (returning students).
 * Rendered on every /crm/* route so the user keeps a stable way to switch
 * cycles regardless of where they drilled in.
 *
 * Active-state detection is prefix-based so a user sitting on a sub-route
 * — e.g. /crm/enrollments/:leadId or /crm/re-enrollments/:periodId — still
 * sees the correct option highlighted.
 */
export function CRMSubNav() {
  const { pathname } = useLocation();
  const shouldShow = useShouldShowCrmToggle();

  if (!shouldShow) return null;

  // Anything under /crm/re-enrollments* (including the Phase 0 preview alias)
  // belongs to the Rematrículas cycle.
  const isReEnrollments = pathname.startsWith('/crm/re-enrollments');
  const isEnrollments = !isReEnrollments;

  const pill = (active: boolean) =>
    [
      'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
      active ? 'bg-primary-100 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100',
    ].join(' ');

  return (
    <nav className="flex items-center gap-1 px-4 lg:px-6 py-2 border-b border-neutral-200 bg-white">
      <Link to="/crm/enrollments" className={pill(isEnrollments)}>
        <UsersRound className="w-4 h-4" />
        Matrículas
      </Link>
      <Link to="/crm/re-enrollments" className={pill(isReEnrollments)}>
        <RotateCcw className="w-4 h-4" />
        Rematrículas
      </Link>
    </nav>
  );
}
