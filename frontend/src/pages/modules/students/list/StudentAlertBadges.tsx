interface StudentAlertBadgesProps {
  alerts:
    | {
        pendingDocs: boolean;
        contractExpiring: boolean;
        reEnrollmentPending: boolean;
      }
    | undefined;
}

const ALERT_CONFIG = [
  {
    key: 'pendingDocs' as const,
    color: 'bg-amber-400',
    title: 'Documentos pendentes',
  },
  {
    key: 'contractExpiring' as const,
    color: 'bg-red-400',
    title: 'Contrato vencendo',
  },
  {
    key: 'reEnrollmentPending' as const,
    color: 'bg-blue-400',
    title: 'Rematrícula pendente',
  },
];

export function StudentAlertBadges({ alerts }: StudentAlertBadgesProps) {
  if (!alerts) return null;

  const active = ALERT_CONFIG.filter((a) => alerts[a.key]);
  if (active.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {active.map((alert) => (
        <span
          key={alert.key}
          title={alert.title}
          className={`inline-block w-1.5 h-1.5 rounded-full ${alert.color}`}
        />
      ))}
    </div>
  );
}
