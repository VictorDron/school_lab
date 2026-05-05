import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Lock, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { get, post, getErrorMessage } from '@/lib/api';
import { useLanguageStore } from '@/stores/languageStore';

interface RegisterForm {
  fullName: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  dateOfBirth?: string;
}

interface InviteData {
  email: string;
  name?: string;
  expiresAt: string;
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguageStore();
  const [showPassword, setShowPassword] = useState(false);

  const token = searchParams.get('token');

  const { data: inviteData, isLoading: isValidating, error: validationError } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => get<InviteData>(`/auth/validate-token/${token}`),
    enabled: !!token,
    retry: false,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const registerMutation = useMutation({
    mutationFn: (data: RegisterForm) =>
      post('/auth/register', {
        token,
        fullName: data.fullName,
        displayName: data.displayName,
        password: data.password,
        dateOfBirth: data.dateOfBirth,
      }),
    onSuccess: () => {
      toast.success('Conta criada! Aguarde aprovação do administrador.');
      navigate('/');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  useEffect(() => {
    if (inviteData?.data?.name) {
      setValue('fullName', inviteData.data.name);
      setValue('displayName', inviteData.data.name.split(' ')[0]);
    }
  }, [inviteData, setValue]);

  if (!token) {
    return (
      <div className="card p-8 text-center">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">Link Inválido</h2>
        <p className="text-neutral-500 mb-6">Este link de registro é inválido.</p>
        <Link to="/" className="btn btn-primary btn-md">
          Voltar ao Login
        </Link>
      </div>
    );
  }

  if (isValidating) {
    return (
      <div className="card p-8 text-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
        <p className="text-neutral-500">Validando convite...</p>
      </div>
    );
  }

  if (validationError || !inviteData?.success) {
    return (
      <div className="card p-8 text-center">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">Convite Inválido</h2>
        <p className="text-neutral-500 mb-6">
          Este convite é inválido, já foi utilizado ou expirou.
        </p>
        <Link to="/" className="btn btn-primary btn-md">
          Voltar ao Login
        </Link>
      </div>
    );
  }

  const invite = inviteData.data!;

  return (
    <div className="card p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold text-primary-600 mb-2">RISYS</h1>
          <p className="text-neutral-500 text-sm">{t('auth.completeRegistration')}</p>
        </motion.div>
      </div>

      {/* Form */}
      <motion.form
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSubmit((data) => registerMutation.mutate(data))}
        className="space-y-5"
      >
        {/* Full Name */}
        <div>
          <label className="label">Nome Completo</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              {...register('fullName', { required: 'Nome completo é obrigatório' })}
              className={`input pl-11 ${errors.fullName ? 'input-error' : ''}`}
              placeholder="Seu nome completo"
            />
          </div>
          {errors.fullName && (
            <p className="text-error-500 text-sm mt-1">{errors.fullName.message}</p>
          )}
        </div>

        {/* Display Name */}
        <div>
          <label className="label">Nome de Exibição</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              {...register('displayName', { required: 'Nome de exibição é obrigatório' })}
              className={`input pl-11 ${errors.displayName ? 'input-error' : ''}`}
              placeholder="Como você quer ser chamado"
            />
          </div>
          {errors.displayName && (
            <p className="text-error-500 text-sm mt-1">{errors.displayName.message}</p>
          )}
        </div>

        {/* Email (readonly) */}
        <div>
          <label className="label">{t('auth.email')}</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="email"
              value={invite.email}
              disabled
              className="input pl-11 bg-neutral-50 text-neutral-500"
            />
          </div>
        </div>

        {/* Date of Birth */}
        <div>
          <label className="label">Data de Nascimento (opcional)</label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="date"
              {...register('dateOfBirth')}
              className="input pl-11"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="label">Criar Senha</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', {
                required: 'Senha é obrigatória',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              })}
              className={`input pl-11 pr-11 ${errors.password ? 'input-error' : ''}`}
              placeholder="Mínimo 6 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-error-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="label">Confirmar Senha</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('confirmPassword', {
                required: 'Confirme sua senha',
                validate: (value) => value === password || 'Senhas não conferem',
              })}
              className={`input pl-11 ${errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="Digite a senha novamente"
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-error-500 text-sm mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full btn btn-primary btn-lg"
        >
          {registerMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t('auth.register')
          )}
        </button>

        {/* Back to Login */}
        <div className="text-center">
          <Link
            to="/"
            className="text-sm text-neutral-500 hover:text-neutral-700"
          >
            Já tem uma conta? Fazer login
          </Link>
        </div>
      </motion.form>
    </div>
  );
}
