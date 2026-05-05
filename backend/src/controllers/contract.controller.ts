import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { GateApprovalDecision, ContractSignerRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { createAuditLog } from '../services/audit.service.js';
import * as ContractService from '../services/contract.service.js';
import logger from '../utils/logger.js';
import { prisma } from '../config/database.js';
import { getSignedUrl, extractStoragePath } from '../config/supabase.js';

const createContractSchema = z.object({
  leadId: z.string().uuid(),
  totalAnnualValue: z.number(),
  installments: z.number().int().min(1).max(12),
  discountPercent: z.number().min(0).max(100).optional(),
  enrollmentFee: z.number().optional(),
  templateVersion: z.string().optional(),
  signers: z.array(z.object({
    role: z.nativeEnum(ContractSignerRole),
    name: z.string().min(2),
    email: z.string().email(),
    cpf: z.string().optional(),
    phone: z.string().optional(),
  })).min(1, 'Ao menos um assinante é obrigatório'),
  paymentStartDate: z.string().optional(),
});

const legalApprovalSchema = z.object({
  decision: z.nativeEnum(GateApprovalDecision),
  notes: z.string().optional(),
});

const financialApprovalSchema = z.object({
  decision: z.nativeEnum(GateApprovalDecision),
  notes: z.string().optional(),
});

const addSignerSchema = z.object({
  role: z.nativeEnum(ContractSignerRole),
  name: z.string().min(2),
  email: z.string().email(),
  cpf: z.string().optional(),
  phone: z.string().optional(),
});

const cancelSchema = z.object({
  reason: z.string().optional(),
});

export async function getPrerequisites(req: AuthenticatedRequest, res: Response) {
  const result = await ContractService.getContractPrerequisites(req.params.leadId);
  res.json({ success: true, data: result });
}

export async function getByLeadId(req: AuthenticatedRequest, res: Response) {
  const contracts = await ContractService.findByLeadId(req.params.leadId);
  res.json({ success: true, data: contracts });
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = createContractSchema.parse(req.body);
    const contract = await ContractService.createContract(data.leadId, data, req.user!.id);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'CONTRACT_CREATED',
      entityType: 'LEAD',
      entityId: data.leadId,
      metadata: { contractId: contract.id },
    }, req);

    res.status(201).json({ success: true, data: contract });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
}

export async function sendForSignature(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const contract = await ContractService.sendForSignature(req.params.id, req.user!.id);

    if (!contract) {
      throw new AppError(404, 'Contrato não encontrado após envio para assinatura', 'CONTRACT_NOT_FOUND');
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'CONTRACT_SENT_FOR_SIGNATURE',
      entityType: 'LEAD',
      entityId: contract.leadId,
      metadata: { contractId: contract.id },
    }, req);

    res.json({ success: true, data: contract });
  } catch (error) {
    next(error);
  }
}

export async function submitLegalApproval(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = legalApprovalSchema.parse(req.body);
    const contract = await ContractService.submitLegalApproval(req.params.id, data.decision, req.user!.id, req.user!.role, data.notes);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'CONTRACT_LEGAL_APPROVAL',
      entityType: 'LEAD',
      entityId: contract.leadId,
      metadata: { contractId: contract.id, decision: data.decision },
    }, req);

    res.json({ success: true, data: contract });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
}

export async function submitFinancialApproval(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = financialApprovalSchema.parse(req.body);
    const contract = await ContractService.submitFinancialApproval(req.params.id, data.decision, req.user!.id, req.user!.role, data.notes);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'CONTRACT_FINANCIAL_APPROVAL',
      entityType: 'LEAD',
      entityId: contract.leadId,
      metadata: { contractId: contract.id, decision: data.decision },
    }, req);

    res.json({ success: true, data: contract });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
}

export async function generateDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const contract = await ContractService.generateContractDocument(req.params.id);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'CONTRACT_DOCUMENT_GENERATED',
      entityType: 'LEAD',
      entityId: contract.leadId,
      metadata: { contractId: contract.id },
    }, req);

    res.json({ success: true, data: contract });
  } catch (error) {
    next(error);
  }
}

