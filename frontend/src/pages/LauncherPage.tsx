import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Users,
  FileText,
  Shield,
  ArrowUpRight,
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
      comingSoon?: boolean;
    }
  | {
      kind: 'placeholder';
      id: string;
      icon: typeof MessageSquare;
      labelKey: string;
      descriptionKey: string;
    };

const MODULES: ModuleCard[] = [
  { kind: 'live',        id: 'CRM',                icon: Users,         labelKey: 'module.crm',                descriptionKey: 'module.crm.description',                path: '/crm' },
  { kind: 'live',        id: 'STUDENT_MANAGEMENT', icon: GraduationCap, labelKey: 'module.studentManagement',  descriptionKey: 'module.studentManagement.description',  path: '/students' },
  { kind: 'live',        id: 'GED',                icon: FileText,      labelKey: 'module.ged',                descriptionKey: 'module.ged.description',                path: '/ged' },
  { kind: 'placeholder', id: 'pedagogical',        icon: BookOpen,      labelKey: 'module.pedagogical',        descriptionKey: 'module.pedagogical.description' },
  { kind: 'placeholder', id: 'team',               icon: UserCog,       labelKey: 'module.team',               descriptionKey: 'module.team.description' },
  { kind: 'placeholder', id: 'financial',          icon: Wallet,        labelKey: 'module.financial',          descriptionKey: 'module.financial.description' },
  { kind: 'live',        id: 'ADMIN',              icon: Shield,        labelKey: 'module.admin',              descriptionKey: 'module.admin.description',              path: '/admin' },
  { kind: 'live',        id: 'COMMUNICATION',      icon: MessageSquare, labelKey: 'module.communication',      descriptionKey: 'module.communication.description',      path: '/communication' },
  { kind: 'live',        id: 'PROCUREMENT',        icon: Package,       labelKey: 'resources.title',           descriptionKey: 'resources.module.description',          path: '/resources' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.045 } },
};
const item = {
  hidden: { y: 12, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

export default function LauncherPage() {
  const navigate = useNavigate();
  const { user, hasModuleAccess, isAdmin } = useAuthStore();
  const { t } = useLanguageStore();

  const availableModules = MODULES.filter((mod) => {
    if (mod.kind === 'placeholder') return true;
    if (mod.id === 'ADMIN') return isAdmin();
    return hasModuleAccess(mod.id);
  });

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-full bg-paper grain">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-12 py-10 lg:py-14">

        {/* ===== Topbar editorial ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-center pb-6 border-b border-ink font-mono text-[11px] uppercase tracking-[0.06em] gap-2">
          <div className="text-stone-deep">— Sistema · v1 · {today}</div>
          <div className="serif-em text-stone-deep text-center" style={{ textTransform: 'none', fontSize: 14 }}>
            — Plataforma operacional —
          </div>
          <div className="text-right text-stone-deep">
            Em operação <span className="text-iris">●</span> live
          </div>
        </div>

        {/* ===== Greeting ===== */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-end gap-6 py-12 border-b border-rule"
        >
          <div>
            <div className="eyebrow eyebrow-iris mb-7">— Bem-vindo de volta</div>
            <h1
              className="font-display font-light text-ink leading-none"
              style={{
                fontSize: 'clamp(44px, 6vw, 84px)',
                letterSpacing: '-0.04em',
                fontVariationSettings: '"opsz" 144, "SOFT" 50',
              }}
            >
              Olá, <em className="display-em">{user?.displayName?.split(' ')[0] || 'usuário'}</em>
              <span className="text-iris">.</span>
            </h1>
            <p className="serif-em text-stone-deep mt-5" style={{ fontSize: 17 }}>
              — {user?.role}{user?.area && ` · ${user.area}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Avatar
              src={user?.avatarUrl}
              name={user?.displayName || ''}
              size="lg"
              className="border border-ink"
            />
            {user?.isPlatformAdmin && (
              <button
                onClick={() => navigate('/platform/tenants')}
                className="btn btn-outline btn-sm whitespace-nowrap"
                title="Cross-tenant management — platform admins only"
              >
                Plataforma · Tenants
                <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </motion.div>

        {/* ===== Section header ===== */}
        <div className="grid lg:grid-cols-[200px_1fr] gap-10 items-end pt-14 pb-10">
          <div
            className="font-display italic font-light leading-none text-stone-deep"
            style={{ fontSize: 56, letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}
          >
            i.
            <small className="block font-mono text-[10px] not-italic font-medium uppercase tracking-[0.20em] text-stone-deep mt-3" style={{ fontWeight: 500 }}>
              Módulos
            </small>
          </div>
          <div>
            <h2
              className="font-display font-light text-ink leading-none"
              style={{ fontSize: 'clamp(28px, 3.4vw, 40px)', letterSpacing: '-0.035em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
            >
              Onde você quer <em className="display-em">trabalhar</em> hoje?
            </h2>
            <p className="serif-em text-stone-deep mt-3" style={{ fontSize: 16 }}>
              — Cada módulo é uma disciplina. Escolha uma e siga.
            </p>
          </div>
        </div>

        {/* ===== Module grid editorial ===== */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-ink"
        >
          {availableModules.map((mod, idx) => {
            const Icon = mod.icon;
            const isPlaceholder = mod.kind === 'placeholder';
            const num = String(idx + 1).padStart(2, '0');

            return (
              <motion.button
                key={mod.id}
                variants={item}
                onClick={() => {
                  if (mod.kind === 'live') navigate(mod.path);
                }}
                aria-disabled={isPlaceholder}
                className={[
                  'group relative bg-paper border-r border-b border-ink p-7 text-left',
                  'transition-colors duration-200 hover:bg-ink hover:text-paper',
                  isPlaceholder ? 'cursor-default' : 'cursor-pointer',
                ].join(' ')}
                style={{ minHeight: 200 }}
              >
                <div className="flex items-baseline justify-between mb-7">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-deep group-hover:text-paper/60">
                    — {num}
                  </span>
                  {!isPlaceholder && (
                    <ArrowUpRight
                      className="w-4 h-4 text-stone group-hover:text-paper transition-transform group-hover:rotate-45 group-hover:scale-110"
                      strokeWidth={2.5}
                    />
                  )}
                </div>

                <div className="mb-5">
                  <Icon
                    className="w-7 h-7 text-ink group-hover:text-paper transition-colors"
                    strokeWidth={1.5}
                  />
                </div>

                <h3
                  className="font-display font-normal text-ink group-hover:text-paper leading-tight mb-2 transition-colors"
                  style={{ fontSize: 22, letterSpacing: '-0.025em' }}
                >
                  <span className="font-light">{t(mod.labelKey)}</span>
                </h3>

                <p className="text-[13px] leading-relaxed text-stone-deep group-hover:text-paper/70 transition-colors line-clamp-2">
                  {t(mod.descriptionKey)}
                </p>
              </motion.button>
            );
          })}
        </motion.div>

        {/* ===== Empty state ===== */}
        {availableModules.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-ink p-16 text-center bg-paper mt-8"
          >
            <Shield className="w-10 h-10 mx-auto mb-5 text-stone" strokeWidth={1.5} />
            <h2
              className="font-display italic font-normal text-ink mb-3"
              style={{ fontSize: 28, letterSpacing: '-0.025em', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}
            >
              Nenhum módulo disponível
            </h2>
            <p className="text-sm text-stone-deep max-w-md mx-auto">
              Entre em contato com o administrador para solicitar acesso.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
