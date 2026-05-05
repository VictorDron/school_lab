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
  Link2,
  Send,
  Copy,
} from 'lucide-react';
import type { ElementType, ReactNode } from 'react';
import type { Lead, AdmissionGateStatus } from '@/types/crm';
import type { LeadProcessoCallbacks, LeadProcessoLoading } from './useLeadProcessoTab';

export interface BannerConfig {
  icon: ElementType;
  title: string;
  description: string;
  stepNumber: string;
  actions: ReactNode;
  color: string;
}

interface BuildArgs {
  lead: Lead;
  userRole: string;
  applicationLink: string | null;
  callbacks: LeadProcessoCallbacks;
  loading: LeadProcessoLoading;
}

export function getNextStepConfigs({
  lead,
  userRole,
  applicationLink,
  callbacks,
  loading,
}: BuildArgs): Partial<Record<AdmissionGateStatus, BannerConfig>> {
  const isAdmissionsApprover = userRole === 'ADMISSIONS' || userRole === 'ADMIN';

  return {
    NOT_STARTED: lead.applicationStatus === 'FORM_RECEIVED' ? {
      icon: Calendar,
      title: 'Agendar Visita',
      description: 'O formulário foi recebido. Agende uma visita para a família conhecer a escola.',
      stepNumber: 'Passo 2 de 5',
      color: 'border-blue-200 bg-blue-50',
      actions: (
        <button onClick={callbacks.onScheduleVisit} className="btn btn-primary btn-sm">
          <Calendar className="w-3.5 h-3.5" />
          Agendar Visita
        </button>
      ),
    } : !applicationLink ? {
      icon: Link2,
      title: 'Gerar e Enviar Formulário de Inscrição (F1)',
      description: 'O primeiro passo é gerar o link do formulário de inscrição e enviar ao responsável por e-mail. A família preencherá online e os dados serão recebidos automaticamente no sistema.',
      stepNumber: 'Passo 1 de 5',
      color: 'border-[#0aacce]/30 bg-[#0aacce]/5',
      actions: (
        <button
          onClick={callbacks.onGenerateLink}
          disabled={loading.generateLink}
          className="btn btn-primary btn-sm"
        >
          {loading.generateLink ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Link2 className="w-3.5 h-3.5" />
          )}
          Gerar Link de Inscrição
        </button>
      ),
    } : {
      icon: Clock,
      title: 'Aguardando Preenchimento do Formulário (F1)',
      description: 'O link de inscrição foi gerado. Envie-o ao responsável e aguarde o preenchimento do formulário.',
      stepNumber: 'Passo 1 de 5',
      color: 'border-yellow-200 bg-yellow-50',
      actions: (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={callbacks.onCopyLink}
            className="btn btn-sm border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
          >
            <Copy className="w-3.5 h-3.5" />
            Copiar Link
          </button>
          <button
            onClick={callbacks.onSendLinkEmail}
            disabled={loading.sendEmail}
            className="btn btn-primary btn-sm"
          >
            {loading.sendEmail ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Enviar por E-mail
          </button>
        </div>
      ),
    },

    FORM_RECEIVED: {
      icon: FileText,
      title: 'Aprovar Formulário de Inscrição',
      description: 'O formulário de inscrição foi preenchido pela família. Revise os dados na aba "Alunos" e aprove ou rejeite.',
      stepNumber: 'Passo 1 de 5 — Contato',
      color: 'border-blue-200 bg-blue-50',
      actions: isAdmissionsApprover ? (
        <div className="flex gap-2">
          <button
            onClick={() => callbacks.onDeptApprove('FORM_APPROVED', 'ADMISSIONS')}
            disabled={loading.deptApproval}
            className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {loading.deptApproval ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
              <><CheckCircle className="w-3.5 h-3.5" /> Aprovar Formulário</>
            )}
          </button>
          <button
            onClick={() => callbacks.onDeptReject('FORM_APPROVED', 'ADMISSIONS')}
            disabled={loading.deptApproval}
            className="btn btn-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
          >
            <XCircle className="w-3.5 h-3.5" /> Rejeitar
          </button>
        </div>
      ) : (
        <p className="text-xs text-blue-600 font-medium">Aguardando aprovação — Admissões</p>
      ),
    },

    FORM_APPROVED: {
      icon: Calendar,
      title: 'Agendar Visita à Escola',
      description: 'O formulário foi aprovado! O próximo passo é agendar uma visita para a família conhecer a escola.',
      stepNumber: 'Passo 2 de 5 — Pré Matrícula',
      color: 'border-blue-200 bg-blue-50',
      actions: (
        <button onClick={callbacks.onScheduleVisit} className="btn btn-primary btn-sm">
          <Calendar className="w-3.5 h-3.5" />
          Agendar Visita
        </button>
      ),
    },

    VISIT_SCHEDULED: {
      icon: Clock,
      title: 'Aguardando Visita',
      description: 'A visita está agendada. Quando a família vier, marque o evento como realizado na lista de eventos abaixo.',
      stepNumber: 'Passo 2 de 5 — Pré Matrícula',
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
      description: 'A visita foi realizada com sucesso. Aprove para prosseguir com o processo ou rejeite o lead.',
      stepNumber: 'Passo 2 de 5 — Pré Matrícula',
      color: 'border-green-200 bg-green-50',
      actions: isAdmissionsApprover ? (
        <div className="flex gap-2">
          <button
            onClick={() => callbacks.onDeptApprove('VISIT_APPROVED', 'ADMISSIONS')}
            disabled={loading.deptApproval}
            className="btn btn-sm bg-green-600 text-white hover:bg-green-700"
          >
            {loading.deptApproval ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
              <><CheckCircle className="w-3.5 h-3.5" /> Aprovar Visita</>
            )}
          </button>
          <button
            onClick={() => callbacks.onDeptReject('VISIT_APPROVED', 'ADMISSIONS')}
            disabled={loading.deptApproval}
            className="btn btn-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
          >
            <XCircle className="w-3.5 h-3.5" /> Rejeitar
          </button>
        </div>
      ) : (
        <p className="text-xs text-green-600 font-medium">Aguardando aprovação — Admissões</p>
      ),
    },

    INTERVIEW_COMPLETED: {
      icon: CheckCircle,
      title: 'Entrevista Realizada — Decisão',
      description: 'A entrevista foi concluída. Aprove para avançar à vivência ou rejeite o lead.',
      stepNumber: 'Passo 2 de 5 — Pré Matrícula',
      color: 'border-green-200 bg-green-50',
      actions: isAdmissionsApprover ? (
        <div className="flex gap-2">
          <button
            onClick={() => callbacks.onDeptApprove('VISIT_APPROVED', 'ADMISSIONS')}
            disabled={loading.deptApproval}
            className="btn btn-sm bg-green-600 text-white hover:bg-green-700"
          >
            {loading.deptApproval ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
              <><CheckCircle className="w-3.5 h-3.5" /> Aprovar</>
            )}
          </button>
          <button
            onClick={() => callbacks.onDeptReject('VISIT_APPROVED', 'ADMISSIONS')}
            disabled={loading.deptApproval}
            className="btn btn-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
          >
            <XCircle className="w-3.5 h-3.5" /> Rejeitar
          </button>
        </div>
      ) : (
        <p className="text-xs text-green-600 font-medium">Aguardando aprovação — Admissões</p>
      ),
    },

    VISIT_APPROVED: {
      icon: GraduationCap,
      title: 'Agendar Vivência',
      description: 'A visita foi aprovada! O próximo passo é agendar uma vivência escolar para o(s) aluno(s).',
      stepNumber: 'Passo 3 de 5 — Vivência',
      color: 'border-purple-200 bg-purple-50',
      actions: (
        <button onClick={callbacks.onScheduleVivencia} className="btn btn-primary btn-sm">
          <GraduationCap className="w-3.5 h-3.5" />
          Agendar Vivência
        </button>
      ),
    },

    DOCS_REQUESTED: {
      icon: FileText,
      title: 'Aguardando Documentação (F2)',
      description: 'A documentação F2 foi solicitada à família. Aguarde o envio dos documentos para avançar.',
      stepNumber: 'Passo 2 de 5 — Pré Matrícula',
      color: 'border-amber-200 bg-amber-50',
      actions: null,
    },

    DOCS_RECEIVED: {
      icon: GraduationCap,
      title: 'Documentos Recebidos — Agendar Vivência',
      description: 'Os documentos foram recebidos. O próximo passo é agendar uma vivência para o(s) aluno(s).',
      stepNumber: 'Passo 3 de 5 — Vivência',
      color: 'border-purple-200 bg-purple-50',
      actions: (
        <button onClick={callbacks.onScheduleVivencia} className="btn btn-primary btn-sm">
          <GraduationCap className="w-3.5 h-3.5" />
          Agendar Vivência
        </button>
      ),
    },

    VIVENCIA_SCHEDULED: {
      icon: Clock,
      title: 'Aguardando Vivência',
      description: 'A vivência está agendada. Quando concluída, marque o evento como realizado na lista abaixo.',
      stepNumber: 'Passo 3 de 5 — Vivência',
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
      title: 'Preencher Avaliação do Aluno',
      description: 'A vivência foi concluída. O professor deve preencher a avaliação de experiência de cada aluno.',
      stepNumber: 'Passo 3 de 5 — Vivência',
      color: 'border-orange-200 bg-orange-50',
      actions: (
        <button onClick={callbacks.onFillEvaluation} className="btn btn-primary btn-sm">
          <FileText className="w-3.5 h-3.5" />
          Preencher Avaliação
        </button>
      ),
    },

    EVALUATION_PENDING: {
      icon: FileText,
      title: 'Avaliações em Andamento',
      description: 'Preencha e decida as avaliações de cada aluno. Após todas decididas, o resultado será definido.',
      stepNumber: 'Passo 3 de 5 — Vivência',
      color: 'border-orange-200 bg-orange-50',
      actions: (
        <button onClick={callbacks.onFillEvaluation} className="btn btn-primary btn-sm">
          <FileText className="w-3.5 h-3.5" />
          Preencher Avaliação
        </button>
      ),
    },

    EVALUATION_COMPLETED: {
      icon: AlertCircle,
      title: 'Decisão Final das Avaliações',
      description: 'Todas as avaliações foram preenchidas. Aprove ou rejeite cada avaliação na seção abaixo para definir o resultado.',
      stepNumber: 'Passo 3 de 5 — Vivência',
      color: 'border-[#0aacce]/20 bg-[#0aacce]/5',
      actions: null,
    },

    APPROVED: {
      icon: CheckCircle,
      title: 'Aprovado — Enviar Link de Matrícula (F3)',
      description: 'O aluno foi aprovado! Gere o link de matrícula e envie para a família preencher o formulário F3.',
      stepNumber: 'Passo 4 de 5 — Matrícula',
      color: 'border-green-200 bg-green-50',
      actions: null,
    },

    ENROLLMENT_PENDING: {
      icon: Clock,
      title: 'Aguardando Matrícula',
      description: 'O link de matrícula foi enviado à família. Aguardando o preenchimento do formulário F3.',
      stepNumber: 'Passo 4 de 5 — Matrícula',
      color: 'border-yellow-200 bg-yellow-50',
      actions: null,
    },

    ENROLLMENT_COMPLETED: {
      icon: FileText,
      title: 'Matrícula Concluída — Criar Contrato',
      description: 'A família completou a matrícula! O próximo passo é criar e enviar o contrato. Vá na aba "Contrato".',
      stepNumber: 'Passo 5 de 5 — Contrato',
      color: 'border-emerald-200 bg-emerald-50',
      actions: null,
    },

    CONTRACT_PENDING: {
      icon: FileText,
      title: 'Contrato Pendente',
      description: 'O contrato está aguardando aprovação jurídica e financeira. Acompanhe na aba "Contrato".',
      stepNumber: 'Passo 5 de 5 — Contrato',
      color: 'border-amber-200 bg-amber-50',
      actions: null,
    },

    CONTRACT_SIGNED: {
      icon: CheckCircle,
      title: 'Contrato Assinado — Aguardando Financeiro',
      description: 'O contrato foi assinado. Aguardando a aprovação financeira final para concluir o processo.',
      stepNumber: 'Passo 5 de 5 — Contrato',
      color: 'border-green-200 bg-green-50',
      actions: null,
    },

    FINANCIAL_APPROVED: {
      icon: CheckCircle,
      title: 'Processo Concluído — Aluno Matriculado!',
      description: 'Todas as etapas foram concluídas com sucesso. O aluno está oficialmente matriculado!',
      stepNumber: 'Concluído',
      color: 'border-emerald-200 bg-emerald-50',
      actions: null,
    },
  };
}
