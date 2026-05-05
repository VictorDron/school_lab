import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  UserPlus,
  RefreshCw,
  FileText,
  FileSignature,
  CheckCircle,
  DollarSign,
  GraduationCap,
  XCircle,
  ClipboardCheck,
  ArrowUpDown,
  Pencil,
  ImageIcon,
  Upload,
  Trash2,
  Heart,
  Bus,
  BookOpen,
  ShieldCheck,
  Phone,
  Users,
} from 'lucide-react';
import clsx from 'clsx';
import type { StudentHistory } from '@/types/students';

interface StudentHistoryTabProps {
  history: StudentHistory[];
}

interface HistoryEntryConfig {
  label: (details: Record<string, unknown> | null) => string;
  iconClass: string;
  icon: typeof UserPlus;
}

/* ── Field label translations (for DATA_UPDATED details) ── */
const FIELD_LABELS: Record<string, string> = {
  fullName: 'Nome completo',
  grade: 'Série',
  academicYear: 'Ano letivo',
  dateOfBirth: 'Data de nascimento',
  cpf: 'CPF',
  gender: 'Gênero',
  nationality: 'Nacionalidade',
  status: 'Status',
};

/* ── Document type translations ── */
const DOC_TYPE_LABELS: Record<string, string> = {
  OTHER: 'Outro',
  STUDENT_ID: 'RG do Aluno',
  STUDENT_CPF: 'CPF do Aluno',
  BIRTH_CERTIFICATE: 'Certidão de Nascimento',
  VACCINATION_CARD: 'Carteira de Vacinação',
  HEALTH_PLAN_CARD: 'Carteirinha do Plano',
  STUDENT_PHOTO: 'Foto 3x4 do Aluno',
  MEDICAL_REPORT: 'Laudo Médico',
  MOTHER_ID: 'RG da Mãe',
  MOTHER_CPF: 'CPF da Mãe',
  MOTHER_RESIDENCE: 'Comprovante de Residência (Mãe)',
  FATHER_ID: 'RG do Pai',
  FATHER_CPF: 'CPF do Pai',
  FATHER_RESIDENCE: 'Comprovante de Residência (Pai)',
  SCHOOL_DECLARATION: 'Declaração de Escolaridade',
  FINANCIAL_CLEARANCE: 'Declaração de Quitação Financeira',
  SCHOOL_TRANSCRIPT: 'Histórico Escolar',
};

function formatDocType(type: string): string {
  return DOC_TYPE_LABELS[type] ?? type;
}

