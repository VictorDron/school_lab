import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Pencil, Loader2, ArrowUpRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { teamApi, EmployeeSummary, EmploymentType, employmentTypeLabel } from '@/lib/api/team';
import { Avatar } from '@/components/ui/Avatar';
import { getErrorMessage } from '@/lib/api';

export default function EmployeesView() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [editing, setEditing] = useState<EmployeeSummary | null>(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['team', 'employees', search, departmentId],
    queryFn: () => teamApi.listEmployees({ search: search || undefined, departmentId: departmentId || undefined }),
  });
  const { data: departments = [] } = useQuery({ queryKey: ['team', 'departments'], queryFn: teamApi.listDepartments });
  const { data: positions = [] } = useQuery({ queryKey: ['team', 'positions'], queryFn: teamApi.listPositions });

  const total = employees.length;

  return (
    <div className="max-w-[1320px] mx-auto px-6 lg:px-12 py-10">
      <header className="flex items-end justify-between gap-4 pb-8 border-b border-rule">
        <div>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-iris mb-3">— iii. Time</div>
          <h1 className="font-display font-light text-ink leading-none" style={{ fontSize: 'clamp(36px, 4vw, 56px)', letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
            <em className="display-em">Colaboradores</em>
            <span className="text-iris">.</span>
          </h1>
          <p className="serif-em text-stone-deep mt-3" style={{ fontSize: 16 }}>
            — {total} pessoa{total === 1 ? '' : 's'} no time
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mt-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-deep" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="Buscar por nome, e-mail…"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-stone-deep" />
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="input min-w-[200px]">
            <option value="">Todos departamentos</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-deep" /></div>
      ) : employees.length === 0 ? (
        <div className="py-20 text-center">
          <p className="serif-em text-stone-deep" style={{ fontSize: 18 }}>— Nenhum colaborador encontrado.</p>
        </div>
      ) : (
        <div className="border border-ink mt-8 bg-paper overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>— Pessoa</Th>
                <Th className="hidden md:table-cell">— Cargo</Th>
                <Th className="hidden lg:table-cell">— Departamento</Th>
                <Th className="hidden lg:table-cell">— Vínculo</Th>
                <Th className="hidden xl:table-cell">— Admissão</Th>
                <Th className="hidden md:table-cell">— Gestor</Th>
                <th className="bg-paper-deep border-b border-ink"></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={emp.id} className={`hover:bg-paper-deep transition-colors ${i < employees.length - 1 ? 'border-b border-rule' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={emp.avatarUrl} name={emp.displayName} size="sm" />
                      <div>
                        <div className="font-medium text-ink">{emp.displayName}</div>
                        <div className="text-xs text-stone-deep">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-ink-soft hidden md:table-cell">
                    {emp.position?.name ?? <span className="text-stone">{emp.role}</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-ink-soft hidden lg:table-cell">
                    {emp.department?.name ?? <span className="text-stone">—</span>}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    {emp.employmentType ? (
                      <span className="badge badge-neutral">{employmentTypeLabel[emp.employmentType]}</span>
                    ) : <span className="text-stone">—</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-ink-soft hidden xl:table-cell">
                    {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('pt-BR') : <span className="text-stone">—</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-ink-soft hidden md:table-cell">
                    {emp.manager?.displayName ?? <span className="text-stone">—</span>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => setEditing(emp)} className="p-1.5 hover:bg-paper-deep rounded text-stone-deep hover:text-ink transition-colors">
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
        {editing && (
          <EmployeeHRForm
            employee={editing}
            departments={departments}
            positions={positions}
            employees={employees.filter((e) => e.id !== editing.id)}
            onClose={() => setEditing(null)}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ['team', 'employees'] });
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

function EmployeeHRForm({
  employee,
  departments,
  positions,
  employees,
  onClose,
  onSaved,
}: {
  employee: EmployeeSummary;
  departments: { id: string; name: string }[];
  positions: { id: string; name: string; departmentId: string | null }[];
  employees: EmployeeSummary[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : '',
      employmentType: (employee.employmentType ?? '') as EmploymentType | '',
      departmentId: employee.departmentId ?? '',
      positionId: employee.positionId ?? '',
      managerId: employee.managerId ?? '',
      area: employee.area ?? '',
    },
  });

  const watchedDept = watch('departmentId');
  const filteredPositions = useMemo(
    () => watchedDept
      ? positions.filter((p) => !p.departmentId || p.departmentId === watchedDept)
      : positions,
    [watchedDept, positions],
  );

  const save = useMutation({
    mutationFn: (form: any) => teamApi.updateEmployee(employee.id, {
      hireDate: form.hireDate ? new Date(form.hireDate).toISOString() : null,
      employmentType: form.employmentType || null,
      departmentId: form.departmentId || null,
      positionId: form.positionId || null,
      managerId: form.managerId || null,
      area: form.area || null,
    }),
    onSuccess: () => {
      toast.success('Dados de RH atualizados');
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
          className="bg-paper border border-ink w-full max-w-xl pointer-events-auto p-8 relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-stone-deep hover:text-ink">
            <X className="w-4 h-4" />
          </button>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-iris mb-3">
            — Colaborador
          </div>
          <div className="flex items-center gap-3 mb-6">
            <Avatar src={employee.avatarUrl} name={employee.displayName} size="lg" />
            <div>
              <h3 className="font-display font-light text-ink leading-none" style={{ fontSize: 28, letterSpacing: '-0.035em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
                <em className="display-em">{employee.displayName}</em>
              </h3>
              <p className="text-sm text-stone-deep mt-1">{employee.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">— Departamento</label>
                <select {...register('departmentId')} className="input">
                  <option value="">— Nenhum —</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">— Cargo</label>
                <select {...register('positionId')} className="input">
                  <option value="">— Nenhum —</option>
                  {filteredPositions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">— Vínculo</label>
                <select {...register('employmentType')} className="input">
                  <option value="">— Não definido —</option>
                  <option value="CLT">CLT</option>
                  <option value="PJ">PJ</option>
                  <option value="ESTAGIO">Estágio</option>
                  <option value="TERCEIRIZADO">Terceirizado</option>
                  <option value="AUTONOMO">Autônomo</option>
                  <option value="TEMPORARIO">Temporário</option>
                </select>
              </div>
              <div>
                <label className="label">— Data de admissão</label>
                <input type="date" {...register('hireDate')} className="input" />
              </div>
            </div>

            <div>
              <label className="label">— Gestor direto</label>
              <select {...register('managerId')} className="input">
                <option value="">— Nenhum —</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.displayName}</option>)}
              </select>
            </div>

            <div>
              <label className="label">— Área de atuação</label>
              <input {...register('area')} className="input" placeholder="Ex.: Educação Infantil" />
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={save.isPending} className="btn btn-primary btn-md">
                {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Salvar <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} /></>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  );
}
