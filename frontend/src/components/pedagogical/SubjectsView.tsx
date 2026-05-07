import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pencil, Trash2, Loader2, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { pedagogicalApi, SchoolSubject } from '@/lib/api/pedagogical';
import { getErrorMessage } from '@/lib/api';

export default function SubjectsView() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<SchoolSubject | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: subjects = [], isLoading } = useQuery({ queryKey: ['ped', 'subjects'], queryFn: pedagogicalApi.listSubjects });

  return (
    <div className="max-w-[1320px] mx-auto px-6 lg:px-12 py-10">
      <header className="flex items-end justify-between gap-4 pb-8 border-b border-rule">
        <div>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-iris mb-3">— ii. Catálogo</div>
          <h1 className="font-display font-light text-ink leading-none" style={{ fontSize: 'clamp(36px, 4vw, 56px)', letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
            <em className="display-em">Disciplinas</em>
            <span className="text-iris">.</span>
          </h1>
          <p className="serif-em text-stone-deep mt-3" style={{ fontSize: 16 }}>
            — {subjects.length} disciplina{subjects.length === 1 ? '' : 's'}
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn btn-primary btn-md">
          <Plus className="w-4 h-4" /> Nova disciplina
        </button>
      </header>

      {isLoading ? (
        <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-deep" /></div>
      ) : subjects.length === 0 ? (
        <div className="py-20 text-center"><p className="serif-em text-stone-deep" style={{ fontSize: 18 }}>— Nenhuma disciplina ainda.</p></div>
      ) : (
        <div className="border-t border-l border-ink mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s, i) => (
            <div key={s.id} className="border-r border-b border-ink p-7 bg-paper hover:bg-paper-deep transition-colors group">
              <div className="flex items-baseline justify-between mb-5">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-deep">— {String(i + 1).padStart(2, '0')}</span>
                <button onClick={() => setEditing(s)} className="p-1.5 hover:bg-paper rounded text-stone-deep hover:text-ink transition-colors">
                  <Pencil className="w-3.5 h-3.5" strokeWidth={1.6} />
                </button>
              </div>
              <h3 className="font-display font-normal text-ink leading-tight mb-1" style={{ fontSize: 22, letterSpacing: '-0.025em' }}>
                <span className="font-light">{s.name}</span>
              </h3>
              {s.code && <div className="font-mono text-xs uppercase tracking-[0.14em] text-iris mb-3">{s.code}</div>}
              {s.description && <p className="text-sm text-stone-deep leading-relaxed line-clamp-2">{s.description}</p>}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {(creating || editing) && (
          <SubjectForm initial={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => {
            qc.invalidateQueries({ queryKey: ['ped', 'subjects'] });
            setCreating(false); setEditing(null);
          }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function SubjectForm({ initial, onClose, onSaved }: { initial: SchoolSubject | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial;
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: initial?.name ?? '', code: initial?.code ?? '', description: initial?.description ?? '' },
  });

  const save = useMutation({
    mutationFn: async (form: any) => {
      const body = { name: form.name, code: form.code || undefined, description: form.description || undefined };
      if (isEdit && initial) return pedagogicalApi.updateSubject(initial.id, body);
      return pedagogicalApi.createSubject(body);
    },
    onSuccess: () => { toast.success(isEdit ? 'Disciplina atualizada' : 'Disciplina criada'); onSaved(); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: () => initial ? pedagogicalApi.deleteSubject(initial.id) : Promise.reject(),
    onSuccess: () => { toast.success('Removida'); qc.invalidateQueries({ queryKey: ['ped', 'subjects'] }); onSaved(); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <>
      <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="bg-paper border border-ink w-full max-w-lg pointer-events-auto p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-stone-deep hover:text-ink"><X className="w-4 h-4" /></button>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-iris mb-4">— {isEdit ? 'Editar' : 'Nova'} disciplina</div>
          <h3 className="font-display font-light leading-none text-ink mb-6" style={{ fontSize: 32, letterSpacing: '-0.035em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
            {isEdit ? <em className="display-em">{initial?.name}</em> : <em className="display-em">nova</em>}
          </h3>
          <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
              <div>
                <label className="label">— Nome</label>
                <input {...register('name', { required: 'Obrigatório' })} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Matemática" autoFocus />
              </div>
              <div>
                <label className="label">— Código</label>
                <input {...register('code')} className="input" placeholder="MAT" />
              </div>
            </div>
            <div>
              <label className="label">— Descrição</label>
              <textarea {...register('description')} className="input min-h-[72px] resize-y" />
            </div>
            <div className="flex justify-between pt-2">
              {isEdit && (
                <button type="button" onClick={() => { if (confirm(`Remover ${initial?.name}?`)) remove.mutate(); }} className="btn btn-md text-error-500 hover:bg-error-50" style={{ borderRadius: 4 }}>
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
