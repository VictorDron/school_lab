export const PRESET_COLORS = [
  "#3B82F6",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#8B5CF6",
  "#EC4899",
];

export const REMINDER_OPTIONS = [
  { label: "5 min", value: 5 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hora", value: 60 },
  { label: "1 dia", value: 1440 },
];

export const EVENT_TYPE_OPTIONS = [
  { label: "Reunião", value: "MEETING" },
  { label: "Prazo", value: "DEADLINE" },
  { label: "Lembrete", value: "REMINDER" },
  { label: "Personalizado", value: "CUSTOM" },
] as const;

export const FREQUENCY_OPTIONS = [
  { label: "Diário", value: "DAILY" },
  { label: "Semanal", value: "WEEKLY" },
  { label: "Mensal", value: "MONTHLY" },
  { label: "Anual", value: "YEARLY" },
] as const;

export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
