import { Response } from 'express';
import { z } from 'zod';
import { ContractSignerRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import * as DefaultSignersService from '../services/contract-default-signers.service.js';
import logger from '../utils/logger.js';

const signerSchema = z.object({
  role: z.enum(['SCHOOL_REPRESENTATIVE', 'WITNESS'] as const),
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  cpf: z.string().optional(),
  phone: z.string().optional(),
});

const replaceAllSchema = z.object({
  signers: z.array(signerSchema).min(1, 'Ao menos um signatário padrão é obrigatório.'),
});

export async function list(req: AuthenticatedRequest, res: Response) {
  try {
    const signers = await DefaultSignersService.listAll();
    res.json({ success: true, data: signers });
  } catch (err) {
    logger.error('Failed to list default signers', err);
    res.status(500).json({ success: false, error: 'Erro ao listar signatários padrão.' });
  }
}

export async function replaceAll(req: AuthenticatedRequest, res: Response) {
  try {
    const { signers } = replaceAllSchema.parse(req.body);
    const result = await DefaultSignersService.replaceAll(
      signers.map((s) => ({
        ...s,
        role: s.role as ContractSignerRole,
      })),
    );
    res.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos.',
        details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    logger.error('Failed to replace default signers', err);
    res.status(500).json({ success: false, error: 'Erro ao salvar signatários padrão.' });
  }
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    await DefaultSignersService.remove(id);
    res.json({ success: true });
  } catch (err) {
    logger.error('Failed to remove default signer', err);
    res.status(500).json({ success: false, error: 'Erro ao remover signatário padrão.' });
  }
}
