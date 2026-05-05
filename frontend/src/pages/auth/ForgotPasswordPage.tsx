import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { useLanguageStore } from '@/stores/languageStore';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const { t } = useLanguageStore();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsLoading(true);
      await api.post('/auth/forgot-password', { email: data.email });
      setEmailSent(true);
      toast.success('Instruções enviadas para seu email!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
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
            {t('auth.emailSent')}
          </h2>
          <p className="text-neutral-600 mb-6">
            {t('auth.checkEmailInstructions')}
            <br />
            <span className="font-medium text-neutral-900">{getValues('email')}</span>
          </p>
          <p className="text-sm text-neutral-500 mb-6">
            {t('auth.emailNotReceived')}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('auth.backToLogin')}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="card p-8">
      {/* Logo */}
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
            {t('auth.forgotPasswordTitle')}
          </h2>
          <p className="text-neutral-500 text-sm">
            {t('auth.forgotPasswordDescription')}
          </p>
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
        {/* Email */}
        <div>
          <label className="label">{t('auth.email')}</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="email"
              {...register('email', {
                required: 'Email é obrigatório',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido',
                },
              })}
              className={`input pl-11 ${errors.email ? 'input-error' : ''}`}
              placeholder="seu@email.com"
            />
          </div>
          {errors.email && (
            <p className="text-error-500 text-sm mt-1">{errors.email.message}</p>
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
            t('auth.sendResetLink')
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
