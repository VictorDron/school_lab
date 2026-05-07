import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { teamApi, OrgChartNode } from '@/lib/api/team';
import { Avatar } from '@/components/ui/Avatar';

export default function OrgChartView() {
  const { data, isLoading } = useQuery({
    queryKey: ['team', 'org-chart'],
    queryFn: teamApi.getOrgChart,
  });

  return (
    <div className="max-w-[1320px] mx-auto px-6 lg:px-12 py-10">
      <header className="pb-8 border-b border-rule">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-iris mb-3">— iv. Hierarquia</div>
        <h1 className="font-display font-light text-ink leading-none" style={{ fontSize: 'clamp(36px, 4vw, 56px)', letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
          <em className="display-em">Organograma</em>
          <span className="text-iris">.</span>
        </h1>
        <p className="serif-em text-stone-deep mt-3" style={{ fontSize: 16 }}>
          — A escola por departamento, líder e time direto
        </p>
      </header>

      {isLoading ? (
        <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-deep" /></div>
      ) : !data || (data.roots.length === 0 && data.unassigned.length === 0) ? (
        <div className="py-20 text-center">
          <p className="serif-em text-stone-deep" style={{ fontSize: 18 }}>— Cadastre departamentos para ver o organograma.</p>
        </div>
      ) : (
        <div className="mt-10 space-y-6">
          {data.roots.map((root) => (
            <DepartmentNode key={root.id} node={root} depth={0} />
          ))}

          {data.unassigned.length > 0 && (
            <div className="border border-ink bg-paper p-7">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-deep mb-4">
                — Sem departamento ({data.unassigned.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.unassigned.map((emp) => (
                  <PersonChip key={emp.id} {...emp} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DepartmentNode({ node, depth }: { node: OrgChartNode; depth: number }) {
  return (
    <div className="border border-ink bg-paper">
      <div className="p-7">
        <div className="flex items-baseline justify-between mb-5">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-iris">
            — {depth === 0 ? 'Departamento' : `Sub · nível ${depth}`}
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-deep">
            {node.employees.length} colaborador{node.employees.length === 1 ? '' : 'es'}
          </span>
        </div>

        <h3 className="font-display font-light text-ink leading-none" style={{ fontSize: 32, letterSpacing: '-0.03em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
          <em className="display-em">{node.name}</em>
        </h3>

        {node.head && (
          <div className="flex items-center gap-3 mt-5 pt-5 border-t border-rule">
            <Avatar src={node.head.avatarUrl} name={node.head.displayName} size="md" />
            <div>
              <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-iris">— Líder</div>
              <div className="text-base font-medium text-ink">{node.head.displayName}</div>
            </div>
          </div>
        )}

        {node.employees.length > 0 && (
          <div className="mt-5 pt-5 border-t border-rule">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-deep mb-3">— Time</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {node.employees.map((emp) => (
                <PersonChip key={emp.id} {...emp} />
              ))}
            </div>
          </div>
        )}
      </div>

      {node.children.length > 0 && (
        <div className="border-t border-ink bg-paper-deep p-5 space-y-4">
          {node.children.map((child) => (
            <DepartmentNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function PersonChip({
  displayName,
  avatarUrl,
  position,
  role,
}: {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  position: { name: string } | null;
}) {
  return (
    <div className="flex items-center gap-2.5 p-2 border border-rule bg-paper hover:border-ink transition-colors">
      <Avatar src={avatarUrl} name={displayName} size="sm" />
      <div className="min-w-0">
        <div className="text-sm font-medium text-ink truncate">{displayName}</div>
        <div className="text-[11px] text-stone-deep truncate">{position?.name ?? role}</div>
      </div>
    </div>
  );
}
