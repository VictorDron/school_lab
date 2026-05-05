import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import CRMPipelineView from './CRMPipelineView';
import LeadDetailPage from './LeadDetailPage';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { CRMSubNav } from './CRMSubNav';
import { useReEnrollmentPeriods } from '@/hooks/useReEnrollmentAdmin';

const CRMDashboardPage = lazy(() => import('./dashboard/CRMDashboardPage'));

// Canonical Re-enrollments hierarchy (Phase 2).
const ReEnrollmentKanbanPage = lazy(() => import('./re-enrollments/ReEnrollmentKanbanPage'));
const PeriodsOverviewPage = lazy(() => import('./re-enrollments/PeriodsOverviewPage'));
const PeriodDetailPage = lazy(() => import('./re-enrollments/PeriodDetailPage'));
const ReEnrollmentInviteDetailPage = lazy(
  () => import('./re-enrollments/detail/ReEnrollmentInviteDetailPage'),
);
const PeriodPreReEnrollmentRoute = lazy(() =>
  import('./re-enrollments/PeriodDetailPage').then((m) => ({ default: m.PeriodPreReEnrollmentRoute })),
);
const PeriodManagementRoute = lazy(() =>
  import('./re-enrollments/PeriodDetailPage').then((m) => ({ default: m.PeriodManagementRoute })),
);
const PeriodDashboardRoute = lazy(() =>
  import('./re-enrollments/PeriodDetailPage').then((m) => ({ default: m.PeriodDashboardRoute })),
);
const PeriodDetailIndexRedirect = lazy(() =>
  import('./re-enrollments/PeriodDetailPage').then((m) => ({ default: m.PeriodDetailIndexRedirect })),
);

/**
 * Resolves /crm/re-enrollments/dashboard (no :periodId) to the OPEN
 * campaign's dashboard route, with a graceful fallback to the kanban list
 * when no campaign is open. Wired so the ReEnrollmentHeader button works
 * even before the operator picks a campaign.
 */
function ReEnrollmentActivePeriodDashboardRedirect() {
  const { data, isLoading } = useReEnrollmentPeriods();
  if (isLoading) return <LoadingScreen />;
  const periods = data?.data ?? [];
  const target = periods.find((p) => p.status === 'OPEN') ?? periods[0];
  if (!target) return <Navigate to="/crm/re-enrollments" replace />;
  return <Navigate to={`/crm/re-enrollments/${target.id}/dashboard`} replace />;
}

/** Preserve :leadId when redirecting legacy /crm/:leadId to /crm/enrollments/:leadId. */
function LegacyLeadRedirect() {
  const { leadId } = useParams();
  return <Navigate to={`/crm/enrollments/${leadId}`} replace />;
}

export default function CRMPage() {
  return (
    <div className="h-full flex flex-col">
      <CRMSubNav />
      <div className="flex-1 min-h-0">
        <Routes>
          {/* Canonical Enrollments hierarchy */}
          <Route index element={<Navigate to="enrollments" replace />} />
          <Route path="enrollments" element={<CRMPipelineView />} />
          <Route
            path="enrollments/dashboard"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <CRMDashboardPage />
              </Suspense>
            }
          />
          <Route path="enrollments/:leadId" element={<LeadDetailPage />} />

          {/* Canonical Re-enrollments hierarchy */}
          <Route
            path="re-enrollments"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <ReEnrollmentKanbanPage />
              </Suspense>
            }
          />
          <Route
            path="re-enrollments/periods"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <PeriodsOverviewPage />
              </Suspense>
            }
          />
          <Route
            path="re-enrollments/dashboard"
            element={<ReEnrollmentActivePeriodDashboardRedirect />}
          />
          <Route
            path="re-enrollments/invites/:inviteId"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <ReEnrollmentInviteDetailPage />
              </Suspense>
            }
          />
          <Route
            path="re-enrollments/:periodId"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <PeriodDetailPage />
              </Suspense>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<LoadingScreen />}>
                  <PeriodDetailIndexRedirect />
                </Suspense>
              }
            />
            <Route
              path="pre-reenrollment"
              element={
                <Suspense fallback={<LoadingScreen />}>
                  <PeriodPreReEnrollmentRoute />
                </Suspense>
              }
            />
            <Route
              path="management"
              element={
                <Suspense fallback={<LoadingScreen />}>
                  <PeriodManagementRoute />
                </Suspense>
              }
            />
            <Route
              path="dashboard"
              element={
                <Suspense fallback={<LoadingScreen />}>
                  <PeriodDashboardRoute />
                </Suspense>
              }
            />
          </Route>

          {/* Back-compat: redirect the old flat URLs to the new hierarchy */}
          <Route path="dashboard" element={<Navigate to="/crm/enrollments/dashboard" replace />} />
          <Route path="re-enrollments-preview" element={<Navigate to="/crm/re-enrollments" replace />} />
          <Route path=":leadId" element={<LegacyLeadRedirect />} />
        </Routes>
      </div>
    </div>
  );
}
