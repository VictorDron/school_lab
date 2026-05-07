import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pencil, Trash2, Loader2, ArrowUpRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { pedagogicalApi, StudentGrade } from '@/lib/api/pedagogical';
import { getErrorMessage } from '@/lib/api';

export default function GradesView() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<StudentGrade | null>(null);
  const [creating, setCreating] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['ped', 'grades', classFilter, subjectFilter, periodFilter],
    queryFn: () => pedagogicalApi.listGrades({
      classId: classFilter || undefined,
      subjectId: subjectFilter || undefined,
      period: periodFilter || undefined,
    }),
  });
  const { data: classes = [] } = useQuery({ queryKey: ['ped', 'classes'], queryFn: () => pedagogicalApi.listClasses() });
  const { data: subjects = [] } = useQuery({ queryKey: ['ped', 'subjects'], queryFn: pedagogicalApi.listSubjects });

  const periods = useMemo(() => Array.from(new Set(grades.map((g) => g.period))).sort(), [grades]);

  return (
    <div className="max-w-[1320px] mx-auto px-6 lg:px-12 py-10">
      <header className="flex items-end justify-between gap-4 pb-8 border-b border-rule">
        <div>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-iris mb-3">— iv. Avaliação</div>
          <h1 className="font-display font-light text-ink leading-none" style={{ fontSize: 'clamp(36px, 4vw, 56px)', letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
            <em className="display-em">Notas</em>
            <span className="text-iris">.</span>
          </h1>
          <p className="serif-em text-stone-deep mt-3" style={{ fontSize: 16 }}>
            — {grades.length} nota{grades.length === 1 ? '' : 's'} registrada{grades.length === 1 ? '' : 's'}
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn btn-primary btn-md">
          <Plus className="w-4 h-4" /> Lançar nota
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3 mt-6">
        <Filter className="w-3.5 h-3.5 text-stone-deep" />
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="input max-w-[240px]">
          <option value="">Todas as turmas</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.year}</option>)}
        </select>
        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="input max-w-[200px]">
          <option value="">Todas as disciplinas</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} className="input max-w-[160px]">
          <option value="">Todos os períodos</option>
          {periods.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-deep" /></div>
      ) : grades.length === 0 ? (
        <div className="py-20 text-center"><p className="serif-em text-stone-deep" style={{ fontSize: 18 }}>— Nenhuma nota neste filtro.</p></div>
      ) : (
        <div className="border border-ink mt-8 bg-paper overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>— Aluno</Th>
                <Th>— Turma</Th>
                <Th className="hidden md:table-cell">— Disciplina</Th>
                <Th>— Período</Th>
                <Th className="hidden lg:table-cell">— Tipo</Th>
                <Th className="text-right">— Nota</Th>
                <Th className="text-right hidden md:table-cell">— Peso</Th>
                <th className="bg-paper-deep border-b border-ink"></th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g, i) => (
                <tr key={g.id} className={`hover:bg-paper-deep transition-colors ${i < grades.length - 1 ? 'border-b border-rule' : ''}`}>
                  <td className="px-5 py-4 font-medium text-ink">{g.student.fullName}</td>
                  <td className="px-5 py-4 text-sm text-ink-soft">{g.class.name}</td>
                  <td className="px-5 py-4 text-sm text-ink-soft hidden md:table-cell">{g.subject.name}</td>
                  <td className="px-5 py-4 font-mono text-xs uppercase tracking-[0.14em] text-stone-deep">{g.period}</td>
                  <td className="px-5 py-4 text-sm text-stone-deep hidden lg:table-cell">{g.type ?? <span className="text-stone">—</span>}</td>
                  <td className="px-5 py-4 text-right font-mono font-semibold text-ink">{g.grade.toFixed(1)}</td>
                  <td className="px-5 py-4 text-right text-sm text-stone-deep hidden md:table-cell">×{g.weight}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => setEditing(g)} className="p-1.5 hover:bg-paper rounded text-stone-deep hover:text-ink transition-colors">
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
          <GradeForm
            initial={editing}
            classes={classes}
            subjects={subjects}
            onClose={() => { setCreating(false); setEditing(null); }}
            onSaved={() => { qc.invalidateQueries({ queryKey: ['ped', 'grades'] }); setCreating(false); setEditing(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-deep px-5 py-3.5 text-left bg-paper-deep border-b border-ink ${className}`}>{children}</th>
  );
}

function GradeForm({ initial, classes, subjects, onClose, onSaved }: {
  initial: StudentGrade | null;
  classes: { id: string; name: string; year: number }[];
  subjects: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const qc = useQueryClient();
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      classId: initial?.classId ?? '',
      studentId: initial?.studentId ?? '',
      subjectId: initial?.subjectId ?? '',
      period: initial?.period ?? '',
      grade: initial?.grade ?? '',
      weight: initial?.weight ?? 1.0,
      type: initial?.type ?? '',
      notes: initial?.notes ?? '',
    },
  });

  const watchedClassId = watch('classId');
  const { data: classDetail } = useQuery({
    queryKey: ['ped', 'class', watchedClassId],
    queryFn: () => pedagogicalApi.getClass(watchedClassId),
    enabled: !!watchedClassId && !isEdit,
  });

  const save = useMutation({
    mutationFn: async (form: any) => {
      const body: any = {
        period: form.period,
        grade: Number(form.grade),
        weight: Number(form.weight),
        type: form.type || undefined,
        notes: form.notes || undefined,
      };
      if (isEdit && initial) return pedagogicalApi.updateGrade(initial.id, body);
      return pedagogicalApi.createGrade({
        ...body,
        classId: form.classId,
        studentId: form.studentId,
        subjectId: form.subjectId,
      });
    },
    onSuccess: () => { toast.success(isEdit ? 'Nota atualizada' : 'Nota lançada'); onSaved(); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: () => initial ? pedagogicalApi.deleteGrade(initial.id) : Promise.reject(),
    onSuccess: () => { toast.success('Removida'); qc.invalidateQueries({ queryKey: ['ped', 'grades'] }); onSaved(); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <>
      <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="bg-paper border border-ink w-full max-w-xl pointer-events-auto p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-stone-deep hover:text-ink"><X className="w-4 h-4" /></button>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-iris mb-4">— {isEdit ? 'Editar' : 'Lançar'} nota</div>
          <h3 className="font-display font-light leading-none text-ink mb-6" style={{ fontSize: 32, letterSpacing: '-0.035em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
            {isEdit ? <em className="display-em">{initial?.student.fullName.split(' ')[0]}</em> : <em className="display-em">nova</em>}
          </h3>
          <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
            {!isEdit && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>
                <div>
                  <label className="label">— Aluno</label>
                  <select {...register('studentId', { required: true })} className={`input ${errors.studentId ? 'input-error' : ''}`}>
                    <option value="">— Escolha a turma primeiro —</option>
                    {classDetail?.enrollments.map((en) => (
                      <option key={en.studentId} value={en.studentId}>{en.student.fullName} ({en.student.code})</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">— Período</label>
                <input {...register('period', { required: 'Obrigatório' })} className={`input ${errors.period ? 'input-error' : ''}`} placeholder="1º Bim" />
              </div>
              <div>
                <label className="label">— Nota</label>
                <input type="number" step="0.1" {...register('grade', { required: 'Obrigatório' })} className={`input ${errors.grade ? 'input-error' : ''}`} placeholder="8.5" />
              </div>
              <div>
                <label className="label">— Peso</label>
                <input type="number" step="0.1" {...register('weight')} className="input" placeholder="1" />
              </div>
            </div>
            <div>
              <label className="label">— Tipo</label>
              <input {...register('type')} className="input" placeholder="Prova, Trabalho, etc." />
            </div>
            <div>
              <label className="label">— Observações</label>
              <textarea {...register('notes')} className="input min-h-[64px]" />
            </div>
            <div className="flex justify-between pt-2">
              {isEdit && (
                <button type="button" onClick={() => { if (confirm('Remover esta nota?')) remove.mutate(); }} className="btn btn-md text-error-500 hover:bg-error-50" style={{ borderRadius: 4 }}>
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
