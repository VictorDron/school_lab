import { useMemo } from 'react';
import { X } from 'lucide-react';
import { useChannelMembers } from '@/hooks/useChannels';
import { useCommunicationStore } from '@/stores/communicationStore';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import type { ChannelMember } from '@/types/communication';

interface MemberListPanelProps {
  channelId: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Gestor',
  STAFF: 'Equipe',
  COORDINATOR: 'Coordenador',
  TEACHER: 'Professor',
  SECRETARY: 'Secretaria',
  IT: 'TI',
  MAINTENANCE: 'Manutenção',
  CLEANING: 'Limpeza',
  PURCHASING: 'Compras',
  FINANCE: 'Financeiro',
  ADMISSIONS: 'Admissões',
};

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'ADMIN':
      return 'bg-red-100 text-red-700';
    case 'MANAGER':
      return 'bg-purple-100 text-purple-700';
    case 'COORDINATOR':
      return 'bg-indigo-100 text-indigo-700';
    case 'TEACHER':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
}

export default function MemberListPanel({ channelId }: MemberListPanelProps) {
  const { data: members = [], isLoading } = useChannelMembers(channelId);
  const { onlineUsers, toggleMembers } = useCommunicationStore();

  const { online, offline } = useMemo(() => {
    const on: ChannelMember[] = [];
    const off: ChannelMember[] = [];
    for (const member of members) {
      if (onlineUsers.has(member.userId) || member.isOnline) {
        on.push(member);
      } else {
        off.push(member);
      }
    }
    return { online: on, offline: off };
  }, [members, onlineUsers]);

  if (isLoading) {
    return (
      <>
        {/* Mobile: full-screen overlay */}
        <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" onClick={toggleMembers} />
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center sm:relative sm:inset-auto sm:z-auto sm:w-64 sm:border-l sm:border-neutral-200">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" onClick={toggleMembers} />

      {/* Panel: full-screen on mobile, fixed sidebar on desktop */}
      <div className="fixed inset-0 z-50 bg-white flex flex-col h-full overflow-y-auto sm:relative sm:inset-auto sm:z-auto sm:w-64 sm:border-l sm:border-neutral-200 sm:flex-shrink-0">
        {/* Mobile header with close button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 sm:hidden">
          <h4 className="text-sm font-semibold text-neutral-900">
            Membros ({members.length})
          </h4>
          <button
            onClick={toggleMembers}
            className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="p-4">
          {/* Desktop header */}
          <h4 className="hidden sm:block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
            Membros ({members.length})
          </h4>

          {/* Online */}
          {online.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-green-600 mb-2">
                Online &mdash; {online.length}
              </p>
              <div className="space-y-1">
                {online.map((member) => (
                  <MemberRow key={member.id} member={member} isOnline />
                ))}
              </div>
            </div>
          )}

          {/* Offline */}
          {offline.length > 0 && (
            <div>
              <p className="text-xs font-medium text-neutral-400 mb-2">
                Offline &mdash; {offline.length}
              </p>
              <div className="space-y-1">
                {offline.map((member) => (
                  <MemberRow key={member.id} member={member} isOnline={false} />
                ))}
              </div>
            </div>
          )}

          {members.length === 0 && (
            <p className="text-sm text-neutral-400 text-center py-4">
              Nenhum membro
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function MemberRow({
  member,
  isOnline,
}: {
  member: ChannelMember;
  isOnline: boolean;
}) {
  const roleLabel = ROLE_LABELS[member.user.role] || member.user.role;
  const badgeColor = getRoleBadgeColor(member.user.role);

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-50 transition-colors">
      <div className="relative flex-shrink-0">
        <Avatar
          src={member.user.avatarUrl}
          name={member.user.displayName}
          size="sm"
        />
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
            isOnline ? 'bg-green-500' : 'bg-neutral-300'
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isOnline ? 'text-neutral-900' : 'text-neutral-500'}`}>
          {member.user.displayName}
        </p>
        <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded ${badgeColor}`}>
          {roleLabel}
        </span>
      </div>
    </div>
  );
}
