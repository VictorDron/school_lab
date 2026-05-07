import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pencil, Trash2, Loader2, ArrowUpRight, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { pedagogicalApi, LessonPlan } from '@/lib/api/pedagogical';
import { teamApi } from '@/lib/api/team';
import { getErrorMessage } from '@/lib/api';

export default function LessonPlansView() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<LessonPlan | null>(null);
  const [creating, setCreating] = useState(false);
  const [classFilter, setClassFilter] = useState('');

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['ped', 'lesson-plans', classFilter],
    queryFn: () => pedagogicalApi.listLessonPlans(classFilter ? { classId: classFilter } : {}),
  });
  const { data: classes = [] } = useQuery({ queryKey: ['ped', 'classes'], queryFn: () => pedagogicalApi.listClasses() });
  const { data: subjects = [] } = useQuery({ queryKey: ['ped', 'subjects'], queryFn: pedagogicalApi.listSubjects });
  const { data: teachers = [] } = useQuery({ queryKey: ['team', 'employees'], queryFn: () => teamApi.listEmployees() });

  return (
    <div className="max-w-[1320px] mx-auto px-6 lg:px-12 py-10">
      <header className="flex items-end justify-between gap-4 pb-8 border-b border-rule">
        <div>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-iris mb-3">— iii. Plano</div>
          <h1 className="font-display font-light text-ink leading-none" style={{ fontSize: 'clamp(36px, 4vw, 56px)', letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
            <em className="display-em">Plano de Aulas</em>
            <span className="text-iris">.</span>
          </h1>
          <p className="serif-em text-stone-deep mt-3" style={{ fontSize: 16 }}>
            — {plans.length} plano{plans.length === 1 ? '' : 's'}
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn btn-primary btn-md">
          <Plus className="w-4 h-4" /> Novo plano
        </button>
      </header>

      <div className="flex items-center gap-2 mt-6">
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="input max-w-[280px]">
          <option value="">Todas as turmas</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.year}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-deep" /></div>
      ) : plans.length === 0 ? (
        <div className="py-20 text-center"><p className="serif-em text-stone-deep" style={{ fontSize: 18 }}>— Nenhum plano de aula ainda.</p></div>
      ) : (
        <div className="border border-ink mt-8 bg-paper">
          <ul>
            {plans.map((p, i) => (
              <li key={p.id} className={`px-6 py-5 ${i < plans.length - 1 ? 'border-b border-rule' : ''} hover:bg-paper-deep transition-colors flex items-start justify-between gap-4`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-3 mb-1.5 flex-wrap">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-iris">— {p.subject.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-deep">{p.class.name} · {p.class.year}</span>
                    {p.scheduledDate && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-deep flex items-center gap-1">
                        <Calendar className="w-3 h-3" strokeWidth={1.6} /> {new Date(p.scheduledDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-normal text-ink mb-1" style={{ fontSize: 20, letterSpacing: '-0.02em' }}>
                    <span className="font-light">{p.title}</span>
                  </h3>
                  {p.objectives && <p className="text-sm text-stone-deep mt-1.5 line-clamp-2">{p.objectives}</p>}
                  <div className="text-xs text-stone-deep mt-2">— {p.teacher.displayName}</div>
                </div>
                <button onClick={() => setEditing(p)} className="p-1.5 hover:bg-paper rounded text-stone-deep hover:text-ink transition-colors flex-shrink-0">
                  <Pencil className="w-3.5 h-3.5" strokeWidth={1.6} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AnimatePresence>
        {(creating || editing) && (
          <LessonPlanForm
            initial={editing}
            classes={classes}
            subjects={subjects}
            teachers={teachers}
            onClose={() => { setCreating(false); setEditing(null); }}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ['ped', 'lesson-plans'] });
              setCreating(false); setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LessonPlanForm({
  initial,
  classes,
  subjects,
  teachers,
  onClose,
  onSaved,
}: {
  initial: LessonPlan | null;
  classes: { id: string; name: string; year: number }[];
  subjects: { id: string; name: string }[];
  teachers: { id: string; displayName: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      classId: initial?.classId ?? '',
      subjectId: initial?.subjectId ?? '',
      teacherId: initial?.teacherId ?? '',
      title: initial?.title ?? '',
      objectives: initial?.objectives ?? '',
      content: initial?.content ?? '',
      scheduledDate: initial?.scheduledDate ? initial.scheduledDate.split('T')[0] : '',
    },
  });

  const save = useMutation({
    mutationFn: async (form: any) => {
      const body: any = {
        title: form.title,
        objectives: form.objectives || undefined,
        content: form.content || undefined,
        scheduledDate: form.scheduledDate ? new Date(form.scheduledDate + 'T12:00:00Z').toISOString() : null,
      };
      if (isEdit && initial) return pedagogicalApi.updateLessonPlan(initial.id, body);
      return pedagogicalApi.createLessonPlan({
        ...body,
        classId: form.classId,
        subjectId: form.subjectId,
        teacherId: form.teacherId,
      });
    },
    onSuccess: () => { toast.success(isEdit ? 'Plano atualizado' : 'Plano criado'); onSaved(); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: () => initial ? pedagogicalApi.deleteLessonPlan(initial.id) : Promise.reject(),
    onSuccess: () => { toast.success('Removido'); qc.invalidateQueries({ queryKey: ['ped', 'lesson-plans'] }); onSaved(); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <>
      <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="bg-paper border border-ink w-full max-w-2xl max-h-[88vh] overflow-y-auto pointer-events-auto p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-stone-deep hover:text-ink"><X className="w-4 h-4" /></button>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-iris mb-4">— {isEdit ? 'Editar' : 'Novo'} plano de aula</div>
          <h3 className="font-display font-light leading-none text-ink mb-6" style={{ fontSize: 32, letterSpacing: '-0.035em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
            {isEdit ? <em className="display-em">{initial?.title.slice(0, 24)}</em> : <em className="display-em">novo</em>}
          </h3>
          <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
            {!isEdit && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">— Turma</label>
                  <select {...register('classId', { required: true })} className={`input ${errors.classId ? 'input-error' : ''}`}>
                    <option value="">—</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.year}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">— Disciplina</label>
                  <select {...register('subjectId', { required: true })} className={`input ${errors.subjectId ? 'input-error' : ''}`}>
                    <option value="">—</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">— Professor</label>
                  <select {...register('teacherId', { required: true })} className={`input ${errors.teacherId ? 'input-error' : ''}`}>
                    <option value="">—</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.displayName}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div>
              <label className="label">— Título</label>
              <input {...register('title', { required: 'Obrigatório' })} className={`input ${errors.title ? 'input-error' : ''}`} placeholder="Geometria · Triângulos" />
            </div>
            <div>
              <label className="label">— Data programada</label>
              <input type="date" {...register('scheduledDate')} className="input max-w-[200px]" />
            </div>
            <div>
              <label className="label">— Objetivos</label>
              <textarea {...register('objectives')} className="input min-h-[80px] resize-y" placeholder="O que o aluno vai conseguir fazer após a aula" />
            </div>
            <div>
              <label className="label">— Conteúdo / Plano</label>
              <textarea {...register('content')} className="input min-h-[140px] resize-y" placeholder="Roteiro, atividades, materiais, etc." />
            </div>
            <div className="flex justify-between pt-2">
              {isEdit && (
                <button type="button" onClick={() => { if (confirm('Remover este plano?')) remove.mutate(); }} className="btn btn-md text-error-500 hover:bg-error-50" style={{ borderRadius: 4 }}>
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
