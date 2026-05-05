import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/index.js';
import { getPaginationParams } from '../utils/helpers.js';
import * as PeriodService from '../services/re-enrollment-period.service.js';
import * as InviteService from '../services/re-enrollment-invite.service.js';
import * as GateService from '../services/re-enrollment-gate.service.js';
import * as EligibilityService from '../services/re-enrollment-eligibility.service.js';
import * as AnalyticsService from '../services/re-enrollment-analytics.service.js';
import {
  getInviteRenewalContract,
  listInviteDocuments as listInviteDocumentsFromService,
} from '../services/re-enrollment-invite.service.js';
import * as CommService from '../services/re-enrollment-communication.service.js';
import * as FinancialService from '../services/re-enrollment-financial.service.js';
import * as KanbanService from '../services/re-enrollment-kanban.service.js';
import * as DetailService from '../services/re-enrollment-detail.service.js';
import * as DocumentService from '../services/re-enrollment-document.service.js';
import * as ContractService from '../services/contract.service.js';
import { generateCSV } from '../lib/csv-export.js';
import { ContractSignerRole } from '@prisma/client';
import logger from '../utils/logger.js';

const createPeriodSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres.').max(100)
    .transform((val) => val.replace(/<[^>]*>/g, '').trim()),
  targetYear: z.number().int().min(2024).max(2100),
  startDate: z.string().datetime({ message: 'Data de início inválida.' }),
  endDate: z.string().datetime({ message: 'Data de fim inválida.' }),
  eligibleGrades: z.array(z.string()).default([]),
});

const transitionPeriodSchema = z.object({
  status: z.enum(['OPEN', 'CLOSED', 'FINALIZED']),
});

const createInviteSchema = z.object({
  studentId: z.string().uuid('ID do aluno inválido.'),
});

const transitionGateSchema = z.object({
  gateStatus: z.enum([
    'FORMULARIO_CONFIRMADO',
    'DOCS_APROVADOS',
    'CONTRATO_PENDENTE',
    'CONTRATO_ASSINADO',
    'TAXA_PAGA',
    'REMATRICULADO',
  ]),
});

const createRenewalContractSchema = z.object({
  leadId: z.string().uuid('ID do lead inválido.'),
  totalAnnualValue: z.number({ required_error: 'Valor anual obrigatório.' }).positive('Valor anual deve ser positivo.'),
  installments: z.number().int().min(1, 'Mínimo 1 parcela.').max(12, 'Máximo 12 parcelas.'),
  discountPercent: z.number().min(0).max(100).optional(),
  enrollmentFee: z.number().optional(),
  templateVersion: z.string().optional(),
  signers: z.array(z.object({
    role: z.nativeEnum(ContractSignerRole),
    name: z.string().min(2, 'Nome do signatário deve ter ao menos 2 caracteres.'),
    email: z.string().email('E-mail do signatário inválido.'),
    cpf: z.string().optional(),
    phone: z.string().optional(),
  })).min(1, 'Ao menos um signatário é obrigatório.'),
  paymentStartDate: z.string().optional(),
  negotiatedDiscountPercent: z.number().min(0).max(100).optional(),
  negotiatedFinalValue: z.number().positive().optional(),
  negotiationJustification: z.string().max(500).optional(),
  negotiationApprovedById: z.string().uuid().optional(),
  sendForSignature: z.boolean().optional(),
});

const registerFeePaymentSchema = z.object({
  amountPaid: z.number({ required_error: 'Valor obrigatório.' }).positive('Valor deve ser positivo.'),
  paymentDate: z.string().datetime({ message: 'Data de pagamento inválida.' }),
  paymentMethod: z.enum(['PIX', 'TRANSFERENCIA', 'BOLETO', 'CARTAO', 'DINHEIRO'], {
    errorMap: () => ({ message: 'Forma de pagamento inválida.' }),
  }),
});

