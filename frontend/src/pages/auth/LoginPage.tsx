import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { useLanguageStore } from '@/stores/languageStore';
import { getErrorMessage } from '@/lib/api';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const { t } = useLanguageStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      toast.success('Login realizado com sucesso!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="bg-paper border border-ink p-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-deep hover:text-ink transition-colors mb-8"
      >
        <ArrowLeft className="w-3 h-3" /> Voltar ao site
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-iris mb-5">
          — Acesso · v1
        </div>
        <h1 className="font-display font-light leading-none mb-3 text-ink" style={{ fontSize: 44, letterSpacing: '-0.035em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
          Bem-<em className="display-em">vindo</em>.
        </h1>
        <p className="serif-em text-stone-deep mb-9" style={{ fontSize: 16 }}>
          — Acesse sua conta para continuar.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <div>
          <label className="label">— {t('auth.email')}</label>
          <input
            type="email"
            {...register('email', {
              required: 'Email é obrigatório',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email inválido',
              },
            })}
            className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="seu@email.com"
            autoFocus
          />
          {errors.email && (
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] mt-2" style={{ color: '#C0411E' }}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="label">— {t('auth.password')}</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', { required: 'Senha é obrigatória' })}
              className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone hover:text-ink transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] mt-2" style={{ color: '#C0411E' }}>
              {errors.password.message}
            </p>
          )}
        </div>

        <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg w-full">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {t('auth.login')} <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            </>
          )}
        </button>

        <div className="text-center">
          <Link
            to="/forgot-password"
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-deep hover:text-iris transition-colors"
          >
            — Esqueci a senha
          </Link>
        </div>
      </motion.form>

      <div className="mt-9 pt-6 border-t border-rule text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-deep">
          Ainda não conhece a plataforma?{' '}
          <Link to="/" className="text-iris hover:underline">
            Conheça os planos →
          </Link>
        </p>
      </div>
    </div>
  );
}
