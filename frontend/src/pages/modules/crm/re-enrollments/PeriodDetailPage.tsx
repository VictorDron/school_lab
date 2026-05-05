import { useState, useMemo } from 'react';
import {
  NavLink,
  Outlet,
  useNavigate,
  useOutletContext,
  useParams,
  Navigate,
} from 'react-router-dom';
import {
  ChevronLeft,
  AlertCircle,
  Loader2,
  BarChart3,
  Ban,
  DollarSign,
  ClipboardList,
  Wrench,
} from 'lucide-react';
import {
  useReEnrollmentPeriods,
  useTransitionPeriod,
} from '@/hooks/useReEnrollmentAdmin';
import type {
  ReEnrollmentPeriodFull,
  ReEnrollmentPeriodStatus,
} from '@/types/re-enrollment';
import ReEnrollmentDashboardPage from './ReEnrollmentDashboardPage';
import PreReEnrollmentPage from './PreReEnrollmentPage';
import SecretaryApprovalSection from './components/SecretaryApprovalSection';
import DefaultSignersConfig from './components/DefaultSignersConfig';
import BatchContractCard from './operations/BatchContractCard';
import PendingFeePaymentsCard from './operations/PendingFeePaymentsCard';
import PendingInvitesCard from './operations/PendingInvitesCard';
import { STATUS_LABELS, STATUS_COLORS } from './constants';

/**
 * Route layout for /crm/re-enrollments/:periodId.
 *
 * Header (period name, status, back nav, tab bar) stays rendered across all
 * three tabs; the active tab is rendered via <Outlet/>. Tab state lives in
 * the URL path (/crm/re-enrollments/:periodId/{pre-reenrollment|management|
 * dashboard}) so tabs are linkable, shareable, and preserve history.
 *
 * Child routes consume { periodId, period } via useOutletContext so they
 * don't each re-query the periods list.
 */
type ChildContext = {
  periodId: string;
  period: ReEnrollmentPeriodFull | undefined;
};