function handleError(err: unknown, res: Response, context: string) {
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos.',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  const appErr = err as any;
  if (appErr?.statusCode) {
    const body: Record<string, unknown> = { success: false, error: appErr.message, code: appErr.code };
    if (appErr.details) {
      body.details = appErr.details;
    }
    return res.status(appErr.statusCode).json(body);
  }

  logger.error(`Re-enrollment ${context} failed`, { error: (err as Error).message });
  res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
}

export async function createPeriod(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createPeriodSchema.parse(req.body);

    if (new Date(data.endDate) <= new Date(data.startDate)) {
      return res.status(400).json({
        success: false,
        error: 'A data de fim deve ser posterior à data de início.',
      });
    }

    const period = await PeriodService.createPeriod(
      {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
      req.user!.id,
    );

    res.status(201).json({ success: true, data: period });
  } catch (err) {
    handleError(err, res, 'createPeriod');
  }
}

export async function listPeriods(req: AuthenticatedRequest, res: Response) {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const { status, targetYear } = req.query;

    const filters: PeriodService.PeriodFilters = {
      ...(status ? { status: status as PeriodService.PeriodFilters['status'] } : {}),
      ...(targetYear ? { targetYear: parseInt(targetYear as string, 10) } : {}),
    };

    const result = await PeriodService.findManyPeriods(filters, { page, limit });

    res.json({
      success: true,
      data: result.periods,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    handleError(err, res, 'listPeriods');
  }
}

export async function getPeriod(req: AuthenticatedRequest, res: Response) {
  try {
    const period = await PeriodService.findPeriodById(req.params.id);

    res.json({ success: true, data: period });
  } catch (err) {
    handleError(err, res, 'getPeriod');
  }
}

export async function getKanbanView(req: AuthenticatedRequest, res: Response) {
  try {
    const payload = await KanbanService.getKanbanView(req.params.periodId);
    res.json({ success: true, data: payload });
  } catch (err) {
    handleError(err, res, 'getKanbanView');
  }
}

export async function transitionPeriod(req: AuthenticatedRequest, res: Response) {
  try {
    const data = transitionPeriodSchema.parse(req.body);

    await PeriodService.transitionPeriod(req.params.id, data.status, req.user!.id);

    res.json({ success: true, data: { message: 'Status atualizado com sucesso.' } });
  } catch (err) {
    handleError(err, res, 'transitionPeriod');
  }
}

const updatePeriodSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres.').max(100)
    .transform((val) => val.replace(/<[^>]*>/g, '').trim()).optional(),
  targetYear: z.number().int().min(2024).max(2100).optional(),
  startDate: z.string().datetime({ message: 'Data de início inválida.' }).optional(),
  endDate: z.string().datetime({ message: 'Data de fim inválida.' }).optional(),
});

export async function updatePeriod(req: AuthenticatedRequest, res: Response) {
  try {
    const data = updatePeriodSchema.parse(req.body);

    const updateData: PeriodService.UpdatePeriodData = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.targetYear !== undefined && { targetYear: data.targetYear }),
      ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
    };

    const period = await PeriodService.updatePeriod(req.params.id, updateData, req.user!.id);

    res.json({ success: true, data: period });
  } catch (err) {
    handleError(err, res, 'updatePeriod');
  }
}

export async function deletePeriod(req: AuthenticatedRequest, res: Response) {
  try {
    await PeriodService.deletePeriod(req.params.id, req.user!.id);

    res.json({ success: true, data: { message: 'Campanha excluída com sucesso.' } });
  } catch (err) {
    handleError(err, res, 'deletePeriod');
  }
}

export async function createInvite(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createInviteSchema.parse(req.body);

    const invite = await InviteService.createInvite(req.params.periodId, data.studentId);

    res.status(201).json({ success: true, data: invite });
  } catch (err) {
    handleError(err, res, 'createInvite');
  }
}

export async function listInvites(req: AuthenticatedRequest, res: Response) {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const { status, gateStatus, grade } = req.query;

    const filters = {
      ...(status ? { status: status as string } : {}),
      ...(gateStatus ? { gateStatus: gateStatus as string } : {}),
      ...(grade ? { grade: grade as string } : {}),
    };

    const result = await InviteService.findManyInvitesByPeriod(req.params.periodId, filters, { page, limit });

    res.json({
      success: true,
      data: result.data,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    });
  } catch (err) {
    handleError(err, res, 'listInvites');
  }
}

