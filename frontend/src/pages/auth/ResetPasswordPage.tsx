import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Loader2, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { useLanguageStore } from '@/stores/languageStore';

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email: string; displayName: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordForm>();

  const newPassword = watch('newPassword');

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setIsValidating(false);
        setIsValid(false);
        return;
      }

      try {
        const response = await api.get(`/auth/validate-reset-token/${token}`);
        if (response.data.success) {
          setIsValid(true);
          setUserInfo(response.data.data);
        } else {
          setIsValid(false);
        }
      } catch {
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      setIsLoading(true);
      await api.post('/auth/reset-password', {
        token,
        newPassword: data.newPassword,
      });
      setResetSuccess(true);
      toast.success('Senha redefinida com sucesso!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="card p-8">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-4" />
          <p className="text-neutral-600">{t('auth.validatingToken')}</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="card p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-error-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            {t('auth.invalidToken')}
          </h2>
          <p className="text-neutral-600 mb-6">
            {t('auth.tokenExpiredDescription')}
          </p>
          <div className="space-y-3">
            <Link
              to="/forgot-password"
              className="block w-full btn btn-primary"
            >
              {t('auth.requestNewLink')}
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('auth.backToLogin')}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="card p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            {t('auth.passwordResetSuccess')}
          </h2>
          <p className="text-neutral-600 mb-6">
            {t('auth.passwordResetSuccessDescription')}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full btn btn-primary btn-lg mt-2"
          >
            {t('auth.goToLogin')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="card p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center"
        >
          <img
            src="/logo_ris.png"
            alt="RISYS"
            className="h-16 w-auto mb-3"
          />
          <h2 className="text-xl font-semibold text-neutral-900 mb-1">
            {t('auth.resetPasswordTitle')}
          </h2>
          {userInfo && (
            <p className="text-neutral-500 text-sm">
              {t('auth.resettingPasswordFor')} <span className="font-medium">{userInfo.displayName}</span>
            </p>
          )}
        </motion.div>
      </div>

      {/* Form */}
      <motion.form
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        {/* New Password */}
        <div>
          <label className="label">{t('auth.newPassword')}</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('newPassword', {
                required: 'Nova senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'Senha deve ter no mínimo 6 caracteres',
                },
              })}
              className={`input pl-11 pr-11 ${errors.newPassword ? 'input-error' : ''}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-error-500 text-sm mt-1">{errors.newPassword.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="label">{t('auth.confirmPassword')}</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword', {
                required: 'Confirmação de senha é obrigatória',
                validate: (value) =>
                  value === newPassword || 'As senhas não coincidem',
              })}
              className={`input pl-11 pr-11 ${errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-error-500 text-sm mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn btn-primary btn-lg"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t('auth.resetPassword')
          )}
        </button>

        {/* Back to Login */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('auth.backToLogin')}
          </Link>
        </div>
      </motion.form>
    </div>
  );
}
