import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  CheckCircle,
  Loader2,
  X,
  Edit2,
  Trash2,
  AlertTriangle,
  Filter,
  Mail,
  MailX,
  RefreshCw,
  Send,
  Clock,
  Copy,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { get, post, patch, del, getErrorMessage } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import type { Invite, InviteStatusFilter } from './types';
import { inviteStatusFilters, roleLabels } from './constants';

export default function InvitesTab() {
  const queryClient = useQueryClient();
  const [inviteStatusFilter, setInviteStatusFilter] = useState<InviteStatusFilter>('PENDING');
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null);
  const [showEditInviteModal, setShowEditInviteModal] = useState(false);
  const [showDeleteInviteModal, setShowDeleteInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const { data: invitesData, isLoading: loadingInvites } = useQuery({
    queryKey: ['invites', { status: inviteStatusFilter, search: inviteSearchQuery }],
    queryFn: () => get<Invite[]>('/invites', {
      params: {
        status: inviteStatusFilter !== 'ALL' ? inviteStatusFilter : undefined,
        search: inviteSearchQuery || undefined,
      },
    }),
  });

  const invites = invitesData?.data || [];

  const { register, handleSubmit, reset } = useForm<{ email: string; name?: string; role: string }>({
    defaultValues: { role: 'STAFF' },
  });

  const { register: registerEditInvite, handleSubmit: handleSubmitEditInvite, reset: resetEditInvite, setValue: setValueEditInvite } = useForm<{
    name?: string;
    role: string;
  }>();

  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; name?: string; role: string }) => post('/auth/invite', data),
    onSuccess: (response: any) => {
      setInviteLink(response.data.inviteLink);
      toast.success('Convite gerado!');
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const updateInviteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; role?: string } }) => patch(`/invites/${id}`, data),
    onSuccess: () => {
      toast.success('Convite atualizado!');
      setShowEditInviteModal(false);
      setSelectedInvite(null);
      resetEditInvite();
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteInviteMutation = useMutation({
    mutationFn: (id: string) => del(`/invites/${id}`),
    onSuccess: () => {
      toast.success('Convite excluído!');
      setShowDeleteInviteModal(false);
      setSelectedInvite(null);
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const resendInviteMutation = useMutation({
    mutationFn: (id: string) => post(`/invites/${id}/resend`, {}),
    onSuccess: () => {
      toast.success('Convite reenviado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copiado!');
  };

  const getInviteStatusBadge = (status: string) => {
    const badges = {
      PENDING: <span className="badge badge-warning">Pendente</span>,
      USED: <span className="badge badge-success">Utilizado</span>,
      EXPIRED: <span className="badge badge-error">Expirado</span>,
    };
    return badges[status as keyof typeof badges] || <span className="badge">{status}</span>;
  };

  const handleEditInvite = (invite: Invite) => {
    setSelectedInvite(invite);
    setValueEditInvite('name', invite.name || '');
    setValueEditInvite('role', invite.role);
    setShowEditInviteModal(true);
  };

  const handleDeleteInvite = (invite: Invite) => {
    setSelectedInvite(invite);
    setShowDeleteInviteModal(true);
  };

  const handleResendInvite = (invite: Invite) => {
    if (confirm(`Deseja reenviar o convite para ${invite.email}?`)) {
      resendInviteMutation.mutate(invite.id);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 lg:p-6 border-b border-neutral-200 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2">
            <button onClick={() => setShowInviteModal(true)} className="btn btn-primary btn-md">
              <Plus className="w-4 h-4" />
              Novo Convite
            </button>
          </div>
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar convites..."
              value={inviteSearchQuery}
              onChange={(e) => setInviteSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm w-full sm:w-64"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          <Filter className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          {inviteStatusFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = inviteStatusFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setInviteStatusFilter(filter.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {loadingInvites ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-neutral-700">Nenhum convite encontrado</p>
            <p className="text-sm text-neutral-500 mt-1">Clique em "Novo Convite" para enviar um convite</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invites.map((invite, index) => (
              <motion.div
                key={invite.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="card p-4 hover:shadow-medium transition-shadow"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      invite.status === 'PENDING' ? 'bg-warning-100' :
                      invite.status === 'USED' ? 'bg-success-100' : 'bg-error-100'
                    }`}>
                      <Mail className={`w-5 h-5 ${
                        invite.status === 'PENDING' ? 'text-warning-600' :
                        invite.status === 'USED' ? 'text-success-600' : 'text-error-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-neutral-900 truncate">{invite.email}</h4>
                        {getInviteStatusBadge(invite.status)}
                      </div>
                      {invite.name && (
                        <p className="text-sm text-neutral-500 truncate">{invite.name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="badge badge-primary">{roleLabels[invite.role] || invite.role}</span>
                        <span className="text-xs text-neutral-400">
                          Enviado por {invite.inviter?.displayName || 'Admin'}
                        </span>
                        <span className="text-xs text-neutral-400">&bull;</span>
                        <span className="text-xs text-neutral-400">
                          {invite.status === 'EXPIRED' ? 'Expirou' : 'Expira'} {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {invite.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleEditInvite(invite)} className="p-2 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors" title="Editar convite">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleResendInvite(invite)} className="p-2 hover:bg-success-50 rounded-lg text-success-600 transition-colors" title="Reenviar convite" disabled={resendInviteMutation.isPending}>
                          <Send className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDeleteInvite(invite)} className="p-2 hover:bg-error-50 rounded-lg text-error-600 transition-colors" title="Excluir convite">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {invite.status === 'EXPIRED' && (
                      <>
                        <button onClick={() => handleResendInvite(invite)} className="p-2 hover:bg-success-50 rounded-lg text-success-600 transition-colors" title="Reenviar convite" disabled={resendInviteMutation.isPending}>
                          <RefreshCw className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDeleteInvite(invite)} className="p-2 hover:bg-error-50 rounded-lg text-error-600 transition-colors" title="Excluir convite">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {invite.status === 'USED' && (
                      <span className="text-xs text-neutral-400">
                        Usado {invite.usedAt && formatDistanceToNow(new Date(invite.usedAt), { addSuffix: true, locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => { setShowInviteModal(false); setInviteLink(''); reset(); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-large w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                  <h2 className="text-lg font-semibold">Novo Convite</h2>
                  <button onClick={() => { setShowInviteModal(false); setInviteLink(''); reset(); }} className="p-2 hover:bg-neutral-100 rounded-lg">
                    <X className="w-5 h-5 text-neutral-500" />
                  </button>
                </div>
                <form onSubmit={handleSubmit((data) => inviteMutation.mutate(data))} className="p-6 space-y-4">
                  <div>
                    <label className="label">Email *</label>
                    <input {...register('email', { required: true })} type="email" className="input" placeholder="email@exemplo.com" />
                  </div>
                  <div>
                    <label className="label">Nome (opcional)</label>
                    <input {...register('name')} className="input" placeholder="Nome do usuário" />
                  </div>
                  <div>
                    <label className="label">Cargo/Função *</label>
                    <select {...register('role', { required: true })} className="input">
                      <option value="STAFF">Funcionário</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="MANAGER">Gestor</option>
                      <option value="COORDINATOR">Coordenador</option>
                      <option value="TEACHER">Professor</option>
                      <option value="SECRETARY">Secretaria</option>
                      <option value="IT">TI</option>
                      <option value="MAINTENANCE">Manutenção</option>
                      <option value="CLEANING">Limpeza</option>
                      <option value="PURCHASING">Compras</option>
                      <option value="FINANCE">Financeiro</option>
                      <option value="ADMISSIONS">Admissões</option>
                      <option value="PSYCHOLOGY">Psicologia</option>
                      <option value="HEALTH">Saúde</option>
                      <option value="LEGAL">Jurídico</option>
                      <option value="DIRECTOR">Diretoria</option>
                    </select>
                  </div>
                  {inviteLink && (
                    <div className="p-4 bg-success-50 rounded-lg">
                      <p className="text-sm font-medium text-success-700 mb-2">Convite enviado com sucesso!</p>
                      <p className="text-xs text-success-600 mb-2">Um email foi enviado para o destinatário com o link de registro.</p>
                      <div className="flex gap-2">
                        <input type="text" value={inviteLink} readOnly className="input text-xs flex-1" />
                        <button type="button" onClick={() => copyToClipboard(inviteLink)} className="btn btn-secondary btn-sm">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  <button type="submit" disabled={inviteMutation.isPending} className="w-full btn btn-primary btn-md">
                    {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Convite'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Invite Modal */}
      <AnimatePresence>
        {showEditInviteModal && selectedInvite && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => { setShowEditInviteModal(false); setSelectedInvite(null); resetEditInvite(); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-large w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                  <div>
                    <h2 className="text-lg font-semibold">Editar Convite</h2>
                    <p className="text-sm text-neutral-500">{selectedInvite.email}</p>
                  </div>
                  <button onClick={() => { setShowEditInviteModal(false); setSelectedInvite(null); resetEditInvite(); }} className="p-2 hover:bg-neutral-100 rounded-lg">
                    <X className="w-5 h-5 text-neutral-500" />
                  </button>
                </div>
                <form onSubmit={handleSubmitEditInvite((data) => updateInviteMutation.mutate({ id: selectedInvite.id, data }))} className="p-6 space-y-4">
                  <div>
                    <label className="label">Nome (opcional)</label>
                    <input {...registerEditInvite('name')} className="input" placeholder="Nome do usuário" />
                  </div>
                  <div>
                    <label className="label">Cargo/Função *</label>
                    <select {...registerEditInvite('role', { required: true })} className="input">
                      <option value="STAFF">Funcionário</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="MANAGER">Gestor</option>
                      <option value="COORDINATOR">Coordenador</option>
                      <option value="TEACHER">Professor</option>
                      <option value="SECRETARY">Secretaria</option>
                      <option value="IT">TI</option>
                      <option value="MAINTENANCE">Manutenção</option>
                      <option value="CLEANING">Limpeza</option>
                      <option value="PURCHASING">Compras</option>
                      <option value="FINANCE">Financeiro</option>
                      <option value="ADMISSIONS">Admissões</option>
                      <option value="PSYCHOLOGY">Psicologia</option>
                      <option value="HEALTH">Saúde</option>
                      <option value="LEGAL">Jurídico</option>
                      <option value="DIRECTOR">Diretoria</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => { setShowEditInviteModal(false); setSelectedInvite(null); resetEditInvite(); }} className="flex-1 btn btn-secondary btn-md">Cancelar</button>
                    <button type="submit" disabled={updateInviteMutation.isPending} className="flex-1 btn btn-primary btn-md">
                      {updateInviteMutation.isPending ? (<><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>) : 'Salvar'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Invite Confirmation Modal */}
      <AnimatePresence>
        {showDeleteInviteModal && selectedInvite && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => { setShowDeleteInviteModal(false); setSelectedInvite(null); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-large w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-error-100 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-error-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">Excluir Convite</h3>
                      <p className="text-sm text-neutral-600 mb-3">
                        Tem certeza que deseja excluir o convite para{' '}
                        <span className="font-semibold text-neutral-900">{selectedInvite.email}</span>?
                      </p>
                      <p className="text-xs text-neutral-500">
                        O usuário não poderá mais usar este link de convite para se registrar.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 px-6 pb-6">
                  <button onClick={() => { setShowDeleteInviteModal(false); setSelectedInvite(null); }} className="flex-1 btn btn-secondary btn-md" disabled={deleteInviteMutation.isPending}>Cancelar</button>
                  <button onClick={() => deleteInviteMutation.mutate(selectedInvite.id)} className="flex-1 btn bg-error-600 hover:bg-error-700 text-white btn-md" disabled={deleteInviteMutation.isPending}>
                    {deleteInviteMutation.isPending ? (<><Loader2 className="w-4 h-4 animate-spin" />Excluindo...</>) : (<><Trash2 className="w-4 h-4" />Excluir</>)}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
