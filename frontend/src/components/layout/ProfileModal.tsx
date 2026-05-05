import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { useAuthStore, User } from '@/stores/authStore';
import { useLanguageStore } from '@/stores/languageStore';
import { patch, api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateUser } = useAuthStore();
  const { t } = useLanguageStore();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [fullName, setFullName] = useState(user?.fullName || '');

  const updateProfileMutation = useMutation({
    mutationFn: (data: { displayName: string; fullName: string }) =>
      patch<User>('/users/profile', data),
    onSuccess: (response) => {
      if (response.data) {
        updateUser(response.data);
      }
      toast.success('Perfil atualizado!');
      onClose();
    },
    onError: () => {
      toast.error('Erro ao atualizar perfil');
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await api.patch('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (response) => {
      updateUser(response.data);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Avatar atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar avatar');
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (files) => {
      if (files[0]) {
        uploadAvatarMutation.mutate(files[0]);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ displayName, fullName });
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-xl shadow-large w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                <h2 className="text-lg font-semibold text-neutral-900">
                  {t('nav.profile')}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Avatar Upload */}
                <div className="flex justify-center">
                  <div
                    {...getRootProps()}
                    className={`relative cursor-pointer group ${
                      isDragActive ? 'scale-105' : ''
                    } transition-transform`}
                  >
                    <input {...getInputProps()} />
                    <Avatar
                      src={user.avatarUrl}
                      name={user.displayName}
                      size="xl"
                      className="ring-4 ring-neutral-100"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploadAvatarMutation.isPending ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="label">Nome de Exibição</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="label">Nome Completo</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                {/* Read-only fields */}
                <div className="space-y-4 pt-4 border-t border-neutral-100">
                  <div>
                    <label className="label text-neutral-500">Email</label>
                    <p className="text-sm text-neutral-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="label text-neutral-500">Cargo</label>
                    <p className="text-sm text-neutral-900">{user.role}</p>
                  </div>
                  {user.area && (
                    <div>
                      <label className="label text-neutral-500">Área</label>
                      <p className="text-sm text-neutral-900">{user.area}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 btn btn-secondary btn-md"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex-1 btn btn-primary btn-md"
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t('common.save')
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