export async function transitionGate(req: AuthenticatedRequest, res: Response) {
  try {
    const data = transitionGateSchema.parse(req.body);

    await GateService.transitionGate(req.params.id, data.gateStatus, req.user!.id);

    res.json({ success: true, data: { message: 'Gate atualizado com sucesso.' } });
  } catch (err) {
    handleError(err, res, 'transitionGate');
  }
}

export async function listUnifiedManagement(req: AuthenticatedRequest, res: Response) {
  try {
    const { periodId } = req.params;
    const { status, gateStatus, grade, unified } = req.query;
    // This endpoint returns all eligible students merged with invite data.
    // Client-side search needs the full dataset, so we allow a higher limit (up to 1000).
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit as string) || 500));

    const filters = {
      ...(status ? { status: status as string } : {}),
      ...(gateStatus ? { gateStatus: gateStatus as string } : {}),
      ...(grade ? { grade: grade as string } : {}),
      ...(unified ? { unified: unified as string } : {}),
    };

    const result = await EligibilityService.findUnifiedManagement(periodId, filters, { page, limit });

    res.json({
      success: true,
      data: result.data,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        ...result.meta,
      },
    });
  } catch (err) {
    handleError(err, res, 'listUnifiedManagement');
  }
}

export async function listEligibleStudents(req: AuthenticatedRequest, res: Response) {
  try {
    const { periodId } = req.params;
    const { eligible, alreadyInvited } = await EligibilityService.findEligibleStudents(periodId);

    res.json({
      success: true,
      data: eligible.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        grade: s.grade,
        code: s.code,
        leadEmail: s.lead?.primaryContactEmail,
        childName: s.child?.fullName,
      })),
      meta: { total: eligible.length, alreadyInvited },
    });
  } catch (err) {
    handleError(err, res, 'listEligibleStudents');
  }
}

export async function batchCreateInvites(req: AuthenticatedRequest, res: Response) {
  try {
    const { periodId } = req.params;
    const result = await EligibilityService.createBatchInvites(periodId, req.user!.id);

    res.json({
      success: true,
      data: result,
      meta: {
        message: result.created > 0
          ? `${result.created} convite(s) enviado(s) com sucesso.`
          : 'Nenhum novo convite foi criado.',
      },
    });
  } catch (err) {
    handleError(err, res, 'batchCreateInvites');
  }
}

export async function createRenewalContract(req: AuthenticatedRequest, res: Response) {
  try {
    const { id: inviteId } = req.params;
    const data = createRenewalContractSchema.parse(req.body);

    const contract = await ContractService.createRenewalContract(
      data.leadId,
      inviteId,
      {
        totalAnnualValue: data.totalAnnualValue,
        installments: data.installments,
        discountPercent: data.discountPercent,
        enrollmentFee: data.enrollmentFee,
        templateVersion: data.templateVersion,
        signers: data.signers,
        paymentStartDate: data.paymentStartDate,
        negotiatedDiscountPercent: data.negotiatedDiscountPercent,
        negotiatedFinalValue: data.negotiatedFinalValue,
        negotiationJustification: data.negotiationJustification,
        negotiationApprovedById: data.negotiationApprovedById,
      },
      req.user!.id,
    );

    // Optionally send for signature immediately
    if (req.body.sendForSignature && contract.id) {
      try {
        await ContractService.sendForSignature(contract.id, req.user!.id);
      } catch (signErr) {
        // Non-fatal — contract created, signature can be sent later
        logger.warn('Auto send-for-signature failed after contract creation', {
          contractId: contract.id,
          error: (signErr as Error).message,
        });
      }
    }

    res.status(201).json({ success: true, data: contract });
  } catch (err) {
    handleError(err, res, 'createRenewalContract');
  }
}

