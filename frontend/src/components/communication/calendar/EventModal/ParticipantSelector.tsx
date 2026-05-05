import type { RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Search, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { UserOption } from "./types";

interface SearchableUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
}

interface ParticipantSelectorProps {
  participants: UserOption[];
  filteredUsers: SearchableUser[];
  toggleParticipant: (user: UserOption) => void;
  removeParticipant: (userId: string) => void;
  userSearch: string;
  setUserSearch: (value: string) => void;
  showUserDropdown: boolean;
  setShowUserDropdown: (value: boolean) => void;
  dropdownRef: RefObject<HTMLDivElement>;
}

export function ParticipantSelector({
  participants,
  filteredUsers,
  toggleParticipant,
  removeParticipant,
  userSearch,
  setUserSearch,
  showUserDropdown,
  setShowUserDropdown,
  dropdownRef,
}: ParticipantSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        Participantes
      </label>

      {participants.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 bg-neutral-100 rounded-full pl-1 pr-2 py-1"
            >
              <Avatar src={p.avatarUrl} name={p.displayName} size="xs" />
              <span className="text-xs font-medium text-neutral-700">
                {p.displayName}
              </span>
              <button
                type="button"
                onClick={() => removeParticipant(p.id)}
                className="text-neutral-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={userSearch}
            onChange={(e) => {
              setUserSearch(e.target.value);
              setShowUserDropdown(true);
            }}
            onFocus={() => setShowUserDropdown(true)}
            placeholder="Buscar usuários..."
            className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
          />
        </div>

        <AnimatePresence>
          {showUserDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-20"
            >
              <div className="max-h-48 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const isSelected = participants.some((p) => p.id === u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() =>
                          toggleParticipant({
                            id: u.id,
                            displayName: u.displayName,
                            email: u.email,
                            avatarUrl: u.avatarUrl,
                          })
                        }
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 transition-colors text-left"
                      >
                        <Avatar src={u.avatarUrl} name={u.displayName} size="xs" />
                        <div className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-neutral-800 truncate">
                            {u.displayName}
                          </span>
                          <span className="block text-xs text-neutral-400 truncate">
                            {u.email}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-4 text-sm text-neutral-400 text-center">
                    {userSearch ? "Nenhum usuário encontrado" : "Nenhum usuário"}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
