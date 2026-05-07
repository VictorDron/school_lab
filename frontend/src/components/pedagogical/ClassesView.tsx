import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pencil, Loader2, ArrowUpRight, Trash2, Users, Layers, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { pedagogicalApi, SchoolClass } from '@/lib/api/pedagogical';
import { teamApi } from '@/lib/api/team';
import { api, getErrorMessage } from '@/lib/api';

interface StudentLite { id: string; fullName: string; code: string }

export default function ClassesView() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [creating, setCreating] = useState(false);
  const [managingId, setManagingId] = useState<string | null>(null);

  const { data: classes = [], isLoading } = useQuery({ queryKey: ['ped', 'classes'], queryFn: () => pedagogicalApi.listClasses() });
  const { data: teachers = [] } = useQuery({ queryKey: ['team', 'employees', 'teachers'], queryFn: () => teamApi.listEmployees() });

  return (
    <div className="max-w-[1320px] mx-auto px-6 lg:px-12 py-10">
      <header className="flex items-end justify-between gap-4 pb-8 border-b border-rule">
        <div>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-iris mb-3">— i. Estrutura</div>
          <h1 className="font-display font-light text-ink leading-none" style={{ fontSize: 'clamp(36px, 4vw, 56px)', letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
            <em className="display-em">Turmas</em>
            <span className="text-iris">.</span>
          </h1>
          <p className="serif-em text-stone-deep mt-3" style={{ fontSize: 16 }}>
            — {classes.length} turma{classes.length === 1 ? '' : 's'} ativa{classes.length === 1 ? '' : 's'}
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn btn-primary btn-md">
          <Plus className="w-4 h-4" /> Nova turma
        </button>
      </header>

      {isLoading ? (
        <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-deep" /></div>
      ) : classes.length === 0 ? (
        <div className="py-20 text-center"><p className="serif-em text-stone-deep" style={{ fontSize: 18 }}>— Nenhuma turma ainda.</p></div>
      ) : (
        <div className="border-t border-l border-ink mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((c, i) => (
            <div key={c.id} className="border-r border-b border-ink p-7 bg-paper hover:bg-paper-deep transition-colors group">
              <div className="flex items-baseline justify-between mb-5">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-deep">— {String(i + 1).padStart(2, '0')} · {c.year}</span>
                <div className="flex gap-1">
                  <button onClick={() => setManagingId(c.id)} className="p-1.5 hover:bg-paper rounded text-stone-deep hover:text-ink transition-colors" title="Gerenciar alunos e disciplinas">
                    <Settings2 className="w-3.5 h-3.5" strokeWidth={1.6} />
                  </button>
                  <button onClick={() => setEditing(c)} className="p-1.5 hover:bg-paper rounded text-stone-deep hover:text-ink transition-colors">
                    <Pencil className="w-3.5 h-3.5" strokeWidth={1.6} />
                  </button>
                </div>
              </div>
              <h3 className="font-display font-normal text-ink leading-tight mb-1" style={{ fontSize: 24, letterSpacing: '-0.025em' }}>
                <span className="font-light">{c.name}</span>
              </h3>
              <div className="text-sm text-stone-deep mb-4">{c.grade}{c.shift ? ` · ${c.shift}` : ''}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-rule">
                <div className="flex items-baseline gap-1.5">
                  <Users className="w-3 h-3 text-stone-deep" strokeWidth={1.6} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-deep">{c._count.enrollments}</span>
                  <span className="text-xs text-ink">aluno{c._count.enrollments === 1 ? '' : 's'}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <Layers className="w-3 h-3 text-stone-deep" strokeWidth={1.6} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-deep">{c._count.classSubjects}</span>
                  <span className="text-xs text-ink">disc.</span>
                </div>
              </div>
              {c.homeroomTeacher && (
                <div className="mt-3 text-xs text-stone-deep">
                  <span className="font-mono uppercase tracking-[0.14em]">— Regente</span>{' '}
                  <span className="text-ink font-medium">{c.homeroomTeacher.displayName}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {(creating || editing) && (
          <ClassForm initial={editing} teachers={teachers} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => {
            qc.invalidateQueries({ queryKey: ['ped', 'classes'] });
            setCreating(false); setEditing(null);
          }} />
        )}
        {managingId && (
          <ClassManageModal classId={managingId} onClose={() => setManagingId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ClassForm({ initial, teachers, onClose, onSaved }: {
  initial: SchoolClass | null;
  teachers: { id: string; displayName: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: initial?.name ?? '',
      grade: initial?.grade ?? '',
      year: initial?.year ?? new Date().getFullYear(),
      shift: initial?.shift ?? '',
      capacity: initial?.capacity ?? '',
      homeroomTeacherId: initial?.homeroomTeacherId ?? '',
    },
  });

  const save = useMutation({
    mutationFn: async (form: any) => {
      const body: any = {
        name: form.name,
        grade: form.grade,
        year: Number(form.year),
        shift: form.shift || undefined,
        homeroomTeacherId: form.homeroomTeacherId || null,
      };
      if (form.capacity) body.capacity = Number(form.capacity);
      if (isEdit && initial) return pedagogicalApi.updateClass(initial.id, body);
      return pedagogicalApi.createClass(body);
    },
    onSuccess: () => { toast.success(isEdit ? 'Turma atualizada' : 'Turma criada'); onSaved(); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: () => initial ? pedagogicalApi.deleteClass(initial.id) : Promise.reject(),
    onSuccess: () => { toast.success('Removida'); qc.invalidateQueries({ queryKey: ['ped', 'classes'] }); onSaved(); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <>
      <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="bg-paper border border-ink w-full max-w-lg pointer-events-auto p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-stone-deep hover:text-ink"><X className="w-4 h-4" /></button>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-iris mb-4">— {isEdit ? 'Editar' : 'Nova'} turma</div>
          <h3 className="font-display font-light leading-none text-ink mb-6" style={{ fontSize: 32, letterSpacing: '-0.035em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
            {isEdit ? <em className="display-em">{initial?.name}</em> : <em className="display-em">nova</em>}
          </h3>
          <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
              <div>
                <label className="label">— Nome</label>
                <input {...register('name', { required: 'Obrigatório' })} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="1º Ano A" autoFocus />
              </div>
              <div>
                <label className="label">— Ano</label>
                <input type="number" {...register('year', { required: true })} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">— Série</label>
                <input {...register('grade', { required: 'Obrigatório' })} className={`input ${errors.grade ? 'input-error' : ''}`} placeholder="1º Ano EF" />
              </div>
              <div>
                <label className="label">— Turno</label>
                <select {...register('shift')} className="input">
                  <option value="">— Não definido —</option>
                  <option value="manhã">Manhã</option>
                  <option value="tarde">Tarde</option>
                  <option value="integral">Integral</option>
                  <option value="noite">Noite</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">— Capacidade</label>
                <input type="number" {...register('capacity')} className="input" placeholder="opcional" />
              </div>
              <div>
                <label className="label">— Regente</label>
                <select {...register('homeroomTeacherId')} className="input">
                  <option value="">— Nenhum —</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.displayName}</option>)}
                </select>
              </div>
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

function ClassManageModal({ classId, onClose }: { classId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: cls, isLoading } = useQuery({ queryKey: ['ped', 'class', classId], queryFn: () => pedagogicalApi.getClass(classId) });
  const { data: subjects = [] } = useQuery({ queryKey: ['ped', 'subjects'], queryFn: pedagogicalApi.listSubjects });
  const { data: teachers = [] } = useQuery({ queryKey: ['team', 'employees'], queryFn: () => teamApi.listEmployees() });
  const { data: students = [] } = useQuery({
    queryKey: ['students', 'all'],
    queryFn: () => api.get<{ success: true; data: { students: StudentLite[] } }>('/students', { params: { limit: 200 } }).then((r) => r.data.data.students),
  });

  const [tab, setTab] = useState<'students' | 'subjects'>('students');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [studentId, setStudentId] = useState('');

  const enroll = useMutation({
    mutationFn: () => pedagogicalApi.enrollStudent(classId, studentId),
    onSuccess: () => { toast.success('Aluno matriculado'); setStudentId(''); qc.invalidateQueries({ queryKey: ['ped', 'class', classId] }); qc.invalidateQueries({ queryKey: ['ped', 'classes'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const unenroll = useMutation({
    mutationFn: (sid: string) => pedagogicalApi.unenrollStudent(classId, sid),
    onSuccess: () => { toast.success('Removido da turma'); qc.invalidateQueries({ queryKey: ['ped', 'class', classId] }); qc.invalidateQueries({ queryKey: ['ped', 'classes'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const addSubject = useMutation({
    mutationFn: () => pedagogicalApi.addClassSubject(classId, { subjectId, teacherId: teacherId || undefined }),
    onSuccess: () => { toast.success('Disciplina adicionada'); setSubjectId(''); setTeacherId(''); qc.invalidateQueries({ queryKey: ['ped', 'class', classId] }); qc.invalidateQueries({ queryKey: ['ped', 'classes'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const removeSubject = useMutation({
    mutationFn: (csId: string) => pedagogicalApi.removeClassSubject(classId, csId),
    onSuccess: () => { toast.success('Removida'); qc.invalidateQueries({ queryKey: ['ped', 'class', classId] }); qc.invalidateQueries({ queryKey: ['ped', 'classes'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const enrolledIds = new Set(cls?.enrollments.map((e) => e.studentId) ?? []);
  const usedSubjectIds = new Set(cls?.classSubjects.map((cs) => cs.subjectId) ?? []);

  return (
    <>
      <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="bg-paper border border-ink w-full max-w-2xl max-h-[88vh] overflow-y-auto pointer-events-auto p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-stone-deep hover:text-ink"><X className="w-4 h-4" /></button>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-iris mb-4">— Gerenciar turma</div>
          {isLoading || !cls ? (
            <Loader2 className="w-6 h-6 animate-spin text-stone-deep" />
          ) : (
            <>
              <h3 className="font-display font-light leading-none text-ink mb-6" style={{ fontSize: 32, letterSpacing: '-0.035em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
                <em className="display-em">{cls.name}</em>
                <span className="text-stone-deep text-base"> · {cls.year}</span>
              </h3>

              <div className="flex border-b border-rule mb-6">
                <button onClick={() => setTab('students')} className={`px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors relative ${tab === 'students' ? 'text-ink' : 'text-stone-deep hover:text-ink'}`}>
                  — Alunos ({cls.enrollments.length})
                  {tab === 'students' && <span className="absolute left-3 right-3 -bottom-px h-[2px]" style={{ background: 'var(--iris)' }} />}
                </button>
                <button onClick={() => setTab('subjects')} className={`px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors relative ${tab === 'subjects' ? 'text-ink' : 'text-stone-deep hover:text-ink'}`}>
                  — Disciplinas ({cls.classSubjects.length})
                  {tab === 'subjects' && <span className="absolute left-3 right-3 -bottom-px h-[2px]" style={{ background: 'var(--iris)' }} />}
                </button>
              </div>

              {tab === 'students' ? (
                <>
                  <div className="flex gap-2 mb-5">
                    <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="input flex-1">
                      <option value="">— Selecionar aluno —</option>
                      {students.filter((s) => !enrolledIds.has(s.id)).map((s) => (
                        <option key={s.id} value={s.id}>{s.fullName} ({s.code})</option>
                      ))}
                    </select>
                    <button disabled={!studentId || enroll.isPending} onClick={() => enroll.mutate()} className="btn btn-primary btn-md">
                      {enroll.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Matricular</>}
                    </button>
                  </div>
                  {cls.enrollments.length === 0 ? (
                    <p className="text-center serif-em text-stone-deep py-8" style={{ fontSize: 15 }}>— Nenhum aluno matriculado ainda.</p>
                  ) : (
                    <ul className="border border-rule">
                      {cls.enrollments.map((en, i) => (
                        <li key={en.id} className={`flex items-center justify-between px-4 py-3 ${i < cls.enrollments.length - 1 ? 'border-b border-rule' : ''}`}>
                          <div>
                            <div className="font-medium text-ink">{en.student.fullName}</div>
                            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-deep">{en.student.code}</div>
                          </div>
                          <button onClick={() => { if (confirm(`Remover ${en.student.fullName} da turma?`)) unenroll.mutate(en.studentId); }} className="p-1.5 text-stone-deep hover:text-error-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.6} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_auto] gap-2 mb-5">
                    <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="input">
                      <option value="">— Disciplina —</option>
                      {subjects.filter((s) => !usedSubjectIds.has(s.id)).map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="input">
                      <option value="">— Professor (opcional) —</option>
                      {teachers.map((t) => <option key={t.id} value={t.id}>{t.displayName}</option>)}
                    </select>
                    <button disabled={!subjectId || addSubject.isPending} onClick={() => addSubject.mutate()} className="btn btn-primary btn-md">
                      {addSubject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /></>}
                    </button>
                  </div>
                  {cls.classSubjects.length === 0 ? (
                    <p className="text-center serif-em text-stone-deep py-8" style={{ fontSize: 15 }}>— Nenhuma disciplina vinculada.</p>
                  ) : (
                    <ul className="border border-rule">
                      {cls.classSubjects.map((cs, i) => (
                        <li key={cs.id} className={`flex items-center justify-between px-4 py-3 ${i < cls.classSubjects.length - 1 ? 'border-b border-rule' : ''}`}>
                          <div>
                            <div className="font-medium text-ink">{cs.subject.name}</div>
                            <div className="text-xs text-stone-deep">{cs.teacher?.displayName ?? '— Sem professor designado'}</div>
                          </div>
                          <button onClick={() => { if (confirm(`Remover ${cs.subject.name} da turma?`)) removeSubject.mutate(cs.id); }} className="p-1.5 text-stone-deep hover:text-error-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.6} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </>
          )}
        </motion.div>
      </div>
    </>
  );
}
