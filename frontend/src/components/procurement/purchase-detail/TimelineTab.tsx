import { Clock, ChevronRight } from 'lucide-react';
import { ACTION_TIMELINE_CONFIG, STATUS_LABELS, formatRelative } from './constants';
import type { PurchaseRequest, PurchaseStatus, ApprovalAction } from '@/types/procurement';

// ── Component ─────────────────────────────────────────────────────────────────

export function TimelineTab({ purchase }: { purchase: PurchaseRequest }) {
  const actions = purchase.approvalActions || [];

  if (actions.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-12 text-neutral-500">
          <Clock className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
          <p className="text-sm">Nenhuma ação registrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-neutral-200" />

        <div className="space-y-6">
          {actions.map((action: ApprovalAction) => {
            const config = ACTION_TIMELINE_CONFIG[action.action] || {
              icon: ChevronRight,
              color: 'text-neutral-400 bg-neutral-100',
            };
            const Icon = config.icon;

            return (
              <div key={action.id} className="relative flex gap-4">
                {/* Icon circle */}
                <div
                  className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-neutral-900">
                      {action.user.displayName}
                    </p>
                    <span className="text-xs text-neutral-400 whitespace-nowrap flex-shrink-0">
                      {formatRelative(action.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {STATUS_LABELS[action.previousStatus as PurchaseStatus] || action.previousStatus}
                    {' '}
                    <ChevronRight className="w-3 h-3 inline-block" />
                    {' '}
                    {STATUS_LABELS[action.newStatus as PurchaseStatus] || action.newStatus}
                  </p>
                  {action.comments && (
                    <div className="mt-2 p-2 bg-neutral-50 rounded-lg text-sm text-neutral-700 border border-neutral-100">
                      {action.comments}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
