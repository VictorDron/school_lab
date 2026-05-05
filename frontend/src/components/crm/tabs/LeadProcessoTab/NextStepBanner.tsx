import { Clock } from 'lucide-react';
import type { Lead, AdmissionGateStatus } from '@/types/crm';
import { buildApplicationLink, stepLabels } from './helpers';
import { getNextStepConfigs, type BannerConfig } from './nextStepConfigs';
import type { LeadProcessoCallbacks, LeadProcessoLoading } from './useLeadProcessoTab';

interface NextStepBannerProps {
  gate: AdmissionGateStatus;
  lead: Lead;
  canEdit: boolean;
  userRole: string;
  callbacks: LeadProcessoCallbacks;
  loading: LeadProcessoLoading;
}

export function NextStepBanner({ gate, lead, canEdit, userRole, callbacks, loading }: NextStepBannerProps) {
  if (!canEdit || gate === 'REJECTED' || gate === 'ENROLLED') return null;

  const applicationLink = buildApplicationLink(lead.applicationToken);

  const configs = getNextStepConfigs({ lead, userRole, applicationLink, callbacks, loading });

  // Fallback: if the gate status has no explicit config, show a generic banner
  // so the user always sees the current step instead of an empty space.
  const config: BannerConfig = configs[gate] ?? {
    icon: Clock,
    title: stepLabels[gate] || gate,
    description: 'Acompanhe o progresso na jornada de matrícula abaixo.',
    stepNumber: '',
    color: 'border-neutral-200 bg-neutral-50',
    actions: null,
  };

  const Icon = config.icon;

  return (
    <section className={`rounded-lg border-2 p-4 ${config.color}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Icon className="w-4.5 h-4.5 text-neutral-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Próximo Passo
            </span>
            {config.stepNumber && (
              <span className="text-[10px] font-medium text-neutral-400">
                • {config.stepNumber}
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-neutral-900">{config.title}</h4>
          <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{config.description}</p>
          {config.actions && (
            <div className="mt-3">
              {config.actions}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
