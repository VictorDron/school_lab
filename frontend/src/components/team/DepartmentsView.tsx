import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pencil, Trash2, Loader2, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { teamApi, Department } from '@/lib/api/team';
import { getErrorMessage } from '@/lib/api';

interface DeptForm {
  name: string;
  description?: string;
  parentDepartmentId?: string;
  headUserId?: string;
}

export default function DepartmentsView() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Department | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['team', 'departments'],
    queryFn: teamApi.listDepartments,
  });

  return (
    <div className="max-w-[1320px] mx-auto px-6 lg:px-12 py-10">
      <header className="flex items-end justify-between gap-4 pb-8 border-b border-rule">
        <div>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-iris mb-3">— i. Estrutura</div>
          <h1 className="font-display font-light text-ink leading-none" style={{ fontSize: 'clamp(36px, 4vw, 56px)', letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
            <em className="display-em">Departamentos</em>
            <span className="text-iris">.</span>
          </h1>
          <p className="serif-em text-stone-deep mt-3" style={{ fontSize: 16 }}>
            — {departments.length} departamento{departments.length === 1 ? '' : 's'} cadastrado{departments.length === 1 ? '' : 's'}
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn btn-primary btn-md">
          <Plus className="w-4 h-4" /> Novo departamento
        </button>
      </header>

      {isLoading ? (
        <div className="py-20 text-center text-stone-deep">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        </div>
      ) : departments.length === 0 ? (
        <div className="py-20 text-center">
          <p className="serif-em text-stone-deep" style={{ fontSize: 18 }}>
            — Nenhum departamento ainda. Crie o primeiro.
          </p>
        </div>
      ) : (
        <div className="border-t border-l border-ink mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <div key={d.id} className="border-r border-b border-ink p-7 bg-paper hover:bg-paper-deep transition-colors group">
              <div className="flex items-baseline justify-between mb-5">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-deep">
                  — {String(departments.indexOf(d) + 1).padStart(2, '0')}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(d)} className="p-1.5 hover:bg-paper-deep rounded transition-colors text-stone-deep hover:text-ink" title="Editar">
                    <Pencil className="w-3.5 h-3.5" strokeWidth={1.6} />
                  </button>
                </div>
              </div>
              <h3 className="font-display font-normal text-ink leading-tight mb-2" style={{ fontSize: 22, letterSpacing: '-0.025em' }}>
                <span className="font-light">{d.name}</span>
              </h3>
              {d.description && (
                <p className="text-sm text-stone-deep leading-relaxed line-clamp-2 mb-4">{d.description}</p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-5 pt-4 border-t border-rule">
                <Stat label="Colaboradores" value={d._count.employees} />
                <Stat label="Cargos" value={d._count.positions} />
                {d.parent && <Stat label="Sob" value={d.parent.name} />}
                {d.head && (
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-deep">— Líder</span>
                    <span className="text-xs text-ink font-medium">{d.head.displayName}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {(creating || editing) && (
          <DepartmentForm
            initial={editing}
            departments={departments}
            onClose={() => {
              setCreating(false);
              setEditing(null);
            }}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ['team', 'departments'] });
              setCreating(false);
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-deep">— {label}</span>
      <span className="text-xs text-ink font-semibold">{value}</span>
    </div>
  );
}

function DepartmentForm({
  initial,
  departments,
  onClose,
  onSaved,
}: {
  initial: Department | null;
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<DeptForm>({
    defaultValues: {
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      parentDepartmentId: initial?.parentDepartmentId ?? '',
      headUserId: initial?.headUserId ?? '',
    },
  });

  const save = useMutation({
    mutationFn: async (form: DeptForm) => {
      const body = {
        name: form.name,
        description: form.description,
        parentDepartmentId: form.parentDepartmentId || null,
        headUserId: form.headUserId || null,
      };
      if (isEdit && initial) return teamApi.updateDepartment(initial.id, body);
      return teamApi.createDepartment(body as any);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Departamento atualizado' : 'Departamento criado');
      onSaved();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: () => initial ? teamApi.deleteDepartment(initial.id) : Promise.reject(),
    onSuccess: () => {
      toast.success('Departamento removido');
      qc.invalidateQueries({ queryKey: ['team', 'departments'] });
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
            — {isEdit ? 'Editar' : 'Novo'} departamento
          </div>
          <h3 className="font-display font-light leading-none text-ink mb-6" style={{ fontSize: 32, letterSpacing: '-0.035em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
            {isEdit ? <em className="display-em">{initial?.name}</em> : <em className="display-em">novo</em>}
          </h3>

          <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
            <div>
              <label className="label">— Nome</label>
              <input {...register('name', { required: 'Obrigatório' })} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Pedagogia" autoFocus />
            </div>
            <div>
              <label className="label">— Descrição</label>
              <textarea {...register('description')} className="input min-h-[72px] resize-y" placeholder="Coordenadoria pedagógica e currículo" />
            </div>
            <div>
              <label className="label">— Departamento-pai</label>
              <select {...register('parentDepartmentId')} className="input">
                <option value="">— Nenhum —</option>
                {departments.filter((d) => d.id !== initial?.id).map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-between pt-2">
              {isEdit && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Remover ${initial?.name}?`)) remove.mutate();
                  }}
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
