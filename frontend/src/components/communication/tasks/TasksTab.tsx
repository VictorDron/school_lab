import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  LayoutDashboard,
  ChevronDown,
  X,
  Globe,
  Lock,
  Hash,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTaskBoards, useCreateBoard } from "@/hooks/useTaskBoards";
import { useChannels } from "@/hooks/useChannels";
import { getErrorMessage } from "@/lib/api";
import { useCommunicationStore } from "@/stores/communicationStore";
import { LoadingSpinner } from "@/components/ui/LoadingScreen";
import TaskBoard from "./TaskBoard";

export default function TasksTab() {
  const { activeBoardId, setActiveBoardId } = useCommunicationStore();
  const { data: boards = [], isLoading } = useTaskBoards();
  const { data: channels = [] } = useChannels();
  const createBoard = useCreateBoard();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBoardDropdown, setShowBoardDropdown] = useState(false);
  const [newBoard, setNewBoard] = useState({
    name: "",
    description: "",
    visibility: "PUBLIC" as "PUBLIC" | "PRIVATE" | "CHANNEL",
    channelId: "",
  });

  // Auto-select first board
  useEffect(() => {
    if (boards.length > 0 && !activeBoardId) {
      setActiveBoardId(boards[0].id);
    }
  }, [boards, activeBoardId, setActiveBoardId]);

  // Clear active board if it no longer exists
  useEffect(() => {
    if (
      activeBoardId &&
      boards.length > 0 &&
      !boards.find((b) => b.id === activeBoardId)
    ) {
      setActiveBoardId(boards[0].id);
    }
  }, [boards, activeBoardId, setActiveBoardId]);

  const selectedBoard = boards.find((b) => b.id === activeBoardId);

  const handleCreateBoard = async () => {
    if (!newBoard.name.trim()) return;
    if (newBoard.visibility === "CHANNEL" && !newBoard.channelId) {
      toast.error("Selecione um canal para criar um quadro vinculado");
      return;
    }

    try {
      const payload: {
        name: string;
        description?: string;
        visibility?: string;
        channelId?: string;
      } = {
        name: newBoard.name.trim(),
        visibility: newBoard.visibility,
      };
      if (newBoard.description.trim()) {
        payload.description = newBoard.description.trim();
      }
      if (newBoard.visibility === "CHANNEL" && newBoard.channelId) {
        payload.channelId = newBoard.channelId;
      }
      const response = await createBoard.mutateAsync(payload);
      if (response.data?.id) {
        setActiveBoardId(response.data.id);
      }
      toast.success("Quadro criado com sucesso!");
      setShowCreateModal(false);
      setNewBoard({
        name: "",
        description: "",
        visibility: "PUBLIC",
        channelId: "",
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const visibilityIcons = {
    PUBLIC: <Globe className="w-4 h-4" />,
    PRIVATE: <Lock className="w-4 h-4" />,
    CHANNEL: <Hash className="w-4 h-4" />,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 bg-white">
        {/* Board Selector */}
        <div className="relative">
          <button
            onClick={() => setShowBoardDropdown(!showBoardDropdown)}
            className="flex items-center gap-2 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-colors min-w-[200px]"
          >
            <LayoutDashboard className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700 flex-1 text-left truncate">
              {selectedBoard?.name || "Selecionar quadro"}
            </span>
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </button>

          <AnimatePresence>
            {showBoardDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute left-0 top-full mt-1 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 py-1 max-h-60 overflow-y-auto"
              >
                {boards.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-neutral-400 text-center">
                    Nenhum quadro encontrado
                  </div>
                ) : (
                  boards.map((board) => (
                    <button
                      key={board.id}
                      onClick={() => {
                        setActiveBoardId(board.id);
                        setShowBoardDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                        activeBoardId === board.id
                          ? "bg-primary-50 text-primary-700"
                          : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {visibilityIcons[board.visibility]}
                      <span className="flex-1 truncate">{board.name}</span>
                      {board._count && (
                        <span className="text-xs text-neutral-400">
                          {board._count.columns} col.
                        </span>
                      )}
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* New Board Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo Quadro
        </button>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-hidden">
        {activeBoardId ? (
          <TaskBoard boardId={activeBoardId} />
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-400">
            <div className="text-center">
              <LayoutDashboard className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium text-lg">Nenhum quadro selecionado</p>
              <p className="text-sm mt-1">
                Crie um novo quadro para comecar a gerenciar tarefas
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
              >
                Criar Quadro
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Close dropdown on click outside */}
      {showBoardDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowBoardDropdown(false)}
        />
      )}

      {/* Create Board Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
            >
              <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                <h3 className="font-semibold text-neutral-900">Novo Quadro</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-neutral-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Nome do quadro
                  </label>
                  <input
                    type="text"
                    value={newBoard.name}
                    onChange={(e) =>
                      setNewBoard({ ...newBoard, name: e.target.value })
                    }
                    placeholder="Ex: Sprint 1, Projetos Marketing..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={newBoard.description}
                    onChange={(e) =>
                      setNewBoard({ ...newBoard, description: e.target.value })
                    }
                    placeholder="Descreva o proposito deste quadro..."
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Visibilidade
                  </label>
                  <select
                    value={newBoard.visibility}
                    onChange={(e) =>
                      setNewBoard({
                        ...newBoard,
                        visibility: e.target.value as
                          | "PUBLIC"
                          | "PRIVATE"
                          | "CHANNEL",
                        channelId: "",
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                  >
                    <option value="PUBLIC">Publico - Todos podem ver</option>
                    <option value="PRIVATE">Privado - Somente membros</option>
                    <option value="CHANNEL">
                      Canal - Vinculado a um canal
                    </option>
                  </select>
                </div>

                {newBoard.visibility === "CHANNEL" && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Canal
                    </label>
                    <select
                      value={newBoard.channelId}
                      onChange={(e) =>
                        setNewBoard({ ...newBoard, channelId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                    >
                      <option value="">Selecionar canal...</option>
                      {channels.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          #{ch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateBoard}
                  disabled={
                    !newBoard.name.trim() ||
                    createBoard.isPending ||
                    (newBoard.visibility === "CHANNEL" && !newBoard.channelId)
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createBoard.isPending ? "Criando..." : "Criar Quadro"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
