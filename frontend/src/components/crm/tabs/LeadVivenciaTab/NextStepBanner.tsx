import type { Lead, AdmissionGateStatus } from '@/types/crm';
import { getNextStepConfigs } from './nextStepConfigs';
import type { LeadVivenciaCallbacks, LeadVivenciaLoading } from './useLeadVivenciaTab';

interface NextStepBannerProps {
  gate: AdmissionGateStatus;
  lead: Lead;
  canEdit: boolean;
  callbacks: LeadVivenciaCallbacks;
  loading: LeadVivenciaLoading;
}

export function NextStepBanner({ gate, lead, canEdit, callbacks, loading }: NextStepBannerProps) {
  if (!canEdit || gate === 'REJECTED' || gate === 'ENROLLED') return null;

  const configs = getNextStepConfigs({ lead, callbacks, loading });
  const config = configs[gate];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <section className={`rounded-lg border p-3 ${config.color}`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-neutral-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-neutral-800">{config.title}</h4>
          <p className="text-xs text-neutral-600 mt-0.5">{config.description}</p>
          {config.actions && (
            <div className="mt-2.5">
              {config.actions}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
