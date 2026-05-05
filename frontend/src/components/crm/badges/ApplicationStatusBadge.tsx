import { Clock, Send, CheckCircle2, Ban, FileText, User } from 'lucide-react';

export type ApplicationStatusType = 'PENDING' | 'LINK_SENT' | 'FORM_RECEIVED' | 'NOT_REQUIRED';
export type LeadOriginType = 'ADMIN_CREATED' | 'IMPORTED';

interface ApplicationStatusBadgeProps {
  status: ApplicationStatusType;
  compact?: boolean;
}

const statusConfig: Record<ApplicationStatusType, {
  label: string;
  labelPt: string;
  color: string;
  bgColor: string;
  icon: typeof Clock;
}> = {
  PENDING: {
    label: 'Awaiting Link',
    labelPt: 'Aguardando Envio',
    color: 'text-neutral-600',
    bgColor: 'bg-neutral-100',
    icon: Clock,
  },
  LINK_SENT: {
    label: 'Link Sent',
    labelPt: 'Link Enviado',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: Send,
  },
  FORM_RECEIVED: {
    label: 'Form Received',
    labelPt: 'Formulário Recebido',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle2,
  },
  NOT_REQUIRED: {
    label: 'Complete',
    labelPt: 'Completo',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: Ban,
  },
};

export function ApplicationStatusBadge({ status, compact = false }: ApplicationStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;

  if (compact) {
    return (
      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${config.bgColor}`} title={config.labelPt}>
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.labelPt}
    </span>
  );
}

interface OriginBadgeProps {
  origin: LeadOriginType;
  compact?: boolean;
}

const originConfig: Record<LeadOriginType, {
  label: string;
  labelPt: string;
  color: string;
  bgColor: string;
  icon: typeof User;
}> = {
  ADMIN_CREATED: {
    label: 'Admin Created',
    labelPt: 'Criado por Admin',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: User,
  },
  IMPORTED: {
    label: 'Imported',
    labelPt: 'Importado',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    icon: FileText,
  },
};

export function OriginBadge({ origin, compact = false }: OriginBadgeProps) {
  const config = originConfig[origin] || originConfig.ADMIN_CREATED;
  const Icon = config.icon;

  if (compact) {
    return (
      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${config.bgColor}`} title={config.labelPt}>
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.labelPt}
    </span>
  );
}