export default function PeriodDetailPage() {
  const navigate = useNavigate();
  const { periodId } = useParams<{ periodId: string }>();
  const { data: periodData } = useReEnrollmentPeriods();

  const periods = periodData?.data ?? [];
  const period = periods.find((p) => p.id === periodId);

  if (!periodId) {
    return null;
  }

  const tabBase = `/crm/re-enrollments/${periodId}`;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-4 lg:px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate('/crm/re-enrollments/periods')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-neutral-900">
                {period?.name || 'Campanha'}
              </h2>
              {period && (
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[period.status]}`}
                >
                  {STATUS_LABELS[period.status]}
                </span>
              )}
            </div>
            {period && (
              <p className="text-sm text-neutral-500">
                {new Date(period.startDate).toLocaleDateString('pt-BR')} —{' '}
                {new Date(period.endDate).toLocaleDateString('pt-BR')}
                {' · '}
                {period.eligibleGrades.join(', ')}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-1 border-b border-neutral-200 -mb-4">
          <TabLink
            to={`${tabBase}/pre-reenrollment`}
            icon={<DollarSign className="w-4 h-4 inline mr-1.5" />}
            label="Pré-Rematrícula"
          />
          <TabLink
            to={`${tabBase}/management`}
            icon={<Wrench className="w-4 h-4 inline mr-1.5" />}
            label="Operações"
          />
          {period && ['OPEN', 'CLOSED', 'FINALIZED'].includes(period.status) && (
            <TabLink
              to={`${tabBase}/dashboard`}
              icon={<BarChart3 className="w-4 h-4 inline mr-1.5" />}
              label="Dashboard"
            />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <Outlet context={{ periodId, period } satisfies ChildContext} />
      </div>
    </div>
  );
}

function TabLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
          isActive
            ? 'border-cyan-600 text-cyan-600'
            : 'border-transparent text-neutral-500 hover:text-neutral-700'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

// ========== Child routes ==========

function usePeriodContext(): ChildContext {
  return useOutletContext<ChildContext>();
}

export function PeriodPreReEnrollmentRoute() {
  const { periodId } = usePeriodContext();
  return <PreReEnrollmentPage periodId={periodId} />;
}

export function PeriodManagementRoute() {
  const { periodId, period } = usePeriodContext();
  const transitionMutation = useTransitionPeriod();
  const { data: periodData } = useReEnrollmentPeriods();
  const [showOpenConfirm, setShowOpenConfirm] = useState(false);

  const periods = periodData?.data ?? [];
  const otherOpenPeriod = useMemo(
    () => periods.find((p) => p.id !== periodId && p.status === 'OPEN'),
    [periods, periodId],
  );

  if (period?.status === 'DRAFT') {
    return (
      <>
        <DraftBanner
          otherOpenPeriod={otherOpenPeriod}
          showOpenConfirm={showOpenConfirm}
          setShowOpenConfirm={setShowOpenConfirm}
          transitionMutation={transitionMutation}
          periodId={periodId}
        />
        <EmptyDraftMessage
          icon={<ClipboardList className="w-12 h-12 mx-auto mb-3 text-neutral-300" />}
          title="Campanha em rascunho"
          subtitle="Abra a campanha para gerenciar a rematrícula dos alunos."
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <SecretaryApprovalSection periodId={periodId} />
      <BatchContractCard periodId={periodId} />
      <PendingFeePaymentsCard periodId={periodId} />
      <PendingInvitesCard periodId={periodId} />
      <DefaultSignersConfig />
    </div>
  );
}

export function PeriodDashboardRoute() {
  const { periodId, period } = usePeriodContext();
  return (
    <ReEnrollmentDashboardPage
      periodId={periodId}
      eligibleGrades={period?.eligibleGrades ?? []}
    />
  );
}

/**
 * Back-compat for shared URLs in the form /crm/re-enrollments/:periodId?tab=X.
 * Mounted on the index route; redirects ?tab=X into the canonical nested
 * path, or falls back to ./management when no tab is specified.
 */
export function PeriodDetailIndexRedirect() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  const valid = new Set(['pre-reenrollment', 'management', 'dashboard']);
  const target = tab && valid.has(tab) ? tab : 'management';
  return <Navigate to={target} replace />;
}

// ========== Local helpers ==========

function EmptyDraftMessage({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center py-16 text-neutral-500">
      {icon}
      <p className="font-medium text-neutral-700">{title}</p>
      <p className="text-sm mt-1">{subtitle}</p>
    </div>
  );
}

function DraftBanner({
  otherOpenPeriod,
  showOpenConfirm,
  setShowOpenConfirm,
  transitionMutation,
  periodId,
}: {
  otherOpenPeriod: ReEnrollmentPeriodFull | undefined;
  showOpenConfirm: boolean;
  setShowOpenConfirm: (v: boolean) => void;
  transitionMutation: ReturnType<typeof useTransitionPeriod>;
  periodId: string;
}) {
  const navigate = useNavigate();

  if (otherOpenPeriod) {
    return (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
        <Ban className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">
            Não é possível abrir esta campanha
          </p>
          <p className="text-xs text-red-600">
            A campanha <strong>"{otherOpenPeriod.name}"</strong> já está aberta. Feche-a
            antes de abrir uma nova campanha.
          </p>
        </div>
        <button
          onClick={() => navigate('/crm/re-enrollments/periods')}
          className="px-3 py-1.5 text-xs font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors flex-shrink-0"
        >
          Ver Campanhas
        </button>
      </div>
    );
  }
  if (showOpenConfirm) {
    return (
      <div className="mb-4 p-4 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-cyan-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-cyan-800">
            Confirmar abertura da campanha?
          </p>
          <p className="text-xs text-cyan-600">
            Após aberto, convites poderão ser enviados e os preços serão fixados.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setShowOpenConfirm(false)}
            className="px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              transitionMutation.mutate(
                { id: periodId, status: 'OPEN' as ReEnrollmentPeriodStatus },
                { onSuccess: () => setShowOpenConfirm(false) },
              )
            }
            disabled={transitionMutation.isPending}
            className="px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {transitionMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}{' '}
            Confirmar
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800">Campanha em rascunho</p>
        <p className="text-xs text-amber-600">
          Abra a campanha para enviar convites e visualizar alunos elegíveis. Configure os
          preços na aba Pré-Rematrícula antes de abrir.
        </p>
      </div>
      <button
        onClick={() => setShowOpenConfirm(true)}
        className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors flex-shrink-0"
      >
        Abrir Campanha
      </button>
    </div>
  );
}
