import { MessageSquare } from 'lucide-react';
import type { PurchaseRequest } from '@/types/procurement';

// ── Component ─────────────────────────────────────────────────────────────────

export function ComunicacaoTab({ purchase }: { purchase: PurchaseRequest }) {
  const hasChannel = purchase.status !== 'DRAFT';

  if (!hasChannel) {
    return (
      <div className="p-4">
        <div className="text-center py-12 text-neutral-500">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
          <p className="text-sm">
            Canal de comunicação será ativado ao submeter a requisição
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="card p-4 text-center">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-primary-400" />
        <p className="text-sm text-neutral-700">
          Canal de comunicação vinculado a esta requisição.
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          Mensagens e notificações serão exibidas aqui.
        </p>
      </div>
    </div>
  );
}
