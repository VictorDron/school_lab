import { useEffect, useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, UserCheck, Search, ChevronDown, UserX } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { useAssignAsset } from '@/hooks/useAssets';
import type { Asset } from '@/types/assets';

interface AssignResponsibleModalProps {
  asset: Asset;
  onClose: () => void;
}

interface UserOption {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
}

export function AssignResponsibleModal({ asset, onClose }: AssignResponsibleModalProps) {
  const assignMutation = useAssignAsset();

  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    asset.responsibleId || null
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () =>
      get<UserOption[]>('/users', { params: { search, limit: 20 } }),
  });

  const users = usersData?.data || [];

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    const fromList = users.find((u) => u.id === selectedUserId);
    if (fromList) return fromList;
    // Fallback to the current responsible info from the asset
    if (asset.responsible && asset.responsible.id === selectedUserId) {
      return asset.responsible as UserOption;
    }
    return null;
  }, [selectedUserId, users, asset.responsible]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  const handleAssign = () => {
    assignMutation.mutate(
      { id: asset.id, userId: selectedUserId },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="bg-white rounded-xl shadow-large w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Atribuir Responsável</h2>
                <p className="text-sm text-white/70 truncate max-w-[280px]">{asset.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {/* Current Responsible */}
            {asset.responsible && (
              <div>
                <label className="label">Responsável Atual</label>
                <div className="flex items-center gap-3 px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg">
                  {asset.responsible.avatarUrl ? (
                    <img
                      src={asset.responsible.avatarUrl}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-semibold">
                      {asset.responsible.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">
                      {asset.responsible.displayName}
                    </p>
                    {asset.responsible.email && (
                      <p className="text-xs text-neutral-500 truncate">{asset.responsible.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* User Search/Select */}
            <div>
              <label className="label">Novo Responsável</label>
              <div ref={dropdownRef} className="relative">
                <div
                  onClick={() => {
                    setDropdownOpen(true);
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer transition-colors ${
                    dropdownOpen
                      ? 'border-primary-400 ring-2 ring-primary-200'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  {dropdownOpen ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar por nome ou email..."
                      className="flex-1 outline-none bg-transparent text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setDropdownOpen(false);
                      }}
                    />
                  ) : (
                    <span
                      className={`flex-1 truncate ${
                        selectedUser ? 'text-neutral-900' : 'text-neutral-400'
                      }`}
                    >
                      {selectedUser ? selectedUser.displayName : 'Buscar usuário...'}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 flex-shrink-0 transition-transform ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {dropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {usersLoading ? (
                      <div className="px-3 py-3 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                      </div>
                    ) : users.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-neutral-400 text-center">
                        Nenhum usuário encontrado
                      </div>
                    ) : (
                      users.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setSearch('');
                            setDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2 ${
                            selectedUserId === user.id
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-neutral-700'
                          }`}
                        >
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {user.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="truncate">{user.displayName}</span>
                          {user.email && (
                            <span className="text-xs text-neutral-400 ml-auto flex-shrink-0">
                              {user.email}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Remove Responsible */}
            {asset.responsibleId && (
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors ${
                  selectedUserId === null
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <UserX className="w-4 h-4" />
                Remover responsável
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-md"
              disabled={assignMutation.isPending}
            >
              Cancelar
            </button>
            <button
              onClick={handleAssign}
              disabled={assignMutation.isPending}
              className="btn btn-primary btn-md"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
