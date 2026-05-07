import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pencil, CheckCircle2, Loader2, ArrowUpRight, Filter, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { financeApi, Payable, PayableCategory, PayableStatus, formatBRL, payableCategoryLabel, statusLabel } from '@/lib/api/finance';
import { getErrorMessage } from '@/lib/api';

const statusBadge: Record<PayableStatus, string> = {
  PENDING: 'badge-neutral',
  PAID: 'badge-success',
  OVERDUE: 'badge-iris',
  CANCELLED: 'badge-error',
};

export default function PayablesView() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<PayableStatus | ''>('');
  const [editing, setEditing] = useState<Payable | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: payables = [], isLoading } = useQuery({
    queryKey: ['finance', 'payables', statusFilter],
    queryFn: () => financeApi.listPayables(statusFilter ? { status: statusFilter as PayableStatus } : {}),
  });

  const pay = useMutation({
    mutationFn: (id: string) => financeApi.payPayable(id),
    onSuccess: () => {
      toast.success('Pagamento registrado');
      qc.invalidateQueries({ queryKey: ['finance'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="max-w-[1320px] mx-auto px-6 lg:px-12 py-10">
      <header className="flex items-end justify-between gap-4 pb-8 border-b border-rule">
        <div>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-iris mb-3">— iv. A pagar</div>
          <h1 className="font-display font-light text-ink leading-none" style={{ fontSize: 'clamp(36px, 4vw, 56px)', letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
            <em className="display-em">Contas a Pagar</em>
            <span className="text-iris">.</span>
          </h1>
          <p className="serif-em text-stone-deep mt-3" style={{ fontSize: 16 }}>
            — {payables.length} conta{payables.length === 1 ? '' : 's'} programada{payables.length === 1 ? '' : 's'}
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn btn-primary btn-md">
          <Plus className="w-4 h-4" /> Nova conta
        </button>
      </header>

      <div className="flex items-center gap-2 mt-6">
        <Filter className="w-3.5 h-3.5 text-stone-deep" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="input max-w-[200px]">
          <option value="">Todos os status</option>
          <option value="PENDING">Pendentes</option>
          <option value="OVERDUE">Atrasados</option>
          <option value="PAID">Pagos</option>
          <option value="CANCELLED">Cancelados</option>
        </select>
      </div>

      {isLoading ? (
        <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-deep" /></div>
      ) : payables.length === 0 ? (
        <div className="py-20 text-center">
          <p className="serif-em text-stone-deep" style={{ fontSize: 18 }}>— Nenhuma conta neste filtro.</p>
        </div>
      ) : (
        <div className="border border-ink mt-8 bg-paper overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>— Fornecedor</Th>
                <Th className="hidden md:table-cell">— Descrição</Th>
                <Th className="hidden lg:table-cell">— Categoria</Th>
                <Th>— Vencimento</Th>
                <Th className="text-right">— Valor</Th>
                <Th>— Status</Th>
                <th className="bg-paper-deep border-b border-ink"></th>
              </tr>
            </thead>
            <tbody>
              {payables.map((p, i) => (
                <tr key={p.id} className={`hover:bg-paper-deep transition-colors ${i < payables.length - 1 ? 'border-b border-rule' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="font-medium text-ink">{p.supplierName}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-ink-soft hidden md:table-cell">{p.description}</td>
                  <td className="px-5 py-4 text-sm text-ink-soft hidden lg:table-cell">{payableCategoryLabel[p.category]}</td>
                  <td className="px-5 py-4 font-mono text-sm text-ink-soft">{new Date(p.dueDate).toLocaleDateString('pt-BR')}</td>
                  <td className="px-5 py-4 text-right font-mono font-semibold text-ink">{formatBRL(p.amount)}</td>
                  <td className="px-5 py-4"><span className={`badge ${statusBadge[p.status]}`}>{statusLabel[p.status]}</span></td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      {p.status !== 'PAID' && p.status !== 'CANCELLED' && (
                        <button onClick={() => pay.mutate(p.id)} className="p-1.5 hover:bg-paper-deep rounded text-success-500 hover:text-success-600 transition-colors" title="Marcar como pago">
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.6} />
                        </button>
                      )}
                      <button onClick={() => setEditing(p)} className="p-1.5 hover:bg-paper-deep rounded text-stone-deep hover:text-ink transition-colors">
                        <Pencil className="w-3.5 h-3.5" strokeWidth={1.6} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {(creating || editing) && (
          <PayableForm
            initial={editing}
            onClose={() => { setCreating(false); setEditing(null); }}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ['finance'] });
              setCreating(false);
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-deep px-5 py-3.5 text-left bg-paper-deep border-b border-ink ${className}`}>
      {children}
    </th>
  );
}

function PayableForm({ initial, onClose, onSaved }: { initial: Payable | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial;
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      supplierName: initial?.supplierName ?? '',
      description: initial?.description ?? '',
      category: (initial?.category ?? 'OTHER') as PayableCategory,
      amount: initial?.amount ?? '',
      dueDate: initial?.dueDate ? initial.dueDate.split('T')[0] : new Date().toISOString().split('T')[0],
      notes: initial?.notes ?? '',
    },
  });

  const save = useMutation({
    mutationFn: async (form: any) => {
      const body = {
        supplierName: form.supplierName,
        description: form.description,
        category: form.category as PayableCategory,
        amount: Number(form.amount),
        dueDate: new Date(form.dueDate + 'T12:00:00Z').toISOString(),
        notes: form.notes || undefined,
      };
      if (isEdit && initial) return financeApi.updatePayable(initial.id, body);
      return financeApi.createPayable(body);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Conta atualizada' : 'Conta criada');
      onSaved();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: () => initial ? financeApi.deletePayable(initial.id) : Promise.reject(),
    onSuccess: () => {
      toast.success('Removida');
      qc.invalidateQueries({ queryKey: ['finance'] });
      onSaved();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <>
      <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          className="bg-paper border border-ink w-full max-w-lg pointer-events-auto p-8 relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-stone-deep hover:text-ink"><X className="w-4 h-4" /></button>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-iris mb-4">
            — {isEdit ? 'Editar' : 'Nova'} conta
          </div>
          <h3 className="font-display font-light leading-none text-ink mb-6" style={{ fontSize: 32, letterSpacing: '-0.035em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
            {isEdit ? <em className="display-em">{initial?.supplierName}</em> : <em className="display-em">nova</em>}
          </h3>
          <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
            <div>
              <label className="label">— Fornecedor</label>
              <input {...register('supplierName', { required: 'Obrigatório' })} className={`input ${errors.supplierName ? 'input-error' : ''}`} placeholder="Light SA" autoFocus />
            </div>
            <div>
              <label className="label">— Descrição</label>
              <input {...register('description', { required: 'Obrigatório' })} className={`input ${errors.description ? 'input-error' : ''}`} placeholder="Conta de luz Maio/2026" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">— Categoria</label>
                <select {...register('category')} className="input">
                  {Object.entries(payableCategoryLabel).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">— Valor (R$)</label>
                <input type="number" step="0.01" {...register('amount', { required: 'Obrigatório' })} className={`input ${errors.amount ? 'input-error' : ''}`} />
              </div>
            </div>
            <div>
              <label className="label">— Vencimento</label>
              <input type="date" {...register('dueDate', { required: true })} className="input" />
            </div>
            <div>
              <label className="label">— Notas</label>
              <textarea {...register('notes')} className="input min-h-[64px]" />
            </div>
            <div className="flex justify-between pt-2">
              {isEdit && (
                <button type="button" onClick={() => { if (confirm(`Remover ${initial?.supplierName}?`)) remove.mutate(); }} className="btn btn-md text-error-500 hover:bg-error-50" style={{ borderRadius: 4 }}>
                  <Trash2 className="w-4 h-4" /> Remover
                </button>
              )}
              <button type="submit" disabled={save.isPending} className="btn btn-primary btn-md ml-auto">
                {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Salvar <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} /></>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  );
}
