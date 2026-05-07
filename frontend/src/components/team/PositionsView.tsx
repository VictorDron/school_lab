import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pencil, Trash2, Loader2, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { teamApi, Position } from '@/lib/api/team';
import { getErrorMessage } from '@/lib/api';

export default function PositionsView() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Position | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: positions = [], isLoading } = useQuery({
    queryKey: ['team', 'positions'],
    queryFn: teamApi.listPositions,
  });
  const { data: departments = [] } = useQuery({
    queryKey: ['team', 'departments'],
    queryFn: teamApi.listDepartments,
  });

  return (
    <div className="max-w-[1320px] mx-auto px-6 lg:px-12 py-10">
      <header className="flex items-end justify-between gap-4 pb-8 border-b border-rule">
        <div>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-iris mb-3">— ii. Catálogo</div>
          <h1 className="font-display font-light text-ink leading-none" style={{ fontSize: 'clamp(36px, 4vw, 56px)', letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
            <em className="display-em">Cargos</em>
            <span className="text-iris">.</span>
          </h1>
          <p className="serif-em text-stone-deep mt-3" style={{ fontSize: 16 }}>
            — {positions.length} cargo{positions.length === 1 ? '' : 's'} cadastrado{positions.length === 1 ? '' : 's'}
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn btn-primary btn-md">
          <Plus className="w-4 h-4" /> Novo cargo
        </button>
      </header>

      {isLoading ? (
        <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-deep" /></div>
      ) : positions.length === 0 ? (
        <div className="py-20 text-center">
          <p className="serif-em text-stone-deep" style={{ fontSize: 18 }}>— Nenhum cargo ainda. Crie o primeiro.</p>
        </div>
      ) : (
        <div className="border border-ink mt-10 bg-paper">
          <table className="w-full">
            <thead>
              <tr>
                <th className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-deep px-5 py-3.5 text-left bg-paper-deep border-b border-ink">— Cargo</th>
                <th className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-deep px-5 py-3.5 text-left bg-paper-deep border-b border-ink hidden md:table-cell">— Departamento</th>
                <th className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-deep px-5 py-3.5 text-left bg-paper-deep border-b border-ink hidden lg:table-cell">— Descrição</th>
                <th className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-deep px-5 py-3.5 text-right bg-paper-deep border-b border-ink">— Pessoas</th>
                <th className="bg-paper-deep border-b border-ink"></th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, i) => (
                <tr key={p.id} className={`hover:bg-paper-deep transition-colors ${i < positions.length - 1 ? 'border-b border-rule' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="font-display font-normal text-ink" style={{ fontSize: 17 }}>{p.name}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-ink-soft hidden md:table-cell">
                    {p.department?.name ?? <span className="text-stone">—</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-stone-deep hidden lg:table-cell line-clamp-1">
                    {p.description || <span className="text-stone">—</span>}
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-mono font-semibold text-ink">{p._count.employees}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => setEditing(p)} className="p-1.5 hover:bg-paper-deep rounded text-stone-deep hover:text-ink transition-colors">
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
          <PositionForm
            initial={editing}
            departments={departments}
            onClose={() => { setCreating(false); setEditing(null); }}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ['team', 'positions'] });
              setCreating(false);
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PositionForm({
  initial,
  departments,
  onClose,
  onSaved,
}: {
  initial: Position | null;
  departments: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      departmentId: initial?.departmentId ?? '',
    },
  });

  const save = useMutation({
    mutationFn: async (form: any) => {
      const body = {
        name: form.name,
        description: form.description,
        departmentId: form.departmentId || null,
      };
      if (isEdit && initial) return teamApi.updatePosition(initial.id, body);
      return teamApi.createPosition(body as any);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Cargo atualizado' : 'Cargo criado');
      onSaved();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: () => initial ? teamApi.deletePosition(initial.id) : Promise.reject(),
    onSuccess: () => {
      toast.success('Cargo removido');
      qc.invalidateQueries({ queryKey: ['team', 'positions'] });
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
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          className="bg-paper border border-ink w-full max-w-lg pointer-events-auto p-8 relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-stone-deep hover:text-ink">
            <X className="w-4 h-4" />
          </button>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-iris mb-4">
            — {isEdit ? 'Editar' : 'Novo'} cargo
          </div>
          <h3 className="font-display font-light leading-none text-ink mb-6" style={{ fontSize: 32, letterSpacing: '-0.035em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
            {isEdit ? <em className="display-em">{initial?.name}</em> : <em className="display-em">novo</em>}
          </h3>

          <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
            <div>
              <label className="label">— Nome</label>
              <input {...register('name', { required: 'Obrigatório' })} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Coordenador Pedagógico" autoFocus />
            </div>
            <div>
              <label className="label">— Departamento</label>
              <select {...register('departmentId')} className="input">
                <option value="">— Nenhum —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">— Descrição</label>
              <textarea {...register('description')} className="input min-h-[72px] resize-y" placeholder="Responsabilidades e perfil esperado" />
            </div>
            <div className="flex justify-between pt-2">
              {isEdit && (
                <button
                  type="button"
                  onClick={() => { if (confirm(`Remover ${initial?.name}?`)) remove.mutate(); }}
                  className="btn btn-md text-error-500 hover:bg-error-50"
                  style={{ borderRadius: 4 }}
                >
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
