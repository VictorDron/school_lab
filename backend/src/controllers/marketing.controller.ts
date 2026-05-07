import type { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import logger from '../utils/logger.js';

const createMarketingLeadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  schoolName: z.string().trim().min(2).max(180),
  email: z.string().trim().toLowerCase().email().max(180),
  phone: z.string().trim().min(8).max(40),
  studentCount: z.string().trim().min(1).max(40),
  notes: z.string().trim().max(2000).optional().or(z.literal('').transform(() => undefined)),
  intent: z.enum(['pequeno', 'medio', 'grande', 'sobmedida', 'demo']),
  source: z.string().trim().max(120).optional(),
});

const INTENT_TO_DB: Record<z.infer<typeof createMarketingLeadSchema>['intent'], 'PEQUENO' | 'MEDIO' | 'GRANDE' | 'SOBMEDIDA' | 'DEMO'> = {
  pequeno: 'PEQUENO',
  medio: 'MEDIO',
  grande: 'GRANDE',
  sobmedida: 'SOBMEDIDA',
  demo: 'DEMO',
};

export async function createMarketingLead(req: Request, res: Response) {
  const parsed = createMarketingLeadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos.',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const data = parsed.data;
  const ipAddress = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.ip || null;
  const userAgent = req.headers['user-agent'] ?? null;

  try {
    const lead = await prisma.marketingLead.create({
      data: {
        name: data.name,
        schoolName: data.schoolName,
        email: data.email,
        phone: data.phone,
        studentCount: data.studentCount,
        notes: data.notes ?? null,
        intent: INTENT_TO_DB[data.intent],
        source: data.source ?? null,
        ipAddress,
        userAgent,
      },
      select: { id: true, createdAt: true },
    });

    logger.info('Marketing lead captured', {
      id: lead.id,
      schoolName: data.schoolName,
      intent: data.intent,
      source: data.source,
    });

    return res.status(201).json({ success: true, data: lead });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error('Marketing lead DB error', { code: error.code, message: error.message });
    } else {
      logger.error('Marketing lead unknown error', { error: String(error) });
    }
    return res.status(500).json({
      success: false,
      error: 'Não foi possível registrar o contato agora. Tente novamente.',
    });
  }
}
