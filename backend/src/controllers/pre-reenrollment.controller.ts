import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/database.js';
import * as FinancialService from '../services/re-enrollment-financial.service.js';
import * as CommService from '../services/re-enrollment-communication.service.js';
import * as AnalyticsService from '../services/re-enrollment-analytics.service.js';
import * as PricingService from '../services/period-pricing.service.js';
import { getIO } from '../socket/io.js';

// ── Zod Schemas ─────────────────────────────────────────────────────

const upsertPriceTableSchema = z.object({
  entries: z
    .array(
      z.object({
        grade: z.string().min(1, 'Série obrigatória.'),
        baseAnnualValue: z.number().positive('Valor anual deve ser positivo.'),
        enrollmentFee: z.number().min(0, 'Entrada não pode ser negativa.'),
        discountPercent: z.number().min(0).max(100).optional().nullable(),
      })
    )
    .min(1, 'Pelo menos uma entrada obrigatória.'),
  discountOptions: z.array(z.number().min(0).max(100)).optional(),
});

const updateAdjustmentSchema = z.object({
  adjustmentPercent: z
    .number()
    .min(-50, 'Redução máxima de 50%.')
    .max(100, 'Reajuste máximo de 100%.'),
});

const createExceptionSchema = z.object({
  studentId: z.string().uuid('ID do aluno inválido.'),
  overrideAnnualValue: z.number().positive().optional().nullable(),
  overrideDiscountPercent: z.number().min(0).max(100).optional().nullable(),
  justification: z
    .string()
    .min(3, 'Justificativa deve ter pelo menos 3 caracteres.')
    .max(500),
});

const updateExceptionSchema = z.object({
  overrideAnnualValue: z.number().positive().optional().nullable(),
  overrideDiscountPercent: z.number().min(0).max(100).optional().nullable(),
  justification: z.string().min(3).max(500).optional(),
});

const sendEmailsSchema = z.object({
  studentIds: z.array(z.string().uuid('ID do aluno inválido.')).min(1, 'Selecione pelo menos um aluno.'),
  customBody: z.string().min(10, 'Texto do e-mail deve ter pelo menos 10 caracteres.').max(5000),
  deadline: z.string().datetime('Data limite inválida.'),
});

const registerNegotiationSchema = z.object({
  discountPercent: z.number().min(0, 'Desconto não pode ser negativo.').max(100, 'Desconto máximo de 100%.'),
  finalValue: z.number().positive('Valor final deve ser positivo.'),
  justification: z.string().min(3, 'Justificativa deve ter pelo menos 3 caracteres.').max(500),
});

const updateEmailTemplateSchema = z.object({
  template: z.string().max(5000),
  deadline: z.string().datetime().optional(),
});

// ── Handlers ────────────────────────────────────────────────────────

export async function getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { periodId } = req.params;
    const data = await FinancialService.getDashboardData(periodId);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function upsertPriceTable(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { periodId } = req.params;
    const { entries, discountOptions } = upsertPriceTableSchema.parse(req.body);
    const mapped = entries.map((e) => ({
      ...e,
      discountPercent: e.discountPercent ?? null,
    }));
    await PricingService.upsertPriceTable(periodId, mapped);

    if (discountOptions !== undefined) {
      await prisma.reEnrollmentPeriod.update({
        where: { id: periodId },
        data: { discountOptions: discountOptions.sort((a, b) => a - b) },
      });
    }

    try {
      getIO()
        .to(`pre-reenrollment:${periodId}`)
        .emit('pre-reenrollment:prices:updated', { periodId });
    } catch {
      // non-fatal: socket may not be initialized in tests
    }

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function updateAdjustment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { periodId } = req.params;
    const { adjustmentPercent } = updateAdjustmentSchema.parse(req.body);
    await PricingService.updateAdjustmentPercent(periodId, adjustmentPercent);

    try {
      getIO()
        .to(`pre-reenrollment:${periodId}`)
        .emit('pre-reenrollment:adjustment:updated', { periodId, adjustmentPercent });
    } catch {
      // non-fatal
    }

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function createException(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { periodId } = req.params;
    const { studentId, ...data } = createExceptionSchema.parse(req.body);
    const exception = await PricingService.createException(periodId, studentId, data, req.user!.id);

    try {
      getIO()
        .to(`pre-reenrollment:${periodId}`)
        .emit('pre-reenrollment:exception:created', { periodId, studentId, exceptionId: exception.id });
    } catch {
      // non-fatal
    }

    return res.status(201).json({ success: true, data: exception });
  } catch (err) {
    next(err);
  }
}

export async function updateException(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { exceptionId } = req.params;
    const data = updateExceptionSchema.parse(req.body);
    const exception = await PricingService.updateException(exceptionId, data, req.user!.id);

    try {
      getIO()
        .to(`pre-reenrollment:${(exception as Record<string, unknown>).periodId}`)
        .emit('pre-reenrollment:exception:updated', { exceptionId });
    } catch {
      // non-fatal
    }

    return res.json({ success: true, data: exception });
  } catch (err) {
    next(err);
  }
}

