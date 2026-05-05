import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  CheckCircle,
  Copy,
  Loader2,
  X,
  Edit2,
  Key,
  Trash2,
  AlertTriangle,
  Filter,
  Archive,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { get, post, patch, del, getErrorMessage } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import type { User, StatusFilter } from './types';
import { statusFilters, roleLabels } from './constants';

export default function UsersTab({ onSwitchToInvites }: { onSwitchToInvites: () => void }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [createdUserPassword, setCreatedUserPassword] = useState<{ email: string; password: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['users', { status: statusFilter, search: searchQuery }],
    queryFn: () => get<User[]>('/users', {
      params: {
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchQuery || undefined,
      },
    }),
  });
  const users = usersData?.data || [];

  const { register: registerCreate, handleSubmit: handleSubmitCreate, reset: resetCreate } = useForm<{
    email: string; displayName: string; fullName: string; role: string; area?: string; password?: string; sendWelcomeEmail: boolean;
  }>({ defaultValues: { sendWelcomeEmail: true } });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue, watch: watchEdit } = useForm<{
    displayName: string; fullName: string; role: string; area?: string; status: string; emailNotificationsEnabled: boolean;
  }>();

  const createUserMutation = useMutation({
    mutationFn: (data: any) => post<{ data: User; temporaryPassword?: string }>('/users', data),
    onSuccess: (response: any) => {
      toast.success('Usuário criado com sucesso!');
      setShowCreateUserModal(false);
      resetCreate();
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (response.temporaryPassword) {
        setCreatedUserPassword({ email: response.data.email, password: response.temporaryPassword });
        setShowPasswordModal(true);
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => patch(`/users/${id}`, data),
    onSuccess: () => {
      toast.success('Usuário atualizado com sucesso!');
      setShowEditUserModal(false);
      setSelectedUser(null);
      resetEdit();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => patch(`/users/${userId}`, { status: 'ACTIVE' }),
    onSuccess: () => { toast.success('Usuário aprovado!'); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const archiveMutation = useMutation({
    mutationFn: (userId: string) => patch(`/users/${userId}`, { status: 'ARCHIVED' }),
    onSuccess: () => { toast.success('Usuário arquivado!'); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => del(`/users/${userId}/permanent`),
    onSuccess: () => {
      toast.success('Usuário excluído permanentemente com sucesso!');
      setShowDeleteModal(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || getErrorMessage(error);
      const errorCode = error?.response?.data?.code;
      if (errorCode === 'HAS_RELATED_DATA') { toast.error(errorMessage, { duration: 5000 }); } else { toast.error(errorMessage); }
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => post(`/users/${userId}/reset-password`, {}),
    onSuccess: () => toast.success('Senha resetada com sucesso! O usuário receberá um email com as novas credenciais.'),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setValue('displayName', user.displayName);
    setValue('fullName', user.fullName);
    setValue('role', user.role);
    setValue('area', user.area || '');
    setValue('status', user.status);
    setValue('emailNotificationsEnabled', user.emailNotificationsEnabled ?? false);
    setShowEditUserModal(true);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      ACTIVE: <span className="badge badge-success">Ativo</span>,
      PENDING: <span className="badge badge-warning">Pendente</span>,
      ARCHIVED: <span className="badge badge-neutral">Arquivado</span>,
      INACTIVE: <span className="badge badge-neutral">Inativo</span>,
    };
    return badges[status as keyof typeof badges] || <span className="badge">{status}</span>;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 lg:p-6 border-b border-neutral-200 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2">
            <button onClick={() => setShowCreateUserModal(true)} className="btn btn-primary btn-md">
              <Plus className="w-4 h-4" /> Criar Usuário
            </button>
            <button onClick={onSwitchToInvites} className="btn btn-secondary btn-md">
              <Plus className="w-4 h-4" /> Convidar Usuário
            </button>
          </div>
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input type="text" placeholder="Buscar usuários..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm w-full sm:w-64" />
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          <Filter className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          {statusFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = statusFilter === filter.id;
            return (
              <button key={filter.id} onClick={() => setStatusFilter(filter.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-primary-100 text-primary-700 border border-primary-200' : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200'}`}>
                <Icon className="w-3.5 h-3.5" /> {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {loadingUsers ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-neutral-700">Nenhum usuário</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user, index) => (
              <motion.div key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="card p-4 hover:shadow-medium transition-shadow">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar src={user.avatarUrl} name={user.displayName} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-neutral-900 truncate">{user.displayName}</h4>
                        {getStatusBadge(user.status)}
                      </div>
                      <p className="text-sm text-neutral-500 truncate">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge badge-primary">{roleLabels[user.role] || user.role}</span>
                        {user.area && <span className="text-xs text-neutral-400 truncate">{user.area}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {user.status === 'PENDING' && (
                      <>
                        <button onClick={() => approveMutation.mutate(user.id)} className="p-2 hover:bg-success-50 rounded-lg text-success-600 transition-colors" title="Aprovar usuário" disabled={approveMutation.isPending}><CheckCircle className="w-5 h-5" /></button>
                        <button onClick={() => archiveMutation.mutate(user.id)} className="p-2 hover:bg-warning-50 rounded-lg text-warning-600 transition-colors" title="Arquivar" disabled={archiveMutation.isPending}><Archive className="w-5 h-5" /></button>
                        <button onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }} className="p-2 hover:bg-error-50 rounded-lg text-error-600 transition-colors" title="Excluir permanentemente"><Trash2 className="w-5 h-5" /></button>
                      </>
                    )}
                    {user.status === 'ACTIVE' && (
                      <>
                        <button onClick={() => handleEditUser(user)} className="p-2 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors" title="Editar usuário"><Edit2 className="w-5 h-5" /></button>
                        <button onClick={() => archiveMutation.mutate(user.id)} className="p-2 hover:bg-warning-50 rounded-lg text-warning-600 transition-colors" title="Arquivar" disabled={archiveMutation.isPending}><Archive className="w-5 h-5" /></button>
                        <button onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }} className="p-2 hover:bg-error-50 rounded-lg text-error-600 transition-colors" title="Excluir permanentemente"><Trash2 className="w-5 h-5" /></button>
                      </>
                    )}
                    {user.status === 'ARCHIVED' && (
                      <>
                        <button onClick={() => approveMutation.mutate(user.id)} className="p-2 hover:bg-success-50 rounded-lg text-success-600 transition-colors" title="Reativar" disabled={approveMutation.isPending}><CheckCircle className="w-5 h-5" /></button>
                        <button onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }} className="p-2 hover:bg-error-50 rounded-lg text-error-600 transition-colors" title="Excluir permanentemente"><Trash2 className="w-5 h-5" /></button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateUserModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => { setShowCreateUserModal(false); resetCreate(); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-large w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 sticky top-0 bg-white z-10">
                  <h2 className="text-lg font-semibold">Criar Novo Usuário</h2>
                  <button onClick={() => { setShowCreateUserModal(false); resetCreate(); }} className="p-2 hover:bg-neutral-100 rounded-lg"><X className="w-5 h-5 text-neutral-500" /></button>
                </div>
                <form onSubmit={handleSubmitCreate((data) => createUserMutation.mutate(data))} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="label">Email *</label><input {...registerCreate('email', { required: true })} type="email" className="input" placeholder="email@exemplo.com" /></div>
                    <div><label className="label">Nome de Exibição *</label><input {...registerCreate('displayName', { required: true })} className="input" placeholder="Nome que aparece no sistema" /></div>
                  </div>
                  <div><label className="label">Nome Completo *</label><input {...registerCreate('fullName', { required: true })} className="input" placeholder="Nome completo do usuário" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Cargo/Função *</label>
                      <select {...registerCreate('role', { required: true })} className="input">
                        <option value="">Selecione...</option>
                        <option value="ADMIN">Administrador</option><option value="MANAGER">Gestor</option><option value="STAFF">Funcionário</option><option value="TEACHER">Professor</option><option value="IT">TI</option><option value="FINANCE">Financeiro</option><option value="ADMISSIONS">Admissões</option><option value="PSYCHOLOGY">Psicologia</option><option value="HEALTH">Saúde</option><option value="LEGAL">Jurídico</option><option value="DIRECTOR">Diretoria</option>
                      </select>
                    </div>
                    <div><label className="label">Área/Departamento</label><input {...registerCreate('area')} className="input" placeholder="Ex: Ensino Médio, RH, etc." /></div>
                  </div>
                  <div><label className="label">Senha (opcional)</label><input {...registerCreate('password')} type="password" className="input" placeholder="Deixe em branco para gerar automaticamente" /><p className="text-xs text-neutral-500 mt-1">Se deixar em branco, uma senha segura será gerada automaticamente</p></div>
                  <div className="flex items-center gap-2 p-4 bg-neutral-50 rounded-lg">
                    <input {...registerCreate('sendWelcomeEmail')} type="checkbox" id="sendWelcomeEmail" className="w-4 h-4 text-primary-600 bg-white border-neutral-300 rounded focus:ring-primary-500" />
                    <label htmlFor="sendWelcomeEmail" className="text-sm text-neutral-700 cursor-pointer">Enviar email de boas-vindas com credenciais de acesso</label>
                  </div>
                  <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                    <p className="text-sm text-warning-800"><strong>Atenção:</strong> O usuário será criado com status ATIVO e poderá acessar o sistema imediatamente. Será solicitado que altere a senha no primeiro login.</p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => { setShowCreateUserModal(false); resetCreate(); }} className="flex-1 btn btn-secondary btn-md">Cancelar</button>
                    <button type="submit" disabled={createUserMutation.isPending} className="flex-1 btn btn-primary btn-md">
                      {createUserMutation.isPending ? (<><Loader2 className="w-4 h-4 animate-spin" />Criando...</>) : (<><Plus className="w-4 h-4" />Criar Usuário</>)}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedUser && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-large w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-error-100 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-error-600" /></div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">Excluir Usuário Permanentemente</h3>
                      <p className="text-sm text-neutral-600 mb-3">Tem certeza que deseja excluir permanentemente o usuário <span className="font-semibold text-neutral-900">{selectedUser.displayName}</span> <span className="text-neutral-500">({selectedUser.email})</span>?</p>
                      <div className="p-3 bg-error-50 border border-error-200 rounded-lg mb-3">
                        <p className="text-xs text-error-800 mb-2"><strong>Atenção:</strong> Esta ação é <strong>irreversível</strong> e o usuário será completamente removido do sistema.</p>
                        <p className="text-xs text-error-700">Se você deseja apenas inativar o usuário temporariamente, use a opção <strong>"Arquivar"</strong> ao invés de excluir.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 px-6 pb-6">
                  <button onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }} className="flex-1 btn btn-secondary btn-md" disabled={deleteUserMutation.isPending}>Cancelar</button>
                  <button onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.id)} className="flex-1 btn bg-error-600 hover:bg-error-700 text-white btn-md" disabled={deleteUserMutation.isPending}>
                    {deleteUserMutation.isPending ? (<><Loader2 className="w-4 h-4 animate-spin" />Excluindo...</>) : (<><Trash2 className="w-4 h-4" />Excluir Usuário</>)}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditUserModal && selectedUser && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => { setShowEditUserModal(false); setSelectedUser(null); resetEdit(); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-large w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 sticky top-0 bg-white z-10">
                  <div><h2 className="text-lg font-semibold">Editar Usuário</h2><p className="text-sm text-neutral-500">{selectedUser.email}</p></div>
                  <button onClick={() => { setShowEditUserModal(false); setSelectedUser(null); resetEdit(); }} className="p-2 hover:bg-neutral-100 rounded-lg"><X className="w-5 h-5 text-neutral-500" /></button>
                </div>
                <form onSubmit={handleSubmitEdit((data) => updateUserMutation.mutate({ id: selectedUser.id, data }))} className="p-6 space-y-4">
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar src={selectedUser.avatarUrl} name={selectedUser.displayName} size="lg" />
                      <div><p className="font-medium text-neutral-900">{selectedUser.displayName}</p><p className="text-sm text-neutral-500">{selectedUser.email}</p></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="label">Nome de Exibição *</label><input {...registerEdit('displayName', { required: true })} className="input" placeholder="Nome que aparece no sistema" /></div>
                    <div><label className="label">Nome Completo *</label><input {...registerEdit('fullName', { required: true })} className="input" placeholder="Nome completo do usuário" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Cargo/Função *</label>
                      <select {...registerEdit('role', { required: true })} className="input">
                        <option value="">Selecione...</option>
                        <option value="ADMIN">Administrador</option><option value="MANAGER">Gestor</option><option value="STAFF">Funcionário</option><option value="TEACHER">Professor</option><option value="IT">TI</option><option value="FINANCE">Financeiro</option><option value="ADMISSIONS">Admissões</option><option value="PSYCHOLOGY">Psicologia</option><option value="HEALTH">Saúde</option><option value="LEGAL">Jurídico</option><option value="DIRECTOR">Diretoria</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Status *</label>
                      <select {...registerEdit('status', { required: true })} className="input">
                        <option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option><option value="PENDING">Pendente</option><option value="ARCHIVED">Arquivado</option>
                      </select>
                    </div>
                  </div>
                  <div><label className="label">Área/Departamento</label><input {...registerEdit('area')} className="input" placeholder="Ex: Ensino Médio, RH, etc." /></div>
                  <div className="flex items-center gap-2 p-4 bg-neutral-50 rounded-lg">
                    <input {...registerEdit('emailNotificationsEnabled')} type="checkbox" id="emailNotificationsEnabled" className="w-4 h-4 text-primary-600 bg-white border-neutral-300 rounded focus:ring-primary-500" />
                    <label htmlFor="emailNotificationsEnabled" className="text-sm text-neutral-700 cursor-pointer">Receber notificações por email para aprovações pendentes</label>
                  </div>
                  {(selectedUser.role !== watchEdit('role') || selectedUser.status !== watchEdit('status')) && (
                    <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                      <p className="text-sm text-warning-800"><strong>Atenção:</strong> Você está alterando informações críticas (cargo ou status). Esta alteração pode afetar as permissões e acessos do usuário no sistema.</p>
                    </div>
                  )}
                  <div className="border-t border-neutral-200 pt-4">
                    <p className="text-sm font-medium text-neutral-700 mb-2">Ações Adicionais</p>
                    <button type="button" className="w-full flex items-center justify-between p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={resetPasswordMutation.isPending} onClick={() => { if (confirm('Deseja resetar a senha deste usuário? Uma nova senha temporária será gerada e enviada por email.')) { resetPasswordMutation.mutate(selectedUser.id); } }}>
                      <div className="flex items-center gap-2">
                        {resetPasswordMutation.isPending ? <Loader2 className="w-4 h-4 text-neutral-600 animate-spin" /> : <Key className="w-4 h-4 text-neutral-600" />}
                        <span className="text-sm text-neutral-700">{resetPasswordMutation.isPending ? 'Resetando...' : 'Resetar Senha'}</span>
                      </div>
                      <span className="text-xs text-neutral-500">Enviar nova senha por email</span>
                    </button>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => { setShowEditUserModal(false); setSelectedUser(null); resetEdit(); }} className="flex-1 btn btn-secondary btn-md">Cancelar</button>
                    <button type="submit" disabled={updateUserMutation.isPending} className="flex-1 btn btn-primary btn-md">
                      {updateUserMutation.isPending ? (<><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>) : 'Salvar Alterações'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Temporary Password Modal */}
      <AnimatePresence>
        {showPasswordModal && createdUserPassword && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => { setShowPasswordModal(false); setCreatedUserPassword(null); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-large w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-warning-100 rounded-full flex items-center justify-center"><Key className="w-5 h-5 text-warning-600" /></div>
                    <h2 className="text-lg font-semibold">Senha Temporária Gerada</h2>
                  </div>
                  <button onClick={() => { setShowPasswordModal(false); setCreatedUserPassword(null); }} className="p-2 hover:bg-neutral-100 rounded-lg"><X className="w-5 h-5 text-neutral-500" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                    <p className="text-sm text-warning-800"><strong>Atenção:</strong> Como o email de boas-vindas não foi enviado, você precisa comunicar as credenciais manualmente ao usuário.</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="label">Email</label>
                      <div className="flex items-center gap-2">
                        <input type="text" value={createdUserPassword.email} readOnly className="input flex-1 bg-neutral-50" />
                        <button onClick={() => { navigator.clipboard.writeText(createdUserPassword.email); toast.success('Email copiado!'); }} className="btn btn-secondary btn-md"><Copy className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div>
                      <label className="label">Senha Temporária</label>
                      <div className="flex items-center gap-2">
                        <input type="text" value={createdUserPassword.password} readOnly className="input flex-1 bg-neutral-50 font-mono" />
                        <button onClick={() => { navigator.clipboard.writeText(createdUserPassword.password); toast.success('Senha copiada!'); }} className="btn btn-secondary btn-md"><Copy className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(`Email: ${createdUserPassword.email}\nSenha: ${createdUserPassword.password}`); toast.success('Credenciais copiadas!'); }} className="w-full btn btn-primary btn-md">
                    <Copy className="w-4 h-4" /> Copiar Credenciais
                  </button>
                  <p className="text-xs text-neutral-500 text-center">Esta senha será exibida apenas uma vez. O usuário deverá alterá-la no primeiro login.</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