export async function cancel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = cancelSchema.parse(req.body);

    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
    });

    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrato não encontrado' });
    }

    const updated = await prisma.contract.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: data.reason ?? null,
      },
    });

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'CONTRACT_CANCELLED',
      entityType: 'LEAD',
      entityId: contract.leadId,
      metadata: { contractId: contract.id, reason: data.reason },
    }, req);

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    logger.error('Cancel contract error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
    });
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrato não encontrado' });
    }
    if (!contract.documentUrl) {
      return res.status(404).json({ success: false, error: 'Documento ainda não foi gerado' });
    }

    // Generate a fresh signed URL from Supabase
    const storagePath = extractStoragePath(contract.documentUrl);
    if (!storagePath) {
      return res.status(404).json({ success: false, error: 'Caminho do documento inválido' });
    }
    const url = await getSignedUrl(storagePath, 3600); // 1 hour
    res.json({ success: true, data: { url } });
  } catch (error) {
    logger.error('Get contract document error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getSignedDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
    });
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrato não encontrado' });
    }

    // If we have a stored signed document URL, generate a fresh Supabase signed URL
    if (contract.signedDocumentUrl) {
      const storagePath = extractStoragePath(contract.signedDocumentUrl);
      if (storagePath) {
        // It's stored in Supabase — generate a fresh 1-hour signed URL
        const freshUrl = await getSignedUrl(storagePath, 3600);
        if (freshUrl) {
          return res.json({ success: true, data: { url: freshUrl } });
        }
      }

      // If it's a ClickSign URL (legacy) or Supabase refresh failed, try to re-download
      if (contract.clicksignEnvelopeId) {
        const redownloaded = await redownloadSignedPdf(contract);
        if (redownloaded) {
          return res.json({ success: true, data: { url: redownloaded } });
        }
      }
    }

    // No stored URL — try fetching from ClickSign and storing permanently
    if (contract.clicksignEnvelopeId && (contract.status === 'SIGNED' || contract.status === 'ACTIVE')) {
      const downloadedUrl = await redownloadSignedPdf(contract);
      if (downloadedUrl) {
        return res.json({ success: true, data: { url: downloadedUrl } });
      }
    }

    return res.status(404).json({ success: false, error: 'Documento assinado ainda não está disponível' });
  } catch (error) {
    logger.error('Get signed contract document error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

/**
 * Downloads the signed PDF from ClickSign, uploads to Supabase, stores the path,
 * and returns a fresh signed URL.
 */
async function redownloadSignedPdf(contract: { id: string; code: string; clicksignEnvelopeId: string | null }) {
  if (!contract.clicksignEnvelopeId) return null;
  try {
    const ClickSignService = await import('../services/clicksign.service.js');
    const docs = await ClickSignService.getEnvelopeDocuments(contract.clicksignEnvelopeId);
    const clicksignUrl =
      docs?.data?.[0]?.attributes?.signed_url ??
      docs?.data?.[0]?.attributes?.download_url ??
      null;
    if (!clicksignUrl) return null;

    const { default: axios } = await import('axios');
    const pdfResponse = await axios.get(clicksignUrl, { responseType: 'arraybuffer', timeout: 30000 });
    const pdfBuffer = Buffer.from(pdfResponse.data);

    const { uploadFile: upload } = await import('../config/supabase.js');
    const signedStoragePath = `contracts/${contract.id}/${contract.code}-signed.pdf`;
    const uploaded = await upload(pdfBuffer, signedStoragePath, 'application/pdf');

    if (!uploaded) {
      logger.warn('Supabase upload returned null for signed PDF', { contractId: contract.id });
      return null;
    }

    // Update stored path
    await prisma.contract.update({
      where: { id: contract.id },
      data: { signedDocumentUrl: signedStoragePath },
    });

    // Return fresh signed URL
    const freshUrl = await getSignedUrl(signedStoragePath, 3600);
    return freshUrl;
  } catch (err) {
    logger.warn('Failed to re-download signed PDF from ClickSign', { contractId: contract.id, error: (err as Error).message });
    return null;
  }
}

export async function deleteContract(req: AuthenticatedRequest, res: Response) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
    });
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrato não encontrado' });
    }
    if (contract.status !== 'PENDING_LEGAL' && contract.status !== 'DRAFT') {
      return res.status(400).json({ success: false, error: 'Apenas contratos pendentes podem ser excluídos' });
    }

    // Delete associated records (cascade) and the contract
    await prisma.$transaction([
      prisma.contractPayment.deleteMany({ where: { contractId: contract.id } }),
      prisma.contractSigner.deleteMany({ where: { contractId: contract.id } }),
      prisma.contract.delete({ where: { id: contract.id } }),
    ]);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'CONTRACT_CANCELLED',
      entityType: 'LEAD',
      entityId: contract.leadId,
      metadata: { contractId: contract.id, code: contract.code },
    }, req);

    res.json({ success: true });
  } catch (error) {
    logger.error('Delete contract error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function addSigner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = addSignerSchema.parse(req.body);
    const contract = await ContractService.addSigner(req.params.id, data);
    res.json({ success: true, data: contract });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
}

export async function updateSigner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = addSignerSchema.partial().parse(req.body);
    const contract = await ContractService.updateSigner(req.params.id, req.params.signerId, data);
    res.json({ success: true, data: contract });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
}

export async function removeSigner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const contract = await ContractService.removeSigner(req.params.id, req.params.signerId);
    res.json({ success: true, data: contract });
  } catch (error) {
    next(error);
  }
}