export async function deleteException(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { exceptionId } = req.params;
    const exception = await PricingService.deleteException(exceptionId);

    try {
      getIO()
        .to(`pre-reenrollment:${(exception as Record<string, unknown>).periodId}`)
        .emit('pre-reenrollment:exception:deleted', { exceptionId });
    } catch {
      // non-fatal
    }

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ── Exception Approval ──────────────────────────────────────────────

const exceptionApprovalSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().max(500).optional(),
});

export async function submitExceptionApproval(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { exceptionId } = req.params;
    const { decision, notes } = exceptionApprovalSchema.parse(req.body);
    const result = await PricingService.submitExceptionApproval(exceptionId, decision, notes, req.user!.id);

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function listPendingApprovals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { periodId } = req.params;
    const approvals = await PricingService.listPendingExceptionApprovals(periodId);
    return res.json({ success: true, data: approvals });
  } catch (err) {
    next(err);
  }
}

// ── Communication & Report Handlers ────────────────────────────────

export async function sendEmails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { periodId } = req.params;
    const { studentIds, customBody, deadline } = sendEmailsSchema.parse(req.body);

    const result = await CommService.sendPreReEnrollmentEmails({
      periodId,
      studentIds,
      customBody,
      deadline: new Date(deadline),
      sentById: req.user!.id,
    });

    try {
      getIO()
        .to(`pre-reenrollment:${periodId}`)
        .emit('pre-reenrollment:emails:sent', { periodId, count: result.sent });
    } catch {
      // non-fatal: socket may not be initialized in tests
    }

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function listResponses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { periodId } = req.params;

    const responses = await prisma.preReEnrollmentResponse.findMany({
      where: { periodId },
      include: {
        student: {
          select: {
            id: true,
            code: true,
            fullName: true,
            grade: true,
            child: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: responses });
  } catch (err) {
    next(err);
  }
}

export async function registerNegotiation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { responseId } = req.params;
    const data = registerNegotiationSchema.parse(req.body);

    const result = await CommService.registerNegotiation({
      responseId,
      discountPercent: data.discountPercent,
      finalValue: data.finalValue,
      justification: data.justification,
      approvedById: req.user!.id,
    });

    try {
      getIO()
        .to(`pre-reenrollment:${result.periodId}`)
        .emit('pre-reenrollment:negotiation:updated', {
          periodId: result.periodId,
          studentId: result.studentId,
        });
    } catch {
      // non-fatal
    }

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function resendResponseEmail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { responseId } = req.params;
    await CommService.resendPreReEnrollmentEmail(responseId);
    return res.json({ success: true });
  } catch (err: any) {
    if (err.message === 'RESPONSE_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Resposta não encontrada.' });
    }
    if (err.message === 'NO_EMAIL_ADDRESS') {
      return res.status(400).json({ success: false, error: 'Nenhum e-mail cadastrado para este aluno.' });
    }
    next(err);
  }
}

export async function getReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { periodId } = req.params;
    const report = await AnalyticsService.getPreReEnrollmentReport(periodId);
    return res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

export async function getEmailTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { periodId } = req.params;

    const period = await prisma.reEnrollmentPeriod.findUnique({
      where: { id: periodId },
      select: {
        preReEnrollmentEmailTemplate: true,
        preReEnrollmentDeadline: true,
      },
    });

    if (!period) {
      return res.status(404).json({ success: false, error: 'Campanha não encontrada.' });
    }

    return res.json({
      success: true,
      data: {
        template: period.preReEnrollmentEmailTemplate,
        deadline: period.preReEnrollmentDeadline,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── Discount Import ─────────────────────────────────────────────────

export async function previewDiscountImport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { periodId } = req.params;
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'Arquivo CSV obrigatório.' });
    }

    const csvContent = file.buffer.toString('utf-8');
    const preview = await FinancialService.previewDiscountImport(periodId, csvContent);

    return res.json({ success: true, data: preview });
  } catch (err) {
    next(err);
  }
}

export async function applyDiscountImport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { periodId } = req.params;
    const schema = z.object({
      rows: z.array(z.object({
        studentId: z.string().uuid(),
        discountPercent: z.number().min(0).max(100),
      })).min(1, 'Pelo menos um aluno obrigatório.'),
    });
    const { rows } = schema.parse(req.body);
    const userId = req.user!.id;

    const result = await FinancialService.applyDiscountImport(periodId, rows, userId);

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function downloadDiscountTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { periodId } = req.params;
    const csv = await FinancialService.generateDiscountTemplate(periodId);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="template_descontos.csv"');
    return res.send('\uFEFF' + csv); // BOM for Excel compatibility
  } catch (err) {
    next(err);
  }
}

export async function updateEmailTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { periodId } = req.params;
    const { template, deadline } = updateEmailTemplateSchema.parse(req.body);

    await prisma.reEnrollmentPeriod.update({
      where: { id: periodId },
      data: {
        preReEnrollmentEmailTemplate: template,
        ...(deadline ? { preReEnrollmentDeadline: new Date(deadline) } : {}),
      },
    });

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
