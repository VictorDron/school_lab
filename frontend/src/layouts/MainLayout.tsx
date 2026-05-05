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
  ChevronLeft,
  Menu,
  X,
  LogOut,
  User,
  Settings,
  GraduationCap,
  BookOpen,
  UserCog,
  Wallet,
} from 'lucide-react';
import { useAuthStore, AppModule } from '@/stores/authStore';
import { useLanguageStore } from '@/stores/languageStore';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationsDropdown } from '@/components/layout/NotificationsDropdown';
import { ProfileModal } from '@/components/layout/ProfileModal';
import { useUnviewedLeadsCount } from '@/hooks/useUnviewedLeads';

type NavItem =
  | {
      kind: 'live';
      id: AppModule | 'home';
      icon: typeof Home;
      label: string;
      path: string;
      color: string;
    }
  | {
      kind: 'placeholder';
      id: string;
      icon: typeof Home;
      label: string;
      color: string;
    };

const navItems: NavItem[] = [
  { kind: 'live', id: 'home', icon: Home, label: 'nav.launcher', path: '/launcher', color: 'text-neutral-600' },
  { kind: 'live', id: 'CRM', icon: Users, label: 'module.crm', path: '/crm', color: 'text-module-crm' },
  { kind: 'live', id: 'STUDENT_MANAGEMENT', icon: GraduationCap, label: 'module.studentManagement', path: '/students', color: 'text-violet-600' },
  { kind: 'live', id: 'GED', icon: FileText, label: 'module.ged', path: '/ged', color: 'text-module-ged' },
  { kind: 'placeholder', id: 'pedagogical', icon: BookOpen, label: 'module.pedagogical', color: 'text-emerald-600' },
  { kind: 'placeholder', id: 'team', icon: UserCog, label: 'module.team', color: 'text-amber-600' },
  { kind: 'placeholder', id: 'financial', icon: Wallet, label: 'module.financial', color: 'text-rose-600' },
  { kind: 'live', id: 'ADMIN', icon: Shield, label: 'module.admin', path: '/admin', color: 'text-module-admin' },
  { kind: 'live', id: 'COMMUNICATION', icon: MessageSquare, label: 'module.communication', path: '/communication', color: 'text-module-communication' },
  { kind: 'live', id: 'PROCUREMENT', icon: Package, label: 'resources.title', path: '/resources', color: 'text-teal-600' },
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

  // Fetch unviewed leads count for CRM badge
  const { data: unviewedCount } = useUnviewedLeadsCount();

  const filteredNavItems = navItems.filter(item => {
    if (item.kind === 'placeholder') return true;
    if (item.id === 'home') return true;
    if (item.id === 'ADMIN') return isAdmin();
    return hasModuleAccess(item.id as AppModule);
  });

  const currentModule = navItems.find(item =>
    item.kind === 'live' && item.id !== 'home' && location.pathname.startsWith(item.path)
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="h-screen bg-neutral-50 flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-neutral-200 transition-all duration-300 ${
          sidebarExpanded ? 'w-64' : 'w-16'
        }`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-neutral-100 px-2">
          <motion.div
            initial={false}
            animate={{ scale: sidebarExpanded ? 1 : 0.85 }}
            className="flex items-center justify-center"
          >
            <img 
              src="/logo_ris.png" 
              alt="School Lab" 
              className={`transition-all duration-300 ${sidebarExpanded ? 'h-10' : 'h-8'} w-auto`}
            />
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {filteredNavItems.map((item) => {
              const isPlaceholder = item.kind === 'placeholder';
              const isActive = !isPlaceholder && location.pathname.startsWith(item.path);
              const Icon = item.icon;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      if (item.kind === 'live') navigate(item.path);
                    }}
                    aria-disabled={isPlaceholder}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : isPlaceholder
                          ? 'text-neutral-500 cursor-default'
                          : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="relative">
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : item.color} ${isPlaceholder ? 'opacity-70' : ''}`} />
                      {item.kind === 'live' && item.id === 'CRM' && (unviewedCount ?? 0) > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {(unviewedCount ?? 0) > 9 ? '9+' : unviewedCount}
                        </span>
                      )}
                      {isPlaceholder && !sidebarExpanded && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                        </span>
                      )}
                    </div>
                    <AnimatePresence>
                      {sidebarExpanded && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="flex-1 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                        >
                          <span>{t(item.label)}</span>
                          {isPlaceholder && (
                            <span className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/60">
                              <span className="relative flex h-1 w-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1 w-1 bg-amber-500" />
                              </span>
                              <span className="text-[10px] font-medium text-amber-700">
                                {t('common.comingSoon')}
                              </span>
                            </span>
                          )}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className="p-2 border-t border-neutral-100">
          {/* Language Switcher */}
          <div className={`flex ${sidebarExpanded ? 'justify-center gap-1 mb-2' : 'flex-col gap-1'}`}>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                language === 'en'
                  ? 'bg-primary-600 text-white'
                  : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('pt')}
              className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                language === 'pt'
                  ? 'bg-primary-600 text-white'
                  : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              PT
            </button>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate('/launcher')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-all"
          >
            <ChevronLeft className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-sm font-medium"
                >
                  {t('common.back')}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg"
            >
              <Menu className="w-5 h-5 text-neutral-600" />
            </button>

            {/* Current Module */}
            <button
              onClick={() => navigate('/launcher')}
              className="flex items-center gap-2"
            >
              {currentModule ? (
                <span className="text-lg font-semibold text-neutral-800">
                  {t(currentModule.label)}
                </span>
              ) : (
                <span className="text-lg font-semibold text-neutral-800">
                  {t('nav.launcher')}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <NotificationsDropdown />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <Avatar
                  src={user?.avatarUrl}
                  name={user?.displayName || ''}
                  size="sm"
                />
                <span className="hidden md:block text-sm font-medium text-neutral-700">
                  {user?.displayName}
                </span>
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-full mt-2 dropdown"
                    >
                      <div className="px-4 py-3 border-b border-neutral-100">
                        <p className="text-sm font-medium text-neutral-900">{user?.displayName}</p>
                        <p className="text-xs text-neutral-500">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowProfileModal(true);
                          }}
                          className="dropdown-item w-full text-left"
                        >
                          <User className="w-4 h-4" />
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
                            <Settings className="w-4 h-4" />
                            {t('nav.settings')}
                          </button>
                        )}
                      </div>
                      <div className="border-t border-neutral-100 py-1">
                        <button
                          onClick={handleLogout}
                          className="dropdown-item w-full text-left text-error-600 hover:bg-error-50"
                        >
                          <LogOut className="w-4 h-4" />
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
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-100">
                <img 
                  src="/logo_ris.png" 
                  alt="School Lab" 
                  className="h-9 w-auto"
                />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 py-4 overflow-y-auto">
                <ul className="space-y-1 px-2">
                  {filteredNavItems.map((item) => {
                    const isPlaceholder = item.kind === 'placeholder';
                    const isActive = !isPlaceholder && location.pathname.startsWith(item.path);
                    const Icon = item.icon;

                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => {
                            if (item.kind === 'live') {
                              navigate(item.path);
                              setMobileMenuOpen(false);
                            }
                          }}
                          aria-disabled={isPlaceholder}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            isActive
                              ? 'bg-primary-50 text-primary-700'
                              : isPlaceholder
                                ? 'text-neutral-500 cursor-default'
                                : 'text-neutral-600 hover:bg-neutral-100'
                          }`}
                        >
                          <div className="relative">
                            <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : item.color} ${isPlaceholder ? 'opacity-70' : ''}`} />
                            {item.kind === 'live' && item.id === 'CRM' && (unviewedCount ?? 0) > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {(unviewedCount ?? 0) > 9 ? '9+' : unviewedCount}
                              </span>
                            )}
                          </div>
                          <span className="flex-1 flex items-center gap-2 text-sm font-medium">
                            <span>{t(item.label)}</span>
                            {isPlaceholder && (
                              <span className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/60">
                                <span className="relative flex h-1 w-1">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-1 w-1 bg-amber-500" />
                                </span>
                                <span className="text-[10px] font-medium text-amber-700">
                                  {t('common.comingSoon')}
                                </span>
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="p-4 border-t border-neutral-100">
                <div className="flex justify-center gap-2 mb-4">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      language === 'en'
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLanguage('pt')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      language === 'pt'
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    Português
                  </button>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full btn btn-outline text-error-600 border-error-200 hover:bg-error-50"
                >
                  <LogOut className="w-4 h-4" />
                  {t('auth.logout')}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}