/* ── ACTION_CONFIG — all known action types ── */
const ACTION_CONFIG: Record<string, HistoryEntryConfig> = {
  STUDENT_CREATED: {
    label: (d) => {
      if (d?.method === 'bulk_import') return 'Aluno cadastrado via importação em massa';
      return 'Aluno cadastrado';
    },
    iconClass: 'bg-green-100 text-green-600',
    icon: UserPlus,
  },
  STATUS_CHANGED: {
    label: (d) => {
      const prev = d?.previousStatus as string | undefined;
      const next = d?.newStatus as string | undefined;
      if (prev && next) return `Status alterado: ${prev} → ${next}`;
      return 'Status alterado';
    },
    iconClass: 'bg-blue-100 text-blue-600',
    icon: RefreshCw,
  },
  GRADE_PROMOTION: {
    label: (d) => {
      const prev = d?.previousGrade as string | undefined;
      const next = d?.newGrade as string | undefined;
      if (prev && next) return `Promoção de série: ${prev} → ${next}`;
      return 'Promoção de série';
    },
    iconClass: 'bg-purple-100 text-purple-600',
    icon: ArrowUpDown,
  },
  GRADE_CHANGED: {
    label: (d) => {
      const prev = d?.previousValue as string | undefined;
      const next = d?.newValue as string | undefined;
      const bulk = d?.bulk as boolean | undefined;
      let text = 'Série alterada';
      if (prev && next) text = `Série alterada: ${prev} → ${next}`;
      if (bulk) text += ' (em massa)';
      return text;
    },
    iconClass: 'bg-purple-100 text-purple-600',
    icon: ArrowUpDown,
  },
  DATA_UPDATED: {
    label: (d) => {
      const count = d?.fieldCount as number | undefined;
      if (count) return `Dados do aluno atualizados (${count} campo${count > 1 ? 's' : ''})`;
      return 'Dados do aluno atualizados';
    },
    iconClass: 'bg-violet-100 text-violet-600',
    icon: Pencil,
  },
  AVATAR_UPDATED: {
    label: () => 'Foto do aluno atualizada',
    iconClass: 'bg-teal-100 text-teal-600',
    icon: ImageIcon,
  },
  DOCUMENT_UPLOADED: {
    label: (d) => {
      const name = d?.fileName as string | undefined;
      return name ? `Documento enviado: ${name}` : 'Documento enviado';
    },
    iconClass: 'bg-amber-100 text-amber-600',
    icon: Upload,
  },
  DOCUMENT_APPROVED: {
    label: (d) => {
      const name = d?.fileName as string | undefined;
      return name ? `Documento aprovado: ${name}` : 'Documento aprovado';
    },
    iconClass: 'bg-green-100 text-green-600',
    icon: CheckCircle,
  },
  DOCUMENT_REJECTED: {
    label: (d) => {
      const name = d?.fileName as string | undefined;
      return name ? `Documento rejeitado: ${name}` : 'Documento rejeitado';
    },
    iconClass: 'bg-red-100 text-red-600',
    icon: XCircle,
  },
  DOCUMENT_TYPE_CHANGED: {
    label: (d) => {
      const prev = d?.previousType as string | undefined;
      const next = d?.newType as string | undefined;
      if (prev && next) return `Tipo de documento alterado: ${formatDocType(prev)} → ${formatDocType(next)}`;
      return 'Tipo de documento alterado';
    },
    iconClass: 'bg-blue-100 text-blue-600',
    icon: FileText,
  },
  DOCUMENT_DELETED: {
    label: (d) => {
      const name = d?.fileName as string | undefined;
      return name ? `Documento removido: ${name}` : 'Documento removido';
    },
    iconClass: 'bg-red-100 text-red-600',
    icon: Trash2,
  },
  HEALTH_DATA_UPDATED: {
    label: () => 'Dados de saúde atualizados',
    iconClass: 'bg-pink-100 text-pink-600',
    icon: Heart,
  },
  TRANSPORT_DATA_UPDATED: {
    label: () => 'Dados de transporte atualizados',
    iconClass: 'bg-orange-100 text-orange-600',
    icon: Bus,
  },
  ENROLLMENT_INFO_UPDATED: {
    label: () => 'Informações de matrícula atualizadas',
    iconClass: 'bg-cyan-100 text-cyan-600',
    icon: BookOpen,
  },
  HEALTH_PLAN_UPDATED: {
    label: () => 'Plano de saúde atualizado',
    iconClass: 'bg-pink-100 text-pink-600',
    icon: ShieldCheck,
  },
  EMERGENCY_CONTACT_UPDATED: {
    label: () => 'Contato de emergência atualizado',
    iconClass: 'bg-yellow-100 text-yellow-600',
    icon: Phone,
  },
  PARENT_DATA_UPDATED: {
    label: () => 'Dados do responsável atualizados',
    iconClass: 'bg-indigo-100 text-indigo-600',
    icon: Users,
  },

  /* ── Re-enrollment gate transitions ── */
  RE_ENROLLMENT_FORMULARIO_CONFIRMADO: {
    label: (d) => (d?.label as string) || 'Formulário de rematrícula preenchido',
    iconClass: 'bg-cyan-100 text-cyan-600',
    icon: FileText,
  },
  RE_ENROLLMENT_DOCS_APROVADOS: {
    label: (d) => (d?.label as string) || 'Documentos aprovados',
    iconClass: 'bg-indigo-100 text-indigo-600',
    icon: ClipboardCheck,
  },
  RE_ENROLLMENT_CONTRATO_PENDENTE: {
    label: (d) => (d?.label as string) || 'Contrato de rematrícula criado',
    iconClass: 'bg-amber-100 text-amber-600',
    icon: FileSignature,
  },
  RE_ENROLLMENT_CONTRATO_ASSINADO: {
    label: (d) => (d?.label as string) || 'Contrato de rematrícula assinado',
    iconClass: 'bg-emerald-100 text-emerald-600',
    icon: CheckCircle,
  },
  RE_ENROLLMENT_TAXA_PAGA: {
    label: (d) => (d?.label as string) || 'Pagamento da entrada registrado',
    iconClass: 'bg-green-100 text-green-600',
    icon: DollarSign,
  },
  RE_ENROLLMENT_REMATRICULADO: {
    label: (d) => (d?.label as string) || 'Rematrícula concluída',
    iconClass: 'bg-violet-100 text-violet-600',
    icon: GraduationCap,
  },
  RE_ENROLLMENT_RECUSADO: {
    label: (d) => (d?.label as string) || 'Rematrícula recusada',
    iconClass: 'bg-red-100 text-red-600',
    icon: XCircle,
  },
};

