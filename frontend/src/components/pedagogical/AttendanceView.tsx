import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowUpRight, Check, AlertCircle, Clock, FileCheck2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { pedagogicalApi, AttendanceStatus, attendanceLabel } from '@/lib/api/pedagogical';
import { getErrorMessage } from '@/lib/api';

const STATUSES: { value: AttendanceStatus; icon: React.ReactNode; bg: string; text: string }[] = [
  { value: 'PRESENT', icon: <Check     className="w-3.5 h-3.5" />, bg: 'bg-success-50',      text: 'text-success-700' },
  { value: 'ABSENT',  icon: <AlertCircle className="w-3.5 h-3.5" />, bg: 'bg-error-50',      text: 'text-error-700' },
  { value: 'LATE',    icon: <Clock     className="w-3.5 h-3.5" />, bg: 'bg-warning-50',     text: 'text-warning-700' },
  { value: 'EXCUSED', icon: <FileCheck2 className="w-3.5 h-3.5" />, bg: 'bg-paper-deep',    text: 'text-stone-deep' },
];

export default function AttendanceView() {
  const qc = useQueryClient();
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});

  const { data: classes = [] } = useQuery({ queryKey: ['ped', 'classes'], queryFn: () => pedagogicalApi.listClasses() });
  const { data: classDetail } = useQuery({
    queryKey: ['ped', 'class', classId],
    queryFn: () => pedagogicalApi.getClass(classId),
    enabled: !!classId,
  });
  const { data: existing = [] } = useQuery({
    queryKey: ['ped', 'attendance', classId, date],
    queryFn: () => pedagogicalApi.listAttendance({ classId, date }),
    enabled: !!classId && !!date,
  });

  const enrollments = useMemo(() => classDetail?.enrollments ?? [], [classDetail]);

  // Reset draft when class/date or existing records change
  useEffect(() => {
    if (!enrollments.length) return;
    const next: Record<string, AttendanceStatus> = {};
    for (const en of enrollments) {
      const prior = existing.find((a) => a.studentId === en.studentId);
      next[en.studentId] = prior?.status ?? 'PRESENT';
    }
    setDraft(next);
  }, [enrollments, existing]);

  const save = useMutation({
    mutationFn: () =>
      pedagogicalApi.bulkRecordAttendance({
        classId,
        date,
        records: enrollments.map((en) => ({ studentId: en.studentId, status: draft[en.studentId] ?? 'PRESENT' })),
      }),
    onSuccess: () => {
      toast.success('Frequência registrada');
      qc.invalidateQueries({ queryKey: ['ped', 'attendance', classId, date] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const counts = useMemo(() => {
    const c = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 } as Record<AttendanceStatus, number>;
    for (const s of Object.values(draft)) c[s]++;
    return c;
  }, [draft]);

  return (
    <div className="max-w-[1320px] mx-auto px-6 lg:px-12 py-10">
      <header className="pb-8 border-b border-rule">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-iris mb-3">— v. Presença</div>
        <h1 className="font-display font-light text-ink leading-none" style={{ fontSize: 'clamp(36px, 4vw, 56px)', letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
          <em className="display-em">Frequência</em>
          <span className="text-iris">.</span>
        </h1>
        <p className="serif-em text-stone-deep mt-3" style={{ fontSize: 16 }}>
          — Registro diário de presença por turma
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3 mt-8">
        <div>
          <label className="label">— Turma</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="input min-w-[280px]">
            <option value="">— Selecione —</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.year}</option>)}
          </select>
        </div>
        <div>
          <label className="label">— Data</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
      </div>

      {!classId ? (
        <div className="py-20 text-center"><p className="serif-em text-stone-deep" style={{ fontSize: 18 }}>— Escolha uma turma para começar.</p></div>
      ) : enrollments.length === 0 ? (
        <div className="py-20 text-center"><p className="serif-em text-stone-deep" style={{ fontSize: 18 }}>— Esta turma não tem alunos matriculados.</p></div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink mt-8 border border-ink">
            {STATUSES.map((s) => (
              <div key={s.value} className="bg-paper p-4">
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-deep mb-1">— {attendanceLabel[s.value]}</div>
                <div className="font-display font-light text-ink" style={{ fontSize: 32, letterSpacing: '-0.025em' }}>{counts[s.value]}</div>
              </div>
            ))}
          </div>

          {/* Roster */}
          <div className="border border-ink bg-paper mt-6">
            <ul>
              {enrollments.map((en, i) => {
                const current = draft[en.studentId] ?? 'PRESENT';
                const wasRecorded = existing.some((a) => a.studentId === en.studentId);
                return (
                  <li key={en.id} className={`flex items-center justify-between gap-4 px-5 py-4 ${i < enrollments.length - 1 ? 'border-b border-rule' : ''}`}>
                    <div className="min-w-0">
                      <div className="font-medium text-ink">{en.student.fullName}</div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-deep">
                        {en.student.code}
                        {wasRecorded && <span className="text-iris ml-2">● registrado</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {STATUSES.map((s) => {
                        const isActive = current === s.value;
                        return (
                          <button
                            key={s.value}
                            onClick={() => setDraft((d) => ({ ...d, [en.studentId]: s.value }))}
                            className={`px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] font-semibold transition-all flex items-center gap-1.5 ${
                              isActive ? 'bg-ink text-paper' : `${s.bg} ${s.text} hover:bg-ink hover:text-paper`
                            }`}
                            style={{ borderRadius: 4 }}
                          >
                            {s.icon}
                            <span className="hidden sm:inline">{attendanceLabel[s.value]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex justify-end mt-6">
            <button onClick={() => save.mutate()} disabled={save.isPending} className="btn btn-primary btn-lg">
              {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Salvar frequência <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} /></>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
