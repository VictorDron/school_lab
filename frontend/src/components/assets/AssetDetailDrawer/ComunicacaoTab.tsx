import { ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// ComunicacaoTab — placeholder for the communication channel feature that
// will surface critical-asset chat threads. Empty for now so the drawer's
// tab strip stays complete.
// ---------------------------------------------------------------------------

export function ComunicacaoTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
      <ChevronRight className="w-10 h-10 mb-2" />
      <span className="text-sm">Canal de comunicação disponível para ativos críticos</span>
    </div>
  );
}
