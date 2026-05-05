import { Hash, Users, Pin, Search } from 'lucide-react';
import { useCommunicationStore } from '@/stores/communicationStore';
import { Avatar } from '@/components/ui/Avatar';
import type { Channel } from '@/types/communication';

export interface DmUser {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
  status?: string;
}

interface ChannelHeaderProps {
  channel: Channel;
  dmUser?: DmUser | null;
  dmOnline?: boolean;
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gestor',
  COORDINATOR: 'Coordenador',
  TEACHER: 'Professor',
  SECRETARY: 'Secretaria',
  STAFF: 'Funcionario',
};

export default function ChannelHeader({ channel, dmUser, dmOnline }: ChannelHeaderProps) {
  const { toggleMembers, togglePinned, toggleSearch, toggleDmProfile, showMembers, showPinned, showSearch, showDmProfile } =
    useCommunicationStore();

  const isDm = channel.type === 'DIRECT';

  return (
    <div className="h-14 px-4 border-b border-neutral-200 flex items-center justify-between bg-white flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {isDm && dmUser ? (
          <button
            onClick={toggleDmProfile}
            className={`flex items-center gap-3 min-w-0 rounded-lg px-2 py-1 -ml-2 transition-colors ${
              showDmProfile ? 'bg-primary-50' : 'hover:bg-neutral-50'
            }`}
          >
            <div className="relative flex-shrink-0">
              <Avatar
                src={dmUser.avatarUrl}
                name={dmUser.displayName}
                size="sm"
              />
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  dmOnline ? 'bg-green-500' : 'bg-neutral-300'
                }`}
              />
            </div>
            <div className="min-w-0 text-left">
              <h3 className="font-semibold text-neutral-900 truncate text-sm leading-tight">
                {dmUser.displayName}
              </h3>
              <p className="text-xs text-neutral-500 truncate leading-tight">
                {dmOnline ? (
                  <span className="text-green-600 font-medium">Online</span>
                ) : (
                  <span>Offline</span>
                )}
                {dmUser.role && (
                  <span> &middot; {roleLabels[dmUser.role] || dmUser.role}</span>
                )}
                {dmUser.email && (
                  <span className="hidden md:inline"> &middot; {dmUser.email}</span>
                )}
              </p>
            </div>
          </button>
        ) : (
          <>
            <Hash className="w-5 h-5 text-neutral-400 flex-shrink-0" />
            <h3 className="font-semibold text-neutral-900 truncate">
              {channel.name}
            </h3>
            {channel.description && (
              <span className="text-sm text-neutral-500 hidden md:block truncate">
                &mdash; {channel.description}
              </span>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        {!isDm && (
          <button
            onClick={toggleMembers}
            className={`p-2 rounded-lg transition-colors ${
              showMembers
                ? 'bg-primary-50 text-primary-600'
                : 'hover:bg-neutral-100 text-neutral-500'
            }`}
            title="Membros"
          >
            <Users className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={togglePinned}
          className={`p-2 rounded-lg transition-colors ${
            showPinned
              ? 'bg-primary-50 text-primary-600'
              : 'hover:bg-neutral-100 text-neutral-500'
          }`}
          title="Mensagens fixadas"
        >
          <Pin className="w-5 h-5" />
        </button>
        <button
          onClick={toggleSearch}
          className={`p-2 rounded-lg transition-colors ${
            showSearch
              ? 'bg-primary-50 text-primary-600'
              : 'hover:bg-neutral-100 text-neutral-500'
          }`}
          title="Pesquisar"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
