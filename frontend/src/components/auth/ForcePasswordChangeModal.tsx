import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { post } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function ForcePasswordChangeModal() {
  const { user, updateUser, checkAuth } = useAuthStore();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ChangePasswordForm>();
  const newPassword = watch('newPassword');

  if (!user?.requirePasswordChange) {
    return null;
  }

  const onSubmit = async (data: ChangePasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsSubmitting(true);
    try {
      await post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      toast.success('Senha alterada com sucesso!');

      // Update user state to remove requirePasswordChange flag
      updateUser({ requirePasswordChange: false });

      // Refresh user data from server
      await checkAuth();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Erro ao alterar senha');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-large w-full max-w-md"
      >
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Lock className="w-6 h-6 text-warning-600" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900">Alteração de Senha Obrigatória</h2>
          </div>
          <p className="text-sm text-neutral-600">
            Por segurança, você precisa alterar sua senha temporária antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-primary-800">
              <p className="font-medium mb-1">Requisitos para a nova senha:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Mínimo de 6 caracteres</li>
                <li>Diferente da senha atual</li>
              </ul>
            </div>
          </div>

          <div>
            <label className="label">Senha Atual *</label>
            <div className="relative">
              <input
                {...register('currentPassword', { required: 'Senha atual obrigatória' })}
                type={showCurrentPassword ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Digite sua senha atual"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-error-600 mt-1">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="label">Nova Senha *</label>
            <div className="relative">
              <input
                {...register('newPassword', {
                  required: 'Nova senha obrigatória',
                  minLength: { value: 6, message: 'Senha deve ter no mínimo 6 caracteres' },
                })}
                type={showNewPassword ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Digite sua nova senha"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-error-600 mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="label">Confirmar Nova Senha *</label>
            <div className="relative">
              <input
                {...register('confirmPassword', {
                  required: 'Confirme sua nova senha',
                  validate: (value) => value === newPassword || 'As senhas não coincidem',
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Digite sua nova senha novamente"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-error-600 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn btn-primary btn-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Alterando senha...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Alterar Senha
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-center text-neutral-500">
            Esta ação é necessária para garantir a segurança da sua conta.
          </p>
        </form>
      </motion.div>
    </div>
  );
}
