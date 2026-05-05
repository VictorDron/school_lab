import type { LeadSource, CommentType } from './leads';

// Source display configuration
export const sourceConfig: Record<LeadSource, { label: string; bgColor: string }> = {
  WEBSITE: { label: 'Website', bgColor: 'bg-blue-100' },
  REFERRAL: { label: 'Indicação', bgColor: 'bg-green-100' },
  SOCIAL_MEDIA: { label: 'Redes Sociais', bgColor: 'bg-pink-100' },
  EVENT: { label: 'Evento', bgColor: 'bg-purple-100' },
  ADVERTISEMENT: { label: 'Anúncio', bgColor: 'bg-orange-100' },
  WALK_IN: { label: 'Visita Espontânea', bgColor: 'bg-teal-100' },
  PHONE: { label: 'Telefone', bgColor: 'bg-cyan-100' },
  EMAIL: { label: 'Email', bgColor: 'bg-indigo-100' },
  OTHER: { label: 'Outro', bgColor: 'bg-gray-100' },
};

export const commentTypeConfig: Record<CommentType, { label: string; color: string; bgColor: string }> = {
  GENERAL: { label: 'Geral', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  POSITIVE: { label: 'Positivo', color: 'text-green-700', bgColor: 'bg-green-100' },
  CONCERN: { label: 'Atenção', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  INTERNAL: { label: 'Interno', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

// Grade options (re-exported from central constants)
export { gradeLabels as gradeOptions } from '@/constants/grades';

// Helper to get text color class from hex color
export function getTextColorFromHex(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? 'text-gray-900' : 'text-white';
}

// Helper to get lighter/darker shade of a color
export function adjustColorBrightness(hexColor: string, percent: number): string {
  const hex = hexColor.replace('#', '');
  const r = Math.min(255, Math.max(0, parseInt(hex.substring(0, 2), 16) + percent));
  const g = Math.min(255, Math.max(0, parseInt(hex.substring(2, 4), 16) + percent));
  const b = Math.min(255, Math.max(0, parseInt(hex.substring(4, 6), 16) + percent));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
