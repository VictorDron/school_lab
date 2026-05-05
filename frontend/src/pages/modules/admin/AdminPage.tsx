import { useSearchParams } from 'react-router-dom';
import AuditView from '@/components/admin/AuditView';
import UsersTab from './UsersTab';
import InvitesTab from './InvitesTab';
import SettingsTab from './SettingsTab';
import type { Tab } from './types';
import { tabs } from './constants';

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as Tab) || 'users';
  const setTab = (tab: Tab) => setSearchParams({ tab });

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="bg-white border-b border-neutral-200 px-4 lg:px-6">
        <nav className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'text-primary-600 border-primary-600'
                    : 'text-neutral-500 border-transparent hover:text-neutral-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {currentTab === 'users' && <UsersTab onSwitchToInvites={() => setTab('invites')} />}
        {currentTab === 'invites' && <InvitesTab />}
        {currentTab === 'audit' && <AuditView />}
        {currentTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
