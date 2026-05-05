import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useInviteDetail } from '@/hooks/useReEnrollmentInvite';
import { ReEnrollmentInviteHeader } from './ReEnrollmentInviteHeader';
import { ReEnrollmentInviteSidebar } from './ReEnrollmentInviteSidebar';
import { ReEnrollmentInviteContent } from './ReEnrollmentInviteContent';

/**
 * Route shell for /crm/re-enrollments/invites/:inviteId. Fetches the
 * full detail payload once and hands it to the header and sidebar.
 * Tab content lives in a sibling commit and is wired into the empty
 * right-hand pane below.
 */
export default function ReEnrollmentInviteDetailPage() {
  const { inviteId } = useParams<{ inviteId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useInviteDetail(inviteId);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 px-4 text-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-neutral-700 font-medium">Convite não encontrado</p>
        <p className="text-xs text-neutral-500 max-w-sm">
          {isError ? (error as Error)?.message : 'Este convite pode ter sido removido.'}
        </p>
        <button
          onClick={() => navigate('/crm/re-enrollments')}
          className="btn btn-primary btn-sm"
        >
          Voltar ao Kanban
        </button>
      </div>
    );
  }

  const detail = data.data;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ReEnrollmentInviteHeader detail={detail} />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <ReEnrollmentInviteSidebar detail={detail} />
        <ReEnrollmentInviteContent detail={detail} />
      </div>
    </div>
  );
}