const batchCreateContractsSchema = z.object({
  inviteIds: z.array(z.string().uuid('ID de convite inválido.')).min(1, 'Selecione ao menos um convite.'),
  sendForSignature: z.boolean().default(true),
});

export async function batchCreateContracts(req: AuthenticatedRequest, res: Response) {
  try {
    const { periodId } = req.params;
    const data = batchCreateContractsSchema.parse(req.body);

    const result = await ContractService.createBatchRenewalContracts(
      periodId,
      data.inviteIds,
      data.sendForSignature,
      req.user!.id,
    );

    res.status(201).json({
      success: true,
      data: result,
      meta: {
        message: result.created > 0
          ? `${result.created} de ${result.total} contrato(s) criado(s) com sucesso.`
          : 'Nenhum contrato foi criado.',
      },
    });
  } catch (err) {
    handleError(err, res, 'batchCreateContracts');
  }
}

export async function getInviteContract(req: AuthenticatedRequest, res: Response) {
  try {
    const contract = await getInviteRenewalContract(req.params.id);
    return res.json({ success: true, data: contract });
  } catch (err) {
    handleError(err, res, 'getInviteContract');
  }
}

// --- Phase 10 Plan 03: Dashboard, Actions, Report, Reminders, Timeline ---

const extendDeadlineSchema = z.object({
  newDeadline: z.string().datetime({ message: 'Data limite inválida.' }).refine(
    (val) => new Date(val) > new Date(),
    { message: 'A nova data limite deve ser no futuro.' }
  ),
});

const scheduleRemindersSchema = z.object({
  intervalMs: z.number().int().positive().optional(),
});

export async function getDashboardStats(req: AuthenticatedRequest, res: Response) {
  try {
    const { periodId } = req.params;
    const grade = req.query.grade as string | undefined;

    const stats = await AnalyticsService.getPeriodDashboardStats(periodId, grade ? { grade } : undefined);

    res.json({ success: true, data: stats });
  } catch (err) {
    handleError(err, res, 'getDashboardStats');
  }
}

export async function resendInvite(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    await CommService.resendInvite(id, req.user!.id);

    res.json({ success: true, data: { message: 'Convite reenviado com sucesso.' } });
  } catch (err) {
    handleError(err, res, 'resendInvite');
  }
}

export async function cancelInvite(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    await CommService.cancelInvite(id, req.user!.id);

    res.json({ success: true, data: { message: 'Convite cancelado com sucesso.' } });
  } catch (err) {
    handleError(err, res, 'cancelInvite');
  }
}

export async function extendInviteDeadline(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = extendDeadlineSchema.parse(req.body);

    await CommService.extendInviteDeadline(id, new Date(data.newDeadline), req.user!.id);

    res.json({ success: true, data: { message: 'Prazo estendido com sucesso.' } });
  } catch (err) {
    handleError(err, res, 'extendInviteDeadline');
  }
}

export async function getPeriodReport(req: AuthenticatedRequest, res: Response) {
  try {
    const { periodId } = req.params;

    const report = await AnalyticsService.generatePeriodReport(periodId);

    res.json({ success: true, data: report });
  } catch (err) {
    handleError(err, res, 'getPeriodReport');
  }
}

export async function exportPeriodReport(req: AuthenticatedRequest, res: Response) {
  try {
    const { periodId } = req.params;

    const report = await AnalyticsService.generatePeriodReport(periodId);

    const allInvites = [
      ...report.confirmed,
      ...report.declined,
      ...report.expired,
      ...report.nonResponded,
    ];

    const headers = ['Aluno', 'Série', 'Família', 'Contato', 'Status', 'Motivo'];
    const rows = allInvites.map((inv: any) => ({
      'Aluno': inv.student?.child?.fullName || inv.student?.fullName || '',
      'Série': inv.student?.grade || '',
      'Família': inv.student?.lead?.familyName || '',
      'Contato': inv.student?.lead?.primaryContactName || '',
      'Status': inv.status || '',
      'Motivo': inv.declineReason || '',
    }));

    const csv = generateCSV(rows, headers);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-rematricula-${periodId}.csv"`);
    res.send(csv);
  } catch (err) {
    handleError(err, res, 'exportPeriodReport');
  }
}

