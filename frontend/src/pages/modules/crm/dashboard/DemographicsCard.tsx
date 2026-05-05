import { Users, Baby, HeartHandshake, Accessibility } from 'lucide-react';
import type { DashboardStats } from './types';

interface DemographicsCardProps {
  demographics: DashboardStats['demographics'];
}

const STUDENT_TYPE_LABELS: Record<string, string> = {
  NEW: 'Novos',
  RETURNING: 'Ex-alunos',
  CURRENT: 'Transferência',
};

const STUDENT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  NEW: { bg: 'bg-blue-100', text: 'text-blue-700' },
  RETURNING: { bg: 'bg-purple-100', text: 'text-purple-700' },
  CURRENT: { bg: 'bg-amber-100', text: 'text-amber-700' },
};

const NAT_COLORS = ['#0aacce', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export function DemographicsCard({ demographics }: DemographicsCardProps) {
  const d = demographics ?? {
    totalChildren: 0,
    avgChildrenPerFamily: 0,
    withSiblings: 0,
    withSpecialNeeds: 0,
    byStudentType: [],
    topNationalities: [],
  };

  const maxNat = d.topNationalities?.[0]?.count ?? 1;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Baby className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-900">{d.totalChildren}</p>
            <p className="text-xs text-neutral-500">Total de Alunos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-50 rounded-lg">
            <Users className="w-4 h-4 text-cyan-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-900">
              {(d.avgChildrenPerFamily ?? 0).toFixed(1)}
            </p>
            <p className="text-xs text-neutral-500">Média por Família</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-900">{d.withSiblings}</p>
            <p className="text-xs text-neutral-500">Com Irmãos na Escola</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Accessibility className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-900">{d.withSpecialNeeds}</p>
            <p className="text-xs text-neutral-500">Necessidades Especiais</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Student types */}
        {d.byStudentType?.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-3">
              Tipo de Aluno
            </p>
            <div className="flex flex-wrap gap-2">
              {d.byStudentType.map((t) => {
                const colors = STUDENT_TYPE_COLORS[t.type] ?? {
                  bg: 'bg-neutral-100',
                  text: 'text-neutral-700',
                };
                return (
                  <div
                    key={t.type}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colors.bg}`}
                  >
                    <span className={`text-sm font-bold ${colors.text}`}>{t.count}</span>
                    <span className={`text-xs font-medium ${colors.text}`}>
                      {STUDENT_TYPE_LABELS[t.type] ?? t.type}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top nationalities */}
        {d.topNationalities?.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-3">
              Principais Nacionalidades
            </p>
            <div className="space-y-2">
              {d.topNationalities.slice(0, 6).map((nat, idx) => (
                <div key={nat.nationality} className="flex items-center gap-2">
                  <span className="text-xs text-neutral-600 w-24 truncate">
                    {nat.nationality}
                  </span>
                  <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(nat.count / maxNat) * 100}%`,
                        background: NAT_COLORS[idx % NAT_COLORS.length],
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-neutral-700 w-6 text-right">
                    {nat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
