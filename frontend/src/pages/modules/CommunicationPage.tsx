import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, Ticket, BarChart3, Calendar, LayoutList } from 'lucide-react';
import { useLanguageStore } from '@/stores/languageStore';

// Tabs
import ChatTab from '@/components/communication/ChatTab';
import TicketsTab from '@/components/communication/TicketsTab';
import OverviewTab from '@/components/communication/OverviewTab';
import TasksTab from '@/components/communication/tasks/TasksTab';
import CalendarTab from '@/components/communication/calendar/CalendarTab';

type Tab = 'overview' | 'chat' | 'tasks' | 'tickets' | 'calendar';

const tabs: { id: Tab; icon: typeof MessageSquare; labelKey: string }[] = [
  { id: 'overview', icon: BarChart3, labelKey: 'nav.launcher' },
  { id: 'chat', icon: MessageSquare, labelKey: 'communication.chat' },
  { id: 'tasks', icon: LayoutList, labelKey: 'communication.tasks' },
  { id: 'tickets', icon: Ticket, labelKey: 'communication.tickets' },
  { id: 'calendar', icon: Calendar, labelKey: 'communication.calendar' },
];

export default function CommunicationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguageStore();

  const currentTab = (searchParams.get('tab') as Tab) || 'overview';

  const setTab = (tab: Tab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      {/* Tab Bar */}
      <div className="px-4 lg:px-6 pt-3 pb-2">
        <nav className="inline-flex bg-neutral-100 rounded-xl p-1 gap-0.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                title={t(tab.labelKey)}
                className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
                  isActive
                    ? 'text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-white rounded-lg shadow-soft"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{t(tab.labelKey)}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {currentTab === 'overview' && <OverviewTab />}
            {currentTab === 'chat' && <ChatTab />}
            {currentTab === 'tasks' && <TasksTab />}
            {currentTab === 'tickets' && <TicketsTab />}
            {currentTab === 'calendar' && <CalendarTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
