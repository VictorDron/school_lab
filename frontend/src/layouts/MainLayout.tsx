import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Package,
  Users,
  FileText,
  Shield,
  Home,
  Menu,
  X,
  LogOut,
  User,
  Settings,
  GraduationCap,
  BookOpen,
  UserCog,
  Wallet,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore, AppModule } from '@/stores/authStore';
import { useLanguageStore } from '@/stores/languageStore';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationsDropdown } from '@/components/layout/NotificationsDropdown';
import { ProfileModal } from '@/components/layout/ProfileModal';
import { useUnviewedLeadsCount } from '@/hooks/useUnviewedLeads';
import Mark from '@/components/brand/Mark';

type NavItem =
  | { kind: 'live'; id: AppModule | 'home'; icon: typeof Home; label: string; path: string }
  | { kind: 'placeholder'; id: string; icon: typeof Home; label: string };

const navItems: NavItem[] = [
  { kind: 'live',        id: 'home',               icon: Home,         label: 'nav.launcher',                path: '/launcher' },
  { kind: 'live',        id: 'CRM',                icon: Users,        label: 'module.crm',                  path: '/crm' },
  { kind: 'live',        id: 'STUDENT_MANAGEMENT', icon: GraduationCap,label: 'module.studentManagement',    path: '/students' },
  { kind: 'live',        id: 'GED',                icon: FileText,     label: 'module.ged',                  path: '/ged' },
  { kind: 'placeholder', id: 'pedagogical',        icon: BookOpen,     label: 'module.pedagogical' },
  { kind: 'placeholder', id: 'team',               icon: UserCog,      label: 'module.team' },
  { kind: 'placeholder', id: 'financial',          icon: Wallet,       label: 'module.financial' },
  { kind: 'live',        id: 'ADMIN',              icon: Shield,       label: 'module.admin',                path: '/admin' },
  { kind: 'live',        id: 'COMMUNICATION',      icon: MessageSquare,label: 'module.communication',        path: '/communication' },
  { kind: 'live',        id: 'PROCUREMENT',        icon: Package,      label: 'resources.title',             path: '/resources' },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasModuleAccess, isAdmin } = useAuthStore();
  const { t, language, setLanguage } = useLanguageStore();

  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { data: unviewedCount } = useUnviewedLeadsCount();

  const filteredNavItems = navItems.filter((it) => {
    if (it.kind === 'placeholder') return true;
    if (it.id === 'home') return true;
    if (it.id === 'ADMIN') return isAdmin();
    return hasModuleAccess(it.id as AppModule);
  });

  const currentModule = navItems.find(
    (it) => it.kind === 'live' && it.id !== 'home' && location.pathname.startsWith(it.path),
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="h-screen bg-paper flex overflow-hidden">
      {/* ============ Desktop Sidebar ============ */}
      <aside
        className={`hidden lg:flex flex-col bg-paper border-r border-ink transition-all duration-300 ${
          sidebarExpanded ? 'w-64' : 'w-[68px]'
        }`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Brand */}
        <div className="h-[68px] flex items-center px-5 border-b border-ink overflow-hidden">
          <AnimatePresence mode="wait">
            {sidebarExpanded ? (
              <motion.div
                key="full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Mark size="sm" />
              </motion.div>
            ) : (
              <motion.div
                key="dot"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center w-full"
              >
                <span
                  aria-hidden
                  className="block animate-iris-pulse"
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: '#6B4FFF',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section label */}
        <div
          className={`px-5 pt-6 pb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-deep transition-opacity ${
            sidebarExpanded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          — Módulos
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-1">
          <ul>
            {filteredNavItems.map((it) => {
              const isPlaceholder = it.kind === 'placeholder';
              const isActive = !isPlaceholder && location.pathname.startsWith(it.path);
              const Icon = it.icon;

              return (
                <li key={it.id}>
                  <button
                    onClick={() => {
                      if (it.kind === 'live') navigate(it.path);
                    }}
                    aria-disabled={isPlaceholder}
                    className={[
                      'group w-full flex items-center gap-3 px-5 py-3 transition-all relative',
                      isActive
                        ? 'bg-ink text-paper'
                        : isPlaceholder
                          ? 'text-ink-soft cursor-default'
                          : 'text-ink-soft hover:bg-paper-deep hover:text-ink',
                    ].join(' ')}
                  >
                    {/* Active iris bar */}
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-0 bottom-0 w-[3px]"
                        style={{ background: 'var(--iris)' }}
                      />
                    )}

                    <div className="relative flex-shrink-0">
                      <Icon
                        className="w-[18px] h-[18px]"
                        strokeWidth={isActive ? 2 : 1.6}
                      />
                      {/* CRM unread badge */}
                      {it.kind === 'live' && it.id === 'CRM' && (unviewedCount ?? 0) > 0 && (
                        <span
                          className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 text-[9px] font-bold rounded-full flex items-center justify-center text-paper"
                          style={{ background: 'var(--iris)' }}
                        >
                          {(unviewedCount ?? 0) > 9 ? '9+' : unviewedCount}
                        </span>
                      )}
                    </div>

                    <AnimatePresence>
                      {sidebarExpanded && (
                        <motion.span
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.15 }}
                          className="flex-1 text-sm font-medium whitespace-nowrap"
                          style={{ letterSpacing: '-0.005em' }}
                        >
                          {t(it.label)}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom — language + status */}
        <div className="border-t border-ink">
          {sidebarExpanded ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between gap-2 px-5 py-3"
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-deep">
                v1 <span className="text-iris">●</span> live
              </span>
              <div className="flex items-center border border-rule rounded-md overflow-hidden">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] transition-all ${
                    language === 'en' ? 'bg-ink text-paper' : 'text-stone-deep hover:text-ink'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('pt')}
                  className={`px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] transition-all ${
                    language === 'pt' ? 'bg-ink text-paper' : 'text-stone-deep hover:text-ink'
                  }`}
                >
                  PT
                </button>
              </div>
            </motion.div>
          ) : (
            // Collapsed: just show the current language as a small mono badge
            <div className="flex items-center justify-center py-3">
              <span
                className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-deep"
                title={language === 'en' ? 'English' : 'Português'}
              >
                {language.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* ============ Main Content ============ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-[68px] bg-paper border-b border-ink flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-paper-deep rounded-md transition-colors"
            >
              <Menu className="w-5 h-5 text-ink" strokeWidth={1.6} />
            </button>

            {/* Breadcrumb */}
            <button
              onClick={() => navigate('/launcher')}
              className="flex items-center gap-2 group"
            >
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-deep group-hover:text-ink transition-colors">
                {currentModule ? t('nav.launcher') : 'Início'}
              </span>
              {currentModule && (
                <>
                  <ChevronRight className="w-3 h-3 text-stone" strokeWidth={2} />
                  <span
                    className="font-display italic text-ink"
                    style={{
                      fontSize: 18,
                      fontWeight: 400,
                      letterSpacing: '-0.015em',
                      fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1',
                    }}
                  >
                    {t(currentModule.label)}
                  </span>
                </>
              )}
              {!currentModule && (
                <>
                  <ChevronRight className="w-3 h-3 text-stone" strokeWidth={2} />
                  <span
                    className="font-display italic text-ink"
                    style={{
                      fontSize: 18,
                      fontWeight: 400,
                      letterSpacing: '-0.015em',
                      fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1',
                    }}
                  >
                    launcher
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <NotificationsDropdown />

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 hover:bg-paper-deep rounded-md transition-colors"
              >
                <Avatar src={user?.avatarUrl} name={user?.displayName || ''} size="sm" />
                <span className="hidden md:block text-sm font-medium text-ink" style={{ letterSpacing: '-0.005em' }}>
                  {user?.displayName?.split(' ')[0]}
                </span>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-full mt-2 dropdown"
                    >
                      <div className="px-4 py-3 border-b border-rule">
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-iris mb-1">
                          — Conta
                        </p>
                        <p className="text-sm font-medium text-ink">{user?.displayName}</p>
                        <p className="text-xs text-stone-deep mt-0.5">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowProfileModal(true);
                          }}
                          className="dropdown-item w-full text-left"
                        >
                          <User className="w-4 h-4" strokeWidth={1.6} />
                          {t('nav.profile')}
                        </button>
                        {isAdmin() && (
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              navigate('/admin?tab=settings');
                            }}
                            className="dropdown-item w-full text-left"
                          >
                            <Settings className="w-4 h-4" strokeWidth={1.6} />
                            {t('nav.settings')}
                          </button>
                        )}
                      </div>
                      <div className="border-t border-rule py-1">
                        <button
                          onClick={handleLogout}
                          className="dropdown-item w-full text-left"
                          style={{ color: '#C0411E' }}
                        >
                          <LogOut className="w-4 h-4" strokeWidth={1.6} />
                          {t('auth.logout')}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-paper">
          <Outlet />
        </main>
      </div>

      {/* ============ Mobile Menu ============ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 lg:hidden"
              style={{ background: 'rgba(14, 13, 11, 0.55)' }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="fixed inset-y-0 left-0 w-72 bg-paper z-50 lg:hidden flex flex-col border-r border-ink"
            >
              <div className="h-[68px] flex items-center justify-between px-5 border-b border-ink">
                <Mark size="sm" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-paper-deep rounded-md"
                >
                  <X className="w-5 h-5 text-ink" strokeWidth={1.6} />
                </button>
              </div>

              <div className="px-5 pt-6 pb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-deep">
                — Módulos
              </div>

              <nav className="flex-1 overflow-y-auto pb-4">
                <ul>
                  {filteredNavItems.map((it) => {
                    const isPlaceholder = it.kind === 'placeholder';
                    const isActive = !isPlaceholder && location.pathname.startsWith(it.path);
                    const Icon = it.icon;

                    return (
                      <li key={it.id}>
                        <button
                          onClick={() => {
                            if (it.kind === 'live') {
                              navigate(it.path);
                              setMobileMenuOpen(false);
                            }
                          }}
                          aria-disabled={isPlaceholder}
                          className={[
                            'w-full flex items-center gap-3 px-5 py-3.5 transition-all relative',
                            isActive
                              ? 'bg-ink text-paper'
                              : isPlaceholder
                                ? 'text-ink-soft cursor-default'
                                : 'text-ink-soft hover:bg-paper-deep hover:text-ink',
                          ].join(' ')}
                        >
                          {isActive && (
                            <span
                              aria-hidden
                              className="absolute left-0 top-0 bottom-0 w-[3px]"
                              style={{ background: 'var(--iris)' }}
                            />
                          )}
                          <div className="relative flex-shrink-0">
                            <Icon
                              className="w-[18px] h-[18px]"
                              strokeWidth={isActive ? 2 : 1.6}
                            />
                            {it.kind === 'live' && it.id === 'CRM' && (unviewedCount ?? 0) > 0 && (
                              <span
                                className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 text-[9px] font-bold rounded-full flex items-center justify-center text-paper"
                                style={{ background: 'var(--iris)' }}
                              >
                                {(unviewedCount ?? 0) > 9 ? '9+' : unviewedCount}
                              </span>
                            )}
                          </div>
                          <span className="flex-1 text-sm font-medium">
                            {t(it.label)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="px-5 py-4 border-t border-ink">
                <div className="flex justify-center gap-2 mb-4">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
                      language === 'en'
                        ? 'bg-ink text-paper'
                        : 'border border-rule text-stone-deep hover:text-ink'
                    }`}
                    style={{ borderRadius: 4 }}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLanguage('pt')}
                    className={`px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
                      language === 'pt'
                        ? 'bg-ink text-paper'
                        : 'border border-rule text-stone-deep hover:text-ink'
                    }`}
                    style={{ borderRadius: 4 }}
                  >
                    Português
                  </button>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full btn btn-outline btn-md"
                  style={{ color: '#C0411E', borderColor: '#C0411E' }}
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.6} />
                  {t('auth.logout')}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>
  );
}
