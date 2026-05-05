import { useLocation, matchPath } from 'react-router-dom';

/**
 * List of CRM routes that render the Matrículas ↔ Rematrículas toggle.
 *
 * Boards, dashboards, and period-scoped overviews get the toggle — anything
 * that is fundamentally a list or top-level view of a cycle. Detail routes
 * (/crm/enrollments/:leadId, future /crm/re-enrollments/invites/:inviteId)
 * are focused editing contexts and stay clean: a user mid-edit on a lead
 * who clicks "Rematrículas" would lose unsaved state and context.
 *
 * Driven by an explicit include-list (not a blacklist) so adding a new
 * detail route later needs no change here — it simply won't be listed and
 * therefore won't show the toggle.
 */
const BOARD_ROUTES = [
  '/crm/enrollments',
  '/crm/enrollments/dashboard',
  '/crm/re-enrollments',
  '/crm/re-enrollments/periods',
  '/crm/re-enrollments/:periodId',
  '/crm/re-enrollments/:periodId/pre-reenrollment',
  '/crm/re-enrollments/:periodId/management',
  '/crm/re-enrollments/:periodId/dashboard',
] as const;

export function useShouldShowCrmToggle(): boolean {
  const { pathname } = useLocation();
  return BOARD_ROUTES.some((pattern) => matchPath({ path: pattern, end: true }, pathname) !== null);
}
