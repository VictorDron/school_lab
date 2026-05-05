import {
  Calendar,
  GraduationCap,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import type { ElementType, ReactNode } from 'react';
import type { Lead, AdmissionGateStatus } from '@/types/crm';
import type { LeadVivenciaCallbacks, LeadVivenciaLoading } from './useLeadVivenciaTab';

export interface BannerConfig {
  icon: ElementType;
  title: string;
  description: string;
  actions: ReactNode;
  color: string;
}

interface BuildArgs {
  lead: Lead;
  callbacks: LeadVivenciaCallbacks;
  loading: LeadVivenciaLoading;
}

export function getNextStepConfigs({
  lead,
  callbacks,
  loading,
}: BuildArgs): Partial<Record<AdmissionGateStatus, BannerConfig>> {
  const { onScheduleVisit, onScheduleVivencia, onApproveVisit, onRejectLead, onFillEvaluation } = callbacks;
  const { approve: approveLoading, reject: rejectLoading } = loading;

  return {
    NOT_STARTED: lead.applicationStatus === 'FORM_RECEIVED' ? {
      icon: Calendar,
      title: 'Agendar Visita',
      description: 'O formulário foi recebido. Agende uma visita para a família conhecer a escola.',
      color: 'border-blue-200 bg-blue-50',
      actions: (
        <button onClick={onScheduleVisit} className="btn btn-primary btn-sm">
          <Calendar className="w-3.5 h-3.5" />
          Agendar Visita
        </button>
      ),
    } : undefined,

    FORM_RECEIVED: {
      icon: FileText,
      title: 'Formulário Recebido',
      description: 'O formulário de inscrição foi preenchido. Analise os dados e aprove ou rejeite usando o painel acima.',
      color: 'border-blue-200 bg-blue-50',
      actions: null,
    },

    FORM_APPROVED: {
      icon: Calendar,
      title: 'Agendar Visita',
      description: 'O formulário foi aprovado! Agora agende uma visita para a família conhecer a escola.',
      color: 'border-blue-200 bg-blue-50',
      actions: (
        <button onClick={onScheduleVisit} className="btn btn-primary btn-sm">
          <Calendar className="w-3.5 h-3.5" />
          Agendar Visita
        </button>
      ),
    },

    VISIT_SCHEDULED: {
      icon: Clock,
      title: 'Aguardando Visita',
      description: 'A visita está agendada. Quando a família vier, marque o evento como realizado na lista abaixo.',
      color: 'border-yellow-200 bg-yellow-50',
      actions: (
        <p className="text-xs text-yellow-700 font-medium flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5" />
          Role para baixo e clique em "Marcar como Realizado" no evento de visita
        </p>
      ),
    },

    VISIT_COMPLETED: {
      icon: CheckCircle,
      title: 'Decisão sobre a Visita',
      description: 'A visita foi realizada. Aprove para prosseguir ou rejeite o lead.',
      color: 'border-green-200 bg-green-50',
      actions: (
        <div className="flex gap-2">
          <button
            onClick={onApproveVisit}
            disabled={approveLoading}
            className="btn btn-sm bg-green-600 text-white hover:bg-green-700"
          >
            {approveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
              <><CheckCircle className="w-3.5 h-3.5" /> Aprovar Visita</>
            )}
          </button>
          <button
            onClick={onRejectLead}
            disabled={rejectLoading}
            className="btn btn-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
          >
            <XCircle className="w-3.5 h-3.5" /> Rejeitar
          </button>
        </div>
      ),
    },

    INTERVIEW_COMPLETED: {
      icon: CheckCircle,
      title: 'Entrevista Realizada',
      description: 'A entrevista foi concluída. Aprove para prosseguir ou rejeite o lead.',
      color: 'border-green-200 bg-green-50',
      actions: (
        <div className="flex gap-2">
          <button
            onClick={onApproveVisit}
            disabled={approveLoading}
            className="btn btn-sm bg-green-600 text-white hover:bg-green-700"
          >
            {approveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
              <><CheckCircle className="w-3.5 h-3.5" /> Aprovar</>
            )}
          </button>
          <button
            onClick={onRejectLead}
            disabled={rejectLoading}
            className="btn btn-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
          >
            <XCircle className="w-3.5 h-3.5" /> Rejeitar
          </button>
        </div>
      ),
    },

    VISIT_APPROVED: {
      icon: GraduationCap,
      title: 'Agendar Vivência',
      description: 'A visita foi aprovada. Agende uma vivência para o(s) aluno(s).',
      color: 'border-purple-200 bg-purple-50',
      actions: (
        <button onClick={onScheduleVivencia} className="btn btn-primary btn-sm">
          <GraduationCap className="w-3.5 h-3.5" />
          Agendar Vivência
        </button>
      ),
    },

    DOCS_REQUESTED: {
      icon: FileText,
      title: 'Documentação Solicitada',
      description: 'A documentação F2 foi solicitada à família. Aguarde o envio e avance quando recebida.',
      color: 'border-amber-200 bg-amber-50',
      actions: null,
    },

    DOCS_RECEIVED: {
      icon: GraduationCap,
      title: 'Documentos Recebidos — Agendar Vivência',
      description: 'Os documentos foram recebidos e analisados. Agende uma vivência para o(s) aluno(s).',
      color: 'border-purple-200 bg-purple-50',
      actions: (
        <button onClick={onScheduleVivencia} className="btn btn-primary btn-sm">
          <GraduationCap className="w-3.5 h-3.5" />
          Agendar Vivência
        </button>
      ),
    },

    VIVENCIA_SCHEDULED: {
      icon: Clock,
      title: 'Aguardando Vivência',
      description: 'A vivência está agendada. Quando concluída, marque o evento como realizado na lista abaixo.',
      color: 'border-yellow-200 bg-yellow-50',
      actions: (
        <p className="text-xs text-yellow-700 font-medium flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5" />
          Role para baixo e clique em "Marcar como Realizado" no evento de vivência
        </p>
      ),
    },

    VIVENCIA_COMPLETED: {
      icon: FileText,
      title: 'Avaliação Pendente',
      description: 'A vivência foi concluída. O professor deve preencher a avaliação de cada aluno.',
      color: 'border-orange-200 bg-orange-50',
      actions: (
        <button onClick={onFillEvaluation} className="btn btn-primary btn-sm">
          <FileText className="w-3.5 h-3.5" />
          Preencher Avaliação
        </button>
      ),
    },

    EVALUATION_PENDING: {
      icon: FileText,
      title: 'Avaliações em Andamento',
      description: 'Preencha e decida as avaliações de cada aluno. Após todas decididas, o resultado será definido.',
      color: 'border-orange-200 bg-orange-50',
      actions: (
        <button onClick={onFillEvaluation} className="btn btn-primary btn-sm">
          <FileText className="w-3.5 h-3.5" />
          Preencher Avaliação
        </button>
      ),
    },

    EVALUATION_COMPLETED: {
      icon: AlertCircle,
      title: 'Decisão Final',
      description: 'Todas as avaliações foram preenchidas. Aprove ou rejeite cada avaliação na seção abaixo.',
      color: 'border-[#0aacce]/20 bg-[#0aacce]/5',
      actions: null,
    },

    APPROVED: {
      icon: CheckCircle,
      title: 'Aprovado — Aguardando Matrícula',
      description: 'O lead foi aprovado! Envie o link de matrícula (F3) para a família preencher.',
      color: 'border-green-200 bg-green-50',
      actions: null,
    },

    ENROLLMENT_PENDING: {
      icon: Clock,
      title: 'Matrícula Pendente',
      description: 'O link de matrícula foi enviado. Aguardando a família preencher o formulário F3.',
      color: 'border-yellow-200 bg-yellow-50',
      actions: null,
    },

    ENROLLMENT_COMPLETED: {
      icon: FileText,
      title: 'Matrícula Concluída — Criar Contrato',
      description: 'A família preencheu a matrícula. Vá na aba "Contrato" para criar e enviar o contrato.',
      color: 'border-emerald-200 bg-emerald-50',
      actions: null,
    },

    CONTRACT_PENDING: {
      icon: FileText,
      title: 'Contrato Pendente',
      description: 'O contrato está aguardando aprovação jurídica e financeira. Veja a aba "Contrato".',
      color: 'border-amber-200 bg-amber-50',
      actions: null,
    },

    CONTRACT_SIGNED: {
      icon: CheckCircle,
      title: 'Contrato Assinado',
      description: 'O contrato foi assinado. Aguardando aprovação financeira final.',
      color: 'border-green-200 bg-green-50',
      actions: null,
    },

    FINANCIAL_APPROVED: {
      icon: CheckCircle,
      title: 'Financeiro Aprovado — Matrícula Finalizada!',
      description: 'Todas as etapas foram concluídas. O aluno está matriculado!',
      color: 'border-emerald-200 bg-emerald-50',
      actions: null,
    },
  };
}
