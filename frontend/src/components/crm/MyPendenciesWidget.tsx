import { useState } from 'react';
import { Bell, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMyPendingApprovals } from '@/hooks/useApprovalTasks';
import { DepartmentBadge } from './gates/DepartmentBadge';

interface MyPendenciesWidgetProps {
  onSelectLead?: (leadId: string) => void;
}

export function MyPendenciesWidget({ onSelectLead }: MyPendenciesWidgetProps) {
  const { data: rawTasks } = useMyPendingApprovals();
  const [expanded, setExpanded] = useState(false);

  // Filter valid tasks only (gateApproval with department and lead must exist)
  const tasks = (rawTasks ?? []).filter(
    (t) => t.gateApproval && t.gateApproval.department && t.gateApproval.lead,
  );

  if (tasks.length === 0) return null;

  // Unique departments for preview badges
  const departments = [...new Set(tasks.map((t) => t.gateApproval.department))];

  return (
    <div className="relative">
      {/* Compact bar */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50/80 border border-amber-200/50 hover:bg-amber-100/60 transition-colors"
      >
        <Bell className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-amber-800">
          Minhas Pendências
        </span>
        <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white leading-none">
          {tasks.length}
        </span>

        {/* Inline department badges when collapsed */}
        {!expanded && departments.length > 0 && (
          <div className="hidden sm:flex items-center gap-1 ml-1">
            {departments.slice(0, 4).map((dept) => (
              <DepartmentBadge key={dept} department={dept} />
            ))}
            {departments.length > 4 && (
              <span className="text-[10px] text-amber-600">+{departments.length - 4}</span>
            )}
          </div>
        )}

        {expanded ? (
          <ChevronUp className="w-3 h-3 text-amber-400 ml-auto flex-shrink-0" />
        ) : (
          <ChevronDown className="w-3 h-3 text-amber-400 ml-auto flex-shrink-0" />
        )}
      </button>

      {/* Dropdown */}
      {expanded && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto divide-y divide-neutral-100">
            {tasks.slice(0, 8).map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => {
                  onSelectLead?.(task.sourceLeadId);
                  setExpanded(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-neutral-50 transition-colors"
              >
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-800">
                  {task.gateApproval.lead.familyName}
                </span>
                <DepartmentBadge department={task.gateApproval.department} />
                <span className="shrink-0 text-[10px] text-neutral-400 tabular-nums">
                  {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true, locale: ptBR })}
                </span>
                <ArrowRight className="w-3 h-3 shrink-0 text-neutral-300" />
              </button>
            ))}
          </div>
          {tasks.length > 8 && (
            <div className="border-t border-neutral-100 px-3 py-1.5 text-center">
              <span className="text-[10px] text-neutral-400">
                +{tasks.length - 8} pendências
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