const DEFAULT_CONFIG: HistoryEntryConfig = {
  label: (details) =>
    (details?.label as string) ||
    (details?.description as string) ||
    'Evento registrado',
  iconClass: 'bg-neutral-100 text-neutral-500',
  icon: RefreshCw,
};

/* ── Contextual detail renderer ── */
function renderDetails(action: string, details: Record<string, unknown> | null) {
  if (!details) return null;

  switch (action) {
    case 'DATA_UPDATED': {
      const changes = details.changes as Record<string, { from: unknown; to: unknown }> | undefined;
      if (!changes || Object.keys(changes).length === 0) return null;
      return (
        <ul className="mt-1 space-y-0.5">
          {Object.entries(changes).map(([field, val]) => (
            <li key={field} className="text-xs text-neutral-500">
              {FIELD_LABELS[field] ?? field}: {String(val.from ?? '—')} → {String(val.to ?? '—')}
            </li>
          ))}
        </ul>
      );
    }
    case 'DOCUMENT_REJECTED': {
      const reason = details.rejectionReason as string | undefined;
      if (!reason) return null;
      return <p className="text-xs text-neutral-500 mt-1">Motivo da rejeição: {reason}</p>;
    }
    case 'GRADE_PROMOTION': {
      const prevYear = details.previousAcademicYear as number | undefined;
      const newYear = details.newAcademicYear as number | undefined;
      if (prevYear && newYear) {
        return <p className="text-xs text-neutral-500 mt-1">Ano letivo: {prevYear} → {newYear}</p>;
      }
      return null;
    }
    case 'DOCUMENT_UPLOADED': {
      const docType = details.documentType as string | undefined;
      if (docType && docType !== 'OTHER') {
        return <p className="text-xs text-neutral-500 mt-1">Tipo: {formatDocType(docType)}</p>;
      }
      return null;
    }
    default:
      return null;
  }
}

/* ── Component ── */
export function StudentHistoryTab({ history }: StudentHistoryTabProps) {
  if (history.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-neutral-500 italic">Nenhum histórico encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {history.map((entry, index) => {
        const config = ACTION_CONFIG[entry.action] ?? DEFAULT_CONFIG;
        const Icon = config.icon;
        const label = config.label(entry.details);
        const reason = entry.action !== 'DOCUMENT_REJECTED' ? (entry.details?.reason as string | undefined) : undefined;
        const isLast = index === history.length - 1;

        return (
          <div key={entry.id} className="flex gap-4">
            {/* Timeline column */}
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10',
                  config.iconClass
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-neutral-200 my-1" />}
            </div>

            {/* Content */}
            <div className={clsx('pb-6 flex-1', isLast && 'pb-0')}>
              <div className="bg-white border border-neutral-200 rounded-lg p-3">
                <p className="text-sm font-medium text-neutral-900">{label}</p>
                {renderDetails(entry.action, entry.details)}
                {reason && (
                  <p className="text-xs text-neutral-500 mt-1">Motivo: {reason}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs text-neutral-400">
                    {formatDistanceToNow(parseISO(entry.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                  {(entry.actorName || entry.actorId) && (
                    <>
                      <span className="text-neutral-300">·</span>
                      <p className="text-xs text-neutral-400">
                        {entry.actorName ?? 'Usuário removido'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
