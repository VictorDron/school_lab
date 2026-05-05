import type { ReactNode } from 'react';
import { Bell, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Lead } from '@/types/crm';
import { sourceConfig } from '@/types/crm';
import { ApplicationStatusBadge, type ApplicationStatusType } from '@/components/crm/badges/ApplicationStatusBadge';
import { SidebarSection } from '../SidebarSection';
import { getApplicationStatusLabel, preferenceOptions } from './helpers';

type NotificationPreferenceValue = 'PRIMARY' | 'MOTHER' | 'FATHER' | 'BOTH';

interface SidebarMetaProps {
  lead: Lead;
  canEdit: boolean;
  onNotificationPreferenceChange: (value: NotificationPreferenceValue) => void;
  updateLeadPending: boolean;
}

export function SidebarMeta({
  lead,
  canEdit,
  onNotificationPreferenceChange,
  updateLeadPending,
}: SidebarMetaProps) {
  return (
    <>
      {canEdit && (
        <SidebarSection
          title="Comunicações"
          icon={<Bell className="w-3.5 h-3.5 text-neutral-400" />}
          defaultOpen
        >
          <NotificationPreferenceSelector
            currentPreference={lead.notificationPreference || 'PRIMARY'}
            onChange={onNotificationPreferenceChange}
            isPending={updateLeadPending}
          />
        </SidebarSection>
      )}

      <SidebarSection
        title="Resumo"
        icon={<FileText className="w-3.5 h-3.5 text-neutral-400" />}
        defaultOpen
      >
        <div className="space-y-1.5">
          <SummaryRow label="Código">
            <span className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700">
              {lead.code}
            </span>
          </SummaryRow>

          <SummaryRow label="Origem">
            <span className="text-xs text-neutral-700">
              {sourceConfig[lead.source]?.label || lead.source}
            </span>
          </SummaryRow>

          <SummaryRow label="Criado">
            <span className="text-xs text-neutral-700">
              {formatDistanceToNow(new Date(lead.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </SummaryRow>

          {lead.creator && (
            <SummaryRow label="Criado por">
              <span className="text-xs text-neutral-700">{lead.creator.displayName}</span>
            </SummaryRow>
          )}

          <SummaryRow label="Filhos">
            <span className="text-xs text-neutral-700">{lead.numberOfChildren}</span>
          </SummaryRow>

          {lead.desiredGrades && lead.desiredGrades.length > 0 && (
            <SummaryRow label="Séries">
              <div className="flex flex-wrap gap-1 justify-end">
                {lead.desiredGrades.map((grade, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 bg-primary-100 text-primary-700 text-[10px] rounded-full font-medium"
                  >
                    {grade}
                  </span>
                ))}
              </div>
            </SummaryRow>
          )}

          {lead.applicationStatus && (
            <SummaryRow label="Status">
              <div className="flex items-center gap-1.5">
                <ApplicationStatusBadge
                  status={lead.applicationStatus as ApplicationStatusType}
                  compact
                />
                <span className="text-xs text-neutral-700">
                  {getApplicationStatusLabel(lead.applicationStatus)}
                </span>
              </div>
            </SummaryRow>
          )}
        </div>
      </SidebarSection>
    </>
  );
}

function NotificationPreferenceSelector({
  currentPreference,
  onChange,
  isPending,
}: {
  currentPreference: string;
  onChange: (value: NotificationPreferenceValue) => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] text-neutral-400 mb-1.5">
        Quem recebe emails e comunicacoes:
      </p>
      <div className="space-y-1">
        {preferenceOptions.map((option) => (
          <label
            key={option.value}
            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
              currentPreference === option.value
                ? 'bg-primary-50 text-primary-700'
                : 'hover:bg-neutral-50 text-neutral-600'
            }`}
          >
            <input
              type="radio"
              name="notificationPreference"
              value={option.value}
              checked={currentPreference === option.value}
              onChange={() => onChange(option.value)}
              disabled={isPending}
              className="w-3.5 h-3.5 accent-[#0aacce]"
            />
            <span className="text-xs">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-neutral-500">{label}</span>
      {children}
    </div>
  );
}
