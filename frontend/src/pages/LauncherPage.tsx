import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Users,
  FileText,
  Shield,
  ArrowRight,
  GraduationCap,
  Package,
  UserCog,
  BookOpen,
  Wallet,
} from 'lucide-react';
import { useAuthStore, AppModule } from '@/stores/authStore';
import { useLanguageStore } from '@/stores/languageStore';
import { Avatar } from '@/components/ui/Avatar';

type ModuleCard =
  | {
      kind: 'live';
      id: AppModule;
      icon: typeof MessageSquare;
      labelKey: string;
      descriptionKey: string;
      path: string;
      color: string;
      bgColor: string;
      comingSoon?: boolean;
    }
  | {
      kind: 'placeholder';
      id: string;
      icon: typeof MessageSquare;
      labelKey: string;
      descriptionKey: string;
      color: string;
      bgColor: string;
    };

const modules: ModuleCard[] = [
  {
    kind: 'live',
    id: 'CRM',
    icon: Users,
    labelKey: 'module.crm',
    descriptionKey: 'module.crm.description',
    path: '/crm',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 hover:bg-pink-100',
  },
  {
    kind: 'live',
    id: 'STUDENT_MANAGEMENT',
    icon: GraduationCap,
    labelKey: 'module.studentManagement',
    descriptionKey: 'module.studentManagement.description',
    path: '/students',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 hover:bg-violet-100',
  },
  {
    kind: 'live',
    id: 'GED',
    icon: FileText,
    labelKey: 'module.ged',
    descriptionKey: 'module.ged.description',
    path: '/ged',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    comingSoon: true,
  },
  {
    kind: 'placeholder',
    id: 'pedagogical',
    icon: BookOpen,
    labelKey: 'module.pedagogical',
    descriptionKey: 'module.pedagogical.description',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100',
  },
  {
    kind: 'placeholder',
    id: 'team',
    icon: UserCog,
    labelKey: 'module.team',
    descriptionKey: 'module.team.description',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
  },
  {
    kind: 'placeholder',
    id: 'financial',
    icon: Wallet,
    labelKey: 'module.financial',
    descriptionKey: 'module.financial.description',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 hover:bg-rose-100',
  },
  {
    kind: 'live',
    id: 'ADMIN',
    icon: Shield,
    labelKey: 'module.admin',
    descriptionKey: 'module.admin.description',
    path: '/admin',
    color: 'text-neutral-600',
    bgColor: 'bg-neutral-100 hover:bg-neutral-200',
  },
  {
    kind: 'live',
    id: 'COMMUNICATION',
    icon: MessageSquare,
    labelKey: 'module.communication',
    descriptionKey: 'module.communication.description',
    path: '/communication',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
    comingSoon: true,
  },
  {
    kind: 'live',
    id: 'PROCUREMENT',
    icon: Package,
    labelKey: 'resources.title',
    descriptionKey: 'resources.module.description',
    path: '/resources',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 hover:bg-teal-100',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

export default function LauncherPage() {
  const navigate = useNavigate();
  const { user, hasModuleAccess, isAdmin } = useAuthStore();
  const { t } = useLanguageStore();

  const availableModules = modules.filter((mod) => {
    if (mod.kind === 'placeholder') return true;
    if (mod.id === 'ADMIN') return isAdmin();
    return hasModuleAccess(mod.id);
  });

  return (
    <div className="min-h-full bg-gradient-to-br from-neutral-50 via-white to-primary-50/20 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* User Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Avatar
            src={user?.avatarUrl}
            name={user?.displayName || ''}
            size="lg"
            className="ring-4 ring-white shadow-medium flex-shrink-0"
          />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-neutral-900">
              Olá, {user?.displayName}!
            </h1>
            <p className="text-neutral-500 text-sm">
              {user?.role} {user?.area && `• ${user.area}`}
            </p>
          </div>
          {user?.isPlatformAdmin && (
            <button
              onClick={() => navigate('/platform/tenants')}
              className="ml-auto rounded-md border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
              title="Cross-tenant management — platform admins only"
            >
              Plataforma · Tenants
            </button>
          )}
        </motion.div>

        {/* Module Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {availableModules.map((mod) => {
            const Icon = mod.icon;
            const isComingSoon = mod.kind === 'placeholder' || mod.comingSoon === true;
            const isPlaceholder = mod.kind === 'placeholder';

            return (
              <motion.button
                key={mod.id}
                variants={item}
                onClick={() => {
                  if (mod.kind === 'live') navigate(mod.path);
                }}
                aria-disabled={isPlaceholder}
                className={`group relative p-6 rounded-2xl text-left transition-all duration-300 ${mod.bgColor} border border-transparent hover:border-neutral-200 hover:shadow-medium overflow-hidden ${
                  isPlaceholder ? 'cursor-default' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-white shadow-soft ${mod.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {t(mod.labelKey)}
                    </h3>
                  </div>
                  {isComingSoon ? (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-200/60 shadow-sm"
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                      </span>
                      <span className="text-[11px] font-medium text-neutral-500">
                        {t('common.comingSoon')}
                      </span>
                    </motion.span>
                  ) : (
                    <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-1 transition-all" />
                  )}
                </div>
                <p className="text-sm text-neutral-500 line-clamp-2">
                  {t(mod.descriptionKey)}
                </p>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Empty State */}
        {availableModules.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Shield className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-700 mb-2">
              Nenhum módulo disponível
            </h2>
            <p className="text-neutral-500">
              Entre em contato com o administrador para solicitar acesso.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
