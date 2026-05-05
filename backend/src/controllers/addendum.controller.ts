import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { ContractSignerRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import * as AddendumService from '../services/addendum.service.js';
import { prisma } from '../config/database.js';
import { getSignedUrl, extractStoragePath } from '../config/supabase.js';
import logger from '../utils/logger.js';

const createAddendumSchema = z.object({
  contractId: z.string().uuid(),
  type: z.enum(['DISCOUNT', 'SPECIAL_CONDITION', 'GRADE_CHANGE', 'OTHER']),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  changedValues: z
    .array(
      z.object({
        field: z.string(),
        oldValue: z.string(),
        newValue: z.string(),
      }),
    )
    .optional(),
  signers: z
    .array(
      z.object({
        role: z.nativeEnum(ContractSignerRole),
        name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
        email: z.string().email('E-mail inválido'),
        cpf: z.string().optional(),
        phone: z.string().optional(),
      }),
    )
    .min(1, 'Ao menos um signatário é obrigatório'),
});

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = createAddendumSchema.parse(req.body);
    const addendum = await AddendumService.createAddendum(data);
    res.status(201).json({ success: true, data: addendum });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
}

export async function listByContract(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { contractId } = req.params;
    const addendums = await AddendumService.listByContractId(contractId);
    res.json({ success: true, data: addendums });
  } catch (error) {
    next(error);
  }
}

export async function generateDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const addendum = await AddendumService.generateAddendumPdf(req.params.id);
    res.json({ success: true, data: addendum });
  } catch (error) {
    next(error);
  }
}

export async function sendForSignature(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const addendum = await AddendumService.sendAddendumForSignature(req.params.id, req.user!.id);
    res.json({ success: true, data: addendum });
  } catch (error) {
    next(error);
  }
}

export async function cancel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const addendum = await AddendumService.cancelAddendum(req.params.id);
    res.json({ success: true, data: addendum });
  } catch (error) {
    next(error);
  }
}

export async function getDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const addendum = await prisma.contractAddendum.findUnique({
      where: { id: req.params.id },
    });
    if (!addendum) {
      return res.status(404).json({ success: false, error: 'Aditivo não encontrado' });
    }
    if (!addendum.documentUrl) {
      return res.status(404).json({ success: false, error: 'Documento ainda não foi gerado' });
    }

    const storagePath = extractStoragePath(addendum.documentUrl);
    if (!storagePath) {
      return res.status(404).json({ success: false, error: 'Caminho do documento inválido' });
    }
    const url = await getSignedUrl(storagePath, 3600);
    res.json({ success: true, data: { url } });
  } catch (error) {
    logger.error('Get addendum document error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getSignedDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const addendum = await prisma.contractAddendum.findUnique({
      where: { id: req.params.id },
    });
    if (!addendum) {
      return res.status(404).json({ success: false, error: 'Aditivo não encontrado' });
    }
    if (!addendum.signedDocumentUrl) {
      return res.status(404).json({ success: false, error: 'Documento assinado ainda não está disponível' });
    }

    const storagePath = extractStoragePath(addendum.signedDocumentUrl);
    if (!storagePath) {
      return res.status(404).json({ success: false, error: 'Caminho do documento inválido' });
    }
    const url = await getSignedUrl(storagePath, 3600);
    res.json({ success: true, data: { url } });
  } catch (error) {
    logger.error('Get addendum signed document error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
