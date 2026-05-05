import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Plus, Search, X, Menu, ChevronDown } from 'lucide-react';
import { useChannels, useDirectMessages, useCreateChannel, useCreateDirectMessage } from '@/hooks/useChannels';
import { useUserSearch, useAllUsers } from '@/hooks/useUserSearch';
import { useCommunicationStore } from '@/stores/communicationStore';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import type { Channel } from '@/types/communication';

export default function ChannelSidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showDmModal, setShowDmModal] = useState(false);
  const [dmSearch, setDmSearch] = useState('');

  const { data: channels = [], isLoading: loadingChannels } = useChannels();
  const { data: dms = [], isLoading: loadingDMs } = useDirectMessages();
  const { activeChannelId, setActiveChannelId, onlineUsers } = useCommunicationStore();
  const createChannel = useCreateChannel();
  const createDm = useCreateDirectMessage();
  const { data: allUsers = [], isLoading: loadingAllUsers } = useAllUsers();
  const { data: searchedUsers = [], isLoading: loadingSearchUsers } = useUserSearch(dmSearch);

  const dmUsers = dmSearch.length >= 1 ? searchedUsers : allUsers;
  const loadingDmUsers = dmSearch.length >= 1 ? loadingSearchUsers : loadingAllUsers;

  const filteredChannels = channels.filter(
    (c: Channel) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const publicChannels = filteredChannels.filter((c: Channel) => c.type !== 'DIRECT');
  const filteredDMs = dms.filter((dm: any) =>
    dm.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dm.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateChannel = () => {
    if (!newChannelName.trim()) return;
    createChannel.mutate(
      { name: newChannelName.trim(), type: newChannelType },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          setNewChannelName('');
          setNewChannelType('PUBLIC');
        },
      }
    );
  };

  const handleSelectChannel = (id: string) => {
    setActiveChannelId(id);
    setMobileOpen(false);
  };

  const handleCreateDm = (userId: string) => {
    createDm.mutate(userId, {
      onSuccess: (response: any) => {
        const channelId = response?.data?.id;
        if (channelId) setActiveChannelId(channelId);
        setShowDmModal(false);
        setDmSearch('');
        setMobileOpen(false);
      },
    });
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-neutral-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar canais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Channels list */}
      <div className="flex-1 overflow-y-auto">
        {/* Channels Section */}
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Canais
            </span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1 hover:bg-neutral-100 rounded transition-colors"
              title="Novo canal"
            >
              <Plus className="w-4 h-4 text-neutral-500" />
            </button>
          </div>

          {loadingChannels ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-0.5">
              {publicChannels.map((channel: Channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleSelectChannel(channel.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeChannelId === channel.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <Hash className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  <span className="flex-1 truncate text-sm font-medium">
                    {channel.name}
                  </span>
                  {channel.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {channel.unreadCount}
                    </span>
                  )}
                </button>
              ))}
              {publicChannels.length === 0 && !loadingChannels && (
                <p className="text-center py-3 text-neutral-400 text-sm">
                  Nenhum canal encontrado
                </p>
              )}
            </div>
          )}
        </div>

        {/* DMs Section */}
        <div className="px-3 py-2 mt-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Mensagens Diretas
            </span>
            <button
              onClick={() => setShowDmModal(true)}
              className="p-1 hover:bg-neutral-100 rounded transition-colors"
              title="Nova mensagem direta"
            >
              <Plus className="w-4 h-4 text-neutral-500" />
            </button>
          </div>

          {loadingDMs ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : filteredDMs.length === 0 ? (
            <p className="text-center py-4 text-neutral-400 text-sm">
              Nenhuma conversa
            </p>
          ) : (
            <div className="space-y-0.5">
              {filteredDMs.map((dm: any) => {
                const isOnline = onlineUsers.has(dm.userId || dm.id);
                return (
                  <button
                    key={dm.id}
                    onClick={() => handleSelectChannel(dm.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeChannelId === dm.id
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar
                        src={dm.avatarUrl}
                        name={dm.displayName || dm.name || 'U'}
                        size="xs"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          isOnline ? 'bg-green-500' : 'bg-neutral-300'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {dm.user?.displayName || dm.displayName || dm.name}
                      </span>
                      {dm.lastMessage && (
                        <span className="block truncate text-xs text-neutral-400">
                          {dm.lastMessage.content?.slice(0, 30)}
                        </span>
                      )}
                    </div>
                    {dm.unreadCount > 0 && (
                      <span className="w-5 h-5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {dm.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Channel Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">
                  Novo Canal
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Nome do canal
                  </label>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="ex: geral, projetos, marketing"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Tipo
                  </label>
                  <div className="relative">
                    <select
                      value={newChannelType}
                      onChange={(e) => setNewChannelType(e.target.value as 'PUBLIC' | 'PRIVATE')}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                    >
                      <option value="PUBLIC">Publico</option>
                      <option value="PRIVATE">Privado</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateChannel}
                    disabled={!newChannelName.trim() || createChannel.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createChannel.isPending ? 'Criando...' : 'Criar Canal'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-md border border-neutral-200"
      >
        <Menu className="w-5 h-5 text-neutral-600" />
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-72 xl:w-80 border-r border-neutral-200 bg-white flex-col h-full">
        {sidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-white z-50 shadow-xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
                <span className="font-semibold text-neutral-900">Canais</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 hover:bg-neutral-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create DM Modal — outside sidebarContent to avoid overflow clipping */}
      <AnimatePresence>
        {showDmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => { setShowDmModal(false); setDmSearch(''); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">Nova Mensagem Direta</h3>
                <button onClick={() => { setShowDmModal(false); setDmSearch(''); }} className="p-1 hover:bg-neutral-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={dmSearch}
                    onChange={(e) => setDmSearch(e.target.value)}
                    placeholder="Buscar por nome ou email..."
                    className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                    autoFocus
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-0.5">
                  {loadingDmUsers ? (
                    <div className="flex justify-center py-6"><LoadingSpinner size="sm" /></div>
                  ) : dmUsers.length === 0 ? (
                    <p className="text-center py-6 text-neutral-400 text-sm">
                      Nenhum usuario encontrado
                    </p>
                  ) : (
                    dmUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleCreateDm(user.id)}
                        disabled={createDm.isPending}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-neutral-50 transition-colors disabled:opacity-50"
                      >
                        <Avatar src={user.avatarUrl} name={user.displayName} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">{user.displayName}</p>
                          <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                        </div>
                        <span className="text-xs text-neutral-400 capitalize">{user.role?.toLowerCase()}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
