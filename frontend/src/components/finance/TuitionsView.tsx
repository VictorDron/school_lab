import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pencil, Trash2, Loader2, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { financeApi, Tuition, formatBRL } from '@/lib/api/finance';
import { getErrorMessage } from '@/lib/api';

export default function TuitionsView() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Tuition | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: tuitions = [], isLoading } = useQuery({
    queryKey: ['finance', 'tuitions'],
    queryFn: () => financeApi.listTuitions(),
  });

  return (
    <div className="max-w-[1320px] mx-auto px-6 lg:px-12 py-10">
      <header className="flex items-end justify-between gap-4 pb-8 border-b border-rule">
        <div>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-iris mb-3">— ii. Tabela-base</div>
          <h1 className="font-display font-light text-ink leading-none" style={{ fontSize: 'clamp(36px, 4vw, 56px)', letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
            <em className="display-em">Mensalidades</em>
            <span className="text-iris">.</span>
          </h1>
          <p className="serif-em text-stone-deep mt-3" style={{ fontSize: 16 }}>
            — Valor-base de mensalidade, material e matrícula por série/ano
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn btn-primary btn-md">
          <Plus className="w-4 h-4" /> Nova mensalidade
        </button>
      </header>

      {isLoading ? (
        <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-deep" /></div>
      ) : tuitions.length === 0 ? (
        <div className="py-20 text-center">
          <p className="serif-em text-stone-deep" style={{ fontSize: 18 }}>— Nenhuma mensalidade cadastrada.</p>
        </div>
      ) : (
        <div className="border border-ink mt-10 bg-paper">
          <table className="w-full">
            <thead>
              <tr>
                <Th>— Série</Th>
                <Th>— Ano</Th>
                <Th className="text-right">— Mensalidade</Th>
                <Th className="text-right hidden md:table-cell">— Material</Th>
                <Th className="text-right hidden md:table-cell">— Matrícula</Th>
                <th className="bg-paper-deep border-b border-ink"></th>
              </tr>
            </thead>
            <tbody>
              {tuitions.map((t, i) => (
                <tr key={t.id} className={`hover:bg-paper-deep transition-colors ${i < tuitions.length - 1 ? 'border-b border-rule' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="font-display text-ink" style={{ fontSize: 17 }}>{t.grade}</div>
                  </td>
                  <td className="px-5 py-4 font-mono text-sm text-ink">{t.year}</td>
                  <td className="px-5 py-4 text-right font-mono font-semibold text-ink">{formatBRL(t.monthlyAmount)}</td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-ink-soft hidden md:table-cell">{t.materialAmount ? formatBRL(t.materialAmount) : <span className="text-stone">—</span>}</td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-ink-soft hidden md:table-cell">{t.enrollmentFee ? formatBRL(t.enrollmentFee) : <span className="text-stone">—</span>}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => setEditing(t)} className="p-1.5 hover:bg-paper-deep rounded text-stone-deep hover:text-ink transition-colors">
                      <Pencil className="w-3.5 h-3.5" strokeWidth={1.6} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {(creating || editing) && (
          <TuitionForm
            initial={editing}
            onClose={() => { setCreating(false); setEditing(null); }}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ['finance', 'tuitions'] });
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

function TuitionForm({ initial, onClose, onSaved }: { initial: Tuition | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial;
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      grade: initial?.grade ?? '',
      year: initial?.year ?? new Date().getFullYear(),
      monthlyAmount: initial?.monthlyAmount ?? '',
      materialAmount: initial?.materialAmount ?? '',
      enrollmentFee: initial?.enrollmentFee ?? '',
      notes: initial?.notes ?? '',
    },
  });

  const save = useMutation({
    mutationFn: async (form: any) => {
      const body: any = {
        grade: form.grade,
        year: Number(form.year),
        monthlyAmount: Number(form.monthlyAmount),
      };
      if (form.materialAmount) body.materialAmount = Number(form.materialAmount);
      if (form.enrollmentFee)  body.enrollmentFee = Number(form.enrollmentFee);
      if (form.notes) body.notes = form.notes;
      if (isEdit && initial) return financeApi.updateTuition(initial.id, body);
      return financeApi.createTuition(body);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Mensalidade atualizada' : 'Mensalidade criada');
      onSaved();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: () => initial ? financeApi.deleteTuition(initial.id) : Promise.reject(),
    onSuccess: () => {
      toast.success('Removida');
      qc.invalidateQueries({ queryKey: ['finance', 'tuitions'] });
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
            — {isEdit ? 'Editar' : 'Nova'} mensalidade
          </div>
          <h3 className="font-display font-light leading-none text-ink mb-6" style={{ fontSize: 32, letterSpacing: '-0.035em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
            {isEdit ? <em className="display-em">{initial?.grade}</em> : <em className="display-em">nova</em>}
          </h3>
          <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
              <div>
                <label className="label">— Série</label>
                <input {...register('grade', { required: 'Obrigatório' })} className={`input ${errors.grade ? 'input-error' : ''}`} placeholder="1º Ano EF" autoFocus />
              </div>
              <div>
                <label className="label">— Ano</label>
                <input type="number" {...register('year', { required: true })} className="input" />
              </div>
            </div>
            <div>
              <label className="label">— Mensalidade (R$)</label>
              <input type="number" step="0.01" {...register('monthlyAmount', { required: 'Obrigatório' })} className={`input ${errors.monthlyAmount ? 'input-error' : ''}`} placeholder="1500.00" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">— Material (R$)</label>
                <input type="number" step="0.01" {...register('materialAmount')} className="input" placeholder="opcional" />
              </div>
              <div>
                <label className="label">— Matrícula (R$)</label>
                <input type="number" step="0.01" {...register('enrollmentFee')} className="input" placeholder="opcional" />
              </div>
            </div>
            <div>
              <label className="label">— Notas</label>
              <textarea {...register('notes')} className="input min-h-[64px]" />
            </div>
            <div className="flex justify-between pt-2">
              {isEdit && (
                <button type="button" onClick={() => { if (confirm(`Remover ${initial?.grade}/${initial?.year}?`)) remove.mutate(); }} className="btn btn-md text-error-500 hover:bg-error-50" style={{ borderRadius: 4 }}>
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
