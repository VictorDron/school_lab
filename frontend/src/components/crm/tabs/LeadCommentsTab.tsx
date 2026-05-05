import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAddComment, useDeleteComment } from '@/hooks/useLeads';
import { commentTypeConfig, type Lead, type CommentType } from '@/types/crm';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';

interface LeadCommentsTabProps {
  lead: Lead;
}

export function LeadCommentsTab({ lead }: LeadCommentsTabProps) {
  const [content, setContent] = useState('');
  const [type, setType] = useState<CommentType>('GENERAL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { user } = useAuthStore();
  const addMutation = useAddComment();
  const deleteMutation = useDeleteComment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    addMutation.mutate(
      { leadId: lead.id, data: { content: content.trim(), type } },
      {
        onSuccess: () => {
          setContent('');
          setType('GENERAL');
        },
      }
    );
  };

  const handleDelete = (commentId: string) => {
    deleteMutation.mutate(
      { leadId: lead.id, commentId },
      { onSuccess: () => setDeletingId(null) }
    );
  };

  const comments = lead.comments || [];

  return (
    <div className="flex flex-col h-full">
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
          Comentários ({comments.length})
        </h3>

        {comments.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
            <p>Nenhum comentário ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => {
              const config = commentTypeConfig[comment.type];
              const isOwner = user?.id === comment.userId;

              return (
                <div
                  key={comment.id}
                  className={`p-3 rounded-lg border ${config.bgColor} border-opacity-50`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={comment.user?.avatarUrl}
                      name={comment.user?.displayName || 'User'}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-neutral-900 text-sm">
                          {comment.user?.displayName || 'Usuário'}
                        </span>
                        <span className={`px-1.5 py-0.5 text-xs rounded ${config.bgColor} ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <p className="text-neutral-700 text-sm whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>

                    {(isOwner || user?.role === 'ADMIN') && (
                      <button
                        onClick={() => setDeletingId(comment.id)}
                        className="p-1 hover:bg-white/50 rounded transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4 text-neutral-400 hover:text-red-500" />
                      </button>
                    )}
                  </div>

                  {/* Delete Confirmation */}
                  <AnimatePresence>
                    {deletingId === comment.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-neutral-200"
                      >
                        <p className="text-sm text-neutral-600 mb-2">
                          Remover este comentário?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeletingId(null)}
                            className="btn btn-secondary btn-sm"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleDelete(comment.id)}
                            disabled={deleteMutation.isPending}
                            className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Remover'
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comment Form */}
      <div className="border-t border-neutral-200 p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 mb-2">
            {(Object.keys(commentTypeConfig) as CommentType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  type === t
                    ? `${commentTypeConfig[t].bgColor} ${commentTypeConfig[t].color}`
                    : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                }`}
              >
                {commentTypeConfig[t].label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Adicionar comentário..."
              rows={2}
              className="input resize-none flex-1"
            />
            <button
              type="submit"
              disabled={!content.trim() || addMutation.isPending}
              className="btn btn-primary btn-md self-end"
            >
              {addMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