export async function scheduleReminders(req: AuthenticatedRequest, res: Response) {
  try {
    const { periodId } = req.params;
    const data = scheduleRemindersSchema.parse(req.body);

    await CommService.scheduleReminders(periodId, data.intervalMs);

    res.json({ success: true, data: { message: 'Lembretes agendados com sucesso.' } });
  } catch (err) {
    handleError(err, res, 'scheduleReminders');
  }
}

export async function removeReminders(req: AuthenticatedRequest, res: Response) {
  try {
    const { periodId } = req.params;

    await CommService.removeReminders(periodId);

    res.json({ success: true, data: { message: 'Lembretes removidos com sucesso.' } });
  } catch (err) {
    handleError(err, res, 'removeReminders');
  }
}

export async function getPeriodTimeline(req: AuthenticatedRequest, res: Response) {
  try {
    const { periodId } = req.params;

    const milestones = await PeriodService.getPeriodTimeline(periodId);

    res.json({ success: true, data: milestones });
  } catch (err) {
    handleError(err, res, 'getPeriodTimeline');
  }
}

export async function registerFeePayment(req: AuthenticatedRequest, res: Response) {
  try {
    const { id: inviteId } = req.params;
    // FormData sends strings — coerce amountPaid to number before validation
    const body = {
      ...req.body,
      amountPaid: req.body.amountPaid != null ? Number(req.body.amountPaid) : undefined,
    };
    const data = registerFeePaymentSchema.parse(body);
    const file = (req as any).file;

    const payment = await FinancialService.registerFeePayment(
      inviteId,
      {
        ...data,
        receipt: file
          ? { buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype }
          : undefined,
      },
      req.user!.id,
    );

    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    handleError(err, res, 'registerFeePayment');
  }
}

export async function getFunnelData(req: AuthenticatedRequest, res: Response) {
  try {
    const { periodId } = req.params;

    const result = await AnalyticsService.getFunnelData(periodId);

    res.json({ success: true, data: result });
  } catch (err) {
    handleError(err, res, 'getFunnelData');
  }
}

export async function getBottleneckAnalysis(req: AuthenticatedRequest, res: Response) {
  try {
    const { periodId } = req.params;

    const result = await AnalyticsService.getBottleneckAnalysis(periodId);

    res.json({ success: true, data: result });
  } catch (err) {
    handleError(err, res, 'getBottleneckAnalysis');
  }
}

// --- STORY-009 / STORY-010: Document review flow ---

const reviewDocumentSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().max(500).optional(),
});

export async function reviewInviteDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const { id: inviteId, docId } = req.params;
    const data = reviewDocumentSchema.parse(req.body);

    const result = await DocumentService.reviewDocument({
      inviteId,
      docId,
      status: data.status,
      rejectionReason: data.rejectionReason,
      userId: req.user!.id,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    handleError(err, res, 'reviewInviteDocument');
  }
}

export async function listInviteDocuments(req: AuthenticatedRequest, res: Response) {
  try {
    const docs = await listInviteDocumentsFromService(req.params.id);
    res.json({ success: true, data: docs });
  } catch (err) {
    handleError(err, res, 'listInviteDocuments');
  }
}

export async function regenerateInviteLink(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await CommService.regenerateInviteLink(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    handleError(err, res, 'regenerateInviteLink');
  }
}

export async function getInviteDetail(req: AuthenticatedRequest, res: Response) {
  try {
    const payload = await DetailService.getInviteDetail(req.params.id);
    res.json({ success: true, data: payload });
  } catch (err) {
    handleError(err, res, 'getInviteDetail');
  }
}

export async function getInviteHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const payload = await DetailService.getInviteHistory(req.params.id);
    res.json({ success: true, data: payload });
  } catch (err) {
    handleError(err, res, 'getInviteHistory');
  }
}
