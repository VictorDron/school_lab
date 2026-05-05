import type { RefObject } from 'react';
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar } from '@/components/ui/Avatar';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    avatarUrl?: string | null;
    displayName: string;
  };
}

interface CurrentUser {
  avatarUrl?: string | null;
  displayName: string;
}

interface TaskCardCommentsProps {
  comments: Comment[];
  currentUser?: CurrentUser | null;
  commentText: string;
  isSubmitting: boolean;
  commentsEndRef: RefObject<HTMLDivElement>;
  onCommentTextChange: (value: string) => void;
  onAddComment: () => void;
}

export function TaskCardComments({
  comments,
  currentUser,
  commentText,
  isSubmitting,
  commentsEndRef,
  onCommentTextChange,
  onAddComment,
}: TaskCardCommentsProps) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
        Comentarios
      </h4>

      {comments.length > 0 && (
        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2.5">
              <Avatar
                src={comment.user.avatarUrl ?? undefined}
                name={comment.user.displayName}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-neutral-800">
                    {comment.user.displayName}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <p className="text-sm text-neutral-700 mt-0.5 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>
      )}

      {/* Add comment form */}
      <div className="flex items-start gap-2.5">
        {currentUser && (
          <Avatar
            src={currentUser.avatarUrl ?? undefined}
            name={currentUser.displayName}
            size="sm"
          />
        )}
        <div className="flex-1">
          <textarea
            value={commentText}
            onChange={(e) => onCommentTextChange(e.target.value)}
            placeholder="Escrever um comentário..."
            rows={2}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                onAddComment();
              }
            }}
          />
          <div className="flex justify-end mt-1">
            <button
              onClick={onAddComment}
              disabled={!commentText.trim() || isSubmitting}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              <Send className="w-3 h-3" />
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
