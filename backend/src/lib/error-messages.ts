import { AppError } from '../middlewares/errorHandler.js';

interface ErrorDef {
  status: number;
  message: string;
}

export const ERROR_MESSAGES: Record<string, ErrorDef> = {
  // Contract errors
  CONTRACT_ALREADY_EXISTS: { status: 409, message: 'Já existe um contrato ativo para este lead.' },
  CONTRACT_NOT_FOUND: { status: 404, message: 'Contrato não encontrado.' },
  CONTRACT_ALREADY_SENT: { status: 409, message: 'Este contrato já foi enviado para assinatura.' },
  CONTRACT_NOT_FULLY_APPROVED: { status: 400, message: 'Contrato precisa ter aprovação jurídica e financeira antes do envio.' },
  CONTRACT_MISSING_REQUIRED_SIGNERS: { status: 400, message: 'Adicione ao menos 1 representante da escola e 2 testemunhas antes de enviar.' },
  CONTRACT_INVALID_STATUS: { status: 400, message: 'Contrato não está no status correto para esta operação.' },
  CONTRACT_LEGAL_NOT_APPROVED: { status: 400, message: 'Contrato precisa ter aprovação jurídica antes da aprovação financeira.' },
  CONTRACT_PDF_DOWNLOAD_FAILED: { status: 500, message: 'Falha ao baixar o PDF do contrato. Tente gerar o documento novamente.' },
  CONTRACT_PDF_UPLOAD_FAILED: { status: 500, message: 'Falha ao fazer upload do PDF do contrato.' },
  CONTRACT_CLICKSIGN_REUSE: { status: 200, message: 'Documento já existe no ClickSign e foi reaproveitado.' },
  CONTRACT_LEAD_NOT_FOUND: { status: 404, message: 'Lead do contrato não encontrado.' },

  // Signer errors
  SIGNER_NOT_FOUND: { status: 404, message: 'Signatário não encontrado neste contrato.' },

  // Lead errors
  LEAD_NOT_FOUND: { status: 404, message: 'Lead não encontrado.' },

  // Gate errors
  INVALID_GATE_TRANSITION: { status: 400, message: 'Transição de gate inválida.' },
  GATE_PENDING_APPROVALS: { status: 400, message: 'Este gate possui aprovações pendentes. Conclua todas as aprovações antes de avançar.' },
  EVALUATION_INCOMPLETE: { status: 400, message: 'Todos os filhos do lead devem ter avaliação concluída (aprovada ou rejeitada) antes de avançar o gate.' },

  // Evaluation errors
  EVALUATION_NOT_FOUND: { status: 404, message: 'Avaliação não encontrada.' },
  EVENT_NOT_FOUND: { status: 404, message: 'Evento não encontrado.' },
  EVENT_NOT_VIVENCIA: { status: 400, message: 'O evento selecionado não é do tipo vivência.' },
  CHILD_NOT_FOUND: { status: 404, message: 'Criança não encontrada para este lead.' },

  // Auth errors
  INSUFFICIENT_ROLE: { status: 403, message: 'Permissão insuficiente para esta operação.' },

  // ClickSign errors
  CLICKSIGN_NOT_CONFIGURED: { status: 400, message: 'ClickSign não configurado. Verifique a variável de ambiente CLICKSIGN_ACCESS_TOKEN.' },
  CLICKSIGN_SIGNER_INVALID_NAME: { status: 400, message: 'Um dos signatários possui nome incompleto. Todos devem ter nome e sobrenome (ex: "João Silva").' },
  CLICKSIGN_DOCUMENT_CREATION_FAILED: { status: 502, message: 'Falha ao criar documento no serviço de assinatura digital. Verifique o PDF e tente novamente.' },
  CLICKSIGN_SIGNER_CREATION_FAILED: { status: 502, message: 'Falha ao cadastrar signatário no serviço de assinatura digital. Verifique os dados e tente novamente.' },
  CLICKSIGN_ADD_SIGNER_FAILED: { status: 502, message: 'Falha ao vincular signatário ao documento. Tente novamente em alguns minutos.' },
  CLICKSIGN_API_ERROR: { status: 502, message: 'Falha na comunicação com o serviço de assinatura digital. Tente novamente em alguns minutos.' },

  // Student errors
  STUDENT_NOT_FOUND: { status: 404, message: 'Aluno não encontrado.' },
  STUDENT_INVALID_STATUS_TRANSITION: { status: 400, message: 'Transição de status inválida para este aluno.' },
  STUDENT_ALREADY_EXISTS: { status: 409, message: 'Já existe um registro de aluno para esta criança.' },
  UPLOAD_FAILED: { status: 500, message: 'Falha ao enviar arquivo.' },
  VALIDATION_ERROR: { status: 400, message: 'Erro de validação.' },

  // Re-enrollment errors
  PERIOD_NOT_FOUND: { status: 404, message: 'Campanha de rematrícula não encontrada.' },
  PERIOD_PRICE_LOCKED: { status: 400, message: 'Preços não podem ser alterados para campanhas encerradas.' },
  PRICE_TABLE_GRADE_NOT_FOUND: { status: 404, message: 'Valor não configurado para a série informada.' },
  PERIOD_ALREADY_OPEN: { status: 409, message: 'Já existe uma campanha de rematrícula aberta. Feche a campanha atual antes de abrir outra.' },
  INVALID_PERIOD_TRANSITION: { status: 400, message: 'Transição de status inválida para esta campanha.' },
  PERIOD_NOT_DRAFT: { status: 400, message: 'Somente campanhas em rascunho podem ser editadas.' },
  PERIOD_INVALID_DATES: { status: 400, message: 'A data de fim deve ser posterior à data de início.' },
  PERIOD_CANNOT_DELETE_OPEN: { status: 400, message: 'Campanhas abertas não podem ser excluídas. Feche a campanha primeiro.' },
  INVITE_NOT_FOUND: { status: 404, message: 'Convite de rematrícula não encontrado.' },
  INVITE_ALREADY_EXISTS: { status: 409, message: 'Já existe um convite para este aluno nesta campanha.' },
  INVALID_GATE_TRANSITION_REENROLLMENT: { status: 400, message: 'Transição de gate de rematrícula inválida.' },
  PERIOD_NOT_OPEN: { status: 400, message: 'A campanha de rematrícula não está aberta.' },

  // Re-enrollment batch & form errors
  BATCH_NO_ELIGIBLE_STUDENTS: { status: 404, message: 'Nenhum aluno elegível encontrado para esta campanha.' },
  BATCH_PERIOD_NOT_OPEN: { status: 400, message: 'A campanha deve estar aberta para enviar convites.' },
  FORM_ALREADY_CONFIRMED: { status: 409, message: 'Este formulário já foi confirmado.' },
  FORM_ALREADY_DECLINED: { status: 409, message: 'Este convite já foi recusado.' },
  FORM_PERIOD_CLOSED: { status: 400, message: 'A campanha de rematrícula foi encerrada.' },
  FORM_LGPD_REQUIRED: { status: 400, message: 'Você deve aceitar os termos LGPD para prosseguir.' },

  // Re-enrollment invite management errors
  INVITE_ALREADY_CONFIRMED: { status: 409, message: 'Este convite já foi confirmado e não pode ser reenviado.' },
  INVITE_CANNOT_CANCEL: { status: 400, message: 'Convites confirmados ou recusados não podem ser cancelados.' },
  INVITE_DEADLINE_PAST: { status: 400, message: 'A nova data limite deve ser no futuro.' },
  PERIOD_NOT_FOUND_FOR_REPORT: { status: 404, message: 'Campanha não encontrada para geração de relatório.' },

  // Re-enrollment contract errors
  RENEWAL_CONTRACT_ALREADY_EXISTS: { status: 409, message: 'Já existe um contrato de renovação ativo para este lead.' },
  RENEWAL_INVITE_NOT_CONFIRMED: { status: 400, message: 'O convite deve estar no status FORMULÁRIO_CONFIRMADO para criar contrato de renovação.' },
  RENEWAL_STUDENT_ALREADY_EXISTS: { status: 409, message: 'Já existe um registro de aluno para esta criança neste ano letivo.' },
  FEE_ALREADY_PAID: { status: 409, message: 'Entrada já foi registrada para este convite.' },
  DOCS_NOT_ALL_APPROVED: { status: 400, message: 'Existem documentos pendentes ou reprovados. Aprove todos antes de prosseguir.' },
  DOCUMENT_NOT_FOUND: { status: 404, message: 'Documento não encontrado para este aluno.' },
  REJECTION_REASON_REQUIRED: { status: 400, message: 'Motivo da reprovação é obrigatório.' },
};

/**
 * Creates an AppError from a known error code.
 * Falls back to 500 + generic message for unknown codes.
 */
export function createAppError(code: string, details?: string | Record<string, unknown>): AppError {
  const def = ERROR_MESSAGES[code];
  if (def) {
    if (typeof details === 'object') {
      return new AppError(def.status, def.message, code, details);
    }
    const msg = details ? `${def.message} ${details}` : def.message;
    return new AppError(def.status, msg, code);
  }
  return new AppError(500, 'Erro interno do servidor.', code);
}
